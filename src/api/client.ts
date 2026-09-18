import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

import type { AuthTokens } from "../types/auth";

const STORAGE_KEY = "mysubs.auth";

const baseURL = import.meta.env.VITE_API_URL
  ?.trim()
  .replace(/\/+$/, "");

if (!baseURL) {
  throw new Error(
    "VITE_API_URL saknas. Ange backend-adressen och bygg frontend igen."
  );
}

export const apiClient = axios.create({
  baseURL,
  timeout: 30_000,
});

// Separat klient för att undvika att refresh anropar sig själv.
const refreshClient = axios.create({
  baseURL,
  timeout: 30_000,
});

let accessToken: string | null = null;
let refreshToken: string | null = null;

// Ändras vid inloggning, återställning av session och utloggning.
let sessionVersion = 0;

type AuthRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _sessionVersion?: number;
  _accessToken?: string | null;
};

type RefreshOperation = {
  version: number;
  promise: Promise<AuthTokens>;
};

let refreshOperation: RefreshOperation | null = null;

export function setAuthTokens(tokens: AuthTokens | null) {
  sessionVersion += 1;
  accessToken = tokens?.token ?? null;
  refreshToken = tokens?.refreshToken ?? null;
  refreshOperation = null;
}

function isAuthTokens(value: unknown): value is AuthTokens {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const tokens = value as Record<string, unknown>;

  return (
    typeof tokens.token === "string" &&
    tokens.token.length > 0 &&
    typeof tokens.refreshToken === "string" &&
    tokens.refreshToken.length > 0
  );
}

function persistRefreshedTokens(
  tokens: AuthTokens,
  previousRefreshToken: string
) {
  const raw = sessionStorage.getItem(STORAGE_KEY);

  // Under pågående inloggning kan sessionen ännu saknas.
  if (!raw) return;

  const stored: unknown = JSON.parse(raw);

  if (typeof stored !== "object" || stored === null) {
    throw new Error("Den sparade sessionen är ogiltig.");
  }

  const session = stored as Record<string, unknown>;

  if (
    !isAuthTokens(session.tokens) ||
    session.tokens.refreshToken !== previousRefreshToken
  ) {
    throw new Error("Den sparade sessionen matchar inte aktiv session.");
  }

  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...session,
      tokens: {
        token: tokens.token,
        refreshToken: tokens.refreshToken,
      },
    })
  );
}

function clearSession(version: number) {
  // Ett gammalt anrop får inte logga ut en ny session.
  if (version !== sessionVersion) return;

  setAuthTokens(null);

  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } finally {
    window.dispatchEvent(new Event("auth:logout"));
  }
}

function isSessionEndpoint(config: InternalAxiosRequestConfig) {
  const path = (config.url ?? "")
    .split(/[?#]/)[0]
    .replace(/\/+$/, "");

  return /\/api\/auth\/(login|register|refresh|logout|forgot-password|reset-password)$/i.test(
    path
  );
}

function refreshSession(version: number): Promise<AuthTokens> {
  if (refreshOperation?.version === version) {
    return refreshOperation.promise;
  }

  const previousRefreshToken = refreshToken;

  const operation: RefreshOperation = {
    version,
    promise: Promise.resolve().then(async () => {
      try {
        if (
          version !== sessionVersion ||
          !previousRefreshToken
        ) {
          throw new Error("Sessionen är inte längre aktiv.");
        }

        const { data } = await refreshClient.post<unknown>(
          "/api/auth/refresh",
          { refreshToken: previousRefreshToken }
        );

        if (version !== sessionVersion) {
          throw new Error("Sessionen ändrades under tokenförnyelsen.");
        }

        if (!isAuthTokens(data)) {
          throw new Error("Servern returnerade ogiltiga token.");
        }

        persistRefreshedTokens(data, previousRefreshToken);

        // Samma session: öka inte sessionVersion vid tokenrotation.
        accessToken = data.token;
        refreshToken = data.refreshToken;

        return data;
      } catch (error) {
        clearSession(version);
        throw error;
      } finally {
        if (refreshOperation === operation) {
          refreshOperation = null;
        }
      }
    }),
  };

  refreshOperation = operation;
  return operation.promise;
}

apiClient.interceptors.request.use((config) => {
  const request = config as AuthRequestConfig;

  // Stoppa återförsök som tillhör en tidigare session.
  if (
    request._retry &&
    request._sessionVersion !== sessionVersion
  ) {
    throw new axios.CanceledError("Sessionen har ändrats.");
  }

  request._sessionVersion = sessionVersion;
  request._accessToken = accessToken;

  if (accessToken) {
    request.headers.set("Authorization", `Bearer ${accessToken}`);
  } else {
    request.headers.delete("Authorization");
  }

  return request;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as AuthRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !original ||
      isSessionEndpoint(original)
    ) {
      return Promise.reject(error);
    }

    const version = original._sessionVersion;

    if (version === undefined || version !== sessionVersion) {
      return Promise.reject(error);
    }

    if (original._retry) {
      clearSession(version);
      return Promise.reject(error);
    }

    original._retry = true;

    // Ett annat anrop kan redan ha förnyat token.
    if (accessToken && original._accessToken !== accessToken) {
      original.headers.set("Authorization", `Bearer ${accessToken}`);
      return apiClient(original);
    }

    if (!refreshToken) {
      clearSession(version);
      return Promise.reject(error);
    }

    try {
      const tokens = await refreshSession(version);

      if (version !== sessionVersion) {
        return Promise.reject(
          new axios.CanceledError("Sessionen har ändrats.")
        );
      }

      original.headers.set(
        "Authorization",
        `Bearer ${tokens.token}`
      );

      return apiClient(original);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);
