# Metronome Plugin

An animated metronome page module with radios for common musical timing speeds.

## Features

- Scalable SVG animated pendulum swinging back and forth at the chosen tempo (BPM)
- Dynamic weight positioning on the pendulum rod based on selected speed
- Radio button selection for common musical timing speeds:
  - **Largo**: 50 BPM
  - **Adagio**: 70 BPM
  - **Andante**: 92 BPM
  - **Moderato**: 108 BPM
  - **Allegro**: 132 BPM
  - **Presto**: 168 BPM
- Start / Stop button control
- Sound click toggle using Web Audio API
- Inherits host styling for form controls according to `STYLEGUIDE.md`

## Testing locally

Start local HTTP server:

```bash
python3 -m http.server 8080
```

Open:
`http://localhost:8080/plugin-tester.html?plugin=metronome`
