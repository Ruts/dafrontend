export async function request<T>(
  token: string, path: string, method = 'GET', body?: object, signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE}${path}`, {
    method, signal, headers: {
      Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.detail === 'string'
    ? data.detail : `Request failed (${response.status}). Check the form and retry.`);
  return data as T;
}

export function message(error: unknown) {
  return error instanceof Error ? error.message : 'Request failed. Please retry.';
}
