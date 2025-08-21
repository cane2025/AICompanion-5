import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

const API_BASE =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_API_BASE) ||
  (typeof window !== "undefined"
    ? window.location.origin
    : "http://127.0.0.1:3001");

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined
): Promise<Response> {
  const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
  console.log("[apiRequest]", method, fullUrl, data ?? null);
  const res = await fetch(fullUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(typeof window !== "undefined" && localStorage.getItem("devToken")
        ? { "X-Dev-Token": localStorage.getItem("devToken") as string }
        : {}),
    },
    body: data !== undefined ? JSON.stringify(data) : undefined,
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(
      "[apiRequest:ERROR]",
      method,
      fullUrl,
      res.status,
      res.statusText,
      text
    );
    throw new Error(
      `HTTP ${res.status} ${res.statusText} for ${fullUrl}\n${text}`
    );
  }
  console.log("[apiRequest:OK]", method, fullUrl, res.status);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const path = queryKey.join("/") as string;
    const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("devToken");
      if (token) headers["X-Dev-Token"] = token;
    }

    const res = await fetch(url, {
      method: "GET",
      headers,
      credentials: "include",
      cache: "no-store",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null as any;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Enable refetch on window focus
      staleTime: 30000, // 30 seconds instead of Infinity
      retry: false,
      gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    },
    mutations: {
      retry: false,
      onSuccess: () => {
        // Invalidate all queries after successful mutations
        queryClient.invalidateQueries();
      },
    },
  },
});
