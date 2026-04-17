import { ASTROBOX_API_BASE_URL } from "./constants";
import { fail } from "./errors";

export async function requestAstroBox<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${ASTROBOX_API_BASE_URL}${path}`, init);
  } catch {
    fail(`Could not reach AstroBox at ${ASTROBOX_API_BASE_URL}. Is AstroBox running?`);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const extra = body ? ` Response: ${body}` : "";
    fail(`Request failed with ${response.status} ${response.statusText}.${extra}`);
  }

  return (await response.json()) as T;
}
