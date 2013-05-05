"use strict";

function View() {
	this.canvas;
	this.gl;
	
	this.squareModel;
	this.house = new House(this);
	this.groundModel;
	this.sphereModel;
	this.groundTex;
	this.sphereTex;
	
	this.zoomFactor = 0.8;

	this.lastGLObject;
	this.lastDrawTarget;

	this.numPointsSqrt = document.getElementById("objectCount").value;
	this.numPoints = this.numPointsSqrt * this.numPointsSqrt;
	
	this.isUpdatingVelocities = true;
	this.isUpdatingPositions = true;
	this.drawShadows = true;
	this.drawSoftShadows = true;
	this.drawDepth = false;
	this.drawVelocity = false;
	this.drawBloom = false;
	this.isRotating = false;
	this.pointSize = 1.0;
	
	this.scripts;
	this.particles;
	this.particleEmitter;
	
	this.cameraPosition = vec3.create([0,5,5]);
	this.lightPosition = vec3.create([-8,7,0]);
	
	this.rotateShadowXCounter = 0.0;
	this.rotateShadowYCounter = 0.0;
	this.rotateXCounter = 0.0;
	this.rotateYCounter = 0.0;
}

View.prototype.initView = function () {
	this.canvas = document.getElementById("canvas");
	this.gl = initGL(this.canvas);
	
	//Query WebGL extensions:
	var float_texture_ext = this.gl.getExtension('OES_texture_float');
	if (!float_texture_ext)
		alert("OES_texture_float extension is not available!");
	
	var depth_texture_ext = this.gl.getExtension('WEBGL_depth_texture');
	if (!depth_texture_ext)
		alert("WEBGL_depth_texture extension is not available!");
		
	//Create shader programs:
	this.scripts = new ShaderScriptLoader(this.gl, this.loadTextures, this);
	this.scripts.addProgram("showBillboardShader", "showBillboard", "showBillboard");
	this.scripts.addProgram("initialParticleShader", "FBTexture", "initialParticle");
	this.scripts.addProgram("updateVelParticleShader", "FBTexture", "updateVelParticle");
	this.scripts.addProgram("updatePosParticleShader", "FBTexture", "updatePosParticle");
	this.scripts.addProgram("renderTextureShader", "FBTexture", "FBTexture");
	this.scripts.addProgram("depthShader", "depth", "passthrough");
	this.scripts.addProgram("phongShadowShader", "phongShadow", "phongShadow");
	this.scripts.addProgram("showBillboardShadowShader", "showBillboard", "passthrough");
	this.scripts.addProgram("blurShader", "FBTexture", "blur");
	this.scripts.addProgram("renderTextureAdditiveShader", "FBTexture", "FBTextureAdditive");
	this.scripts.addProgram("particleEmitterShader", "particleEmitter", "showBillboardEmitter");
	this.scripts.addProgram("depthParticleEmitterShader", "particleEmitter", "passthroughParticleEmitter");
	
	//Downloads scripts and calls loadTextures when done, which calls setupShadersAndObjects when done:
	this.scripts.loadScripts();
}

View.prototype.setupShadersAndObjects = function (thisClass) {	
	var gl = thisClass.gl;
	
	//Instantiate square object for rendering textures:
	thisClass.squareModel = new SquareObject(gl, 1, thisClass);
	thisClass.squareModel.createQuadAndSetup(gl);
	
	//Instantiate particles:
	thisClass.particles = new Particles(thisClass, thisClass.smokeTex, true);
	thisClass.particles2 = new Particles(thisClass, thisClass.house.textures[0], false);
	
	thisClass.particleEmitter = new ParticleEmitter(thisClass, thisClass.smokeTex2);
	
	//Instantiate screen framebuffers for blooming:
	thisClass.shadowFBinit(gl);
	thisClass.sceneFBinit(gl);
	thisClass.blurFBinit(gl);

	//Setup GL:
	thisClass.setupCanvas(gl);
	
	//Setup the shaders:
	thisClass.particles.setup(gl);
	thisClass.particles2.setup(gl);
	thisClass.particleEmitter.setup(gl);
	thisClass.setupDepthShader(gl);
	thisClass.setupPhongShadowShader(gl);
	thisClass.setupRenderTextureShader(gl);
	thisClass.setupRenderTextureAdditiveShader(gl);
	
	//Load models:
	thisClass.loadModels(gl);
}

