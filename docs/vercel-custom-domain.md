# Vercel: Point this Branch Deployment at a Custom Domain

This repo uses **Vercel Git Integration** for deployments. Mapping a **custom domain** to a specific **preview/branch deployment** is not controlled by code by default; it must be done in Vercel (or via Vercel API/CLI).

## What this branch needs

You provided a preview deployment host:

- `scope-generator-git-cursor-contrac-565edb-jimmy-theocs-projects.vercel.app`

To serve that build from a custom domain, you must either:

- **Alias** the deployment to a domain (recommended for branch previews; usually a subdomain), or
- **Promote** the deployment to Production (not recommended unless you intend to replace production).

## Option A (recommended): Automated aliasing via GitHub Actions

This branch includes a workflow: `.github/workflows/vercel-custom-domain-alias.yml`

It runs on pushes to `cursor/vercel-custom-domain-deployment-d8d2` (and can also be run manually).

### Required GitHub Action secrets

Create these secrets in GitHub:

- `VERCEL_TOKEN`: Vercel personal token (Account Settings → Tokens)
- `VERCEL_PROJECT_ID`: Vercel Project ID (Project → Settings → General)
- `VERCEL_CUSTOM_DOMAIN`: The custom domain to point at this deployment (prefer a subdomain, e.g. `preview.yourdomain.com`)

Optional:

- `VERCEL_TEAM_ID`: If the Vercel project is owned by a team (Team Settings → General)

### Manual run (recommended the first time)

Run the workflow with `deployment_url` set to:

- `scope-generator-git-cursor-contrac-565edb-jimmy-theocs-projects.vercel.app`

This avoids ambiguity if multiple deployments exist for the same commit.

If you want to override the target domain for a one-off run, set the workflow input `custom_domain` (it will override the `VERCEL_CUSTOM_DOMAIN` secret).

## Option B: Do it in the Vercel dashboard (fastest one-off)

1. Open the Vercel project.
2. Go to **Deployments**.
3. Open the deployment that matches:
   - `scope-generator-git-cursor-contrac-565edb-jimmy-theocs-projects.vercel.app`
4. Use the deployment menu to **Assign Domains / Add Domain** (wording varies).
5. Choose the desired custom domain (it must already be added/verified in the project’s **Domains** settings).

## Notes / gotchas

- If you alias an **apex** domain (e.g. `yourdomain.com`) you will effectively replace production traffic. Prefer a **dedicated subdomain** for branch previews.
- The custom domain must be **added and verified** under the Vercel project’s Domains settings before aliasing will succeed.

