/**
 * Alias a Vercel deployment to a custom domain.
 *
 * This is intended for CI usage (e.g. GitHub Actions) where you want a branch/preview
 * deployment to be reachable via a known custom domain (usually a subdomain).
 *
 * Required env:
 * - VERCEL_TOKEN
 * - VERCEL_PROJECT_ID
 * - VERCEL_CUSTOM_DOMAIN
 *
 * Optional env:
 * - VERCEL_TEAM_ID
 * - VERCEL_DEPLOYMENT_URL (e.g. "scope-generator-git-....vercel.app")
 * - GITHUB_SHA (preferred) / VERCEL_GIT_COMMIT_SHA
 * - GITHUB_REF_NAME (branch name, used as a fallback filter)
 */
 
type VercelDeployment = {
  uid: string;
  url: string; // host without scheme (e.g. "foo.vercel.app")
  state?: string;
  meta?: Record<string, string | undefined>;
  createdAt?: number;
};
 
function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}
 
function optionalEnv(name: string): string | undefined {
  return process.env[name] || undefined;
}
 
function normalizeHost(input: string): string {
  // Accept "https://x.y", "x.y", or "x.y/path"
  const trimmed = input.trim();
  const noScheme = trimmed.replace(/^https?:\/\//i, "");
  return noScheme.split("/")[0] || "";
}
 
async function vercelFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const token = requiredEnv("VERCEL_TOKEN");
  const res = await fetch(`https://api.vercel.com${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(opts?.headers ?? {}),
    },
  });
 
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Vercel API ${res.status} ${res.statusText}: ${text || "(no body)"}`);
  }
 
  return (await res.json()) as T;
}
 
function teamQuery(teamId?: string): string {
  return teamId ? `teamId=${encodeURIComponent(teamId)}` : "";
}
 
async function getCandidateDeployments(params: URLSearchParams): Promise<VercelDeployment[]> {
  type Resp = { deployments: VercelDeployment[] };
  const q = params.toString();
  const data = await vercelFetch<Resp>(`/v6/deployments?${q}`);
  return data.deployments ?? [];
}
 
async function findDeployment(): Promise<VercelDeployment> {
  const projectId = requiredEnv("VERCEL_PROJECT_ID");
  const teamId = optionalEnv("VERCEL_TEAM_ID");
 
  const wantedHost = optionalEnv("VERCEL_DEPLOYMENT_URL")
    ? normalizeHost(optionalEnv("VERCEL_DEPLOYMENT_URL")!)
    : undefined;
 
  const sha = optionalEnv("GITHUB_SHA") || optionalEnv("VERCEL_GIT_COMMIT_SHA");
  const branch = optionalEnv("GITHUB_REF_NAME");
 
  // 1) If user provided a deployment host, match it directly.
  if (wantedHost) {
    const params = new URLSearchParams({
      projectId,
      limit: "50",
    });
    if (teamId) params.set("teamId", teamId);
 
    const deployments = await getCandidateDeployments(params);
    const match = deployments.find((d) => d.url === wantedHost);
    if (match) return match;
 
    throw new Error(
      `Could not find deployment url "${wantedHost}" in latest deployments for project ${projectId}.`
    );
  }
 
  // 2) Prefer filtering by commit SHA (works well with Vercel Git integration).
  if (sha) {
    const params = new URLSearchParams({
      projectId,
      limit: "20",
      "meta-githubCommitSha": sha,
      state: "READY",
    });
    if (teamId) params.set("teamId", teamId);
 
    const deployments = await getCandidateDeployments(params);
    if (deployments.length > 0) return deployments[0]!;
  }
 
  // 3) Fallback: search recent deployments and try to match branch name.
  const params = new URLSearchParams({
    projectId,
    limit: "50",
    state: "READY",
  });
  if (teamId) params.set("teamId", teamId);
 
  const deployments = await getCandidateDeployments(params);
  const byBranch =
    branch &&
    deployments.find((d) => {
      const ref = d.meta?.githubCommitRef || d.meta?.githubCommitBranch;
      return ref === branch;
    });
  if (byBranch) return byBranch;
 
  throw new Error(
    `Could not find a READY deployment for project ${projectId} (sha=${sha ?? "n/a"}, branch=${
      branch ?? "n/a"
    }).`
  );
}
 
async function aliasDeployment(deploymentId: string, alias: string) {
  const teamId = optionalEnv("VERCEL_TEAM_ID");
  const q = teamQuery(teamId);
  const path = q ? `/v2/aliases?${q}` : "/v2/aliases";
 
  type Resp = { alias: string; uid: string };
  return vercelFetch<Resp>(path, {
    method: "POST",
    body: JSON.stringify({
      alias,
      deploymentId,
    }),
  });
}
 
async function main() {
  const customDomain = normalizeHost(requiredEnv("VERCEL_CUSTOM_DOMAIN"));
  const deployment = await findDeployment();
 
  const result = await aliasDeployment(deployment.uid, customDomain);
 
  // Intentionally concise so it reads well in CI logs.
  console.log(`Aliased ${deployment.url} -> ${result.alias}`);
}
 
main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

