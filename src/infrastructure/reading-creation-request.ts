/**
 * Posts an AI reading request and recovers when the hosting edge gives up first.
 *
 * Generation can outlast the edge in front of the web server (about 30 seconds), which then answers
 * 504 by itself while the backend goes on to finish and charge the reading. Sending the same body
 * again is safe: the backend replays a finished request id without generating or charging twice,
 * and answers 409 READING_GENERATION_IN_PROGRESS while it is still working.
 * A connection error is not retried here: it rejects at once, so an offline visitor is told right away.
 */
export type ReadingRequestOutcome =
  | { readonly kind: "response"; readonly response: Response }
  | { readonly kind: "unresolved" };

export interface ReadingRequestOptions {
  /** Called once, when the first answer was lost and the request is being checked again. */
  readonly onRecovering?: () => void;
  readonly fetcher?: typeof fetch;
  readonly wait?: (milliseconds: number) => Promise<void>;
  readonly now?: () => number;
}

export const RECOVERY_INTERVAL_MS = 3_000;
// Shorter than the backend's reading-credits.stale-after (5 minutes), after which a stuck
// generation is failed and a replay would report that instead.
export const RECOVERY_DEADLINE_MS = 4.5 * 60 * 1000;

const IN_PROGRESS = "READING_GENERATION_IN_PROGRESS";
const defaultWait = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export async function postReadingRequest(
  url: string,
  body: unknown,
  { onRecovering, fetcher = fetch, wait = defaultWait, now = Date.now }: ReadingRequestOptions = {},
): Promise<ReadingRequestOutcome> {
  const payload = JSON.stringify(body);
  const startedAt = now();
  let recovering = false;
  for (;;) {
    const response = await fetcher(url, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    const settled = !(await isLost(response)) && !(recovering && await isInProgress(response));
    if (settled) return { kind: "response", response };
    if (!recovering) {
      recovering = true;
      onRecovering?.();
    }
    if (now() - startedAt + RECOVERY_INTERVAL_MS > RECOVERY_DEADLINE_MS) return { kind: "unresolved" };
    await wait(RECOVERY_INTERVAL_MS);
  }
}

// Our own proxy answers a JSON 502 when it cannot reach the backend; the edge's 502-504 carry HTML or nothing.
async function isLost(response: Response): Promise<boolean> {
  if (response.status === 504) return true;
  if (response.status !== 502 && response.status !== 503) return false;
  return (await readJson(response)) === null;
}

async function isInProgress(response: Response): Promise<boolean> {
  if (response.status !== 409) return false;
  const value = await readJson(response);
  return typeof value === "object" && value !== null && (value as { code?: unknown }).code === IN_PROGRESS;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.clone().json();
  } catch {
    return null;
  }
}