View.prototype.animate = function () {
	timeNow = Date.now();
	var elapsed = timeNow - timeLast;
    this.deltaTime = 0.001 * elapsed * 60;
		
	timeLast = timeNow;
	
	if (this.drawShadows)
		this.rotateShadowYCounter += 0.05 * this.deltaTime;
	if (this.isRotating) 
		this.rotateYCounter -= 0.01 * this.deltaTime;
}

View.prototype.draw = function () {
	var gl = this.gl;
	
	//Clear the screen:
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    
    mat4.identity(mMatrix);
	mat4.identity(vMatrix);
	
	//Update particle cloud state:
	//this.particles.updateState(gl);

	//Create depth map:
	this.drawHouseAndGroundFromLight(gl);	
	
	if (this.drawSoftShadows) {
		//Apply blur, first horizontal, then vertical:
		this.currentProgram = this.scripts.getProgram("blurShader").useProgram(gl);
		//Bind the blur framebuffer:
		this.smallShadowFB.bind(gl, this.smallShadowFB.front);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		gl.uniform1i(this.currentProgram.getUniform("orientationUniform"), 0);
		this.squareModel.drawOnFBOne(this.gl, this.smallShadowFB, this.shadowFB.texFront);
		this.smallShadowFB.bind(gl, this.smallShadowFB.back);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		gl.uniform1i(this.currentProgram.getUniform("orientationUniform"), 1);
		this.squareModel.drawOnFBOne(this.gl, this.smallShadowFB, this.smallShadowFB.texFront);
		
		//Copy blurred texture to the larger shadow texture, and scale it with linear filtering at the same time:
		this.currentProgram = this.scripts.getProgram("renderTextureShader").useProgram(gl);
		this.shadowFB.bind(gl, this.shadowFB.front);
		this.squareModel.drawOnFBMulti(this.gl, this.shadowFB, this.smallShadowFB.texBack);
		
		this.shadowFB.unbind(gl);
	}
	
	//if (false)
	if (this.drawDepth) {
		//Draw depth map directly to the screen:
		this.currentProgram = this.scripts.getProgram("renderTextureShader").useProgram(gl);
		this.squareModel.drawOnFBOne(this.gl, this.shadowFB, this.shadowFB.texFront);
	} else {
		//Draw the scene:
		
		this.currentProgram = this.scripts.getProgram("phongShadowShader").useProgram(gl);
		
		//Setup camera:
		mat4.lookAt(this.cameraPosition, [0,0,0], [0,1,0], vMatrix);
		
		//Camera rotation:
		var quatX = quat4.fromAngleAxis(this.rotateXCounter, [1,0,0]);
		var quatY = quat4.fromAngleAxis(this.rotateYCounter, [0,1,0]);
		var quatRes = quat4.multiply(quatX, quatY);
		var rotMatrix = quat4.toMat4(quatRes);
		mat4.multiply(vMatrix, rotMatrix);
		
		//Zoom:
		mat4.scale(vMatrix, [this.zoomFactor,this.zoomFactor,this.zoomFactor]);
		
		//Light position:
		//View matrix transformation, takes the view matrix and adds rotation:
		var quatX = quat4.fromAngleAxis(-this.rotateShadowXCounter*0.5, [0,0,1]);
		var quatY = quat4.fromAngleAxis(-this.rotateShadowYCounter*0.5, [0,1,0]);
		var quatRes = quat4.multiply(quatY, quatX);
		var rotMatrix = quat4.toMat4(quatRes);
		mat4.multiply(vMatrix, rotMatrix, lightMat);
		
		//Model matrix transformation, takes the rotated view matrix and applies translation:
		mat4.translate(lightMat, this.lightPosition);
		
		if (this.drawBloom) {
			//Render the scene into a texture:
			this.sceneFB.bind(gl, this.sceneFB.front);
			this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
			this.drawHouseAndGround(gl);
			this.particles.updateState(gl);
			//Need to bind framebuffer again after particle state update:
			this.sceneFB.bind(gl, this.sceneFB.front);		
			this.particles.drawBillboards(gl, this.pointSize, false, 3.0);
			mvPushMatrix();
				mat4.translate(mMatrix, [-0.22,0.6,-0.1]);
				this.particleEmitter.drawBloom(gl);
			mvPopMatrix();
			
			//Apply blur, first horizontal, then vertical:
			this.currentProgram = this.scripts.getProgram("blurShader").useProgram(gl);
			//Bind the blur framebuffer:
			this.blurFB.bind(gl, this.blurFB.front);
			this.gl.clear(this.gl.COLOR_BUFFER_BIT);
			gl.uniform1i(this.currentProgram.getUniform("orientationUniform"), 0);
			this.squareModel.drawOnFBOne(this.gl, this.blurFB, this.sceneFB.texFront);
			this.blurFB.bind(gl, this.blurFB.back);
			gl.uniform1i(this.currentProgram.getUniform("orientationUniform"), 1);
			this.squareModel.drawOnFBOne(this.gl, this.blurFB, this.blurFB.texFront);
			
			//Render the texture:
			this.currentProgram = this.scripts.getProgram("renderTextureAdditiveShader").useProgram(gl);
			this.sceneFB.unbind(gl);
			gl.uniform1f(this.currentProgram.getUniform("tex1RateUniform"), 0.75);
			gl.uniform1f(this.currentProgram.getUniform("tex2RateUniform"), 0.7);
			this.squareModel.drawOnFBMulti(this.gl, this.sceneFB, this.blurFB.texBack, this.sceneFB.texFront);
		}
		else {		
			this.drawHouseAndGround(gl);
			this.particles.updateState(gl);
			this.particles.drawBillboards(gl, this.pointSize);
			mvPushMatrix();
				mat4.translate(mMatrix, [-0.22,0.6,-0.1]);
				this.particleEmitter.draw(gl);
			mvPopMatrix();
		}
		
		if (this.drawPositions) {
			//Draw the positions map used for the particles, directly to the screen:
			this.currentProgram = this.scripts.getProgram("renderTextureShader").useProgram(gl);
			this.squareModel.drawOnFBOne(gl, this.particles.posFB, this.particles.posFB.texBack);
		}
	}
	
	this.particles.swapBuffers();
}

