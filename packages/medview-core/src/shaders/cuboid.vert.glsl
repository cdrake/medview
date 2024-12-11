#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aTexCoord; // Update type to match texture coordinates (vec3)

uniform mat4 uMVPMatrix;

out vec3 vTexCoord; // Output as vec3 to match the texture coordinate dimensionality

void main() {
  gl_Position = uMVPMatrix * vec4(aPosition, 1.0);
  vTexCoord = aTexCoord; // Pass texture coordinates to the fragment shader
}
