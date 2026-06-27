# Agent Notes

This repo contains module-side assets for host-mounted page plugins.

The scope of work in this repo is intentionally narrow.
Do not expand a plugin task into host-app architecture, cross-plugin systems,
site-wide refactors, new infrastructure, or speculative platform work.
Implement only the smallest module-side change needed for the requested plugin
behavior.

When adding a new plugin, start by copying `sample/` to a new folder with the
plugin id as the folder name, then rename the copied files to match that id.
Work from that renamed copy rather than inventing a new structure.

For work in this repo, treat these files as the local source of truth:

- `sample/` for the baseline file structure and boot pattern
- `STYLEGUIDE.md` for host-contract and styling rules
- `README.md` for repository layout and local testing

Plugins in this repo are tested through `plugin-tester.html`.
Do not modify `plugin-tester.html` as part of ordinary plugin work.

- Do not treat this repository as a starting point for broader product implementation. It exists to build or edit self-contained page plugins only.
- Do not read, search, or inspect files in other plugin directories in this repository. Draw all layout, setup, and implementation patterns exclusively from the `sample/` folder, `STYLEGUIDE.md`, and `README.md`.
