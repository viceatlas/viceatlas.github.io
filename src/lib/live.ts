/**
 * Build-time probes for the observability pane.
 *
 * Rule of the pane: every value carries its fetch time or its date. These two
 * functions run once per `astro build` (module-level memo, so eleven pages do
 * not mean eleven fetches), never at request time, and never promise anything
 * about the future. A static site only rebuilds on push or on a schedule; the
 * stamp printed next to each value is what makes any staleness visible.
 *
 * On any failure (timeout, non-2xx, bad JSON) each probe degrades to a labelled
 * fallback instead of throwing, so a flaky network can never break the build.
 */

export interface Health {
  /** The `status` word the endpoint returned, or `unreachable` / `http <code>`. */
  status: string;
  /** UTC stamp of the fetch, `YYYY-MM-DD HH:MM UTC`. */
  fetchedAt: string;
  /** True only when the endpoint answered 2xx with `status: "HEALTHY"`. */
  healthy: boolean;
  /** True when the endpoint could not be reached or answered non-2xx. */
  unreachable: boolean;
}

export interface GitHub {
  publicRepos: number;
  /** `YYYY-MM-DD` of the newest push across the user's public repos. */
  newestPush: string;
  /** UTC stamp of the fetch; for the fallback, the date the literals were measured. */
  fetchedAt: string;
  /** False when the numbers are the dated fallback literals, not a live read. */
  live: boolean;
}

const HEALTH_URL = 'https://www.viceatlas.com/api/health';
const GH_USER_URL = 'https://api.github.com/users/viceatlas';
const GH_REPOS_URL = 'https://api.github.com/users/viceatlas/repos?per_page=100&type=owner';
const TIMEOUT_MS = 5_000;

/**
 * Fallback literals, measured by hand on 2026-10-11 against
 * api.github.com/users/viceatlas (3 public repos) and /users/viceatlas/repos
 * (newest `pushed_at` 2026-09-24, the profile README). Rendered with that date.
 */
const GH_FALLBACK: GitHub = {
  publicRepos: 3,
  newestPush: '2026-09-24',
  fetchedAt: '2026-10-11',
  live: false,
};

/** `YYYY-MM-DD HH:MM UTC` for a Date (default: now). */
export function utcStamp(d: Date = new Date()): string {
  return d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

async function fetchWithTimeout(
  url: string,
  headers: Record<string, string> = {},
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { headers, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

let healthMemo: Promise<Health> | undefined;
let githubMemo: Promise<GitHub> | undefined;

/** GET viceatlas.com/api/health once per build. Any failure reads `unreachable`. */
export function health(): Promise<Health> {
  healthMemo ??= (async (): Promise<Health> => {
    const fetchedAt = utcStamp();
    try {
      const res = await fetchWithTimeout(HEALTH_URL, { accept: 'application/json' });
      if (!res.ok) {
        return { status: `http ${res.status}`, fetchedAt, healthy: false, unreachable: true };
      }
      const body = (await res.json()) as { status?: unknown };
      const status =
        typeof body.status === 'string' && body.status.trim() ? body.status.trim() : 'unknown';
      return { status, fetchedAt, healthy: status === 'HEALTHY', unreachable: false };
    } catch {
      return { status: 'unreachable', fetchedAt, healthy: false, unreachable: true };
    }
  })();
  return healthMemo;
}

/** GET the public repo count and newest push once per build; dated literals on failure. */
export function github(): Promise<GitHub> {
  githubMemo ??= (async (): Promise<GitHub> => {
    const fetchedAt = utcStamp();
    const headers = {
      accept: 'application/vnd.github+json',
      'user-agent': 'viceatlas-portfolio-build',
    };
    try {
      const [userRes, reposRes] = await Promise.all([
        fetchWithTimeout(GH_USER_URL, headers),
        fetchWithTimeout(GH_REPOS_URL, headers),
      ]);
      if (!userRes.ok || !reposRes.ok) return GH_FALLBACK;

      const user = (await userRes.json()) as { public_repos?: unknown };
      const repos = (await reposRes.json()) as unknown;
      if (typeof user.public_repos !== 'number' || !Array.isArray(repos)) return GH_FALLBACK;

      const pushes = (repos as Array<{ pushed_at?: unknown; private?: unknown }>)
        .filter((r) => r.private !== true && typeof r.pushed_at === 'string')
        .map((r) => (r.pushed_at as string).slice(0, 10))
        .sort();
      const newestPush = pushes.length > 0 ? pushes[pushes.length - 1] : GH_FALLBACK.newestPush;

      return { publicRepos: user.public_repos, newestPush, fetchedAt, live: true };
    } catch {
      return GH_FALLBACK;
    }
  })();
  return githubMemo;
}
