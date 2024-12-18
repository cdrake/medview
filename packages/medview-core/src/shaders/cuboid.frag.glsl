// #version 300 es
// precision highp float;
// precision highp sampler3D;

// in vec3 vTexCoord; // Match the type and name from the vertex shader
// out vec4 fragColor;

// uniform sampler3D uVolumeTexture;

// void main() {
//   fragColor = texture(uVolumeTexture, vTexCoord);
//   fragColor = vec4(1.0, fragColor.g, fragColor.b, 1.0);
// }
// #version 300 es
// precision highp float;

// out vec4 fragColor;

// void main() {
//     fragColor = vec4(1.0, 0.0, 0.0, 1.0); // Solid red color
// }

// #version 300 es
// uniform highp sampler3D uVolumeTexture; // 3D texture
#version 300 es
precision highp float;

in vec3 fTexCoord; // Interpolated 3D texture coordinates from the vertex shader
out vec4 fragColor;

uniform highp sampler3D uVolumeTexture; // 3D texture
uniform vec4 uClipPlane; // Clipping plane equation

void main() {
    // Apply clipping
    float clipDist = dot(fTexCoord, uClipPlane.xyz) + uClipPlane.w;
    if (clipDist > 0.0) {
        discard; // Discard fragments outside the clip plane
    }

    // Sample the 3D texture using interpolated texture coordinates
    float intensity = texture(uVolumeTexture, fTexCoord).r;

    // Map intensity to grayscale color
    // fragColor = vec4(intensity, intensity, intensity, 1.0);
    // fragColor = texture(uVolumeTexture, fTexCoord);
    fragColor = vec4(fTexCoord, 1.0); 
}




