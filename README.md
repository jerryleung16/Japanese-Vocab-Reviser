# Japanese Vocab Reviser

## Requirements

- Node.js `20.19` or newer
- A GitHub Copilot CLI installation authenticated for the local user account
- Git, if you are cloning or contributing to the repository

Local development uses the local Copilot CLI login. The repository does not contain a Copilot token, GitHub token, OAuth secret, or hosted AI credential.

## Clean clone setup

Clone the repository, install the pinned dependencies, and start the local server:

```text
git clone https://github.com/jerryleung16/Japanese-Vocab-Reviser.git
cd Japanese-Vocab-Reviser
npm ci
npm start
```

Open `http://127.0.0.1:3000/` in the same machine's browser. The server binds only to `127.0.0.1` and uses the authenticated local Copilot CLI account.

Before opening the Copilot panel, make sure the Copilot CLI is installed and logged in according to the CLI's current instructions. If the backend cannot create a session, the panel keeps the vocabulary workflow usable and provides a retry action.

You can copy `.env.example` to `.env` to customize limits or the port. The server reads environment variables supplied by the shell or process manager; it does not require a `.env` file for the defaults.

## Copilot panel

The tutor supports separate user-named conversations. Conversations can be switched independently, cancelled, deleted, retried, and edited. Editing a previous prompt regenerates the conversation from that point and removes later turns. The panel reports session AI credits derived from SDK nano-AIU metrics, premium request cost/count, context tokens, and account premium-interaction quota when the SDK provides it. Unavailable metrics are shown as unavailable rather than estimated.

The server limits request size, message/context length, request rate, concurrent model turns, session-name length, and idle sessions. Operational values can be adjusted in `.env` using `.env.example` as a guide.

## Public Copilot deployment

GitHub Pages can host the vocabulary frontend, but it cannot run the Node.js Copilot backend. The repository includes `render.yaml` for deploying the backend as a separate Render web service.

1. Create a GitHub OAuth App. Set its callback URL to `https://YOUR-RENDER-SERVICE.onrender.com/auth/github/callback`.
2. Create a fine-grained GitHub token for your personal account with the `Copilot Requests` account permission. Keep this token only in Render as `COPILOT_GITHUB_TOKEN`.
3. Create the Render service from `render.yaml` and set `PUBLIC_BASE_URL`, `GITHUB_CALLBACK_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET`, and `COPILOT_GITHUB_TOKEN` in the Render dashboard. Set `GITHUB_CALLBACK_URL` exactly to `https://YOUR-RENDER-SERVICE.onrender.com/auth/github/callback`, matching the GitHub OAuth App callback URL with no trailing slash. Keep `AUTH_MODE=github`, `HOST=0.0.0.0`, `FRONTEND_ORIGIN=https://jerryleung16.github.io`, `FRONTEND_URL=https://jerryleung16.github.io/Japanese-Vocab-Reviser`, and `ALLOWED_GITHUB_LOGIN` set to the permitted GitHub username. `FRONTEND_ORIGIN` is origin-only for CORS; `FRONTEND_URL` is the full Pages project URL used after login.
4. After Render gives the service its URL, add a repository variable named `COPILOT_API_URL` with that HTTPS URL under **Settings > Secrets and variables > Actions > Variables**. The Pages workflow injects it into the public build; do not put a secret in this variable.
5. In **Settings > Pages**, choose **GitHub Actions** as the source. Push to `main` or manually run **Deploy Pages**. The workflow fails if `COPILOT_API_URL` is missing rather than deploying a broken Copilot link.
6. Open the Pages site, open Copilot, and choose `使用 GitHub 登入`. Only the configured GitHub account can use the backend.

The hosted backend uses HttpOnly signed sessions, a one-time OAuth ticket exchange for browsers that block cross-site cookies, a CSRF token for state-changing requests, exact-origin CORS, per-user sessions, rate limits, request limits, and the existing Copilot turn limits. Add a Render PostgreSQL database and set its connection string as `DATABASE_URL` to persist named conversations and their turns across service restarts. The server creates its tables on startup and restores the Copilot SDK context from saved successful turns when a conversation is used again. Without `DATABASE_URL`, conversations remain memory-only for local development. Do not expose the backend without OAuth or put `COPILOT_GITHUB_TOKEN` in browser code.

