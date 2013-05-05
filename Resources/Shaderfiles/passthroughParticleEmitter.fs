precision lowp float;

varying float vAge;
const float maxAge = 0.7;

vec4 pack (float depth) {
	const vec4 bias = vec4(1.0 / 255.0,
							1.0 / 255.0,
							1.0 / 255.0,
							0.0);

	float r = depth;
	float g = fract(r * 255.0);
	float b = fract(g * 255.0);
	float a = fract(b * 255.0);
	vec4 colour = vec4(r, g, b, a);
	
	return colour - (colour.yzww * bias);
}

void main(void) {
	//Don't write anything (including depth values) if the age (alpha value is practically invisible) is above a certain threshold:
	if (vAge > maxAge)
		discard;
	
	gl_FragColor = pack(gl_FragCoord.z);
	
	//Pass through
}