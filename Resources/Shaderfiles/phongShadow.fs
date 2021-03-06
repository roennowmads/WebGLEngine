precision mediump float;

varying vec2 vTextureCoord;
varying vec3 vTransformedNormal;
varying vec4 vPosition;
varying vec3 vLightDirection;

uniform vec3 uLightingColour;
uniform sampler2D uTexture;
uniform sampler2D uDepthMap;
uniform bool uUseSpecular;
uniform float uNoLighting;

varying vec4 vVL; 

float unpack (vec4 colour) {
	const vec4 bitShifts = vec4(1.0,
								1.0 / 255.0,
								1.0 / (255.0 * 255.0),
								1.0 / (255.0 * 255.0 * 255.0));
	return dot(colour, bitShifts);
}

void main(void) {
	//Phong shading:
	vec3 lightWeighting = vec3(1.0, 1.0, 1.0);
	//float lightWeighting = 1.0;
	float specularLightWeighting = 0.0;

	vec3 transformedNormal = normalize(vTransformedNormal); 
	vec3 lightDirection = normalize(vLightDirection);
	
	vec3 reflectionDirection = reflect(-lightDirection, transformedNormal);
		
	float NdotL = dot(transformedNormal, lightDirection);

	if (NdotL > 0.0 && uUseSpecular) {
		vec3 eyeDirection = normalize(-vPosition.xyz);
		specularLightWeighting = pow(max(dot(reflectionDirection, eyeDirection), 0.0), 200.0); //uMaterialShininess);
	}			

	float directionalLightWeighting = max(NdotL, 0.0);
	lightWeighting = directionalLightWeighting + uLightingColour * specularLightWeighting + uNoLighting;
	
	//Determine if the point is in shadow:
	vec3 projectedDepth = vVL.xyz;
	
	//Use texture2DProj to project the texture by dividing by the 4th component. Since we cannot use the result of the division, 
	//we have to multiply by the 4th component in the following depth comparison.
	//vec4 depthMapDepth = texture2DProj(uDepthMap, vVL);
	
	//"Cure" shadow acne:
	projectedDepth.z *= 0.9999;
	
	//If the distance to the camera from this fragment is larger than the distance recorded in the depth map, then in shadow:
	//The multiplication unprojects the depth map, and is done to avoid a division by the 4th component earlier in the code.
	//if (unpack(depthMapDepth) * vVL.w < projectedDepth.z)
	//	lightWeighting *= 0.5;
	
	
	//
	// Exponential shadow map algorithm
	//
	float c = 4.0;
	vec4 texel = texture2DProj(uDepthMap, vVL);
	float shadow = clamp(exp(-c * (projectedDepth.z / vVL.w - unpack(texel))), 0.0, 1.0)*2.0 - 1.0;
	lightWeighting *= shadow;
	
	vec4 textureColor = texture2D(uTexture, vTextureCoord);
	gl_FragColor = vec4(textureColor.rgb * lightWeighting, textureColor.a);
}