To enable persistence on Render, create a PostgreSQL database in the same region as the web service, copy its internal connection string into the web service's `DATABASE_URL` environment variable, and redeploy. The `/api/health` response reports `persistence: "configured"` when the connection is active.

### Neon Free migration

Neon Free can be used instead of Render Free Postgres to avoid Render's 30-day database expiration. The application uses standard PostgreSQL through `pg`, so no application code change is required. Use a Neon root branch for production and keep its connection strings only in local environment variables and the Render dashboard.

Before changing Render, install PostgreSQL client tools and verify that `pg_dump`, `pg_restore`, and `psql` are available. Keep dumps outside the repository; dump files are ignored by Git, but they still contain private conversation data.

For a rehearsal or final migration, set the connection strings only in the current PowerShell session:

```powershell
$env:SOURCE_DATABASE_URL = 'Render external PostgreSQL URL'
$env:TARGET_DATABASE_URL = 'Neon unpooled PostgreSQL URL'

pg_dump -Fc -v --no-owner --no-privileges `
	-f "$env:USERPROFILE\Downloads\japanese-vocab-render.dump" `
	"$env:SOURCE_DATABASE_URL"

pg_restore -v --exit-on-error --single-transaction --no-owner --no-privileges `
	-d "$env:TARGET_DATABASE_URL" `
	"$env:USERPROFILE\Downloads\japanese-vocab-render.dump"
```

If the PostgreSQL command-line tools are not installed, the repository also includes a guarded Node-based transfer for the application's two persistence tables:

```powershell
$env:SOURCE_DATABASE_URL = 'Render external PostgreSQL URL'
$env:TARGET_DATABASE_URL = 'Neon unpooled PostgreSQL URL'
npm run db:migrate
```

The command creates the application schema in Neon, refuses to overwrite a non-empty target by default, and copies conversations and ordered turns in one transaction. To intentionally replace a disposable, non-production target, set `$env:ALLOW_TARGET_REPLACE = 'YES'` before running it. Run `npm run db:compare` afterward with the same source and target variables.

Run `npm run db:compare` with both `SOURCE_DATABASE_URL` and `TARGET_DATABASE_URL` set to compare conversation counts, turn counts, owners, statuses, and orphaned turns. During the final migration, freeze new Copilot requests, wait for `/api/health` to report `activeTurns: 0`, take a final dump, restore it to Neon, then replace only Render's `DATABASE_URL` and redeploy. Verify `/api/health` reports `persistence: "configured"` and confirm an existing conversation survives a browser reload and backend restart.

## Local data and GitHub sync

Custom vocabulary and review marks are stored in the browser. The optional GitHub sync panel can read and write the configured sync file using a GitHub Personal Access Token kept in the current browser's local storage. Never commit that token.

The generated personal sync file at `shared/japanese-vocab-sync.json` is intentionally ignored by Git. This keeps personal vocabulary and review progress out of the public repository. Each user can create their own local data or import a sync file through the app.

## Verification

Run the same checks used by GitHub Actions:

```text
npm ci
npm run check
```

The health endpoint can confirm that the local server is running:

```text
http://127.0.0.1:3000/api/health
```

The check command validates all JavaScript modules and runs `npm audit --omit=dev`. GitHub Actions runs these checks on pushes and pull requests to `main`. CI does not start Copilot because GitHub-hosted runners do not have the local user's Copilot authentication.

## Deployment boundary

There are two supported modes: local mode uses `127.0.0.1` and the local Copilot login; hosted mode uses an HTTPS Render backend, GitHub OAuth, and a server-side Copilot token. GitHub Pages alone is not enough because it cannot run `server.js`. Never bind the local mode to a LAN address or deploy it publicly without the hosted authentication configuration.
