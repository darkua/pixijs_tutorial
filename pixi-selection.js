//PIXI SELECTION
'use strict';

//SELECTION ( ONLY ONE LEVEL SELECTION ON STAGE!)
var Selecta = function(options){
  
  if(!options.stage){
    throw "missing stage";
  }
  var stage = options.stage;

  // var selected = new Container();
  // selected.interactive=true;
  // selected.buttonMode=true;
  // selected.displayGroup = options.displayGroup;
  var selected = options.selected;
  var r = {
    rect:{},
    area:{},
    anchor:{},
    draw: function(){
      this.rect = new Graphics();
      this.rect.beginFill(0xFFFFFF,0.2);
      this.rect.lineStyle(1, 0xEEEEEE,0.5);
      this.rect.drawRect(this.area.x,this.area.y,this.area.width,this.area.height);
      this.rect.endFill();
    },
    setState:function(state,data){
      fsm.goTo(state,data)
    },
    calculateHitArea : function(ev){
      var pos = ev.data.getLocalPosition(stage);
      var selectWidth = Math.abs(pos.x - this.anchor.x);
      var selectHeight = Math.abs(pos.y - this.anchor.y);
      var minX = Math.min(pos.x, this.anchor.x);
      var minY = Math.min(pos.y, this.anchor.y);
      return {x:minX,y:minY,width:selectWidth,height:selectHeight};
    }
  };

  var fsm = new machina.Fsm({
    initialize: function( options ) {
      console.log("SELECTA INIT",options);  
    },
    namespace: "selecta",
    initialState: "uninitialized",
    states:{
      uninitialized: {
        _onEnter: function() {
          console.log("ENTER UNINTIALIZED");
          
          //remove child if already present
          selected.removeChild(r.rect);

          //reset all internal values
          r.rect = null;
          r.area = null;
          r.anchor = null;
          selected.x=0;
          selected.y=0;
          selected.width=0;
          selected.height=0;

          //make sure all events related to selection are off
          renderer.plugins.interaction.off('mousedown').off("mousemove").off("mouseup");
        },
        _onExit: function() {
          console.log("EXIT UNINTIALIZED");
          //any initializing options could go here
        }
      },
      unselected: {
        _onEnter: function() {
          console.log("ENTER UNSELECTD");
          // add mouse events for unselected state
          renderer.plugins.interaction.on('mousedown', function(ev) {
            if(!bubling.down){
              bubling.down=true;
              r.anchor = ev.data.getLocalPosition(stage);
              r.area = r.anchor;
              r.draw();
              selected.addChild(r.rect);

              renderer.plugins.interaction.on('mousemove', function(ev) {
                selected.removeChild(r.rect)
                var local = ev.data.getLocalPosition(selected);
                r.area = {x:r.anchor.x,y:r.anchor.y,width:local.x - r.anchor.x,height:local.y-r.anchor.y};
                r.draw();
                selected.addChild(r.rect);
              });  
            }
          });

          renderer.plugins.interaction.on('mouseup', function(ev) {
            if(!bubling.up){
              bubling.up=true;
              var selectedElements = [];
              renderer.plugins.interaction.off("mousemove");
              
              var hitArea = r.calculateHitArea(ev);
              for (var i = stage.children.length - 1; i >= 0; i--) {
                if (utils.hitTestRectangle(stage.children[i],hitArea)) {
                  if(stage.children[i]!==selected)
                    selectedElements.push(stage.children[i]); //addChild removes from stage
                }
              }
              //keep unselected or change to selected state 
              if(!selectedElements.length){
                selected.removeChild(r.rect);
              } else {
                r.setState("selected",selectedElements);
              }
            }
          });
        },
        _onExit: function() {
          console.log("EXIT UNSELECTD");
          // remove events for unselected state
          renderer.plugins.interaction.off('mousedown').off("mousemove").off("mouseup");
        }
      },
      selected:{
        _onEnter: function(elements) {
          console.log("ENTER SELECTD");
          // add elements to selected
          for (var i = elements.length - 1; i >= 0; i--) {
            selected.addChild(elements[i]);
          }
          // r.rect must have same bounds then elements
          selected.removeChild(r.rect)
          r.area = selected.getLocalBounds();
          r.draw();
          selected.addChildAt(r.rect,0);
          // add mouse event for selected state
          renderer.plugins.interaction.on('mouseup', function(){
            if(!bubling.up){
              bubling.up=true;
              r.setState("unselected");
            }
          });
        },
        _onExit: function() {
          console.log("EXIT SELECTD");
          // remove r.rect from selected
          selected.removeChild(r.rect);
          // any children selected should return to the stage, NO CONTAINER RECURSION?
          for (var i = selected.children.length - 1; i >= 0; i--) {
            selected.children[i].x += selected.x;
            selected.children[i].y += selected.y;
            stage.addChild(selected.children[i]);
          }
          // remove events for selected state
          renderer.plugins.interaction.off('mousedown').off("mousemove").off("mouseup");
        }
      }
    },
    goTo: function(state,data){
      this.transition(state,data);
    }
  });

  return {
    selected:selected,
    start:function(){
      r.setState("unselected");
    },
    stop:function(){
      r.setState("uninitialized");
    },
    delete:function(){
      selected.removeChildren();
      r.setState("uninitialized");
    }
  }
};
//export Selecta;