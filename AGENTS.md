# Agent Notes

This file is the complete reference for working in this project. Do not read files from the parent site (its CSS, PHP, or templates) — that codebase is separate and large. Everything a model needs to know about host conventions is documented here.

## Reference modules

Before writing any new module, read the finished examples:

- `piano/` — module with custom CSS and a visual interaction
- `zodiac/` — module with no CSS; inherits everything from the parent site

These are the canonical patterns. Match them structurally before doing anything else.

## Module structure

Each module lives in its own folder and consists of:

- `<name>.json` — config: `id`, `title`, `page`, `region`, `edge`, `html`, `css`, `js[]`, `settings`
- `<name>.html` — a plain HTML fragment (no `<html>`, `<head>`, or `<body>`); injected by the host
- `<name>.css` — scoped styles (omit the file and leave `"css": ""` in JSON if no custom CSS is needed)
- `<name>.js` — behaviour

## JavaScript conventions

- Wrap all code in an IIFE: `(function () { ... })();`
- Boot via `document.getElementById('plugin_<id>')` where `<id>` matches the JSON `id` field
- Guard against double-initialisation at the top of `boot()`:
  ```js
  if (!root || root.dataset.pluginBooted === 'true') { return; }
  root.dataset.pluginBooted = 'true';
  ```
- Always include a `parseSettings(root)` function that reads `root.dataset.pluginSettings`
- Query all DOM elements via `root.querySelector(...)`, never `document.querySelector(...)`
- Settings are injected by the host as `root.dataset.pluginSettings` (JSON string)

## CSS conventions

- Scope every rule under `#plugin_<id>` — no global selectors
- If the module needs no custom layout or interaction-specific styles, omit the CSS file entirely (see zodiac)
- When a max-width is set on a module wrapper, always pair it with `margin: 0 auto` to centre it within the host region
- Do not re-declare properties that the parent site already sets (font, color, line-height, form element appearance, etc.)

## Styling

- Match the existing Photographic Dictionary visual language.
- Do not add styling unless it is absolutely necessary for a genuinely custom interaction or layout.
- Assume inheritance first, particularly for form elements.
- Do not introduce beige styling, decorative cards, soft panel UI, or ornamental wrappers unless explicitly asked.
- Prefer angular layouts and solid colors over decorative treatments.
- Use existing site utility classes for color where possible. `.green`, `.magenta`, `.blue`, `.purple`, `.grey` are background color classes. `.greentext`, `.magentatext` etc. are text color modifiers, used for output or result text only.
- Do not apply color utility classes to buttons or interactive controls — buttons are styled by the parent site by default.
- Only add custom CSS when the module genuinely needs structure or interaction-specific layout that the parent site does not already provide.
- Do not add borders or shading unless required for custom visualisation (eg, edge of a clock).
- Keep modules small and visually quiet unless the interaction itself requires more.
