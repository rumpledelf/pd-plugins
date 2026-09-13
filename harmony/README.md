# Harmony

Listen to a fixed A3 (220 Hz) plus an adjustable second note, from unison to an octave above. The interval slider uses 0.05-semitone increments; presets choose unison, equal-tempered fifth, octave, or a close semitone labelled Clash. Frequencies are `220 × 2^(semitones / 12)`: the fifth is about 329.63 Hz, rather than the just-intonation 330 Hz.

Both displayed waves include the fundamental and modest second/third harmonics, matching the audible periodic-wave components. Motion is slowed to make the patterns visible. No combined trace is shown, keeping the two sources readable. The caption avoids claiming that consonance preferences are universal.

Audio starts only on Play; each normalized oscillator has gain 0.035, with short frequency and amplitude ramps. Stop closes the audio context after fading. Hiding the page or detaching the plugin also stops audio. Reduced motion leaves the waves static while sound plays.

Test: `http://localhost:8080/plugin-tester.html?plugin=harmony`.