View.prototype.setupCanvas = function (gl) {
	gl.clearColor(0.1, 0.1, 0.2, 1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.frontFace(gl.CCW);
	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.BACK);
	
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 1, 30.0, pMatrix);
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
}

//This is the update function, which is called every frame:
function tick () {
	view.draw();
	view.animate();
	logFrameRate();
	requestAnimFrame(tick);
}

function startTicking() {
	//Remove loading information:
	var prevText = document.getElementById("loadingFile");
	if (prevText)
		canvasDiv.removeChild(prevText);
		
	//Start updating:
	tick();
}

View.prototype.drawHouseAndGroundFromLight = function (gl) {
	mvPushMatrix();
		this.currentProgram = this.scripts.getProgram("depthShader").useProgram(gl);
		
		gl.uniform3fv(this.currentProgram.getUniform("lightingPositionUniform"), this.lightPosition);
		
		//Bind the depth texture framebuffer:
		this.shadowFB.bind(gl, this.shadowFB.front);
		
		gl.viewport(0, 0, this.shadowFB.widthFB, this.shadowFB.widthFB);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);//gl.clear(gl.DEPTH_BUFFER_BIT);
		gl.disable(gl.BLEND);
		
		//We only need the depth, so disable colour writes (this improves performance significantly):
		//gl.colorMask(false, false, false, false);
		
		//Setup light "camera"
		mat4.lookAt(this.lightPosition, [0,0,0], [0,1,0], lightVMatrix);
		
		var quatX = quat4.fromAngleAxis(this.rotateShadowXCounter*0.5, [0,0,1]);
		var quatY = quat4.fromAngleAxis(this.rotateShadowYCounter*0.5, [0,1,0]);
		var quatRes = quat4.multiply(quatX, quatY);
		var rotMatrix = quat4.toMat4(quatRes);
		mat4.multiply(lightVMatrix, rotMatrix);
		
		//Ground:
		mvPushMatrix();
			mat4.translate(mMatrix, [0.0,-.16,0.0]);
			mat4.scale(mMatrix, [3.07, 0.05, 3.07]);
			
			this.groundModel.texture = this.groundTex.texture;
			this.groundModel.drawDepth(gl);
		mvPopMatrix();
		
		//Rotating block:
		mvPushMatrix();	
			var quatX = quat4.fromAngleAxis(0, [1,0,0]);
			var quatY = quat4.fromAngleAxis(this.rotateShadowYCounter, [0,1,0]);
			var quatRes = quat4.multiply(quatX, quatY);
			var rotMatrix = quat4.toMat4(quatRes);
			mat4.multiply(mMatrix, rotMatrix);
			
			mat4.translate(mMatrix, [2.0,1.0,0.0]);
			mat4.scale(mMatrix, [0.57, 0.05, 0.57]);
			
			this.groundModel.texture = this.groundTex.texture;
			this.groundModel.drawDepth(gl);
		mvPopMatrix();
		
		//Draw house:
		mvPushMatrix();	
			mat4.scale(mMatrix, [.001, .001, .001]);
			this.house.drawDepth(gl);
		mvPopMatrix();
		
		mvPushMatrix();
			this.particles.drawBillboards(gl, this.pointSize, true);
			mat4.translate(mMatrix, [-0.22,0.6,-0.1]);
			this.particleEmitter.drawDepth(gl);
		mvPopMatrix();
		
		//Unbind framebuffer:
		this.shadowFB.unbind(gl);
		
		//Re-enable blending and colour writes:
		gl.enable(gl.BLEND);
		//gl.colorMask(true, true, true, true);
	
	mvPopMatrix();
}

