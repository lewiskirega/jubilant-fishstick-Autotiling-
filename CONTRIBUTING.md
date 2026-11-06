# Contributing to Fedora AutoTile

Thank you for your interest in contributing to **Fedora AutoTile**! This project aims to deliver a top-tier, native automatic tiling extension for modern GNOME on Fedora and Linux distributions.

---

## Code of Conduct

All contributors and participants are expected to adhere to the [Code of Conduct](CODE_OF_CONDUCT.md). Please report unacceptable behavior privately in accordance with our reporting guidelines.

---

## Development Setup

### Prerequisites
- Fedora Workstation (or any modern Linux distribution running GNOME 50 or 51 under Wayland)
- `gjs` (>= 1.80)
- `glib2-devel` (provides `glib-compile-schemas`)
- `git`
- `make`
- `node` (optional, for running headless tests outside GJS)

### Cloning the Repository
```bash
git clone https://github.com/lewiskirega/fedora-autotile.git
cd fedora-autotile
```

### Git Branching Model
We follow standard Git flow:
- `main`: Production-ready, stable releases.
- `develop`: Integration branch for tested upcoming features.
- Feature branches: `feature/<feature-name>` branched from `develop`.
- Bugfix branches: `fix/<issue-name>` branched from `develop`.
- Release branches: `release/<version>`.

Example:
```bash
git checkout develop
git checkout -b feature/interactive-resize
```

### Development Commands
We provide a standard `Makefile` for developer tasks:

```bash
make check       # Validate syntax across all modules
make test        # Run the full automated test suite (Node & GJS)
make build       # Compile schemas and build extension
make pack        # Produce clean distributable ZIP
make dev-install # Symlink or install to local extension directory
make uninstall   # Remove installed local extension
```

---

## Commit Guidelines (Conventional Commits)

Commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` A new feature or capability.
- `fix:` A bug fix.
- `docs:` Documentation changes only.
- `test:` Adding or refactoring tests.
- `refactor:` Code change that neither fixes a bug nor adds a feature.
- `perf:` Performance improvements.
- `chore:` Maintenance tasks, dependency updates, build tooling.
- `ci:` CI/CD workflow configuration changes.

Example:
```bash
git commit -m "feat(shortcuts): add dynamic window resize keybindings"
```

---

## Pull Request Guidelines

1. **Keep PRs focused**: Each PR should address a single feature or bug fix.
2. **Include Tests**: Add unit tests in `tests/` for any new geometry, layout, or filtering logic.
3. **Run Checks**: Ensure `make check` and `make test` pass with 100% success before submitting.
4. **Never Commit Secrets**: Never commit credentials, private SSH keys, personal tokens, or local build artifacts.
5. **Fill out the PR Template**: Describe what was changed, how it was tested, and link related issues.
