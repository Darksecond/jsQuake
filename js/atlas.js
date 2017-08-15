define(function(){
  "use strict";

  function Atlas(width, height, gl) {
    if (!(this instanceof Atlas)) {
      throw new TypeError("Atlas constructor cannot be called as a function.");
    }

    this.gl = gl;
    this.freeRects = [{xy: [0,0], size: [width, height]}];
    this.width = width;
    this.height = height;

    this.texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB,
      width, height, 0, this.gl.RGB,
      this.gl.UNSIGNED_BYTE, new Uint8Array(width*height*3).fill(0));

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
    this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1);
  }

  Atlas.prototype = {
    constructor: Atlas,

    allocate: function(width, height, data) {
      var bestRect;
      var bestScore = Infinity;
      for(var i=0; i < this.freeRects.length; i++) {
        var rect = this.freeRects[i];
        var score = (rect.size[0]-width) + (rect.size[1]-height);
        if(score == 0) {
          bestRect = rect;
          bestScore = score;
          break;
        } else if(score > 0 && score < bestScore && rect.size[0] >= width && rect.size[1] >= height) {
            bestScore = score;
            bestRect = rect;
        }
      }
      if(bestRect) {
        this.freeRects.splice(this.freeRects.indexOf(bestRect), 1);
        var rect1 = {
          xy: [bestRect.xy[0],bestRect.xy[1]+height],
          size: [bestRect.size[0],bestRect.size[1]-height],
        };
        var rect2 = {
          xy: [bestRect.xy[0]+width,bestRect.xy[1]],
          size: [bestRect.size[0]-width,height],
        };

        if(rect1.size[0] > 0 && rect1.size[1] > 0) {
          this.freeRects.push(rect1);
        }
        if(rect2.size[0] > 0 && rect2.size[1] > 0) {
          this.freeRects.push(rect2);
        }

        if(data) {
          this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
          this.gl.texSubImage2D(this.gl.TEXTURE_2D,
            0,
            bestRect.xy[0],
            bestRect.xy[1],
            width,
            height,
            this.gl.RGB,
            this.gl.UNSIGNED_BYTE,
            data);
        }
        return {xy: bestRect.xy, size: [width, height]};
      } else {
        console.error('No fitting rect found');
        return null;
      }
    },
  };

  return Atlas;
});
