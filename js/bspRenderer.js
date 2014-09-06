define(['glMatrix'], function(GLM) {
  "use strict";

  function BSPRenderer(gl) {
    if (!(this instanceof BSPRenderer)) {
            throw new TypeError("BSPRenderer constructor cannot be called as a function.");
    }

    this.gl = gl;

    this.loadShaders();
  }

  BSPRenderer.prototype = {
    constructor: BSPRenderer,

    //TODO cacheAttributes
    //     (https://github.com/mrdoob/three.js/blob/master/src/renderers/webgl/WebGLProgram.js#L38)
    //TODO cacheUniforms
    //     (https://github.com/mrdoob/three.js/blob/master/src/renderers/webgl/WebGLProgram.js#L23)
    //TODO Proper Shader & Program classes
    loadShaders: function() {
      var fsScript = document.getElementById('bsp-fs');
      var fsShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
      this.gl.shaderSource(fsShader, fsScript.text);
      this.gl.compileShader(fsShader);
      if(!this.gl.getShaderParameter(fsShader, this.gl.COMPILE_STATUS)) {
        var compilationLog = this.gl.getShaderInfoLog(fsShader);
        console.error("Couldn't compile the fragment shader", compilationLog);
        this.gl.deleteShader(fsShader);
        return;
      }

      var vsScript = document.getElementById('bsp-vs');
      var vsShader = this.gl.createShader(this.gl.VERTEX_SHADER);
      this.gl.shaderSource(vsShader, vsScript.text);
      this.gl.compileShader(vsShader);
      if(!this.gl.getShaderParameter(vsShader, this.gl.COMPILE_STATUS)) {
        var vsCompilationLog = this.gl.getShaderInfoLog(vsShader);
        console.error("Couldn't compile the vertex shader", vsCompilationLog);
        this.gl.deleteShader(vsShader);
        return;
      }

      this.bspProgram = this.gl.createProgram();
      this.gl.attachShader(this.bspProgram, vsShader);
      this.gl.attachShader(this.bspProgram, fsShader);
      this.gl.linkProgram(this.bspProgram);

      if (!this.gl.getProgramParameter(this.bspProgram, this.gl.LINK_STATUS)) {
        console.error("Unable to initialise shaders");
        this.gl.deleteProgram(this.bspProgram);
        this.gl.deleteProgram(vsShader);
        this.gl.deleteProgram(fsShader);
        return;
      }

      this.bspProgram.attribute = {};
      this.bspProgram.uniform = {};

      this.bspProgram.attribute.position = this.gl.getAttribLocation(
        this.bspProgram,
        "position");

      this.bspProgram.attribute.uv = this.gl.getAttribLocation(
        this.bspProgram,
        "uv");

      this.bspProgram.uniform.perspectiveMatrix = this.gl.getUniformLocation(
        this.bspProgram,
        "perspectiveMatrix");

      this.bspProgram.uniform.viewMatrix = this.gl.getUniformLocation(
        this.bspProgram,
        "viewMatrix");
    },

    //TODO Clean this up
    loadVertices: function() {
      var vertsPerSurface = new Array(this.bsp.surfaces.length);
      var verts;

      for(var f=0; f < this.bsp.faces.length; ++f) {
        var face = this.bsp.faces[f];
        verts = vertsPerSurface[face.surface.index];
        if(!verts) {
          verts = [];
          vertsPerSurface[face.surface.index] = verts;
        }

        for(var v=0; v < face.vertices.length; ++v) {
          verts.push(face.vertices[v].pos[0]);
          verts.push(face.vertices[v].pos[1]);
          verts.push(face.vertices[v].pos[2]);

          verts.push(face.vertices[v].uv[0] / face.surface.mipTex.width);
          verts.push(face.vertices[v].uv[1] / face.surface.mipTex.height);
        }
      }

      this.vbos = [];
      for(var i=0; i < vertsPerSurface.length; ++i) {
        verts = vertsPerSurface[i];
        if(!verts) continue;

        var vbo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(verts), this.gl.STATIC_DRAW);
        this.vbos.push({vbo: vbo, count: verts.length/5});
      }
    },

    load: function(bsp) {
      this.bsp = bsp;

      this.loadVertices();
    },

    render: function(view, perspective) {
      this.gl.useProgram(this.bspProgram);

      this.gl.enableVertexAttribArray(this.bspProgram.attribute.position);
      this.gl.enableVertexAttribArray(this.bspProgram.attribute.uv);

      this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
      this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT );

      this.gl.enable(this.gl.DEPTH_TEST);
			this.gl.depthFunc(this.gl.LEQUAL);

      this.gl.enable(this.gl.CULL_FACE);
			this.gl.cullFace(this.gl.FRONT);

      // this.gl.enable(this.gl.BLEND);
			// this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

      this.gl.uniformMatrix4fv(this.bspProgram.uniform.perspectiveMatrix, false, perspective);
      this.gl.uniformMatrix4fv(this.bspProgram.uniform.viewMatrix, false, view);

      for(var i=0; i < this.vbos.length; ++i) {
        var vbo = this.vbos[i];
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo.vbo);
        this.gl.vertexAttribPointer(this.bspProgram.attribute.position, 3, this.gl.FLOAT, false, 5*4, 0);
        this.gl.vertexAttribPointer(this.bspProgram.attribute.uv, 2, this.gl.FLOAT, false, 5*4, 3*4);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, vbo.count);
      }

      //TODO Disable this on non-debug mode
      var error = this.gl.getError ();
      if (this.gl.NO_ERROR != error) {
        console.error ("GL threw an error, code: " + error);
      }
    },
  };

  return BSPRenderer;
});
