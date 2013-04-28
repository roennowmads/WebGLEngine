
function House (view) {
	this.view = view;
	this.models = new Array();
	this.textures = new Array();
	this.relativePath = "Scene/Resources/";
}

House.prototype.draw = function (gl) {
	for (var i = 0; i < this.models.length; i++) {
		var j = i;
		if (i > 6)
			j--;
		if (this.textures[i]) {
			this.models[i].texture = this.textures[j].texture;	
		}
		this.models[i].draw(gl);
	}
}

House.prototype.drawDepth = function (gl) {
	for (var i = 0; i < this.models.length; i++) {
		var j = i;
		if (i > 6)
			j--;
		if (this.textures[i]) {
			this.models[i].texture = this.textures[j].texture;	
		}
		this.models[i].drawDepth(gl);
	}
}

House.prototype.loadTextures = function (gl, objectLoader) {
	var leftWallTex = new Texture();
	var frontWallTex = new Texture();
	var rightWallTex = new Texture();
	var backWallTex = new Texture();
	var upperWallTex = new Texture();
	var upperWallBackTex = new Texture();
	var roofTex = new Texture();
	var roofAccessoriesTex = new Texture();
	var pillarsTex = new Texture();
	var patioTex = new Texture();
	var doorTex = new Texture();
	
	this.textures.push(
		leftWallTex, 
		frontWallTex, 
		rightWallTex,
		backWallTex,
		upperWallTex,
		upperWallBackTex,
		roofTex,
		roofAccessoriesTex,
		pillarsTex,
		patioTex,
		doorTex
	); 
	
	loadImageToTex(gl, leftWallTex, this.relativePath + "x-images/House/LeftWallLogs_color.jpg", objectLoader);
	loadImageToTex(gl, frontWallTex, this.relativePath + "x-images/House/FrontWallLogs_color.jpg", objectLoader);
	loadImageToTex(gl, rightWallTex, this.relativePath + "x-images/House/LeftWallLogs_color.jpg", objectLoader);
	loadImageToTex(gl, backWallTex, this.relativePath + "x-images/House/LeftWallLogs_color.jpg", objectLoader);
	loadImageToTex(gl, upperWallTex, this.relativePath + "x-images/House/UpperWall_color.jpg", objectLoader);
	loadImageToTex(gl, upperWallBackTex, this.relativePath + "x-images/House/UpperWall_color.jpg", objectLoader);
	loadImageToTex(gl, roofTex, this.relativePath + "x-images/House/Roof_color.jpg", objectLoader);
	loadImageToTex(gl, roofAccessoriesTex, this.relativePath + "x-images/House/RoofAccessories_color.jpg", objectLoader);
	loadImageToTex(gl, pillarsTex, this.relativePath + "x-images/House/Pillars_color.jpg", objectLoader);
	loadImageToTex(gl, patioTex, this.relativePath + "x-images/House/Patio_color.jpg", objectLoader);
	loadImageToTex(gl, doorTex, this.relativePath + "x-images/House/Door_color.jpg", objectLoader);
}

House.prototype.loadModels = function (gl, objectLoader) {
	var door = new GLObject(gl, this.view, true);
	//var doorHandle = new GLObject(gl, this.view, true);
	var frontWallLogs = new GLObject(gl, this.view, true);
	var backWall = new GLObject(gl, this.view, true);
	var insideCottage = new GLObject(gl, this.view, true);
	var interiorFloor = new GLObject(gl, this.view, true);
	var leftWallLogs = new GLObject(gl, this.view, true);
	var rightWallMortar = new GLObject(gl, this.view, true);
	var patio = new GLObject(gl, this.view, true);
	var pillars = new GLObject(gl, this.view, true);
	var rightWallLogs = new GLObject(gl, this.view, true);
	var roofPanel1 = new GLObject(gl, this.view, true);
	var roofPanel2 = new GLObject(gl, this.view, true);
	var roofAccessories = new GLObject(gl, this.view, true);
	var upperWall = new GLObject(gl, this.view, true);
	var upperWallBack = new GLObject(gl, this.view, true);
	
	this.models.push(
		leftWallLogs, 
		frontWallLogs, 
		rightWallLogs, 
		backWall, 
		upperWall, 
		upperWallBack, 
		roofPanel1, 
		roofPanel2, 
		roofAccessories, 
		pillars, 
		patio, 
		door
	);

	loadMesh(gl, door, this.relativePath + "x-models/door.ctm", objectLoader);
	loadMesh(gl, frontWallLogs, this.relativePath + "x-models/frontWall.ctm", objectLoader);
	loadMesh(gl, backWall, this.relativePath + "x-models/backWall.ctm", objectLoader);
	loadMesh(gl, leftWallLogs, this.relativePath + "x-models/leftWall.ctm", objectLoader);
	loadMesh(gl, patio, this.relativePath + "x-models/patio.ctm", objectLoader);
	loadMesh(gl, pillars, this.relativePath + "x-models/pillars.ctm", objectLoader);
	loadMesh(gl, rightWallLogs, this.relativePath + "x-models/rightWallFull.ctm", objectLoader);
	loadMesh(gl, roofPanel1, this.relativePath + "x-models/roofPanel.ctm", objectLoader);
	loadMesh(gl, roofPanel2, this.relativePath + "x-models/roofPanel2.ctm", objectLoader);
	loadMesh(gl, roofAccessories, this.relativePath + "x-models/roofAccessories.ctm", objectLoader);
	loadMesh(gl, upperWall, this.relativePath + "x-models/frontRoofWall.ctm", objectLoader);
	loadMesh(gl, upperWallBack, this.relativePath + "x-models/backRoofWall.ctm", objectLoader);
}