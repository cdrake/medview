#version 300 es

layout(location = 0) in vec3 pos;

uniform vec2 canvasWidthHeight; // Canvas dimensions
uniform vec4 leftTopWidthHeight; // [x, y, width, height]
uniform vec2 shadowOffset; // Shadow offset relative to the circle center
uniform float shadowBlur; // Shadow blur radius
uniform float z; // Depth value

out vec2 vUV; // UV coordinates for the fragment shader

void main(void) {
    // Calculate margins to expand bounds for the shadow
    float marginX = shadowBlur + abs(shadowOffset.x * leftTopWidthHeight.z);
    float marginY = shadowBlur + abs(shadowOffset.y * leftTopWidthHeight.w);

    // Expanded bounding box to fully enclose the shadow
    vec4 expandedBounds = vec4(
        leftTopWidthHeight.x - marginX,
        leftTopWidthHeight.y - marginY,
        leftTopWidthHeight.z + marginX * 2.0,
        leftTopWidthHeight.w + marginY * 2.0
    );

    // Convert pixel coordinates to normalized device coordinates (NDC)
    vec2 frac;
    frac.x = (expandedBounds.x + (pos.x * expandedBounds.z)) / canvasWidthHeight.x;
    frac.y = 1.0 - ((expandedBounds.y + ((1.0 - pos.y) * expandedBounds.w)) / canvasWidthHeight.y);
    frac = (frac * 2.0) - 1.0;

    // Adjust UVs to reflect expanded bounds (0 to 1 range for expanded area)
    vUV = vec2(pos.x * (expandedBounds.z / leftTopWidthHeight.z), pos.y * (expandedBounds.w / leftTopWidthHeight.w));

    gl_Position = vec4(frac, z, 1.0);
}
