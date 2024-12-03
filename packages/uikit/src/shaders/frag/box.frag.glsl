#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2 iResolution;      // Canvas resolution (width, height)
uniform vec2 boxStart;         // Start point of the box (NDC)
uniform vec2 boxEnd;           // End point of the box (NDC)
uniform float boxThickness;    // Thickness of the box (NDC)
uniform float outlineThickness; // Outline thickness in pixels
uniform vec4 fillColor;        // Fill color of the box
uniform vec4 outlineColor;     // Outline color of the box

// Signed distance function for an oriented box
float sdOrientedBox(in vec2 p, in vec2 a, in vec2 b, float th) {
    float l = length(b - a);
    vec2 d = (b - a) / l;
    vec2 q = p - (a + b) * 0.5;
    q = mat2(d.x, -d.y, d.y, d.x) * q;
    q = abs(q) - vec2(l * 0.5, th);
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

void main() {
    // Normalize pixel coordinates
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 p = (2.0 * fragCoord - iResolution) / iResolution.y;
    
    // Convert outline thickness from pixels to NDC
    float outlineThicknessNDC = (outlineThickness / iResolution.y) * 2.0;

    // Compute the signed distance to the oriented box
    float d = sdOrientedBox(p, boxStart, boxEnd, boxThickness);

    // Sharpen the edges using smoothstep with a narrow range
    float edgeStart = -outlineThicknessNDC * 0.5;
    float edgeEnd = 0.0;
    float edge = smoothstep(edgeStart, edgeEnd, d);

    // Combine the colors based on the edge
    vec3 finalColor = mix(fillColor.rgb, outlineColor.rgb, edge);
    float finalAlpha = mix(outlineColor.a, fillColor.a, edge);

    fragColor = vec4(finalColor, finalAlpha);

    // Discard fragments outside the outline range for better performance
    if (d > outlineThicknessNDC) {
        discard;
    }
}
