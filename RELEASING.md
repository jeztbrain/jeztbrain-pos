# Releasing a POS update (auto-update via GitHub Releases)

Installed terminals check for updates 10 seconds after start and every 4 hours, download new
versions in the background, show a "Restart & Update" banner, and otherwise install the update
the next time the app is closed. No pen drive or re-install is needed.

## One-time setup
1. Put the real GitHub repo in `package.json` -> `repository.url` (it is a `YOUR_GITHUB_USER`
   placeholder today). `build.publish` (`["github"]`) reads owner/repo from there.
2. The repo must be **public**, or terminals need a read-only token baked into the app. A public
   repo is simplest; the installer contains no secrets (Supabase values are in the bundle either way).
3. Create a GitHub personal access token with `repo` scope and set it on the build machine:
   `setx GH_TOKEN "<token>"` (open a new terminal afterwards).
4. First install of this version must still be done manually (installer from `release/`).
   Every later version arrives automatically.

## Publishing a new version
1. Bump `"version"` in `package.json` (e.g. `2.4.1`). The updater only offers a *higher* version.
2. `npm run electron:publish`
   - builds, creates a **draft** GitHub release containing the installer, `.blockmap` and `latest.yml`.
3. Open the draft on GitHub and click **Publish release**. Terminals pick it up on their next check.

## Notes
- Do not delete `latest.yml` from a release; it is what terminals read.
- Updates are not code-signed yet. Windows SmartScreen may warn on a manual first install; auto-updates
  do not show it. Add a code-signing certificate before wide distribution.
- Diagnostics: `%APPDATA%\jeztbrain-pos-erp\pos-desktop.log` records every update check and error.
