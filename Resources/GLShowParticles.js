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
	this.vertexLifeTimeBuffer = gl.createBuffer();
	
	this.itemSize = 3;
	this.indexNumItems = particleCount;
	
	var posArray = new Array(this.indexNumItems*this.itemSize); 
	var lifeTimeArray = new Array(this.indexNumItems); 

	var vertexPositions = new Float32Array(posArray); 	
	var vertexLifeTimes = new Float32Array(lifeTimeArray); 	
	posArray = null;
	lifeTimeArray = null;
	
	var maxInitPos = size;
	var halfInitPos = maxInitPos/2;
	for (var i = 0; i < this.indexNumItems; i++) {
		var j = i*3;
		vertexPositions[j] = Math.random()*maxInitPos - halfInitPos;
		vertexPositions[j+1] = 0;
		vertexPositions[j+2] = Math.random()*maxInitPos - halfInitPos;
	}
	
	for (var i = 0; i < this.indexNumItems; i++) {
		vertexLifeTimes[i] = Math.random()*maxLifeTime;
	}
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPosBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertexPositions, gl.STATIC_DRAW);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexLifeTimeBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertexLifeTimes, gl.STATIC_DRAW);
	
	vertexPositions = null;
	vertexLifeTimes = null;
	
}

GLShowParticles.prototype.generateParticleUVsAndBuffer = function (gl, particleCountSqrt) {	
	this.vertexCoordsBuffer = gl.createBuffer();
	
	this.itemSize = 2;
	this.indexNumItems = particleCountSqrt*particleCountSqrt;
	
	var array = new Array(this.indexNumItems*this.itemSize);  
	var vertexCoords = new Float32Array(array); 
	array = null;
	
	// width / height:
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
	
	//console.log((timeNow-startTime) % 3000);
	gl.uniform1f(this.view.currentProgram.getUniform("timeUniform"), (timeNow-startTime));
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, billboardTex);
	
	this.view.setPMVMatrixUniforms(gl);
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