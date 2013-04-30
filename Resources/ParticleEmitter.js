
function ParticleEmitter (view, texture) {
	this.view = view;
	this.texture = texture;
	this.showParticlesModel;
	this.particleEmitterShader = this.view.scripts.getProgram("particleEmitterShader");
}

ParticleEmitter.prototype.setup = function (gl) {
	this.setupShowBillboardShader(gl);
}

ParticleEmitter.prototype.draw = function (gl) {
	gl.disable(gl.DEPTH_TEST);
	gl.blendEquationSeparate(gl.FUNC_REVERSE_SUBTRACT,gl.FUNC_ADD);
	this.view.currentProgram = this.particleEmitterShader.useProgram(gl);
	this.showParticlesModel.drawEmitterBillboards(gl, this.texture.texture);
	gl.blendEquation(gl.FUNC_ADD);
	gl.enable(gl.DEPTH_TEST);
}

ParticleEmitter.prototype.drawDepth = function (gl) {
	this.view.currentProgram = this.particleEmitterShader.useProgram(gl);
	this.showParticlesModel.drawEmitterBillboardsDepth(gl);
}

ParticleEmitter.prototype.setupShowBillboardShader = function (gl) {
	this.view.currentProgram = this.particleEmitterShader.useProgram(gl);
	
	//Texture:
	gl.uniform1i(this.view.currentProgram.getUniform("billUniform"), 0);
	
	this.view.setPMVMatrixUniforms(gl);
	
	this.showParticlesModel = new GLShowParticles(gl, 2, this.view);
	this.showParticlesModel.generateEmitterAndBuffer(gl, 750, .075, 1000);
}