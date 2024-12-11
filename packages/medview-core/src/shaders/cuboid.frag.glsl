#version 300 es
precision highp float;

in vec3 vTexCoord; // Match the type and name from the vertex shader
out vec4 fragColor;

uniform sampler3D uVolumeTexture;

void main() {
  fragColor = texture(uVolumeTexture, vTexCoord);
}
