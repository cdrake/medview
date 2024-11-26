#version 300 es
precision highp int;
precision highp float;

uniform highp sampler2D fontTexture;
uniform vec4 fontColor;
uniform vec4 outlineColor;
uniform float screenPxRange;
uniform float outlineThickness;
uniform vec2 canvasWidthHeight;

in vec2 vUV;
out vec4 color;

float median(float r, float g, float b) {
    return max(min(r, g), min(max(r, g), b));
}

void main() {
    vec3 msd = texture(fontTexture, vUV).rgb;
    float sd = median(msd.r, msd.g, msd.b);

    float outlineThicknessNDC = outlineThickness / max(canvasWidthHeight.x, canvasWidthHeight.y);
    float screenPxDistance = screenPxRange * (sd - 0.5);

    float glyphAlpha = clamp(screenPxDistance + 0.5, 0.0, 1.0);
    float outlineEdgeStart = -outlineThicknessNDC;
    float outlineEdgeEnd = 0.0;
    float outlineAlpha = smoothstep(outlineEdgeStart - 0.01, outlineEdgeEnd + 0.01, screenPxDistance) * (1.0 - glyphAlpha);

    vec3 finalColor = mix(outlineColor.rgb, fontColor.rgb, glyphAlpha);
    float finalAlpha = max(outlineAlpha * outlineColor.a, glyphAlpha * fontColor.a);

    color = vec4(finalColor, finalAlpha);
}
