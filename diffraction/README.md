# Diffraction

Change slit width and centre-to-centre spacing independently. Values are in wavelengths (λ); green illustrates monochromatic light using the host green. Five coherent slits create a far-field pattern.

Intensity is proportional to sinc²(π a sinθ / λ) × [sin(N π d sinθ / λ)/(N sin(π d sinθ / λ))]², with removable singularities handled explicitly. Width controls the envelope; spacing controls principal maxima sinθ=mλ/d. Screen coordinates use sinθ=y/√(L²+y²). Brightness is normalized and gamma lifted for visibility; ray geometry is schematic and the slit drawing is enlarged. Four subpixel samples per screen half-pixel prevent missing thin peaks.

Source: [University of Alberta, Lecture 36: Diffraction on multiple slits](https://sites.ualberta.ca/~pogosyan/teaching/PHYS_130/FALL_2010/lectures/lect36/lecture36.html).

Motion depicts propagation only; reduced motion freezes it while controls and screen still work.

Test: http://localhost:8080/plugin-tester.html?plugin=diffraction
