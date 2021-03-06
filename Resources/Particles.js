"use strict";

function Particles (view, texture, mouseControlled) {
	this.view = view;
	this.texture = texture;
	this.showParticlesModel;
	this.velFB;
	this.posFB;
	this.first = true;
	this.mouseControlled = mouseControlled;
}


Particles.prototype.draw = function (gl, pointSize) {
	this.updateState(gl);
	
	//Draw on canvas:
	this.drawBillboards(gl, pointSize);

	this.swapBuffers();
}

Particles.prototype.setup = function (gl) {
	this.setupUpdateVelShader(gl);
	this.setupUpdatePosShader(gl);
	this.setupFBAndInitTextures(gl);
	this.setupShowBillboardShader(gl);
}

Particles.prototype.updateState = function (gl) {
	if (this.first) 
    	this.drawInitialTextures(gl);
    
    var elapsedFromStart = (timeNow - startTime)*0.001;
    
    //Update velocities:
    if(this.view.isUpdatingVelocities)
    	this.updateVelocities(gl);
    
    //Update positions:
    if(this.view.isUpdatingPositions)
    	this.updatePositions(gl);
}

Particles.prototype.swapBuffers = function () {
	this.posFB.swap();
	this.velFB.swap();
}

//Draw functions:
Particles.prototype.drawBillboards = function (gl, pointSize, depth, amplify) { 
	mvPushMatrix();		
		mat4.translate(mMatrix, [0.0,-1.0,-2.0]);
		mat4.scale(mMatrix, [0.5, 0.5, 0.5]);
	
	    mat4.translate(mMatrix, [0, 0, 1]);		

		if (!depth) {
			//Amplify fragment output for blooming:
			if (!amplify)
				amplify = 1.0;
			this.view.currentProgram = this.view.scripts.getProgram("showBillboardShader").useProgram(gl);
			gl.uniform1f(this.view.currentProgram.getUniform("pointSizeUniform"), pointSize);
			gl.uniform1f(this.view.currentProgram.getUniform("amplifyUniform"), amplify);
			this.showParticlesModel.drawBillboards(gl, this.posFB.texFront, this.texture.texture);
		}	
		else { 
			this.view.currentProgram = this.view.scripts.getProgram("showBillboardShadowShader").useProgram(gl);
			//Make the shadow for the points bigger, so their size correspond to the object's size:
			//(this happens because the point size is relative to the distance from the camera, 
			// while the points' shadows sixe is relative to the distance from the light)
			gl.uniform1f(this.view.currentProgram.getUniform("pointSizeUniform"), pointSize/**pointSize*/);
			this.showParticlesModel.drawBillboardsDepth(gl, this.posFB.texFront);
		}
	mvPopMatrix();
}

Particles.prototype.updateVelocities = function (gl) {
	this.view.currentProgram = this.view.scripts.getProgram("updateVelParticleShader").useProgram(gl);
    
    gl.uniform1f(this.view.currentProgram.getUniform("timeUniform"), this.view.deltaTime);
	
	if (this.mouseControlled) {
		gl.uniform2f(this.view.currentProgram.getUniform("mousePosUniform"), 3*mouseX/gl.viewportWidth - 1, 6*mouseY/gl.viewportHeight - 1);
		gl.uniform1f(this.view.currentProgram.getUniform("mouseDownUniform"), mouseDown ? -1 : 1);  
    }
	else {
		gl.uniform2f(this.view.currentProgram.getUniform("mousePosUniform"), 0.5, 2);
		gl.uniform1f(this.view.currentProgram.getUniform("mouseDownUniform"), 1);  
	}
	this.velFB.bind(gl, this.velFB.back);
    this.view.squareModel.drawOnFBMulti(gl, this.velFB, this.velFB.texBack, this.posFB.texBack);
	this.velFB.unbind(gl);
}

Particles.prototype.updatePositions = function (gl) {
	this.view.currentProgram = this.view.scripts.getProgram("updatePosParticleShader").useProgram(gl);
    
    gl.uniform1f(this.view.currentProgram.getUniform("timeUniform"), this.view.deltaTime);

	this.posFB.bind(gl, this.posFB.back);
    this.view.squareModel.drawOnFBMulti(gl, this.posFB, this.posFB.texBack, this.velFB.texBack);
	this.posFB.unbind(gl);
}

Particles.prototype.drawInitialTextures = function (gl) {
	this.view.currentProgram = this.view.scripts.getProgram("initialParticleShader").useProgram(gl);
	
	//Initialize position texture:
	//var elapsedFromStart = (timeNow - startTime)*0.001;
	gl.uniform2f(this.view.currentProgram.getUniform("offsetUniform"), -0.5, -0.5);
	gl.uniform1f(this.view.currentProgram.getUniform("multiplierUniform"), 1.0);
	gl.uniform1f(this.view.currentProgram.getUniform("correctionUniform"), 0.45);
	
	this.posFB.bind(gl, this.posFB.back);
	this.view.squareModel.drawOnFB(gl, this.posFB);
	this.posFB.unbind(gl);
	///

	//Initialize velocity texture:
	gl.uniform2f(this.view.currentProgram.getUniform("offsetUniform"), -.5 , -0.5);
	gl.uniform1f(this.view.currentProgram.getUniform("multiplierUniform"), 0.1);
	gl.uniform1f(this.view.currentProgram.getUniform("correctionUniform"), 0.45);
	
	this.velFB.bind(gl, this.velFB.back);
	this.view.squareModel.drawOnFB(gl, this.velFB);
	this.velFB.unbind(gl);
	
	this.first = false;
	this.posFB.swap();
	this.velFB.swap();
	
}

//Setup functions:
Particles.prototype.setupShowBillboardShader = function (gl) {
	this.view.currentProgram = this.view.scripts.getProgram("showBillboardShader").useProgram(gl);
	
	gl.uniform1i(this.view.currentProgram.getUniform("posUniform"), 0);
	gl.uniform1i(this.view.currentProgram.getUniform("billUniform"), 1);
	
	this.view.setPMVMatrixUniforms(gl);
	
	this.showParticlesModel = new GLShowParticles(gl, 2, this.view);
	this.showParticlesModel.generateParticleUVsAndBuffer(gl, this.view.numPointsSqrt);
}

Particles.prototype.setupUpdatePosShader = function (gl) {
	this.view.currentProgram = this.view.scripts.getProgram("updatePosParticleShader").useProgram(gl);
	
	gl.uniform1i(this.view.currentProgram.getUniform("currentPosUniform"), 0);
	gl.uniform1i(this.view.currentProgram.getUniform("currentVelUniform"), 1);
}

Particles.prototype.setupUpdateVelShader = function (gl) {
	this.view.currentProgram = this.view.scripts.getProgram("updateVelParticleShader").useProgram(gl);
	
	gl.uniform1i(this.view.currentProgram.getUniform("currentVelUniform"), 0);
	gl.uniform1i(this.view.currentProgram.getUniform("currentPosUniform"), 1);
}

Particles.prototype.setupFBAndInitTextures = function (gl) {
	this.view.currentProgram = this.view.scripts.getProgram("initialParticleShader").useProgram(gl);
	
	this.velFB = new FBO(gl, this.view.numPointsSqrt);
	this.posFB = new FBO(gl, this.view.numPointsSqrt);
}