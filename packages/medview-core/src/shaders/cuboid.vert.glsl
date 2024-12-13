// #version 300 es
// precision highp float;

// layout(location = 0) in vec3 aPosition;
// layout(location = 1) in vec3 aTexCoord; // Update type to match texture coordinates (vec3)

// uniform mat4 uMVPMatrix;

// out vec3 vTexCoord; // Output as vec3 to match the texture coordinate dimensionality

// void main() {
//   // gl_Position = uMVPMatrix * vec4(aPosition, 1.0);
//   vec4 alpha = uMVPMatrix * vec4(aPosition, 1.0);
//   gl_Position = vec4(aPosition, alpha.w);
//   vTexCoord = aTexCoord; // Pass texture coordinates to the fragment shader
// }
#version 300 es
precision highp float;

in vec3 aPosition;
in vec3 vTexCoord;

out vec3 fTexCoord;

uniform mat4 uMVPMatrix;

void main() {
  gl_Position = uMVPMatrix * vec4(aPosition, 1.0);
  fTexCoord = vTexCoord; // Pass texture coordinates to the fragment shader
}

