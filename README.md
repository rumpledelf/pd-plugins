# Photographic Dictionary Page Modules

This workspace is for small interactive page-mounted modules for Photographic Dictionary.

The point of these modules is to add bounded, JS-driven interactive companions to specific word pages and category or listing pages: calculators, visualisers, tiny toys, explainers, and similar small interactive pieces that support the meaning of a page without turning into full standalone apps.

Examples include:

- a zodiac calculator on zodiac pages
- area and volume helpers on shape pages
- a planets visualiser on the planets page
- a small keyboard or piano-style module on word pages such as `keyboard`, `piano`, `octave`, or `note`

## Why This Lives Outside The Main Site

These modules are developed separately from the main PHP/MySQL codebase because they are conceptually distinct and easier to iterate on outside the larger app.

The main site provides a small bridge that:

- reads a module config file
- allows the user to decide what page a module belongs on
- allows the user to decide where on the page it should be inserted
- at runtime, injects module HTML, CSS, and JS into the page

The host site owns placement. The module owns its own behaviour.

## Module Shape

Most modules in this collection are intentionally small. They are organised with one folder at the top level per family.

The common pattern is:

- a module family folder at the top level
- a small config file that the main site can read
- a static HTML snippet used to create anchor elements or wrapper markup
- module-owned CSS
- module-owned JavaScript that does the real work
- optional settings or family-specific data

Some families will stay single-purpose. Others may contain closely related variants that share assets and code but differ in data or presentation.

## Placement Model

Modules are intended to mount into named regions of a parent page rather than inventing their own placement logic.

The current model is:

- choose a page
- choose a region
- choose an edge within that region: `top` or `bottom`

For many modules the common placement will probably be the bottom of `#contentheader`, but the system allows other named regions where needed.

## Development and Testing

Modules can be tested locally using `plugin-tester.html`. Because the tester uses `fetch()` to load plugin assets, it must be served over HTTP rather than opened directly as a file.

Serve the project root on port 8080 (avoids the commonly-occupied 8000 and 3000):

```
python3 -m http.server 8080
```

Then open:

```
http://localhost:8080/plugin-tester.html?plugin=time
http://localhost:8080/plugin-tester.html?plugin=zodiac
http://localhost:8080/plugin-tester.html?plugin=piano
```

Replace `time` with the folder name of whichever module you are working on.