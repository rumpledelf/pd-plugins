# Style Guide

This file defines the plugin-side contract for this repository.

Use it literally. Do not infer extra host behavior that is not written here.

## Start here

When creating a new plugin:

1. Copy `sample/`.
2. Rename the folder to the new plugin id.
3. Rename `sample.json`, `sample.html`, `sample.css`, and `sample.js` to match
   the new plugin id.
4. Edit the copied files.

Do not start from a blank folder unless there is a specific reason.

Plugins in this repo are tested through `plugin-tester.html`.
Do not modify `plugin-tester.html` as part of ordinary plugin work.
Only change the tester when the task is specifically about the tester itself.

## What the host does

This repository owns plugin-side assets only.
The host site owns page structure, placement, loading, and live integration.

The host wraps each plugin in an element with this id:

- `plugin_<id>`

The host may also set these attributes on that wrapper:

- `data-plugin`
- `data-plugin-settings`

Assume all of these are true:

- the HTML file is injected as a fragment
- CSS is loaded separately
- JavaScript runs after the wrapper exists
- the host decides final live placement

Do not assume the manifest controls final production placement.
Do not implement host-side routing, page composition, shared application
state, or global plugin orchestration from inside a plugin.

## HTML rules

Plugin HTML must be a fragment only.

Do not include:

- `<html>`
- `<head>`
- `<body>`
- site header
- site footer
- page navigation

Do not create your own root id that competes with `plugin_<id>`.

Use simple semantic markup.

## JavaScript rules

Wrap plugin code in an IIFE.

Boot from the host wrapper id.

Keep plugin code self-contained, root-scoped, and compatible with being
mounted by an external host.

Do not introduce cross-plugin dependencies or plugin-to-plugin coordination
unless the task explicitly requires it.

Use this pattern:

```js
(function () {
  function parseSettings(root) {
    try {
      return JSON.parse(root.dataset.pluginSettings || '{}');
    } catch (error) {
      return {};
    }
  }

  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') {
      return;
    }

    root.dataset.pluginBooted = 'true';

    const settings = parseSettings(root);
  }

  boot(document.getElementById('plugin_sample'));
})();
```

Rules:

- query plugin DOM from `root`
- do not use `document.querySelector(...)` for plugin elements when
  `root.querySelector(...)` will do
- guard against double initialisation
- tolerate missing optional elements
- keep plugin state inside the plugin

## CSS rules

Scope every selector under `#plugin_<id>`.

Example:

```css
#plugin_sample .sample-row {
  display: flex;
  gap: 8px;
}
```

Default to inherited host styling.

Add CSS only when the plugin needs:

- layout
- spacing
- interaction-specific presentation

Unless explicitly requested otherwise, keep the plugin's visible UI within a
maximum height of `250px`.

Default plugin backgrounds to transparent.

Do not add plugin-local background fills unless the plugin has a real visual or
interaction requirement for one.

Do not add plugin-local borders or decorative colors unless explicitly
requested.

If plugin-local colors are necessary and you are not using an explicit host
utility class, use only shades of pure grey.

Do not invent warm neutrals, tinted blacks, off-whites, or custom accent
colors.

The default local grey palette here is:

- `white`
- `whitesmoke`
- `gainsboro`
- `#333333`

Do not invent control accent colors.

If a control needs a non-default accent color, use an explicit host utility or
the documented host color value.

Do not re-declare by default:

- font family
- text color
- line height
- button styling
- input styling
- generic site chrome

## Host CSS assumptions

These are explicit rules.

### Color utility classes

These classes are not interchangeable.
Treat the lists below as explicit and bounded. They are the current host utility
classes to rely on here, not open-ended examples.

Background or fill utility classes:

- `.blue`
- `.purple`
- `.magenta`
- `.green`
- `.grey`

Text-color utility classes:

- `.bluetext`
- `.purpletext`
- `.magentatext`
- `.greentext`

Current host utility values from `photodir/public/style/style.css`:

- `.blue` / `.bluetext`: `#0585BA`
- `.purple` / `.purpletext`: `#64317B`
- `.magenta` / `.magentatext`: `#B7287E`
- `.green` / `.greentext`: `#4CAF50`
- `.grey`: `#999999`

Use them like this:

- use `.bluetext` when result text should be blue
- use `.purpletext` when result text should be purple
- use `.greentext` when result text should be green
- use `.magentatext` when result text should be magenta
- do not assume there is a matching `*text` class for every background class
- do not invent classes like `.greytext` unless the host actually adds them
- do not use `.green` when you only want green text
- do not use `.blue` when you only want blue text
- do not use `.purple` when you only want purple text
- do not use `.magenta` when you only want magenta text

Do not infer host utility colors from unrelated plugin code or from browser
defaults.

### Form controls

Buttons, inputs, selects, and textareas already inherit host styling.

Default rule:

- do not restyle form controls

Only add control-specific CSS when the plugin has a real structural or
interaction need that inherited styles cannot cover.

If you add CSS, start with:

- layout
- spacing
- sizing

Do not jump straight to custom button chrome, input chrome, or decorative form
styling.

## Manifest rules

Each plugin manifest should include:

- `id`
- `title`
- `page`
- `region`
- `edge`
- `html`
- `css`
- `js`
- `settings`

Treat `page`, `region`, and `edge` as plugin-side metadata.

Do not treat them as a guarantee that production placement is fixed forever.

The host owns live placement.
The manifest is not a license to implement missing host behavior inside the
plugin.

## Common mistakes

Do not do these:

- creating a new plugin from scratch instead of copying `sample/`
- using `.green` when you mean green text
- styling buttons or inputs just because a plugin has a form
- querying plugin elements with `document.querySelector(...)`
- adding full-page markup to the HTML fragment
- assuming the manifest fully defines production placement
