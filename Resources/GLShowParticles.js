"use strict";

function GLShowParticles (gl, id, view) {
	this.indexNumItems = 0;
	this.identifier;
	this.itemSize;
	this.identifier = id;
	this.view = view;
}

GLShowParticles.prototype.generateEmitterAndBuffer = function (gl, particleCount, size, maxLifeTime) {
	this.vertexPosBuffer = gl.createBuffer();
	this.vertexVelBuffer = gl.createBuffer();
	this.vertexLifeTimeBuffer = gl.createBuffer();
	
	this.maxLifeTime = maxLifeTime;
	
	this.itemSize = 3;
	this.indexNumItems = particleCount;

	var vertexPositions = new Float32Array(this.indexNumItems*this.itemSize); 
	var vertexVelocities = new Float32Array(this.indexNumItems*this.itemSize); 	
	var vertexLifeTimes = new Float32Array(this.indexNumItems); 	
	
	var maxInitPos = size;
	var halfInitPos = maxInitPos/2;
	var maxRadiusSqr = (maxInitPos - halfInitPos)*(maxInitPos - halfInitPos);
	
	for (var i = 0; i < this.indexNumItems; i++) {
		var j = i*3;
		do {
			vertexPositions[j] = Math.random()*maxInitPos - halfInitPos;
			vertexPositions[j+1] = 0;
			vertexPositions[j+2] = Math.random()*maxInitPos - halfInitPos;
		} while((vertexPositions[j]*vertexPositions[j]) + (vertexPositions[j+1]*vertexPositions[j+1]) + (vertexPositions[j+2]*vertexPositions[j+2]) > 
			maxRadiusSqr);
		
		do {
			vertexVelocities[j] = Math.random()*maxInitPos - halfInitPos;
			vertexVelocities[j+1] = Math.random()*maxInitPos;
			vertexVelocities[j+2] = Math.random()*maxInitPos - halfInitPos;
		} while((vertexVelocities[j]*vertexVelocities[j]) + (vertexVelocities[j+1]*vertexVelocities[j+1]) + (vertexVelocities[j+2]*vertexVelocities[j+2]) > 
			maxRadiusSqr);
	}
	
	for (var i = 0; i < this.indexNumItems; i++) {
		vertexLifeTimes[i] = Math.random()*maxLifeTime;
	}
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPosBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertexPositions, gl.STATIC_DRAW);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexVelBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertexVelocities, gl.STATIC_DRAW);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexLifeTimeBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertexLifeTimes, gl.STATIC_DRAW);
	
	vertexPositions = null;
	vertexVelocities = null;
	vertexLifeTimes = null;
}

GLShowParticles.prototype.generateParticleUVsAndBuffer = function (gl, particleCountSqrt) {	
	this.vertexCoordsBuffer = gl.createBuffer();
	
	this.itemSize = 2;
	this.indexNumItems = particleCountSqrt*particleCountSqrt;
	var vertexCoords = new Float32Array(this.indexNumItems*this.itemSize); 
	
	//width and height:
	var particleCountSqrt = particleCountSqrt;
	
	//From 1D array to 2D array:
	for (var i = 0; i<this.indexNumItems; i++) {
		var x = (i % particleCountSqrt) / particleCountSqrt; //column
		var y = ((i+1) / particleCountSqrt) / particleCountSqrt; //row
		
		var j = i*2;
		vertexCoords[j] = x;
		vertexCoords[j+1] = y;
	}
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexCoordsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertexCoords, gl.STATIC_DRAW);
	
	vertexCoords = null;
}

GLShowParticles.prototype.bindEmitterBuffers = function (gl) {
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPosBuffer);
	gl.vertexAttribPointer(this.view.currentProgram.getAttribute("vertexPositionAttribute"), this.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexVelBuffer);
	gl.vertexAttribPointer(this.view.currentProgram.getAttribute("vertexVelocityAttribute"), this.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexLifeTimeBuffer);
	gl.vertexAttribPointer(this.view.currentProgram.getAttribute("vertexLifeTimeAttribute"), 1, gl.FLOAT, false, 0, 0);
}

GLShowParticles.prototype.bindUVsBuffer = function (gl) {
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexCoordsBuffer);
	gl.vertexAttribPointer(this.view.currentProgram.getAttribute("vertexCoordsAttribute"), this.itemSize, gl.FLOAT, false, 0, 0);
}

GLShowParticles.prototype.drawEmitterBillboards = function (gl, billboardTex) {
	//if (this.identifier != lastGLObject && lastDrawTarget != DRAWTARGETS.CANVAS) 		//Optimizes by not binding buffers again for subsequent instances of the same mesh.
	this.bindEmitterBuffers(gl);
	
	gl.uniform1f(this.view.currentProgram.getUniform("timeUniform"), (timeNow-startTime));
	gl.uniform1f(this.view.currentProgram.getUniform("maxLifeTimeUniform"), this.maxLifeTime);
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, billboardTex);
	
	this.view.setPMVMatrixUniforms(gl);
	gl.drawArrays(gl.POINTS, 0, this.indexNumItems)
}

GLShowParticles.prototype.drawEmitterBillboardsDepth = function (gl) {
	//if (this.identifier != lastGLObject && lastDrawTarget != DRAWTARGETS.CANVAS) 		//Optimizes by not binding buffers again for subsequent instances of the same mesh.
	this.bindEmitterBuffers(gl);
	
	gl.uniform1f(this.view.currentProgram.getUniform("timeUniform"), (timeNow-startTime));
	gl.uniform1f(this.view.currentProgram.getUniform("maxLifeTimeUniform"), this.maxLifeTime);
	
	plmMatrix = mat4.multiply(pMatrix, mat4.multiply(lightVMatrix, mMatrix, plmMatrix), plmMatrix)
	gl.uniformMatrix4fv(this.view.currentProgram.getUniform("pMVMatrixUniform"), false, plmMatrix);
	
	//this.view.setShadowMatrixUniforms(gl);
	gl.drawArrays(gl.POINTS, 0, this.indexNumItems)
}

GLShowParticles.prototype.drawBillboards = function (gl, posTex, billboardTex) {
	//if (this.identifier != lastGLObject && lastDrawTarget != DRAWTARGETS.CANVAS) 		//Optimizes by not binding buffers again for subsequent instances of the same mesh.
	this.bindUVsBuffer(gl);

	//gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	//gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	
	//Bind texture to read vertex positions from:
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, posTex);
	
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, billboardTex);
	
	//gl.activeTexture(gl.TEXTURE0);
	
	this.view.setPMVMatrixUniforms(gl);
	gl.drawArrays(gl.POINTS, 0, this.indexNumItems)
}