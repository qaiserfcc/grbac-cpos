const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000/api";

interface RequestOptions extends RequestInit {
  accessToken?: string;
  cacheKey?: string;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === "string" ? payload : payload?.message;
    throw new Error(message || "Request failed");
  }

  return payload as T;
}

export async function request<T>(path: string, options: RequestOptions = {}) {
  const { accessToken, headers, ...rest } = options;
  const finalHeaders = new Headers(headers);
  finalHeaders.set("Content-Type", "application/json");
  if (accessToken) {
    finalHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
  });

  return parseResponse<T>(response);
}

export async function get<T>(path: string, options?: RequestOptions) {
  return request<T>(path, {
    method: "GET",
    ...options,
  });
}

export async function post<T, B = unknown>(path: string, body?: B, options?: RequestOptions) {
  return request<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });
}

export async function put<T, B = unknown>(path: string, body?: B, options?: RequestOptions) {
  return request<T>(path, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });
}

export async function del<T>(path: string, options?: RequestOptions) {
  return request<T>(path, {
    method: "DELETE",
    ...options,
  });
}
