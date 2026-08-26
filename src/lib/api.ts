import { ASTROBOX_API_BASE_URL } from "./constants";
import { getSessionToken, invalidateSession } from "./auth";

export class AstroBoxApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly retryable = false,
    public readonly details: unknown = {},
  ) {
    super(message);
    this.name = "AstroBoxApiError";
  }
}

function requestUrl(path: string): string {
  return `${ASTROBOX_API_BASE_URL}${path}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function responseError(response: Response): Promise<AstroBoxApiError> {
  const body = await response.text().catch(() => "");
  let parsed: unknown;
  try {
    parsed = body ? JSON.parse(body) : undefined;
  } catch {
    parsed = undefined;
  }

  const errorBody = isRecord(parsed) && isRecord(parsed.error) ? parsed.error : undefined;
  const code = typeof errorBody?.code === "string" ? errorBody.code : `http_${response.status}`;
  const message =
    typeof errorBody?.message === "string"
      ? errorBody.message
      : body || `${response.status} ${response.statusText}`;
  const retryable = errorBody?.retryable === true;
  const details = errorBody?.details ?? {};
  return new AstroBoxApiError(response.status, code, message, retryable, details);
}

async function performRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(requestUrl(path), init);
  } catch {
    throw new Error(`Could not reach AstroBox at ${ASTROBOX_API_BASE_URL}. Is AstroBox running?`);
  }

  if (!response.ok) {
    throw await responseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.text();
  if (!body) {
    return undefined as T;
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error("AstroBox returned an invalid JSON response");
  }
}

export function pathSegment(value: string): string {
  return encodeURIComponent(value);
}

export function requestAstroBoxPublic<T>(path: string, init?: RequestInit): Promise<T> {
  return performRequest<T>(path, init);
}

export async function requestAstroBox<T>(path: string, init?: RequestInit): Promise<T> {
  let token = await getSessionToken();
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);

  try {
    return await performRequest<T>(path, { ...init, headers });
  } catch (error) {
    if (!(error instanceof AstroBoxApiError) || error.status !== 401) {
      throw error;
    }

    invalidateSession();
    token = await getSessionToken(true);
    const retryHeaders = new Headers(init?.headers);
    retryHeaders.set("Authorization", `Bearer ${token}`);
    return performRequest<T>(path, { ...init, headers: retryHeaders });
  }
}
