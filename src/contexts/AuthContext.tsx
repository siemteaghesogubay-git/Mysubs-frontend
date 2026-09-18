import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";

import { apiClient, setAuthTokens } from "../api/client";

import type {
  AuthTokens,
  AuthUser,
  LoginRequest,
  LoginResponse,
  ProfileResponse,
  RegisterRequest,
} from "../types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateUser: (patch: Partial<AuthUser>) => void;
}

interface StoredAuth {
  tokens: AuthTokens;
  user: AuthUser;
}

const STORAGE_KEY = "mysubs.auth";

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);


const sessionClient = axios.create({
  baseURL: apiClient.defaults.baseURL,
  timeout: 30_000,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeRoles(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (role): role is string => typeof role === "string"
  );
}

function isAuthTokens(value: unknown): value is AuthTokens {
  return (
    isRecord(value) &&
    typeof value.token === "string" &&
    value.token.length > 0 &&
    typeof value.refreshToken === "string" &&
    value.refreshToken.length > 0
  );
}

function parseUser(value: unknown): AuthUser | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !value.id.trim() ||
    typeof value.email !== "string" ||
    !value.email.trim()
  ) {
    return null;
  }

  return {
    id: value.id,
    email: value.email,
    firstName:
      typeof value.firstName === "string" ? value.firstName : "",
    lastName:
      typeof value.lastName === "string" ? value.lastName : "",
    roles: normalizeRoles(value.roles),
  };
}

function removeStoredAuth() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    
  }
}

function readStoredAuth(): StoredAuth | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);

    if (!isRecord(parsed) || !isAuthTokens(parsed.tokens)) {
      removeStoredAuth();
      return null;
    }

    const user = parseUser(parsed.user);

    if (!user) {
      removeStoredAuth();
      return null;
    }

    return {
      tokens: {
        token: parsed.tokens.token,
        refreshToken: parsed.tokens.refreshToken,
      },
      user,
    };
  } catch {
    removeStoredAuth();
    return null;
  }
}

function writeStoredAuth(session: StoredAuth) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    throw new Error(
      "Sessionen kunde inte sparas. Kontrollera webbläsarens lagringsinställningar."
    );
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const userRef = useRef<AuthUser | null>(null);

  // Hindrar gamla inloggningsanrop från att återställa en avslutad session.
  const authAttempt = useRef(0);

  const clearSession = useCallback(() => {
    authAttempt.current += 1;

    setAuthTokens(null);
    userRef.current = null;
    setUser(null);
    removeStoredAuth();

    // Avbryt frågor och ta bort cachad data från föregående användare.
    void queryClient.cancelQueries();
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    const stored = readStoredAuth();

    setAuthTokens(stored?.tokens ?? null);
    userRef.current = stored?.user ?? null;
    setUser(stored?.user ?? null);
    setIsLoading(false);

    const handleForcedLogout = () => {
      clearSession();
    };

    window.addEventListener("auth:logout", handleForcedLogout);

    return () => {
      window.removeEventListener("auth:logout", handleForcedLogout);
      authAttempt.current += 1;
    };
  }, [clearSession]);

  async function establishSession(
    loginData: LoginResponse,
    attempt: number
  ) {
    if (attempt !== authAttempt.current) {
      throw new Error("Inloggningsförsöket är inte längre aktivt.");
    }

    if (!isAuthTokens(loginData)) {
      throw new Error("Servern returnerade ogiltiga inloggningsuppgifter.");
    }

    // Läs profilen med token från just detta inloggningsförsök.
    // Den nya sessionen aktiveras först när profilen har hämtats.
    const { data: profile } = await sessionClient.get<ProfileResponse>(
      "/api/Users/me",
      {
        headers: {
          Authorization: `Bearer ${loginData.token}`,
        },
      }
    );

    if (attempt !== authAttempt.current) {
      throw new Error("Inloggningsförsöket har avbrutits.");
    }

    const fullUser = parseUser(profile);

    if (!fullUser) {
      throw new Error("Servern returnerade en ogiltig användarprofil.");
    }

    const session: StoredAuth = {
      tokens: {
        token: loginData.token,
        refreshToken: loginData.refreshToken,
      },
      user: fullUser,
    };

    writeStoredAuth(session);

    setAuthTokens(session.tokens);
    userRef.current = fullUser;
    setUser(fullUser);
  }

  async function authenticate(
    path: string,
    payload: LoginRequest | RegisterRequest
  ) {
    clearSession();
    const attempt = authAttempt.current;

    try {
      const { data } = await sessionClient.post<LoginResponse>(
        path,
        payload
      );

      await establishSession(data, attempt);
    } catch (error) {
      // Ett gammalt försök får inte rensa en nyare session.
      if (attempt === authAttempt.current) {
        clearSession();
      }

      throw error;
    }
  }

  async function login(data: LoginRequest) {
    await authenticate("/api/auth/login", data);
  }

  async function register(data: RegisterRequest) {
    await authenticate("/api/auth/register", data);
  }

  function logout() {
    // client.ts uppdaterar dessa token efter en lyckad förnyelse.
    const stored = readStoredAuth();

    clearSession();

    if (!stored) return;

  
    void sessionClient
      .post(
        "/api/auth/logout",
        { refreshToken: stored.tokens.refreshToken },
        {
          headers: {
            Authorization: `Bearer ${stored.tokens.token}`,
          },
        }
      )
      .catch(() => {
        
      });
  }

  function updateUser(patch: Partial<AuthUser>) {
    const current = userRef.current;
    if (!current) return;

    const stored = readStoredAuth();

    if (!stored || stored.user.id !== current.id) {
      clearSession();
      return;
    }

    const updated: AuthUser = {
      ...current,
      ...patch,

      
      id: current.id,

      roles: normalizeRoles(
        patch.roles === undefined ? current.roles : patch.roles
      ),
    };

    // Behåll token och refreshToken från den nuvarande sessionen.
    writeStoredAuth({
      tokens: stored.tokens,
      user: updated,
    });

    userRef.current = updated;
    setUser(updated);
  }

  const isAdmin = user?.roles?.includes("ADMIN") ?? false;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth måste användas inom AuthProvider");
  }

  return context;
}