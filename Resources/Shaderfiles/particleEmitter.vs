attribute vec3 aVertexPosition;
attribute vec3 aVertexVelocity;
attribute float aVertexLifeTime;

uniform float uTime;
uniform float uMaxLifeTime;
uniform float uPointSize;
uniform mat4 uPMVMatrix;

varying float vAge;

void main () {

	vAge = mod(uTime*0.4 + aVertexLifeTime, uMaxLifeTime)*0.001;

	vec3 position = aVertexPosition + (aVertexVelocity*10.0*vAge) + vec3(pow(vAge, 2.0)*0.5, vAge, 0.0);
	
	gl_Position = uPMVMatrix * vec4(position, 1.0);
	
	gl_PointSize = .075*(1.0/gl_Position.z)*vAge*2000.0;
}