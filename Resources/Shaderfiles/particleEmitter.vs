attribute vec3 aVertexPosition;
attribute float aVertexLifeTime;

uniform float uTime;
uniform float uPointSize;
uniform mat4 uPMVMatrix;

void main () {

	vec3 position = aVertexPosition + vec3(0.0, mod((aVertexLifeTime - uTime), 1000.0) * 0.005, 0.0);
	
	gl_Position = uPMVMatrix * vec4(position, 1.0);
	
	gl_PointSize = 10.0;
}