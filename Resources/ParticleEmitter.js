
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

ParticleEmitter.prototype.setupShowBillboardShader = function (gl) {
	this.view.currentProgram = this.view.scripts.getProgram("particleEmitterShader").useProgram(gl);
	
	//Texture:
	gl.uniform1i(this.view.currentProgram.getUniform("billUniform"), 0);
	
	this.view.setPMVMatrixUniforms(gl);
	
	this.showParticlesModel = new GLShowParticles(gl, 2, this.view);
	this.showParticlesModel.generateEmitterAndBuffer(gl, 750, .1, 1000);
}