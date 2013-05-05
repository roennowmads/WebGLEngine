"use strict";
var timeLast;
var startTime;
var timeNow;

var mouseX = 0, mouseY = 0;
var mouseXOld = 0, mouseYOld = 0;
var mouseOver = false;
var mouseDown = false;
var middleDown = false;

var Keys = {RIGHT : 39, LEFT : 37, DOWN : 40, UP : 38, SPACE : 32, ALT: 18};

var view;
var origWidth;
var origHeight;

function main () {
	document.onmousemove = onMouseMove;
	document.onmousewheel = onMouseWheel;
	document.onkeydown = onKeyDown;
	document.onkeyup = onKeyUp;
	
	var canvasElm = document.getElementById("canvas");
	origWidth = canvasElm.width;
	origHeight = canvasElm.height;
	
	canvasElm.onmouseover = function () { mouseOver = true; }
	canvasElm.onmouseout = function () { mouseOver = false; }
	canvasElm.onmousedown = onMouseDown;
	canvasElm.onmouseup = onMouseUp;
	
	document.addEventListener("webkitfullscreenchange", fullscreenChange, false)
	document.addEventListener("mozfullscreenchange", fullscreenChange, false)
	document.getElementById("fullscreen").onclick = onFullscreenClick;
	
	view = new View();
	document.getElementById("objectCount").value = view.numPointsSqrt; 
	document.getElementById("partCount").innerHTML = "Count: " + view.numPoints;
	
	//Initialize mouse position to the middle of the canvas:
	mouseX = canvasElm.width/2;
	mouseY = canvasElm.height/2;
	
	timeLast = Date.now();
	startTime = Date.now();
	timeNow = startTime;
	view.initView();
}

function submit () {
	var count = document.getElementById("objectCount").value;
	view.numPointsSqrt = count;
	view.numPoints = count*count;
	view.particles.setupFBAndInitTextures(view.gl);
	view.particles.setupShowBillboardShader(view.gl);
	view.particles.first = true;
	document.getElementById("partCount").innerHTML = "Count: " + view.numPoints;
}

function loadMesh (gl, model, meshLoc, objectLoader) {
	model.loadMeshFromCTMFile(meshLoc, gl, objectLoader);
}

function loadImageToTex (gl, textureObj, imgLoc, objectLoader, notMipmap) {
	var img = new Image();
	img.src = imgLoc;
	img.onload = function () {
		displayLoadState ("Downloaded texture: " + imgLoc);
		textureObj.texture = new createTexture(img, gl, objectLoader, notMipmap);
	}
}

function loadShaderScript (object, scriptAddress, fileLoader) {
	var request = new XMLHttpRequest();
    request.onreadystatechange = function () { 
    	if (request.readyState == 4) { 
    		object.script = request.responseText;
    		fileLoader.count();
		}
	}
	request.open("GET", scriptAddress, true);
    request.send();
}

function onKeyDown (e) {	
	switch(e.keyCode) {
	case 88:
		view.isUpdatingVelocities = !view.isUpdatingVelocities;
		var velInput = document.getElementById("velInput");
		velInput.checked = view.isUpdatingVelocities;
		break;
	case 90:
		view.isUpdatingPositions = !view.isUpdatingPositions;
		var posInput = document.getElementById("posInput");
		posInput.checked = view.isUpdatingPositions;
		//view.zoomFactor = 1.0;
		view.rotYAngle = 0.0;
		break;
	case Keys.LEFT:
		if (!view.isUpdatingPositions)
			view.rotYAngle -= 0.1;
		break;
	case Keys.RIGHT:
		if (!view.isUpdatingPositions)
			view.rotYAngle += 0.1;
		break;
	case Keys.UP:
		if (!view.isUpdatingPositions)	
			view.zoomFactor *= 1.01;
		e.preventDefault();
		break;
	case Keys.DOWN:
		if (!view.isUpdatingPositions)
			view.zoomFactor *= 0.99;
		e.preventDefault();
		break;
	case Keys.SPACE:
		var count = document.getElementById("objectCount").value;
		view = new View();
		view.initView();
		break;
	case Keys.ALT:
		if (mouseOver) {
			middleDown = true;
			e.preventDefault();
		}
		break;
	}	
}

function onKeyUp (e) {
	switch(e.keyCode) {
	case Keys.ALT:
		if (mouseOver) {
			middleDown = false;
			e.preventDefault();
		}
		break;
	}
}

