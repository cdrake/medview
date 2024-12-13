#version 300 es
precision highp float;
precision highp int;

#define INTENSITY_SAMPLER_TYPE isampler3D

#include "./volume.frag.glsl"
