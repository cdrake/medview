#version 300 es
#line 593
precision highp int;
precision highp float;
uniform highp sampler2D fontTexture;
uniform vec4 fontColor;
uniform float screenPxRange;
uniform bool isOutline;
in vec2 vUV;
out vec4 color;
float median(float r, float g, float b) {
	return max(min(r, g), min(max(r, g), b));
}
void main() {
	// distances are stored with 1.0 meaning "inside" and 0.0 meaning "outside"
	vec4 distances = texture(fontTexture, vUV);
	float d_msdf = median(distances.r, distances.g, distances.b);
	if (!isOutline) {
		float screenPxDistance = screenPxRange * (d_msdf - 0.5);
		float opacity = clamp(screenPxDistance + 0.5, 0.0, 1.0);
		color = vec4(fontColor.rgb , fontColor.a * opacity);
		return;
	}
	float u_outline_width_absolute = 0.33333;
	float u_outline_width_relative = 0.05;
	float d_sdf = distances.a; // mtsdf format only
	d_msdf = min(d_msdf, d_sdf + 0.1);  // HACK: to fix glitch in msdf near edges
	// blend between sharp and rounded corners
	float d_edge = mix(d_msdf, d_sdf, 0.0);
	float inner = screenPxRange * (d_edge - 0.5) + 0.75;
	float outer = screenPxRange * (d_edge - 0.5 + u_outline_width_relative) + 0.75 + u_outline_width_absolute;
	float inner_opacity = clamp(inner, 0.0, 1.0);
	//vec4 inner_color = vec4(1, 1, 1, 1);
	float outer_opacity = clamp(outer, 0.0, 1.0);
	// make the outline white for dark text and black for bright text
	vec4 outer_color = vec4(1.0, 0.0, 0.0, 1.0);//vec4(vec3(1.0 - step(0.1, length(fontColor.rgb))), fontColor.a);
	color = (fontColor * inner_opacity) + (outer_color * (outer_opacity - inner_opacity));
}