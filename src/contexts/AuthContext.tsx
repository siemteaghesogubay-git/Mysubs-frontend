import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

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

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "mysubs.auth";

function normalizeRoles(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (role): role is string => typeof role === "string"
  );
}

function readStoredAuth(): StoredAuth | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as StoredAuth | null;

    if (
      !parsed ||
      !parsed.user ||
      typeof parsed.user !== "object" ||
      !parsed.tokens ||
      typeof parsed.tokens.token !== "string" ||
      !parsed.tokens.token ||
      typeof parsed.tokens.refreshToken !== "string" ||
      !parsed.tokens.refreshToken
    ) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      tokens: parsed.tokens,
      user: {
        ...parsed.user,
        roles: normalizeRoles(parsed.user.roles),
      },
    };
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = readStoredAuth();

    if (stored) {
      setAuthTokens(stored.tokens);
      setUser(stored.user);
    } else {
      setAuthTokens(null);
      setUser(null);
    }

    setIsLoading(false);

    // Klienten skickar denna händelse om tokenförnyelsen misslyckas.
    const handleForcedLogout = () => {
      setAuthTokens(null);
      setUser(null);
      sessionStorage.removeItem(STORAGE_KEY);
    };

    window.addEventListener("auth:logout", handleForcedLogout);

    return () => {
      window.removeEventListener("auth:logout", handleForcedLogout);
    };
  }, []);

  async function establishSession(loginData: LoginResponse) {
    setAuthTokens(loginData);

    try {
      const { data: profile } =
        await apiClient.get<ProfileResponse>("/api/Users/me");

      const fullUser: AuthUser = {
        id: profile.id,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        roles: normalizeRoles(profile.roles),
      };

      const storedAuth: StoredAuth = {
        tokens: {
          token: loginData.token,
          refreshToken: loginData.refreshToken,
        },
        user: fullUser,
      };

      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(storedAuth));
      setUser(fullUser);
    } catch (error) {
      setAuthTokens(null);
      setUser(null);
      sessionStorage.removeItem(STORAGE_KEY);

      throw error;
    }
  }

  async function login(data: LoginRequest) {
    const response = await apiClient.post<LoginResponse>(
      "/api/auth/login",
      data
    );

    await establishSession(response.data);
  }

  async function register(data: RegisterRequest) {
    const response = await apiClient.post<LoginResponse>(
      "/api/auth/register",
      data
    );

    await establishSession(response.data);
  }

  function logout() {
    const stored = readStoredAuth();
    const currentRefreshToken = stored?.tokens.refreshToken;

    if (currentRefreshToken) {
      void apiClient
        .post("/api/auth/logout", {
          refreshToken: currentRefreshToken,
        })
        .catch(() => {
          // Lokal utloggning genomförs även om anropet misslyckas.
        });
    }

    setAuthTokens(null);
    setUser(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  function updateUser(patch: Partial<AuthUser>) {
    if (!user) return;

    const updated: AuthUser = {
      ...user,
      ...patch,
      roles: normalizeRoles(
        patch.roles === undefined ? user.roles : patch.roles
      ),
    };

    const stored = readStoredAuth();

    if (stored) {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...stored,
          user: updated,
        })
      );
    }

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