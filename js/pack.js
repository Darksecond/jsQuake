define(["util"], function (Util){
  "use strict";
  function Pack(url) {
    if (!(this instanceof Pack)) {
            throw new TypeError("Pack constructor cannot be called as a function.");
    }

    this.url = url;
    this.entries = {};
  }

  function parseEntry(pack, dataView) {
    var name = Util.dataViewToString(dataView, 0, 0x38);
    var offset = dataView.getUint32(0x38, true);
    var length = dataView.getUint32(0x3C, true);

    pack.entries[name] = {
      name: name,
      offset: offset,
      length: length,
    };
  }

  Pack.prototype = {
    constructor: Pack,

    loadEntry: function(name, onLoad, onError) {
      var entry = this.entries[name];
      if(entry) {
        Util.getBinaryRange(this.url, entry.offset, entry.length, function(entryArray) {
          if(onLoad) onLoad(entryArray);
        }, function(){
          if(onLoad) onError();
        });
      } else {
        if(onLoad) onError();
      }
    },

    load: function(onLoad, onError) {
      Util.getBinaryRange(this.url, 0, 12, function(array) {
        var data = new DataView(array);
        if(data.getUint32(0, true) != 0x4b434150) {
          console.error("Not a PACK file");
          if(onError) onError();
          return;
        }
        var dirofs = data.getUint32(4, true);
        var dirlen = data.getUint32(8, true);
        var numEntries = dirlen / 0x40;

        if(numEntries > 0) { //There are entries to load
          Util.getBinaryRange(this.url, dirofs, dirlen, function(dirArray) {
            //load All entries
            for(var i=0; i < numEntries; ++i) {
              var data = new DataView(dirArray, i*0x40, 0x40);
              parseEntry(this, data);
            }
            console.log("Loaded %i entries from %s", numEntries, this.url);
            if(onLoad) onLoad();
          }.bind(this), function(status) {
            if(onError) onError();
          });
        }
      }.bind(this), function(status){
        if(onError) onError();
      });
    },
  };

  return Pack;
});