View.prototype.drawHouseAndGround = function (gl) {	
	mvPushMatrix();
		//Bind the depth texture for use in the shader:
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.shadowFB.texFront);
	
		gl.disable(gl.BLEND);
		
		//Draw light as object:
		mvPushMatrix();
			var scaledMat = mat4.create();
			mat4.scale(lightMat, [0.125, 0.125, 0.125], scaledMat);
			gl.uniform1f(this.currentProgram.getUniform("noLightingUniform"), 1.0);
			this.sphereModel.texture = this.sphereTex.texture;
			this.sphereModel.drawWithMatrix(gl, scaledMat);
			gl.uniform1f(this.currentProgram.getUniform("noLightingUniform"), 0.0);
		mvPopMatrix();
		
		//Ground:
		mvPushMatrix();		
			mat4.translate(mMatrix, [0.0,-.16,0.0]);
			mat4.scale(mMatrix, [3.0, 0.05, 3.0]);
			this.groundModel.texture = this.groundTex.texture;
			this.groundModel.draw(gl);
		mvPopMatrix();
		
		//Rotating block:
		mvPushMatrix();		
			var quatX = quat4.fromAngleAxis(0, [1,0,0]);
			var quatY = quat4.fromAngleAxis(this.rotateShadowYCounter, [0,1,0]);
			var quatRes = quat4.multiply(quatX, quatY);
			var rotMatrix = quat4.toMat4(quatRes);
			mat4.multiply(mMatrix, rotMatrix);
			
			mat4.translate(mMatrix, [2.0,1.0,0.0]);
			mat4.scale(mMatrix, [0.5, 0.05, 0.5]);
			this.groundModel.texture = this.groundTex.texture;
			this.groundModel.draw(gl);
		mvPopMatrix();
		
		mat4.scale(mMatrix, [.001, .001, .001]);
		
		//House
		this.house.draw(gl);
		gl.enable(gl.BLEND);
	mvPopMatrix();
}

View.prototype.shadowFBinit = function (gl) {
	//Create framebuffer with depth component:
	this.shadowFB = new FBO(gl, 1024, true, true);
	this.smallShadowFB = new FBO(gl, 512, false, true);
}
View.prototype.sceneFBinit = function (gl) {
	//Create framebuffer with depth component:
	this.sceneFB = new FBO(gl, 1024, true);
}
View.prototype.blurFBinit = function (gl) {
	//Create framebuffer without depth component, and with linear texture filtering:
	this.blurFB = new FBO(gl, 128, false, true);
}

View.prototype.setupDepthShader = function (gl) {
	this.currentProgram = this.scripts.getProgram("depthShader").useProgram(gl);
	gl.uniform3fv(this.currentProgram.getUniform("lightingPositionUniform"), this.lightPosition);
	this.setShadowMatrixUniforms(gl);
	this.setPMatrixUniform(gl);
	this.setNormalUniforms(gl); 
}

View.prototype.setupPhongShadowShader = function (gl) {
	this.currentProgram = this.scripts.getProgram("phongShadowShader").useProgram(gl);
	
	gl.uniform1i(this.currentProgram.getUniform("textureUniform"), 0);
	gl.uniform1i(this.currentProgram.getUniform("depthMapUniform"), 1);
	
	gl.uniform3fv(this.currentProgram.getUniform("lightingPositionUniform"), this.lightPosition);
	gl.uniform3fv(this.currentProgram.getUniform("lightingColourUniform"), [1.0,1.0,1.0]);
	this.setShadowMatrixUniforms(gl);
	this.setPMatrixUniform(gl);
	this.setNormalUniforms(gl); 
}

