#version 300 es
precision mediump float;

in vec2 vUV; // Input varying from vertex shader
uniform sampler2D u_mtsdf_font;

uniform vec2 u_unit_range; // Unit range for screen pixel scaling
uniform float u_rounded_fonts; // Rounded corners for inner glyphs
uniform float u_rounded_outlines; // Rounded corners for outlines
uniform float u_threshold; // Threshold for glyph sharpness
uniform float u_out_bias; // Bias for glyph edges
uniform float u_outline_width_absolute; // Absolute outline width
uniform float u_outline_width_relative; // Relative outline width
uniform float u_outline_blur; // Blur factor for the outline
uniform float u_gradient; // Gradient effect intensity
uniform float u_gamma; // Gamma correction factor

out vec4 fragColor; // Output fragment color

// Helper function for computing median
float median(float r, float g, float b) {
    return max(min(r, g), min(max(r, g), b));
}

// Helper function to calculate screen pixel range
float screenPxRange(vec2 texcoord) {
    vec2 screenTexSize = vec2(1.0) / fwidth(texcoord);
    return max(0.5 * dot(u_unit_range, screenTexSize), 1.0);
}

void main() {
    // Sample the MTSDF texture
    vec4 distances = texture(u_mtsdf_font, vUV);

    // Decode the MTSDF
    float d_msdf = median(distances.r, distances.g, distances.b);
    float d_sdf = distances.a; // SDF channel from MTSDF
    d_msdf = min(d_msdf, d_sdf + 0.1); // Fix for edge glitches

    // Blend between sharp and rounded corners
    float d_inner = mix(d_msdf, d_sdf, u_rounded_fonts);
    float d_outer = mix(d_msdf, d_sdf, u_rounded_outlines);

    // Adjust threshold for edge detection
    float inverted_threshold = 1.0 - u_threshold;
    float width = screenPxRange(vUV);

    // Calculate inner and outer edges
    float inner = width * (d_inner - inverted_threshold) + 0.5 + u_out_bias;
    float outer = width * (d_outer - inverted_threshold + u_outline_width_relative) + 0.5 + u_out_bias + u_outline_width_absolute;

    // Calculate opacity
    float inner_opacity = clamp(inner, 0.0, 1.0);
    float outer_opacity = clamp(outer, 0.0, 1.0);

    // Define colors
    vec4 inner_color = vec4(1.0, 1.0, 1.0, 1.0); // Glyph color
    vec4 outer_color = vec4(0.0, 0.0, 0.0, 1.0); // Outline color

    // Apply blur to the outline
    if (u_outline_blur > 0.0) {
        float blur_start = u_outline_width_relative + u_outline_width_absolute / width;
        outer_color.a = smoothstep(blur_start, blur_start * (1.0 - u_outline_blur), inverted_threshold - d_sdf - u_out_bias / width);
    }

    // Apply gradient effect
    if (u_gradient > 0.0) {
        vec2 normal = normalize(vec3(dFdx(d_inner), dFdy(d_inner), 0.01)).xy;
        float light = 0.5 * (1.0 + dot(normal, normalize(vec2(-0.3, -0.5))));
        inner_color = mix(inner_color, vec4(light, light, light, 1.0), smoothstep(u_gradient + inverted_threshold, inverted_threshold, d_inner));
    }

    // Apply gamma correction
    inner_opacity = pow(inner_opacity, 1.0 / u_gamma);

    // Final color blending
    fragColor = (inner_color * inner_opacity) + (outer_color * (outer_opacity - inner_opacity));
    // fragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
// #version 300 es
// precision mediump float;

// in vec2 vUV;
// out vec4 fragColor;

// void main() {
//     // fragColor = vec4(vUV.x, vUV.y, 0.0, 1.0); // Gradient for testing
//     fragColor = vec4(vUV, 0.0, 1.0);
// }
