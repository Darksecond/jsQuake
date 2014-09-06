requirejs.config({
  urlArgs: new Date().getTime().toString(), // For debugging only!
});

//TODO FirstPersonControls class
//TODO PointerLockControls class
//TODO Camera class
//TODO Handle context loss
//TODO Handle resize
//TODO update() routine
//TODO tick() routine
//TODO Input class
//TODO FPS counter (https://github.com/mrdoob/stats.js/)
//TODO Fullscreen
//TODO Clean this up massively
require(['pack', 'bsp', 'bspRenderer', 'glMatrix'], function(Pack, BSP, BSPRenderer, GLM){
  "use strict";

  // Initialize OpenGL
  if(!window.WebGLRenderingContext) {
    console.error("WebGL not available");
    return;
  }

  var canvas = document.getElementById("game");
  var devicePixelRatio = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;

  var gl = canvas.getContext("experimental-webgl");
  if(!gl) {
    console.error("Error initializing WebGL");
    return;
  }
  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.viewportWidth = canvas.width;
  gl.viewportHeight = canvas.height;

  var bspRenderer = new BSPRenderer(gl);

  var projectionMat = GLM.mat4.create();
  GLM.mat4.perspective(projectionMat, 45.0,
    gl.viewportWidth / gl.viewportHeight,
    1.0, 4096.0);

  var cameraPos = GLM.vec3.fromValues(0, -256, 0);
  var speed = 15;
  var movingModel = false;
	var lastX = 0;
	var lastY = 0;
  var zAngle = 0;
	var xAngle = 0;
  var camera = GLM.mat4.create();
  GLM.mat4.identity(camera);
  GLM.mat4.rotateX(camera, camera, xAngle-Math.PI/2);
  GLM.mat4.rotateZ(camera, camera, zAngle);
  GLM.mat4.translate(camera, camera, cameraPos);

  var pressed = new Array(128);
  window.onkeydown = function(event) {
		pressed[event.keyCode] = true;
	};

	window.onkeyup = function(event) {
		pressed[event.keyCode] = false;
	};

  setInterval(function() {
		var dir = [0, 0, 0];
		if(pressed['W'.charCodeAt(0)]) {
			dir[2] += speed;
		}
		if(pressed['S'.charCodeAt(0)]) {
			dir[2] -= speed;
		}
		if(pressed['A'.charCodeAt(0)]) {
			dir[0] += speed;
		}
		if(pressed['D'.charCodeAt(0)]) {
			dir[0] -= speed;
		}
		if(pressed[17]) {
			dir[1] += speed;
		}
		if(pressed[32]) {
			dir[1] -= speed;
		}
    GLM.mat4.identity(camera);
    GLM.mat4.rotateX(camera, camera, xAngle-Math.PI/2);
    GLM.mat4.rotateZ(camera, camera, zAngle);
    // GLM.mat4.translate(camera, camera, cameraPos);
    GLM.mat4.invert(camera, camera);

    GLM.vec3.transformMat4(dir, dir, camera);
    GLM.vec3.add(cameraPos, cameraPos, dir);
  }, 33);

  document.getElementById('game').onmousedown = function(event) {
					if(event.which == 1) {
						movingModel = true;
					}
					lastX = event.pageX;
					lastY = event.pageY;
				};

	document.getElementById('game').onmouseup = function(event) {
		movingModel = false;
	};

	document.getElementById('game').onmousemove = function(event) {
		var xDelta = event.pageX  - lastX;
		var yDelta = event.pageY  - lastY;
		lastX = event.pageX;
		lastY = event.pageY;

		if (movingModel) {
			zAngle += xDelta*0.025;
			while (zAngle < 0)
				zAngle += Math.PI*2;
			while (zAngle >= Math.PI*2)
				zAngle -= Math.PI*2;

			xAngle += yDelta*0.025;
			while (xAngle < -Math.PI*0.5)
				xAngle = -Math.PI*0.5;
			while (xAngle > Math.PI*0.5)
				xAngle = Math.PI*0.5;
		}
	};

  var render = function() {
    GLM.mat4.identity(camera);
    GLM.mat4.rotateX(camera, camera, xAngle-Math.PI/2);
    GLM.mat4.rotateZ(camera, camera, zAngle);
    GLM.mat4.translate(camera, camera, cameraPos);

    bspRenderer.render(camera, projectionMat);
    window.requestAnimationFrame(render, canvas);
  }.bind(this);

  // Load pack
  var pack = new Pack('data/pak0.pak');
  pack.load(function(){
    //onLoad
    pack.loadEntry("maps/e1m1.bsp", function(raw){
      var bsp = new BSP(raw);
      console.log(bsp);

      bspRenderer.load(bsp);
      render();
    });
  },function(){
    //onError
  });
  console.log(pack);
});
