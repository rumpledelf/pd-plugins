# Sample Plugin

Copy this folder when starting a new plugin.

Rename:

- the folder
- `sample.json`
- `sample.html`
- `sample.css`
- `sample.js`

Then update the copied file contents to use the new plugin id.

This sample shows:

- the expected manifest shape
- fragment-only HTML
- root-scoped JavaScript boot
- optional settings parsing
- minimal layout-only CSS
- inherited host styling for form controls
- text color utilities used on result text only

This sample intentionally does not:

- restyle the button
- restyle the text input
- use background color utility classes for result text
- create a second fake plugin root
