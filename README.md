# Photographic Dictionary Page Modules

This repository contains small page-mounted modules for Photographic Dictionary.
Each module owns its own HTML fragment, optional CSS, JavaScript behaviour, and
manifest data. The host site decides where a module is mounted and loads the
module assets at runtime.

## Repo shape

- one top-level folder per plugin
- `sample/` is the starter plugin to copy when making a new one
- `STYLEGUIDE.md` documents the module-side contract and host CSS assumptions
- `plugin-tester.html` is the local harness for loading a plugin over HTTP

## Plugin files

A typical plugin folder contains:

- `<id>.json` manifest
- `<id>.html` injected HTML fragment
- `<id>.css` optional scoped CSS
- `<id>.js` boot and behaviour
- optional plugin-local assets or notes

The manifest belongs to the plugin, but live placement belongs to the host.
Manifest placement fields are defaults or hints for testing and management, not
an exhaustive description of production usage.

## Local testing

`plugin-tester.html` loads plugin assets via `fetch()`, so serve this repository
over HTTP instead of opening the file directly.

Plugins in this repo are normally tested by loading them through
`plugin-tester.html`. You usually should not modify the tester when building or
editing a plugin.

```bash
python3 -m http.server 8080
```

Then open one of these URLs in a browser:

- `http://localhost:8080/plugin-tester.html?plugin=sample`

To test a new plugin, replace the `plugin=` value with the plugin folder name.

## Working pattern

Copy `sample/`, rename the folder and files to the new plugin id, then edit the
copied files. Use `STYLEGUIDE.md` for code and styling conventions.
