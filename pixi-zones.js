//SEAT DRAWING

//PIXI SELECTION
'use strict';

//ZONE
var ZoneGroup = function(options){
  
  if(!options.stage){
    throw "missing stage";
  }
  var stage = options.stage;
	
	var zone = options.zone;
  
  var zb = {
    diameter:64,
    padding:8,
    text:{},
    size:{},
    line:new Graphics(),
    area:{},
    anchor:{},
    drawLine: function(x,y){
      
    },
    setState:function(state,data){
      fsm.goTo(state,data)
    },
    calculateSeatArea : function(ev){
      var pos = ev.data.getLocalPosition(stage);
      var selectWidth = Math.abs(pos.x - this.anchor.x);
      var selectHeight = Math.abs(pos.y - this.anchor.y);

      var minX = Math.min(pos.x, this.anchor.x);
      var minY = Math.min(pos.y, this.anchor.y);
      
      return {};
    }
  };

  var fsm = new machina.Fsm({
    initialize: function( options ) {
      console.log("SELECTA INIT",options);  
    },
    namespace: "seatGroup",
    initialState: "uninitialized",
    states:{
      uninitialized: {
        _onEnter: function() {
          console.log("ENTER UNINTIALIZED");
          //make sure all events related to drawing are off
          renderer.plugins.interaction.off('mousedown').off("mousemove").off("mouseup");

          //reset all internal values
          zb.rect = {};
          zb.area = {};
          zb.anchor = {};
          zb.text = {};
          zb.size={};
          zone.x=0;
          zone.y=0;
          zone.width=0;
          zone.height=0;
        },
        _onExit: function() {
          console.log("EXIT UNINTIALIZED");
          //any initializing options could go here
        }
      },
      unzone: {
        _onEnter: function() {
          console.log("ENTER UNZONE");
          // add mouse events for undraw state
          renderer.plugins.interaction.on('mousedown', function(ev) {
            if(!bubling.down){
              bubling.down=true;
              zb.anchor = ev.data.getLocalPosition(zone);
              console.log(zone.children);
              zone.removeChild(zb.line);
              zb.line.lineStyle(4, 0xffd900, 1);
              
              console.log(zb.anchor.x,zb.anchor.y);
              zb.line.moveTo(zb.anchor.x,zb.anchor.y);
              zb.line.lineTo(500,500);
              zone.addChild(zb.line);

              renderer.plugins.interaction.on('mousemove', function(ev) {
                zone.removeChild(zb.line);
                var point = ev.data.getLocalPosition(zone);
                console.log(point.x,point.y);
                
              });  
            }
          });

          renderer.plugins.interaction.on('mouseup', function(ev) {
            if(!bubling.up){
              bubling.up=true;
              renderer.plugins.interaction.off("mousemove");
            }
          });
        },
        _onExit: function() {
          console.log("EXIT UNZONE");
          // remove events for undraw state
          renderer.plugins.interaction.off('mousedown').off("mousemove").off("mouseup");
        }
      }
    },
    goTo: function(state,data){
      this.transition(state,data);
    }
  });

  return {
    zone:zone,
    start:function(){
      zb.setState("unzone");
    },
    stop:function(){
      zb.setState("uninitialized");
    }
  }
};
//export Selecta;