define(['util', 'glMatrix'], function(Util, GLM){
  "use strict";
  function BSP(raw) {
    if (!(this instanceof BSP)) {
            throw new TypeError("BSP constructor cannot be called as a function.");
    }

    this.raw = raw;

    this.header      = {};
    this.vertices    = [];
    this.edges       = [];
    this.faces       = [];
    this.clipNodes   = [];
    this.edgeIndices = [];
    this.faceIndices = [];
    this.mipTextures = [];
    this.surfaces    = [];
    this.planes      = [];
    this.nodes       = [];
    this.leaves      = [];
    this.models      = [];

    this.parseHeader();
    this.parseVertices();
    this.parseEdges();
    this.parsePlanes();
    this.parseMipTextures();
    this.parseSurfaces();
    this.parseEdgeIndices();
    this.parseFaces();
    this.parseClipNodes();
    this.parseFaceIndices();
    this.parseNodes();
    this.parseLeaves();
    this.parseModels();
  }

  BSP.prototype = {
    constructor: BSP,

    parseModels: function() {
      var data = new DataView(
        this.raw,
        this.header.models.offset,
        this.header.models.length
      );

      console.log("Parsing %i models", this.header.models.count);

      for(var i=0; i < this.header.models.count; ++i) {
        var model = {
          box: {
            min: GLM.vec3.fromValues(
              data.getFloat32(i * 64 + 0, true), //0-4
              data.getFloat32(i * 64 + 4, true), //4-8
              data.getFloat32(i * 64 + 8, true)  //8-12
            ),
            max: GLM.vec3.fromValues(
              data.getFloat32(i * 64 + 12, true), //12-16
              data.getFloat32(i * 64 + 16, true), //16-20
              data.getFloat32(i * 64 + 20, true)  //20-24
            ),
          },
          origin: GLM.vec3.fromValues(
            data.getFloat32(i * 64 + 24, true), //24-28
            data.getFloat32(i * 64 + 28, true), //28-32
            data.getFloat32(i * 64 + 32, true)  //32-36
          ),
          // index of first BSP node
          nodeId0  : data.getInt32(i*64 + 36, true), //36-40
          // index of first clip node
          nodeId1  : data.getInt32(i*64 + 40, true), //40-44
          // index of second clip node
          nodeId2  : data.getInt32(i*64 + 44, true), //44-48
          // usually zero
          nodeId3  : data.getInt32(i*64 + 48, true), //48-52
          numLeaves: data.getInt32(i*64 + 52, true), //52-56
          faces    : [],
        };

        // Reference faces directly
        var faceId = data.getInt32(i*64 + 56, true); //56-60
        var faceNum = data.getInt32(i*64 + 60, true); //60-64

        for(var f=0; f < faceNum; ++f) {
          model.faces.push(this.faces[faceId+f]);
        }

        this.models.push(model);
      }
    },

    parseLeaves: function() {
      var data = new DataView(
        this.raw,
        this.header.leaves.offset,
        this.header.leaves.length
      );

      console.log("Parsing %i leaves", this.header.leaves.count);

      for(var i=0; i < this.header.leaves.count; ++i) {
        var leaf = {
          type   : data.getInt32(i*28 + 0, true),         //0-4
          vislist: data.getInt32(i*28 + 4, true),         //4-8
          box: {
            min: GLM.vec3.fromValues(
              data.getUint16(i*28 +  8, true),            //8-10
              data.getUint16(i*28 + 10, true),            //10-12
              data.getUint16(i*28 + 12, true)             //12-14
            ),
            max: GLM.vec3.fromValues(
              data.getUint16(i*28 + 14, true),            //14-16
              data.getUint16(i*28 + 16, true),            //16-18
              data.getUint16(i*28 + 18, true)             //18-20
            ),
          },
          faces        : [],
          sndWater     : data.getUint8 (i*28 + 24, true), //24-25
          sndSky       : data.getUint8 (i*28 + 25, true), //25-26
          sndSlime     : data.getUint8 (i*28 + 26, true), //26-27
          sndLava      : data.getUint8 (i*28 + 27, true), //27-28
        };

        // Reference faces directly
        var faceIndiceId = data.getUint16(i*28 + 20, true); //20-22
        var faceIndiceNum = data.getUint16(i*28 + 22, true); //22-24

        for(var f=0; f < faceIndiceNum; ++f) {
          var index = this.faceIndices[faceIndiceId + f];
          leaf.faces.push(this.faces[index]);
        }

        this.leaves.push(leaf);
      }
    },

    parseNodes: function() {
      var data = new DataView(
        this.raw,
        this.header.nodes.offset,
        this.header.nodes.length
      );

      console.log("Parsing %i nodes", this.header.nodes.count);

      for(var i=0; i < this.header.nodes.count; ++i) {
        var node = {
          planeId: data.getInt32(i*24 + 0, true),   //0-4
          front: data.getUint16(i*24 + 4, true),    //4-6
          back:  data.getUint16(i*24 + 6, true),    //6-8
          box: {
            min: GLM.vec3.fromValues(
              data.getUint16(i*24 + 8, true),       //8-10
              data.getUint16(i*24 + 10, true),      //10-12
              data.getUint16(i*24 + 12, true)       //12-14
            ),
            max: GLM.vec3.fromValues(
              data.getUint16(i*24 + 14, true),      //14-16
              data.getUint16(i*24 + 16, true),      //16-18
              data.getUint16(i*24 + 18, true)       //18-20
            ),
          },
          faces : [],
        };

        // Reference faces directly
        var faceId = data.getUint16(i*24 + 20, true);  //20-22
        var faceNum = data.getUint16(i*24 + 22, true); //22-24

        for(var f=0; f < faceNum; ++f) {
          node.faces.push(this.faces[faceId + f]);
        }

        this.nodes.push(node);
      }
    },

    parsePlanes: function() {
      var data = new DataView(
        this.raw,
        this.header.planes.offset,
        this.header.planes.length
      );

      console.log("Parsing %i planes", this.header.planes.count);

      for(var i=0; i < this.header.planes.count; ++i) {
        this.planes.push({
          normal: GLM.vec3.fromValues(
            data.getFloat32(i*20 + 0, true),      //0-4
            data.getFloat32(i*20 + 4, true),      //4-8
            data.getFloat32(i*20 + 8, true)       //8-12
          ),
          dist: data.getFloat32(i*20 + 12, true), //12-16
          type: data.getInt32(i*20 + 16, true),   //16-20
        });
      }
    },

    parseSurfaces: function() {
      var data = new DataView(
        this.raw,
        this.header.texinfo.offset,
        this.header.texinfo.length
      );

      console.log("Parsing %i surfaces", this.header.texinfo.count);

      for(var i=0; i < this.header.texinfo.count; ++i) {
        var surface = {
          vecS: GLM.vec3.fromValues(
            data.getFloat32(i*40 + 0, true),         //0-4
            data.getFloat32(i*40 + 4, true),         //4-8
            data.getFloat32(i*40 + 8, true)          //8-12
          ),
          distS: data.getFloat32(i*40 + 12, true),   //12-16

          vecT: GLM.vec3.fromValues(
            data.getFloat32(i*40 + 16, true),        //16-20
            data.getFloat32(i*40 + 20, true),        //20-24
            data.getFloat32(i*40 + 24, true)         //24-28
          ),
          distT: data.getFloat32(i*40 + 28, true),   //28-32
          animated: data.getUint32(i*40 + 36, true), //36-40
        };

        // Reference mipTexture directly
        var mipTexId =  data.getUint32(i*40 + 32, true); //32-36
        surface.mipTex = this.mipTextures[mipTexId];

        this.surfaces.push(surface);
      }
    },

    parseMipTextures: function() {
      var data = new DataView(
        this.raw,
        this.header.miptex.offset,
        this.header.miptex.length
      );

      var numTex = data.getInt32(0, true);
      console.log("Parsing %i mipTextures", numTex);

      for(var i=0; i < numTex; ++i) {
        var offset = data.getInt32(i*4 + 4, true);

        var mipTex = {
          name   : Util.dataViewToString(data, offset + 0, 16), //0-16
          width  : data.getUint32(offset + 16, true),           //16-20
          height : data.getUint32(offset + 20, true),           //20-24
          mips   : [], // 1/1 - 1/2 - 1/4 - 1/8
        };

        for(var m=0; m < 4; ++m) {
          var mipOffset = data.getUint32(offset + 24 + m*4, true);
          var mipStart = offset + mipOffset;
          // (x >> y) is the same as (x / 2^y)
          var mipEnd = mipStart + (mipTex.width >> m) * (mipTex.height >> m);
          var mipData = this.raw.slice(mipStart, mipEnd);
          mipTex.mips.push(mipData);
        }

        this.mipTextures.push(mipTex);
      }
    },

    parseFaceIndices: function() {
      var data = new DataView(
        this.raw,
        this.header.listFaces.offset,
        this.header.listFaces.length
      );

      console.log("Parsing %i faceIndices", this.header.listFaces.count);

      for(var i=0; i < this.header.listFaces.count; ++i) {
        this.faceIndices.push( data.getUint16(i*2 + 0, true) );
      }
    },

    parseEdgeIndices: function() {
      var data = new DataView(
        this.raw,
        this.header.listEdges.offset,
        this.header.listEdges.length
      );

      console.log("Parsing %i edgeIndices", this.header.listEdges.count);

      for(var i=0; i < this.header.listEdges.count; ++i) {
        this.edgeIndices.push( data.getInt16(i*2 + 0, true) );
      }
    },

    parseClipNodes: function() {
      var data = new DataView(
        this.raw,
        this.header.clipNodes.offset,
        this.header.clipNodes.length
      );

      console.log("Parsing %i clipNodes", this.header.clipNodes.count);

      for(var i=0; i < this.header.clipNodes.count; ++i) {
        this.clipNodes.push({
          planeNum: data.getUint32(i*8 + 0, true), //0-4
          front   : data.getInt16 (i*8 + 4, true), //4-6
          back    : data.getInt16 (i*8 + 6, true), //6-8
        });
      }
    },

    parseVertices: function() {
      var data = new DataView(
        this.raw,
        this.header.vertices.offset,
        this.header.vertices.length
      );

      console.log("Parsing %i vertices", this.header.vertices.count);

      for(var i=0; i < this.header.vertices.count; ++i) {
        this.vertices.push(GLM.vec3.fromValues(
          data.getFloat32(i*12 + 0, true),
          data.getFloat32(i*12 + 4, true),
          data.getFloat32(i*12 + 8, true)
        ));
      }
    },

    parseEdges: function() {
      var data = new DataView(
        this.raw,
        this.header.edges.offset,
        this.header.edges.length
      );

      console.log("Parsing %i edges", this.header.edges.count);

      for(var i=0; i < this.header.edges.count; ++i) {
        var edge = {
          vertexIndex0: data.getUint16(i*4 + 0, true), //0-2
          vertexIndex1: data.getUint16(i*4 + 2, true), //2-4
        };

        this.edges.push(edge);
      }
    },

    parseFaces: function() {
      var data = new DataView(
        this.raw,
        this.header.faces.offset,
        this.header.faces.length
      );

      console.log("Parsing %i faces", this.header.faces.count);

      for(var i=0; i < this.header.faces.count; ++i) {
        var face = {
          side         : data.getUint16(i*20 +  2, true), // 2- 4
          vertices     : [],
          typelight    : data.getUint8 (i*20 + 12, true), //12-13
          baselight    : data.getUint8 (i*20 + 13, true), //13-14
          light        : [
                         data.getUint8 (i*20 + 14, true), //14-15
                         data.getUint8 (i*20 + 15, true), //15-16
                         ],
          lightmap     : data.getInt32 (i*20 + 16, true), //16-20
        };

        // Reference vertices directly
        //TODO UV coordinates
        var edgeIndiceId = data.getInt32 (i*20 +  4, true);  // 4-8
        var edgeIndiceNum = data.getUint16(i*20 +  8, true); // 8-10

        var index;
        var edge;
        var vert0, vert1, vert2;

        if(edgeIndiceNum < 3) {
          console.error("Face %i has less than 3 edges", i);
          continue;
        }

        index = this.edgeIndices[edgeIndiceId + 0];
        edge = this.edges[Math.abs(index)];
        if(index < 0) {
          vert0 = this.vertices[edge.vertexIndex1];
        } else {
          vert0 = this.vertices[edge.vertexIndex0];
        }

        index = this.edgeIndices[edgeIndiceId + 1];
        edge = this.edges[Math.abs(index)];
        if(index < 0) {
          vert1 = this.vertices[edge.vertexIndex1];
        } else {
          vert1 = this.vertices[edge.vertexIndex0];
        }

        for(var e=2; e < edgeIndiceNum; ++e) {
          index = this.edgeIndices[edgeIndiceId + e];
          edge = this.edges[Math.abs(index)];
          if(index < 0) {
            vert2 = this.vertices[edge.vertexIndex1];
          } else {
            vert2 = this.vertices[edge.vertexIndex0];
          }

          face.vertices.push(vert0);
          face.vertices.push(vert1);
          face.vertices.push(vert2);

          vert1 = vert2;
        }

        // Reference plane directly
        var planeId = data.getUint16(i*20 +  0, true); // 0-2
        face.plane = this.planes[planeId];

        // Reference surface directly
        var texinfoId = data.getUint16(i*20 + 10, true); //10-12
        face.surface = this.surfaces[texinfoId];

        this.faces.push(face);
      }
    },

    parseHeader: function() {
      var data = new DataView(this.raw, 0);

      var version = data.getInt32(0, true);
      if(version != 29) {
        console.error("Trying to load BSP (%i)", version);
      } else {
        console.log("Loading BSP (%i)", version);
      }

      this.header = {
        entities: {
          offset: data.getInt32(4, true),
          length: data.getInt32(8, true),
        },
        planes: {
          offset: data.getInt32(12, true),
          length: data.getInt32(16, true),
        },
        miptex: {
          offset: data.getInt32(20, true),
          length: data.getInt32(24, true),
        },
        vertices: {
          offset: data.getInt32(28, true),
          length: data.getInt32(32, true),
        },
        visilist: {
          offset: data.getInt32(36, true),
          length: data.getInt32(40, true),
        },
        nodes: {
          offset: data.getInt32(44, true),
          length: data.getInt32(48, true),
        },
        texinfo: {
          offset: data.getInt32(52, true),
          length: data.getInt32(56, true),
        },
        faces: {
          offset: data.getInt32(60, true),
          length: data.getInt32(64, true),
        },
        lightmaps: {
          offset: data.getInt32(68, true),
          length: data.getInt32(72, true),
        },
        clipNodes: {
          offset: data.getInt32(76, true),
          length: data.getInt32(80, true),
        },
        leaves: {
          offset: data.getInt32(84, true),
          length: data.getInt32(88, true),
        },
        listFaces: {
          offset: data.getInt32(92, true),
          length: data.getInt32(96, true),
        },
        edges: {
          offset: data.getInt32(100, true),
          length: data.getInt32(104, true),
        },
        listEdges: {
          offset: data.getInt32(108, true),
          length: data.getInt32(112, true),
        },
        models: {
          offset: data.getInt32(116, true),
          length: data.getInt32(120, true),
        },
      };

      this.header.vertices.count = this.header.vertices.length / 12;
      this.header.edges.count = this.header.edges.length / 4;
      this.header.faces.count = this.header.faces.length / 20;
      this.header.clipNodes.count = this.header.clipNodes.length / 8;
      this.header.listEdges.count = this.header.listEdges.length / 2;
      this.header.listFaces.count = this.header.listFaces.length / 2;
      this.header.texinfo.count = this.header.texinfo.length / 40;
      this.header.planes.count = this.header.planes.length / 20;
      this.header.nodes.count = this.header.nodes.length / 24;
      this.header.leaves.count = this.header.leaves.length / 28;
      this.header.models.count = this.header.models.length / 64;

    },
  };

  return BSP;
});
