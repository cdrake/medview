#version 300 es
precision highp float;

in vec2 v_texcoord;               // Texture coordinates from vertex shader
uniform sampler2D u_texture;      // Bitmap texture sampler
uniform vec2 offset;              // Offset for bitmap texture (x, y)

out vec4 fragColor;               // Final fragment color

void main() {
  // Adjust texture coordinates with offset
  vec2 adjustedUV = v_texcoord + offset;

  // Compute the distance from the center of the circle
  float distance = length(v_texcoord - vec2(0.5, 0.5));

  // Check if the pixel is within the circle bounds
  if (distance < 0.5) {
    // Sample the texture and use it directly
    fragColor = texture(u_texture, adjustedUV);
  } else {
    discard; // Discard fragments outside the circle
  }
}
