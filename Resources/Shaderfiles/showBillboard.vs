precision lowp float;

attribute vec2 aVertexCoords;

uniform sampler2D uPos;
uniform mat4 uPMVMatrix;
uniform float uPointSize;

void main() {
	vec4 posFromTex = texture2D(uPos, aVertexCoords);
	vec4 position = (posFromTex - .5) * 2.0;

	gl_PointSize = uPointSize;

	gl_Position = uPMVMatrix * position;

}
