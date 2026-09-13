# Sound waves

Play a sine tone, change pitch over A2–A5 (110–880 Hz), and vary loudness. The illustrative waveform keeps a fixed time window, so frequency changes the number of peaks and volume changes amplitude. Motion is slowed for visibility; this is a sound-pressure graph, not the physical path of an air particle.

Audio starts only on Play tone. Default gain is 0.03, maximum 0.12; volume also depends on the device. Frequency and gain changes are smoothed. Stop closes the audio context after a short fade. Audio stops when the page is hidden or the module is detached. Reduced motion keeps the waveform static while the tone plays.

Test: `http://localhost:8080/plugin-tester.html?plugin=sound-waves`.
