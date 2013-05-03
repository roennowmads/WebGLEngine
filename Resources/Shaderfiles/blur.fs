precision lowp float;

uniform sampler2D uTexture;
uniform int uOrientation;

varying vec2 vTexCoords;

const vec2 texelSize = vec2(.0025,.0025);
const int blurAmount = 3;
const int halfBlur = blurAmount / 2;

void main ()
{
    vec4 colour;
    
    if (uOrientation == 0) {
        //Blur horizontal
        for (int i = 0; i < blurAmount; i++) {            
            int offset = i - halfBlur;
            colour += texture2D(uTexture, vTexCoords + vec2(float(offset) * texelSize.x, 0.0));
        }
    }
    else {
        //Blur vertical
        for (int i = 0; i < blurAmount; i++) {
            int offset = i - halfBlur;
            colour += texture2D(uTexture, vTexCoords + vec2(0.0, float(offset) * texelSize.y));
        }
    }
    
    //Calculate average
    colour = colour / float(blurAmount);

	gl_FragColor = colour;
}