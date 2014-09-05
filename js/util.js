define(function(){
  "use strict";
  return {
    //TODO Change this to a StringView class (or something similar)
    dataViewToString: function(dataView, offset, length) {
      var unis = [];

      for(var c=offset; c < offset+length; ++c) {
        var uni = dataView.getUint8(c);
        if(uni === 0) {
          break;
        }
        unis.push(uni);
      }
      return String.fromCharCode.apply(null, unis);
    },
    getBinaryRange: function(url, offset, length, onLoad, onError) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.setRequestHeader('Range', 'bytes=' + offset + '-' + (offset + length - 1));

      // These next two are browser hacks (to make safari work)
      xhr.setRequestHeader('If-None-Match', Math.random().toString(36));
      xhr.setRequestHeader('Cache-control', 'no-cache');

      xhr.responseType = 'arraybuffer';

      xhr.onload = function(e) {
        if(xhr.status == 206) {
          if(onLoad) onLoad(xhr.response);
        } else if(xhr.status == 200) {
          if(onLoad) onLoad(xhr.response.slice(offset, offset + length));
        } else {
          if(onError) onError(xhr.status);
        }
      };

      xhr.onerror = function(e) {
        if(onError) onError(xhr.status);
      };

      xhr.send(null);
    },
  };
});
