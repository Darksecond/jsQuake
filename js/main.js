requirejs.config({
  urlArgs: new Date().getTime().toString(), // For debugging only!
});

require(['pack', 'bsp'], function(Pack, BSP){
  "use strict";
  var pack = new Pack('data/pak0.pak');
  pack.load(function(){
    //onLoad
    pack.loadEntry("maps/e1m1.bsp", function(raw){
      var bsp = new BSP(raw);
      console.log(bsp);
    });
  },function(){
    //onError
  });
  console.log(pack);
});
