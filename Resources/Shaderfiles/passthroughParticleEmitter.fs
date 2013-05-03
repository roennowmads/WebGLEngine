precision lowp float;

varying float vAge;
const float maxAge = 0.7;

void main(void) {
	//Don't write anything (including depth values) if the age (alpha value is practically invisible) is above a certain threshold:
	if (vAge > maxAge)
		discard;
		
	//Pass through
}