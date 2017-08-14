define(['glMatrix', 'atlas'], function(GLM, Atlas) {
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

      this.bspProgram.uniform.texture = this.gl.getUniformLocation(
        this.bspProgram,
        "texture");

      this.bspProgram.uniform.texSize = this.gl.getUniformLocation(
        this.bspProgram,
        "texSize");
      this.bspProgram.uniform.texOffset = this.gl.getUniformLocation(
        this.bspProgram,
        "texOffset");
    },

    //TODO Clean this up
    //     Possibly by renaming this to LoadModel
    loadVertices: function() {
      var faces = this.bsp.models[0].faces; //only the first model (level)
      var vertsPerSurface = new Array(this.bsp.surfaces.length);
      var verts;

      for(var f=0; f < faces.length; ++f) {
        var face = faces[f];
        verts = vertsPerSurface[face.surface.index];
        if(!verts) {
          verts = [];
          vertsPerSurface[face.surface.index] = verts;
        }

        for(var v=0; v < face.vertices.length; ++v) {
          verts.push(face.vertices[v].pos[0]);
          verts.push(face.vertices[v].pos[1]);
          verts.push(face.vertices[v].pos[2]);

          verts.push((face.vertices[v].uv[0] / face.surface.mipTex.width));
          verts.push((face.vertices[v].uv[1] / face.surface.mipTex.height));
        }
      }

      this.vbos = [];
      for(var i=0; i < vertsPerSurface.length; ++i) {
        verts = vertsPerSurface[i];
        if(!verts) continue;

        this.gl.activeTexture(this.gl.TEXTURE0);
        var vbo = this.gl.createBuffer();
        var texture = this.loadTexture(i);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(verts), this.gl.STATIC_DRAW);
        this.vbos.push({vbo: vbo, count: verts.length/5, tex: texture});
      }
    },

    loadTexture: function(surfaceId) {
      var surface = this.bsp.surfaces[surfaceId];

      var data = new Uint8Array(surface.mipTex.mips[0]);
      var mip = new Uint8Array(surface.mipTex.width * surface.mipTex.height * 3);
      for(var i=0; i < data.length; ++i) {
        var idx = data[i];
        mip[i*3+0] = this.palette[idx*3+0];
        mip[i*3+1] = this.palette[idx*3+1];
        mip[i*3+2] = this.palette[idx*3+2];
      }

      let rect = this.atlas.allocate(surface.mipTex.width, surface.mipTex.height, mip);
      
      return {
        xy: [
          rect.xy[0]/this.atlas.width,
          rect.xy[1]/this.atlas.height,
        ],
        size: [
          rect.size[0]/this.atlas.width,
          rect.size[1]/this.atlas.height
        ],
      };
    },

    load: function(bsp, palette) {
      this.bsp = bsp;
      this.palette = new Uint8Array(palette);
      this.atlas = new Atlas(2048, 2048, this.gl);

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

        this.gl.activeTexture(this.gl.TEXTURE0);
			  this.gl.bindTexture(this.gl.TEXTURE_2D, this.atlas.texture);
			  this.gl.uniform1i(this.bspProgram.uniform.texture, 0);
        this.gl.uniform2fv(this.bspProgram.uniform.texSize, vbo.tex.size);
        this.gl.uniform2fv(this.bspProgram.uniform.texOffset, vbo.tex.xy);

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
