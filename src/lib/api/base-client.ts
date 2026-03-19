const parseError = async (response: Response) => {
  const body = await response.json().catch(() => null);
  const message = body?.error;
  if (typeof message === "string" && message.length > 0) {
    return message;
  }
  return `Erro ${response.status}`;
};

export async function request<T>(
  input: RequestInfo | URL,
  init: RequestInit & { sessionId: string }
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-session-id": init.sessionId,
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<T>;
}

export async function requestPublic<T>(
  input: RequestInfo | URL,
  init?: RequestInit & { sessionId?: string | null }
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  if (init?.sessionId && init.sessionId.length > 0) {
    headers.set("x-session-id", init.sessionId);
  }

  const response = await fetch(input, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<T>;
}

export async function requestAdmin<T>(
  input: RequestInfo | URL,
  init: RequestInit & { sessionId: string; adminToken: string }
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-session-id": init.sessionId,
      "x-admin-token": init.adminToken,
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<T>;
}

export async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as T;
}
