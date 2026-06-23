import {
  getDealershipId,
  getDefaultDealershipId,
} from "@/lib/dealership-storage";
import { createClient } from "@/lib/supabase/client";

const API_PREFIX = "/api/v1";
const API_PROXY_PREFIX = "/api/proxy";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function baseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  return url.replace(/\/$/, "");
}

function requestUrl(path: string): string {
  if (typeof window !== "undefined") {
    return `${API_PROXY_PREFIX}${path}`;
  }
  return `${baseUrl()}${API_PREFIX}${path}`;
}

function resolveDealershipId(override?: string): string {
  const id = override ?? getDealershipId() ?? getDefaultDealershipId();
  if (!id) {
    throw new ApiError(
      403,
      "Dev Dealership ID is required. Open Settings and save your dealership UUID.",
    );
  }
  return id;
}

async function getAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function apiFetch<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    dealershipId?: string;
  } = {},
): Promise<T> {
  const { method = "GET", body, dealershipId } = options;
  const headers: Record<string, string> = {
    "X-Dealership-Id": resolveDealershipId(dealershipId),
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const accessToken = await getAccessToken();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response: Response;
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    response = await fetch(requestUrl(path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    window.clearTimeout(timeout);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(
        0,
        "Request timed out — start the API (cd apps/api && uvicorn app.main:app --reload --port 8000).",
      );
    }
    throw new ApiError(
      0,
      "Cannot reach API — start the backend on port 8000 (127.0.0.1, not LAN IP in .env.local).",
    );
  }

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const payload = (await response.json()) as {
        detail?: string | { msg: string }[];
      };
      if (typeof payload.detail === "string") {
        detail = payload.detail;
      } else if (Array.isArray(payload.detail) && payload.detail[0]?.msg) {
        detail = payload.detail[0].msg;
      }
    } catch {
      // keep statusText
    }
    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
