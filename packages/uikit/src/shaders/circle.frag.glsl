#version 300 es
precision highp int;
precision highp float;

uniform vec4 circleColor; // Color of the circle
uniform vec4 shadowColor; // Color of the shadow
uniform vec2 shadowOffset; // Offset of the shadow from the circle center
uniform float shadowBlur; // Blur radius for the shadow
uniform float fillPercent; // Fill percentage for filled circles

in vec2 vUV;
out vec4 fragColor;

void main() {
    vec2 circleCenter = vec2(0.5, 0.5);
    vec2 shadowCenter = circleCenter + shadowOffset;

    // Distance from current fragment to circle and shadow centers
    float distanceToCircle = length(vUV - circleCenter);
    float distanceToShadow = length(vUV - shadowCenter);

    // Shadow alpha gradient
    float shadowAlpha = 1.0 - smoothstep(0.5, 0.5 + shadowBlur, distanceToShadow);

    // If within shadow area, render shadow
    if (distanceToShadow <= 0.5 + shadowBlur) {
        fragColor = vec4(shadowColor.rgb, shadowColor.a * shadowAlpha);
    }

    // If within circle bounds, render circle
    if (distanceToCircle <= 0.5 && distanceToCircle >= (1.0 - fillPercent) / 2.0) {
        fragColor = circleColor;
    }

    // Discard fragments outside both circle and shadow
    if (distanceToCircle > 0.5 && distanceToShadow > 0.5 + shadowBlur) {
        discard;
    }
}
