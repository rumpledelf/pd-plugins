# Agent Notes

This repo contains module-side assets for host-mounted page plugins.

When adding a new plugin, start by copying `sample/` to a new folder with the
plugin id as the folder name, then rename the copied files to match that id.
Work from that renamed copy rather than inventing a new structure.

For work in this repo, treat these files as the local source of truth:

- `sample/` for the baseline file structure and boot pattern
- `STYLEGUIDE.md` for host-contract and styling rules
- `README.md` for repository layout and local testing

Plugins in this repo are tested through `plugin-tester.html`.
Do not modify `plugin-tester.html` as part of ordinary plugin work.

Keep plugin code self-contained, root-scoped, and compatible with being mounted
by an external host.
