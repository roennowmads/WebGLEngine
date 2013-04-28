
function ParticleEmitter (view, texture) {
	this.view = view;
	this.texture = texture;
	this.showParticlesModel;
}

ParticleEmitter.prototype.setup = function (gl) {
	this.setupShowBillboardShader(gl);
}


ParticleEmitter.prototype.draw = function (gl) {
	this.showParticlesModel.drawEmitterBillboards(gl, this.texture.texture);
}

//Do it with attributes (that do not change after setup), time(offset), pos(initial), (vel)
//Have point size be dependent on lifetime
//Have the movement of the smoke be like a logarithmic curve


ParticleEmitter.prototype.setupShowBillboardShader = function (gl) {
	this.view.currentProgram = this.view.scripts.getProgram("particleEmitterShader").useProgram(gl);
	
	//gl.uniform1i(this.view.currentProgram.getUniform("posUniform"), 0);
	
	//Texture:
	gl.uniform1i(this.view.currentProgram.getUniform("billUniform"), 0);
	
	this.view.setPMVMatrixUniforms(gl);
	
	this.showParticlesModel = new GLShowParticles(gl, 2, this.view);
	this.showParticlesModel.generateEmitterAndBuffer(gl, 500, 5, 3000);
}