precision highp float;
precision highp int;

in vec2 TexCoord; // 2D texture coordinates from the vertex shader
out vec4 FragColor;

uniform float coordZ; // Current slice in the volume
uniform float scl_slope; // Scale slope from NIfTI header
uniform float scl_inter; // Scale intercept from NIfTI header
uniform float cal_max; // Maximum intensity from NIfTI header
uniform float cal_min; // Minimum intensity from NIfTI header
uniform bool isAlphaThreshold; // Apply alpha thresholding
uniform highp sampler3D intensityVol; // Intensity volume
uniform highp sampler2D colormap; // Colormap texture
uniform float opacity; // Global opacity

void main(void) {
    // Construct the 3D texture coordinate using the 2D TexCoord and coordZ
    vec3 voxelCoord = vec3(TexCoord, coordZ);

    // Ensure the coordinates are within the volume range
    if (voxelCoord.x < 0.0 || voxelCoord.x > 1.0 || 
        voxelCoord.y < 0.0 || voxelCoord.y > 1.0 || 
        voxelCoord.z < 0.0 || voxelCoord.z > 1.0) {
        FragColor = vec4(0.0); // Fully transparent if out of range
        return;
    }

    // Sample the intensity volume
    float intensity = texture(intensityVol, voxelCoord).r;

    // Apply scale slope and intercept from the NIfTI header
    float scaledIntensity = (scl_slope * intensity) + scl_inter;

    // Normalize the intensity to the colormap range
    float normalizedIntensity = (scaledIntensity - cal_min) / max(0.00001, cal_max - cal_min);
    normalizedIntensity = clamp(normalizedIntensity, 0.0, 1.0); // Ensure it's within [0, 1]

    // Sample the colormap using the normalized intensity
    FragColor = texture(colormap, vec2(normalizedIntensity, 0.5));

    // Apply alpha thresholding if enabled
    if (isAlphaThreshold && (scaledIntensity < cal_min || scaledIntensity > cal_max)) {
        FragColor.a = 0.0; // Fully transparent for out-of-range intensities
    }

    // Apply global opacity
    FragColor.a *= opacity;
}
