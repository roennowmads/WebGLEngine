precision lowp float;

uniform sampler2D uBill;

varying float vAge;

void main(void) {

	vec4 sample = texture2D(uBill, vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y));

	gl_FragColor = vec4(sample.rgb, sample.a - vAge*.1);
}
