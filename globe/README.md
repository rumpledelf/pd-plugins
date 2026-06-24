# Globe

This folder contains the standalone globe prototype.

It is one module family within the wider page-modules workspace, but it is also one of the more complicated outliers and should not define the baseline architecture for the simpler modules.

## Purpose

The globe is exploring browse patterns such as:

- `country -> dictionary country page`
- `continent -> countries in that continent`
- `continent -> other continent-scoped surfaces`

The current URL mappings in `app.js` are placeholders. They mostly point to Wikipedia for now, but they stand in for future dictionary routing.

## Current Files

- `index.html`
- `style.css`
- `app.js`
- `app.js.pre-merge-backup`
- `vendor/`
- `data/`
- `assets/`

## Constraints

- Keep vendored files untouched where possible.
- Prefer app-side normalization over editing source geography.
- Treat real-world geography complexity as domain complexity inside this family, not as a reason to complicate the base module system.
