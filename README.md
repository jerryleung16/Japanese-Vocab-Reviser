# Japanese Vocab Reviser

## Requirements

- Node.js `20.19` or newer
- A GitHub Copilot CLI installation authenticated for the local user account
- Git, if you are cloning or contributing to the repository

The Copilot tutor uses the local CLI login. The repository does not contain a Copilot token, GitHub token, or hosted AI credential.

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

This backend is private and local-only. Do not bind it to a LAN address or deploy it publicly: the ambient Copilot CLI login belongs to the owner of this machine. Phone or iPad access requires a separately authenticated, HTTPS-hosted backend and is outside this project scope. GitHub Pages is not supported for the full app because it cannot run the local Copilot backend.
