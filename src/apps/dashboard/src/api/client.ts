import type {
  SignupPayload,
  SignupSuccess,
  LoginPayload,
  AuthSuccess,
  CreateMagicLinkPayload,
  MagicLinkSuccess,
  DisableUserPayload,
  LogoutSuccess,
  MeSuccess,
  PingSuccess,
} from "../cf-worker/api";

const API_URL = "http://localhost:8780";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const getCookie = () => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/stoquify_session=([^;]+)/);
  return match?.[1] ?? null;
};

const fetchApi = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const url = `${API_URL}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new ApiError(
      errorBody || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
    );
  }

  return response.json();
};

export const api = {
  ping: async (): Promise<PingSuccess> => {
    return fetchApi<PingSuccess>("/ping", { method: "GET" });
  },

  signup: async (
    payload: SignupPayload,
  ): Promise<SignupSuccess & { sessionToken: string }> => {
    return fetchApi<SignupSuccess & { sessionToken: string }>(
      "/api/auth/signup",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  },

  login: async (
    payload: LoginPayload,
  ): Promise<AuthSuccess & { sessionToken: string }> => {
    return fetchApi<AuthSuccess & { sessionToken: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  loginWithMagicLink: async (payload: {
    token: string;
    phone: string;
    name: string;
    password: string;
  }): Promise<AuthSuccess & { sessionToken: string }> => {
    return fetchApi<AuthSuccess & { sessionToken: string }>(
      "/api/auth/login-magic",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  },

  logout: async (): Promise<LogoutSuccess> => {
    return fetchApi<LogoutSuccess>("/api/auth/logout", {
      method: "POST",
    });
  },

  me: async (): Promise<MeSuccess> => {
    const token = getCookie();
    if (!token) {
      throw new ApiError("Not authenticated", 401);
    }
    return fetchApi<MeSuccess>("/api/auth/me", {
      method: "GET",
    });
  },

  createMagicLink: async (
    payload: CreateMagicLinkPayload,
  ): Promise<MagicLinkSuccess> => {
    return fetchApi<MagicLinkSuccess>("/api/auth/create-magic-link", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  disableUser: async (payload: DisableUserPayload): Promise<LogoutSuccess> => {
    return fetchApi<LogoutSuccess>("/api/auth/disable-user", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  catalog: async (shopId: string) => {
    return fetchApi<{ products: any[] }>(
      `/catalog?shopId=${encodeURIComponent(shopId)}`,
      {
        method: "GET",
      },
    );
  },

  categories: async (shopId: string) => {
    return fetchApi<{ categories: any[] }>(
      `/categories?shopId=${encodeURIComponent(shopId)}`,
      {
        method: "GET",
      },
    );
  },

  collections: async (shopId: string) => {
    return fetchApi<{ collections: any[] }>(
      `/collections?shopId=${encodeURIComponent(shopId)}`,
      {
        method: "GET",
      },
    );
  },

  pushEvents: async (storeId: string, events: any[]) => {
    return fetchApi<{ events: any[]; checkpoint: any; lastSeqNum: number }>(
      "/events",
      {
        method: "POST",
        body: JSON.stringify({ storeId, events }),
      },
    );
  },

  pullEvents: async (storeId: string, afterSeq: number = 0) => {
    return fetchApi<{ events: any[]; checkpoint: any }>("/pull", {
      method: "POST",
      body: JSON.stringify({ storeId, afterSeq }),
    });
  },

  createOrder: async (shopId: string, order: any, storeId?: string) => {
    return fetchApi<{ orderId: string; lastSeqNum: number }>("/orders", {
      method: "POST",
      body: JSON.stringify({ shopId, order, storeId }),
    });
  },
};
