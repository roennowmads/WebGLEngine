precision lowp float;

varying vec2 vTexCoords;
uniform vec2 uOffset;
uniform float uMultiplier;
uniform float uCorrection;

void main(void) {
	//Initialize texture so the positions/velocities are put in a square (disregarding z-axis):
	gl_FragColor = vec4((vTexCoords)*uMultiplier + uCorrection + uOffset, ((vTexCoords)*uMultiplier + uCorrection + uOffset).x, 1.0);//vec4((vTexCoords)*0.1 + 0.45 + uOffset, ((vTexCoords)*uMultiplier + uCorrection + uOffset).x /*sin(vTexCoords.x*10.0)*0.125*/, 1.0); //0.0-1.0, *0.1 : 0.0-0.1, + 0.45 : 0.45-0.55
}
