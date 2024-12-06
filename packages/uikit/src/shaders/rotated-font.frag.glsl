#version 300 es
precision highp float;

in vec2 vUV; // UV coordinates passed from the vertex shader
out vec4 fragColor; // Output color

uniform sampler2D fontTexture; // MTSDF texture
uniform vec4 fontColor; // Color for the glyph fill
uniform vec4 outlineColor; // Color for the outline
uniform float screenPxRange; // Screen pixel range for scaling
uniform float outlineThickness; // Thickness of the outline
uniform vec2 canvasWidthHeight; // Canvas dimensions in pixels

float median(float r, float g, float b) {
    return max(min(r, g), min(max(r, g), b));
}

void main() {
    // Sample the MSDF texture
    vec3 msd = texture(fontTexture, vUV).rgb;
    float sd = median(msd.r, msd.g, msd.b);

    // Calculate screen pixel range
    float screenPxDistance = screenPxRange * (sd - 0.5);

    // Convert outline thickness to normalized device coordinates (NDC)
    float outlineThicknessNDC = 0.025 * (screenPxRange / 0.1); // / max(canvasWidthHeight.x, canvasWidthHeight.y);

    // Define sharp cutoff thresholds
    float glyphEdge = 0.0; // Edge for the glyph fill
    float outlineEdgeStart = -outlineThicknessNDC; // Outer edge of the outline
    float outlineEdgeEnd = glyphEdge; // Inner edge of the outline

    // Sharp edge alpha calculations
    float glyphAlpha = step(glyphEdge, screenPxDistance); // Glyph fill
    // float outlineAlpha = step(outlineEdgeStart, screenPxDistance) * (1.0 - step(outlineEdgeEnd, screenPxDistance)); // Outline
    float outlineAlpha = step(outlineEdgeStart, screenPxDistance) * (1.0 - step(outlineEdgeEnd, screenPxDistance)); // Outline
    // Combine the alpha values
    float finalAlpha = max(glyphAlpha, outlineAlpha);

    // Combine the colors
    vec3 finalColor = mix(outlineColor.rgb, fontColor.rgb, glyphAlpha);

    // Output the final fragment color
    fragColor = vec4(finalColor, finalAlpha);
}

// #version 300 es
// precision highp float;

// in vec2 vUV; // UV coordinates passed from the vertex shader
// out vec4 fragColor; // Output color

// uniform sampler2D fontTexture; // MSDF texture
// uniform vec4 fontColor; // Color for the glyph fill
// uniform vec4 outlineColor; // Color for the outline

// uniform float screenPxRange; // Distance range for anti-aliasing
// uniform float outlineThickness; // Thickness for the outline in normalized units

// // Median function for decoding MSDF
// float median(float r, float g, float b) {
//     return max(min(r, g), min(max(r, g), b));
// }

// void main() {
//     // Sample the MSDF texture
//     vec3 msd = texture(fontTexture, clamp(vUV, 0.01, 0.99)).rgb;
//     float sd = median(msd.r, msd.g, msd.b);

//     // Calculate the screen-space distance
//     float screenPxDistance = screenPxRange * (sd - 0.5);

//     // Calculate the glyph alpha
//     float glyphAlpha = clamp(0.5 - screenPxDistance, 0.0, 1.0);

//     // Calculate the outline alpha with smoother fall-off
//     float outlineStart = 0.5 - outlineThickness;
//     float outlineEnd = 0.5;
//     float outlineAlpha = smoothstep(outlineStart, outlineEnd, screenPxDistance);

//     // Adjust the outline alpha to prevent it from overwhelming the glyph
//     outlineAlpha *= (1.0 - glyphAlpha);

//     // Combine the final alpha values
//     float finalAlpha = max(glyphAlpha, outlineAlpha);

//     // Blend colors based on alpha values
//     vec3 finalColor = mix(outlineColor.rgb, fontColor.rgb, glyphAlpha);

//     // Output the final fragment color
//     fragColor = vec4(finalColor, finalAlpha);
// }
// #version 300 es
// precision highp float;

// in vec2 vUV; // UV coordinates passed from the vertex shader
// out vec4 fragColor; // Output color

// uniform sampler2D fontTexture; // MSDF texture
// uniform vec4 fontColor; // Color for the glyph fill
// uniform vec4 outlineColor; // Color for the outline
// uniform float screenPxRange; // Screen pixel range for scaling
// uniform float outlineThickness; // Thickness of the outline
// uniform vec2 canvasWidthHeight; // Canvas dimensions in pixels

// float median(float r, float g, float b) {
//     return max(min(r, g), min(max(r, g), b));
// }

// void main() {
//     // Sample the MSDF texture
//     vec3 msd = texture(fontTexture, vUV).rgb;
//     float sd = median(msd.r, msd.g, msd.b);

//     // Calculate screen pixel range
//     float screenPxDistance = screenPxRange * (sd - 0.5);

//     // Convert outline thickness to normalized device coordinates (NDC)
//     float outlineThicknessNDC = outlineThickness / max(canvasWidthHeight.x, canvasWidthHeight.y);

//     // Define smooth thresholds for antialiasing
//     float glyphEdge = 0.0; // Edge for the glyph fill
//     float outlineEdgeStart = -outlineThicknessNDC; // Outer edge of the outline
//     float outlineEdgeEnd = glyphEdge; // Inner edge of the outline

//     // Smooth alpha calculations
//     float glyphAlpha = clamp(1.0 - smoothstep(-screenPxRange, screenPxRange, screenPxDistance), 0.0, 1.0); // Glyph fill
//     float outlineAlpha = clamp(
//         smoothstep(outlineEdgeStart - 0.01, outlineEdgeStart + 0.01, screenPxDistance) - 
//         smoothstep(outlineEdgeEnd - 0.01, outlineEdgeEnd + 0.01, screenPxDistance), 
//         0.0, 1.0
//     );

//     // Combine the alpha values
//     float finalAlpha = max(glyphAlpha, outlineAlpha);

//     // Combine the colors
//     vec3 finalColor = mix(outlineColor.rgb, fontColor.rgb, glyphAlpha);

//     // Output the final fragment color
//     fragColor = vec4(finalColor, finalAlpha);
// }

