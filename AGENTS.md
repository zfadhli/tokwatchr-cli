# tokwatchr-cli

CLI tool for downloading TikTok livestreams — powered by [tokwatchr](https://github.com/zfadhli/tokwatchr).

## Tech Stack

| Layer | Choice |
|-------|--------|
| Runtime | Node.js >= 18 / [Bun](https://bun.sh) |
| Language | TypeScript (strict) |
| CLI framework | [cac](https://github.com/cacjs/cac) |
| Testing | [Bun test](https://bun.sh/docs/cli/test) |
| Lint + Format | [Biome](https://biomejs.dev) |
| CI | GitHub Actions |

## Conventions

### Commit Messages

Use emoji conventional commits. The emoji comes first, followed by the conventional scope in lowercase, then a short description.

| Type | Emoji | Example |
|------|-------|---------|
| Feature | ✨ | `✨ feat: add download command` |
| Bug fix | 🐛 | `🐛 fix: handle offline user gracefully` |
| Refactor | ♻️ | `♻️ refactor: extract format helpers` |
| Documentation | 📚 | `📚 docs: add usage examples to README` |
| Test | 🧪 | `🧪 test: add format utility tests` |
| Chore | 🔧 | `🔧 chore: update biome config` |
| Style | 💄 | `💄 style: format with biome` |
| Performance | ⚡ | `⚡ perf: reduce memory in stream pipe` |

### Branch Naming

- `feature/<short-description>` — new features and enhancements
- `fix/<short-description>` — bug fixes
- `chore/<short-description>` — maintenance tasks (deps, config, CI)

Use kebab-case for the description portion.

## Quality Gates

Before every commit, ensure these pass:

1. **TypeScript check** — `bun run typecheck` (noEmit, strict)
2. **Tests** — `bun run test` (all passing)
3. **Lint** — `bun run lint` (Biome, no warnings)
4. **Format** — `bun run format` (Biome, no unformatted files)

These are **not** enforced by a pre-commit hook (to keep setup simple), but CI enforces them on push and PR.

## Git Safety Rules

- **No force push** — never use `--force` or `--force-with-lease`. If you need to rewrite history, use the GitHub UI or create a new branch.
- **No secrets** — never commit API keys, tokens, passwords, or `.env` files. The `.gitignore` ignores `.env` and `.env.local`.
- **No `--no-verify`** — never bypass CI hooks. If a check fails, fix it before committing.