function onMouseDown (e) {
	switch(e.button) {
	case 0:
		mouseDown = true;
		break;
	case 1:
		middleDown = true;
	}
	e.preventDefault(); 
}

function onMouseUp (e) {
	switch(e.button) {
	case 0:
		mouseDown = false;
		break;
	case 1:
		middleDown = false;
	}
	e.preventDefault();  
}

function onMouseMove(e) {
	if (mouseOver) {
		if(e.offsetX == undefined) // this works for Firefox
		{
			if (document.getElementById("canvas").offsetLeft == 0) {
				mouseX = e.pageX - 267;
				mouseY = e.pageY - 66;
			}
			else {
				mouseX = e.pageX - document.getElementById("canvas").offsetLeft;
				mouseY = e.pageY - document.getElementById("canvas").offsetTop;
			}
		}
		else {
			mouseX = e.offsetX;
			mouseY = e.offsetY;
		}
		
		if (middleDown) {
			if (!view.drawDepth) {
				view.rotateXCounter += (mouseY - mouseYOld)*0.005;
				view.rotateYCounter += (mouseX - mouseXOld)*0.005;
			}
			else if (!view.drawShadows) {
				view.rotateShadowXCounter += (mouseY - mouseYOld)*0.005;
				view.rotateShadowYCounter += (mouseX - mouseXOld)*0.005;
			}
		}
		mouseXOld = mouseX;
		mouseYOld = mouseY;
	}
	else
		middleDown = false;
}

function onMouseWheel(e) {
	if (e.wheelDeltaY > 0) {
		view.zoomFactor *= 1.05;
	}
	else if (e.wheelDeltaY < 0) {
		view.zoomFactor *= 0.95;
	}
	e.preventDefault();
	
}

function FileLoader (fileCount, onCompleteFunction, originClass) {
	this.fileCount = fileCount;
	this.filesLoaded = 0;
	this.onCompleteFunction = onCompleteFunction;
	this.originClass = originClass;
}

FileLoader.prototype.count = function () {
	this.filesLoaded++;
	if (this.filesLoaded == this.fileCount) {
		this.onCompleteFunction(this.originClass);
	}
}

function onFullscreenClick () {
	if (view.canvas.webkitRequestFullScreen)
		view.canvas.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
	else if (view.canvas.mozRequestFullScreen)
		view.canvas.mozRequestFullScreen();
}

function fullscreenChange () {
	if (document.webkitIsFullScreen || document.mozFullScreenElement) {
		view.canvas.width = screen.width;
		view.canvas.height = screen.height;
		view = new View();
		view.initView();
	}
	else {
		view.canvas.width = origWidth;
		view.canvas.height = origHeight;
		view = new View();
		view.initView();
	}
	view.gl.viewport(0, 0, view.canvas.width, view.canvas.height);
}

function displayLoadState (state) {
	var canvasDiv = document.getElementById("canvasDiv");
	var prevText = document.getElementById("loadingFile");
	if (prevText)
		canvasDiv.removeChild(prevText);
		
	var text = document.createElement("p");
	text.id = "loadingFile";
	text.style.position = "absolute";
	text.style.left = "300px";
	text.innerHTML = state
	
	canvasDiv.appendChild(text);
}

function Texture () {
	this.texture;
}

function createTexture (img, gl, fileLoader, notMipmap) {
	var texture = gl.createTexture();	
	gl.bindTexture(gl.TEXTURE_2D, texture);
	
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	if (!notMipmap) {
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.generateMipmap(gl.TEXTURE_2D);
	}
	else
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	fileLoader.count();
	
	return texture;
}

function toggleVelocities () {
	var velInput = document.getElementById("velInput");
	view.isUpdatingVelocities = velInput.checked;
}

function togglePositions () {
	var posInput = document.getElementById("posInput");
	view.isUpdatingPositions = posInput.checked;
}

function updatePointSize () {
	view.pointSize = document.getElementById("pointSize").value;
}

function toggleDrawDepth () {
	view.drawDepth = !view.drawDepth;
}

function toggleDrawVel () {
	view.drawPositions = !view.drawPositions;
}

function toggleDrawBloom () {
	view.drawBloom = !view.drawBloom;
}

function toggleDrawShadows () {
	view.drawShadows = !view.drawShadows;
}

function toggleDrawSoftShadows () {
	view.drawSoftShadows = !view.drawSoftShadows;
}

function toggleRotate () {
	if (view.isRotating)
		view.rotateYCounter = 0;
	view.isRotating = !view.isRotating;
}