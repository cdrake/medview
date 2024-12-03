#version 300 es
#line 215
precision highp int;
precision highp float;
uniform vec3 rayDir;
uniform vec3 texVox;
uniform int backgroundMasksOverlays;
uniform vec3 volScale;
uniform vec4 clipPlane;
uniform highp sampler3D volume, overlay;
uniform float overlays;
uniform float clipThick;
uniform vec3 clipLo;
uniform vec3 clipHi;
uniform float backOpacity;
uniform mat4 mvpMtx;
uniform mat4 matRAS;
uniform vec4 clipPlaneColor;
uniform float renderOverlayBlend;
uniform highp sampler3D drawing;
uniform highp sampler2D colormap;
uniform vec2 renderDrawAmbientOcclusionXY;
in vec3 vColor;
out vec4 fColor;

#include utils/renderFunc;

void main() {
	// Main function logic...
}