View.prototype.setupRenderTextureShader = function (gl) {
	this.currentProgram = this.scripts.getProgram("renderTextureShader").useProgram(gl);
	gl.uniform1i(this.currentProgram.getUniform("textureUniform"), 0);
} 

View.prototype.setupRenderTextureAdditiveShader = function (gl) {
	this.currentProgram = this.scripts.getProgram("renderTextureAdditiveShader").useProgram(gl);
	gl.uniform1i(this.currentProgram.getUniform("textureUniform"), 0);
	gl.uniform1i(this.currentProgram.getUniform("texture2Uniform"), 1);
}

View.prototype.setPMatrixUniform = function (gl) {
	gl.uniformMatrix4fv(this.currentProgram.getUniform("pMatrixUniform"), false, pMatrix);
}

View.prototype.setShadowMatrixUniforms = function (gl) {
	mvMatrix = mat4.multiply(vMatrix, mMatrix, mvMatrix);
    gl.uniformMatrix4fv(this.currentProgram.getUniform("mVMatrixUniform"), false, mvMatrix);
	
	plmMatrix = mat4.multiply(pMatrix, mat4.multiply(lightVMatrix, mMatrix, plmMatrix), plmMatrix);
	gl.uniformMatrix4fv(this.currentProgram.getUniform("pLMMatrixUniform"), false, plmMatrix);
	
	//Light position update:
	gl.uniform3fv(this.currentProgram.getUniform("lightPositionUniform"), mat4.multiplyVec3(lightMat, [0,0,0]));
}

View.prototype.setPMVMatrixUniforms = function (gl) {	
	//Do the matrix projection on the CPU, instead of for every vertex on the GPU:
	pmvMatrix = mat4.multiply(pMatrix, mat4.multiply(vMatrix, mMatrix, pmvMatrix), pmvMatrix)
	gl.uniformMatrix4fv(this.currentProgram.getUniform("pMVMatrixUniform"), false, pmvMatrix);
}

View.prototype.setNormalUniforms = function (gl) {   
    var normalMatrix = mat3.create();
    mat4.toInverseMat3(mat4.multiply(vMatrix, mMatrix, mvMatrix), normalMatrix);
    mat3.transpose(normalMatrix);
    gl.uniformMatrix3fv(this.currentProgram.getUniform("nMatrixUniform"), false, normalMatrix);
}

View.prototype.setSpecularUniform = function (gl, useSpecular) {   
	gl.uniform1i(this.currentProgram.getUniform("useSpecularUniform"), useSpecular);
}

//Loading of files:
View.prototype.loadModels = function (gl) {
	this.groundModel = new GLObject(gl, this);
	this.sphereModel = new GLObject(gl, this);
	
	var objectLoader = new FileLoader(14, startTicking, this); 
	
	displayLoadState ("Downloading models");
	
	this.house.loadModels(gl, objectLoader);
	loadMesh(gl, this.groundModel, "Scene/Resources/x-models/ground.ctm", objectLoader);
	loadMesh(gl, this.sphereModel, "Scene/Resources/x-models/sphere.ctm", objectLoader);
}

View.prototype.loadTextures = function(thisClass) {
	thisClass.cubeTex = new Texture();
	thisClass.smokeTex = new Texture();
	thisClass.smokeTex2 = new Texture();
	thisClass.groundTex = new Texture();
	thisClass.sphereTex = new Texture();
	
	var objectLoader = new FileLoader(15, thisClass.setupShadersAndObjects, thisClass); 
	
	displayLoadState ("Downloading textures");
	
	thisClass.house.loadTextures(thisClass.gl, objectLoader);
	loadImageToTex(thisClass.gl, thisClass.groundTex, "Scene/Resources/x-images/House/Mortar_color.jpg", objectLoader);
	loadImageToTex(thisClass.gl, thisClass.sphereTex, "Scene/Resources/x-images/empty.png", objectLoader);
	loadImageToTex(thisClass.gl, thisClass.smokeTex, "Scene/Resources/x-images/smoke.png", objectLoader, true);
	loadImageToTex(thisClass.gl, thisClass.smokeTex2, "Scene/Resources/x-images/smoke2.png", objectLoader);
}