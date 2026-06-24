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

## Common mistakes

Do not do these:

- creating a new plugin from scratch instead of copying `sample/`
- using `.green` when you mean green text
- styling buttons or inputs just because a plugin has a form
- querying plugin elements with `document.querySelector(...)`
- adding full-page markup to the HTML fragment
- assuming the manifest fully defines production placement
