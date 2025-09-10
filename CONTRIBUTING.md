Contributing

Thanks for contributing to this project! A few notes to keep VS Code and the GitHub Pull Requests extension happy, especially on corporate networks with proxies or TLS interception.

VS Code + GitHub PRs extension

- Use the workspace settings in `.vscode/settings.json` (committed) as a safe baseline.
- If you are behind TLS interception, ensure your organization’s root CA is installed in the OS trust store. Then in VS Code:
  - `http.systemCertificates`: `true`
  - `http.proxySupport`: `on`
- Only for troubleshooting, you can temporarily set `http.proxyStrictSSL: false`. Revert to strict SSL once the root CA is installed.
- If the PR view fails with network errors (e.g., ECONNRESET):
  1) Reload the window (Command Palette → Developer: Reload Window)
  2) Sign out/in of GitHub (Accounts menu)
  3) Clear the extension cache at:
     - Windows: %APPDATA%\Code\User\globalStorage\github.vscode-pull-request-github
     - macOS: ~/Library/Application Support/Code/User/globalStorage/github.vscode-pull-request-github
     - Linux: ~/.config/Code/User/globalStorage/github.vscode-pull-request-github
  4) Retry authentication when prompted

CLI fallback

- You can always use the GitHub CLI while investigating extension issues:
  - `gh pr status`
  - `gh pr view <number> --web`
  - `gh pr checkout <number>`

Formatting and linting

- This repo uses flat-config ESLint and may run format-on-save in VS Code. If you see lint errors, run the project’s standard scripts (see `package.json`).

Thanks!
