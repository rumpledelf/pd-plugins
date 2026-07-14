# Wax Wane Moon Phase Simulation Plugin

This plugin simulates a 30-day lunar cycle time-lapse animation.

## Features

- **Parabolic Orbital Trajectory**: The moon asset crosses the sky in a smooth parabolic curve height.
- **Dynamic ClipPath Illumination Mask**: Generates razor-sharp SVG paths representing correct phases (Waxing Crescent, First Quarter, Waxing Gibbous, Full Moon, Waning Gibbous, Third Quarter, Waning Crescent, New Moon).
- **Environment Layering**: Includes a vertical linear gradient sky background, a background stars group that twinkle deterministically, a solid black hills silhouette foreground, and the moon layer which blocks background elements.
- **Snappy Cross-Fade Transitions**: Simulates high-end time-lapse camera shutter action by fading elements out/in quickly during step changes.
- **Deterministic Twinkling**: Stars subtly shift radius and opacity per day based on a reproducible trigonometric sequence.
