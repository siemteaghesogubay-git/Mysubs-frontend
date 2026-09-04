import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiClient, setAuthTokens } from "../api/client";
import type {
  AuthTokens, AuthUser, LoginRequest, LoginResponse, ProfileResponse, RegisterRequest,
} from "../types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "mysubs.auth";

interface StoredAuth {
  tokens: AuthTokens;
  user: AuthUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: StoredAuth = JSON.parse(stored);
      setAuthTokens(parsed.tokens);
      setUser(parsed.user);
    }
    setIsLoading(false);

    const handleForcedLogout = () => logout();
    window.addEventListener("auth:logout", handleForcedLogout);
    return () => window.removeEventListener("auth:logout", handleForcedLogout);
  }, []);

  async function establishSession(loginData: LoginResponse) {
    setAuthTokens(loginData);
    const { data: profile } = await apiClient.get<ProfileResponse>("/api/Users/me");

    const fullUser: AuthUser = {
      id: profile.id,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      roles: profile.roles,
    };

    setUser(fullUser);
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ tokens: { token: loginData.token, refreshToken: loginData.refreshToken }, user: fullUser })
    );
  }

  async function login(data: LoginRequest) {
    const res = await apiClient.post<LoginResponse>("/api/auth/login", data);
    await establishSession(res.data);
  }

  async function register(data: RegisterRequest) {
    const res = await apiClient.post<LoginResponse>("/api/auth/register", data);
    await establishSession(res.data);
  }

  function logout() {
    apiClient.post("/api/auth/logout").catch(() => {});
    setAuthTokens(null);
    setUser(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  const isAdmin = user?.roles.includes("ADMIN") ?? false;

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth måste användas inom AuthProvider");
  return ctx;
}