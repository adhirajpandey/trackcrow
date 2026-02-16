export function makeRequest(url: string, init?: RequestInit): Request {
  return new Request(url, init);
}

export function makeJsonRequest(
  url: string,
  method: string,
  body: unknown,
  headers: Record<string, string> = {}
): Request {
  return new Request(url, {
    method,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

export async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}
