# Version Bump Rules

This project uses **semantic versioning**: `x.y.z`

| Segment | Bumps when | How |
|---|---|---|
| **z — patch** | A bug is reported and fixed | Label PR with `bug` or `fix` |
| **y — minor** | A feature is added or changed | Label PR with `feature` or `enhancement` |
| **x — major** | Breaking change | Label PR with `major` (manual only) |
| *(none)* | Docs, chores, refactors | No label → no bump |

## How it works

The `.github/workflows/version-bump.yml` CI workflow fires on every merged PR to `main`.
It reads the PR labels, runs `npm version patch|minor|major --no-git-tag-version`,
commits `package.json`, creates a git tag (`v1.2.3`), and pushes to `main`.

## Quick reference

- Bug reported → label the fix PR **`bug`** or **`fix`** → `z` bumps
- New feature / behavior change → label the PR **`feature`** or **`enhancement`** → `y` bumps
- Breaking change → label the PR **`major`** → `x` bumps
- Docs / cleanup → no label → version unchanged
