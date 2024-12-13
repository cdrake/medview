#version 300 es
#line 613
precision highp int;
precision highp float;

in vec3 vPos; // Vertex position in normalized coordinates
out vec2 TexCoord; // Texture coordinates for the fragment shader

void main() {
    // Pass the 2D texture coordinates from the vertex position
    TexCoord = vPos.xy;

    // Transform the vertex position to clip space
    gl_Position = vec4((vPos.xy - vec2(0.5, 0.5)) * 2.0, 0.0, 1.0);
}
