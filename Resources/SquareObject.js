"use strict";

function SquareObject (gl, id, view) {
	this.vertexPositionBuffer;
	this.texCoordsBuffer;
	this.indexNumItems = 0;
	this.identifier;
	this.itemSize;
	this.identifier = id;
	this.texture;
	this.view = view;
}

SquareObject.prototype.createQuadAndSetup = function (gl) {
	this.vertexPositionBuffer = gl.createBuffer();
	this.texCoordsBuffer = gl.createBuffer();
	
	var verts = new Float32Array([
									-1.0, -1.0, 
									1.0, -1.0, 
									-1.0,  1.0, 
									-1.0,  1.0, 
									1.0, -1.0, 
									1.0,  1.0
	                             ]);
	
	var texCoords = new Float32Array([
	                                  0.0,  0.0,
	                                  1.0,  0.0,
	                                  0.0,  1.0,
	                                  0.0,  1.0,
	                                  1.0,  0.0,
	                                  1.0,  1.0
	                                 ]);
	
	this.itemSize = 2;
	this.indexNumItems = 6;
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.DYNAMIC_DRAW);
}

SquareObject.prototype.bindBuffers = function (gl) {
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
	gl.vertexAttribPointer(this.view.currentProgram.getAttribute("positionAttribute"), this.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordsBuffer);
	gl.vertexAttribPointer(this.view.currentProgram.getAttribute("texCoordsAttribute"), 2, gl.FLOAT, false, 0, 0);
}

SquareObject.prototype.drawOnFB = function (gl, FBO) {
	gl.viewport(0, 0, FBO.widthFB, FBO.heightFB);
	
    this.bindBuffers(gl);
    
    gl.drawArrays(gl.TRIANGLES, 0, this.indexNumItems);
}

SquareObject.prototype.drawOnFBOne = function (gl, FBO, texture) {
	//Depth testing is unnecessary for 2D image rendering, so it is disabled:
	gl.disable(gl.DEPTH_TEST);
	gl.viewport(0, 0, FBO.widthFB, FBO.heightFB);
    
    this.bindBuffers(gl);
		
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
    
    gl.drawArrays(gl.TRIANGLES, 0, this.indexNumItems);
	gl.enable(gl.DEPTH_TEST);
}

SquareObject.prototype.drawOnFBMulti = function (gl, FBO, texCurrent, texDelta) {
	//Depth testing is unnecessary for 2D image rendering, so it is disabled:
	gl.disable(gl.DEPTH_TEST);
	gl.viewport(0, 0, FBO.widthFB, FBO.heightFB);
    
	this.bindBuffers(gl);
		
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texCurrent);
	
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, texDelta);
    
    gl.drawArrays(gl.TRIANGLES, 0, this.indexNumItems);
	gl.enable(gl.DEPTH_TEST);
}