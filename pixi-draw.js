//SEAT DRAWING

//PIXI SELECTION
'use strict';

//DRAW
var SeatGroup = function(options){
  
  if(!options.stage){
    throw "missing stage";
  }
  var stage = options.stage;
	
	var draw = options.draw;
  
  var sb = {
    diameter:64,
    padding:8,
    text:{},
    size:{},
    rect:{},
    area:{},
    anchor:{},
    drawLine: function(){
      this.rect = new Graphics();
      this.rect.beginFill(0xFFFFFF,0.2);
      this.rect.lineStyle(1, 0xEEEEEE,0.5);
      this.rect.drawRect(this.area.x,this.area.y,this.area.width,this.area.height);
      this.rect.endFill();
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
      
      var rows = Math.floor(selectWidth / (this.diameter+(2*this.padding)))
      var cols = Math.floor(selectHeight / (this.diameter+(2*this.padding)))

      return {rows:rows,cols:cols,x:minX,y:minY};
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
          sb.rect = {};
          sb.area = {};
          sb.anchor = {};
          sb.text = {};
          sb.size={};
          draw.x=0;
          draw.y=0;
          draw.width=0;
          draw.height=0;
        },
        _onExit: function() {
          console.log("EXIT UNINTIALIZED");
          //any initializing options could go here
        }
      },
      undraw: {
        _onEnter: function() {
          console.log("ENTER UNDRAW");
          // add mouse events for undraw state
          renderer.plugins.interaction.on('mousedown', function(ev) {
            if(!bubling.down){
              
              bubling.down=true;
              sb.anchor = ev.data.getLocalPosition(draw);
              sb.area = sb.anchor;
              sb.drawLine();
              draw.addChild(sb.rect);

              
              renderer.plugins.interaction.on('mousemove', function(ev) {
                //remove previous
                draw.removeChild(sb.text);
                draw.removeChild(sb.rect);
                console.log('draw',draw);
                ////draw line
                var local = ev.data.getLocalPosition(draw);
                console.log('local',local)
                sb.area = {x:sb.anchor.x,y:sb.anchor.y,width:local.x - sb.anchor.x,height:local.y-sb.anchor.y};
                console.log('area',sb.area);
                sb.drawLine();
                draw.addChild(sb.rect);

                //draw rowxcols text
                sb.size = sb.calculateSeatArea(ev);
                var textString = "["+sb.size.rows+"x"+sb.size.cols+"]";
                sb.text = new Text(textString,
                	{fontFamily : 'Arial', fontSize: 14, fill : 0xff1010, align : 'center'});
                sb.text.x = local.x+10;
                sb.text.y = local.y+10;
                draw.addChild(sb.text);
              });  
            }
          });

          renderer.plugins.interaction.on('mouseup', function(ev) {
            if(!bubling.up){
              bubling.up=true;
              renderer.plugins.interaction.off("mousemove");
              
              function add(i,j){
              	var obj = new PixiObject({container:stage,image:"cat.png",layer:stageLayer});
      					var rest = (sb.diameter/2)+sb.padding;
      					var x = sb.size.x+((i * sb.padding) + (i * sb.diameter/2) + (i-1)*rest);
      					var y = sb.size.y+((j * sb.padding) + (j * sb.diameter/2) + (j-1)*rest);
      					obj.add(x,y);
              }

              for (var i = 1; i <= sb.size.rows; i++) {
              	for(var j=1; j <= sb.size.cols;j++){
              		add(i,j);
              	}
              }
              draw.removeChild(sb.rect);
              draw.removeChild(sb.text);
            }
          });
        },
        _onExit: function() {
          console.log("EXIT UNDRAW");
          draw.removeChild(sb.rect);
          draw.removeChild(sb.text);
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
    draw:draw,
    start:function(){
      sb.setState("undraw");
    },
    stop:function(){
      sb.setState("uninitialized");
    }
  }
};
//export Selecta;