 
  var type = "WebGL"
    if(!PIXI.utils.isWebGLSupported()){
      type = "canvas"
    }
    PIXI.utils.sayHello(type)
    
    var Container = PIXI.Container,
        ParticleContainer = PIXI.particles.ParticleContainer,
        autoDetectRenderer = PIXI.autoDetectRenderer,
        loader = PIXI.loader,
        resources = PIXI.loader.resources,
        Sprite = PIXI.Sprite,
        Graphics = PIXI.Graphics,
        DisplayGroup = PIXI.DisplayGroup;

    //Create a Pixi stage and renderer and add the 
    //renderer.view to the DOM
    var canvasDOM = document.getElementById("stage");
    var stage = new Container(),
        renderer = autoDetectRenderer(256, 256,{view:canvasDOM});
    
    renderer.backgroundColor = 0x061639;
    renderer.view.style.position = "absolute";
    renderer.view.style.display = "block";
    renderer.autoResize = true;
    renderer.resize(window.innerWidth, window.innerHeight);

    //selection on top of it
    $(document.body).append("<div style='z-index:1000;position:absolute; display:none; border: 1px dashed white' id='tpSelectBox'></div>");
    //no right click menu on canvas
    $('body').on('contextmenu', '#stage', function(e){ return false; });

    //zoom function
    function zoom(s,x,y){
        s = s > 0 ? 1.05 : 0.95;
        
        var worldPos = {x: (x - stage.x) / stage.scale.x, y: (y - stage.y)/stage.scale.y};
        var newScale = {x: stage.scale.x * s, y: stage.scale.y * s};
        var newScreenPos = {x: (worldPos.x ) * newScale.x + stage.x, y: (worldPos.y) * newScale.y + stage.y};
        //prevent infinite
        console.log(newScale.x)
        if(newScale.x > 0.1 && newScale.x < 10){
          stage.x -= (newScreenPos.x-x) ;
          stage.y -= (newScreenPos.y-y) ;
          stage.scale.x = newScale.x;
          stage.scale.y = newScale.y;
        }
    };
    //ZOOM_LISTENER
    addWheelListener(canvasDOM, function (e) {
        zoom(e.deltaY, e.offsetX, e.offsetY)
    });

    //important "global" for event mananaging!
    var bubling={
      down:false,
      up:false
    };

    //PAN && SELECTION LISTEN TO SAME EVENT SO CAN BE LOADED ON SAME TIME
    isPanOn=false;
    function togglePan(){
      console.log("isPanOn?",!isPanOn);
      if(isPanOn){
        removePan();
        selection.start()
      }else {
        addPan();
        selection.stop();
      }
    };

    //pan
    function addPan(){
      var lastPos;
      $(canvasDOM).on("mousedown",function(e) {
        if(!bubling.down){
          lastPos = {x:e.offsetX,y:e.offsetY};
          $(canvasDOM).on("mousemove",function(e){
            stage.x += (e.offsetX-lastPos.x);
            stage.y += (e.offsetY-lastPos.y);  
            lastPos = {x:e.offsetX,y:e.offsetY};
            console.log("canvasMOVE");
          })
        }
        //surface set bubling back to false!
        bubling.down=false;
      }).on("mouseup",function(e) {
        $(canvasDOM).off("mousemove");
        //surface set bubling back to false!
        bubling.up=false;
      });
      isPanOn=true;
    }

    function removePan(){
      $(canvasDOM)
      .off("mousedown")
      .off("mouseup")
      .off("mousemove")
      isPanOn=false;
    }
    


    //load an image and run the `setup` function when it's done
    loader
      .add("cat.png")
      .load(setup);
    


    var cat,
        mouseDownX,
        mouseDownY,
        canvasLeft,
        canvasTop,
        selectWidth,
        selectHeight,
        leftPos,
        topPos,
        selected,
        r,
        Rwidth,
        Rheight;
    
    
    
    stage.displayList = new PIXI.DisplayList();
    var stageLayer = new DisplayGroup(0, true);
    var dragLayer = new DisplayGroup(1000, false);

    //DRAG FUNCTIONS
    function onDragStart(event) {
      event.stopPropagation() //only works with parents
      bubling.down = true;
      console.log('element down',this.parent,event)
      this.data = event.data;
      this.oldGroup = this.displayGroup;
      this.displayGroup = dragLayer;
      this.defaultCursor="move"    
      
      this.alpha=0.7;
      this.dragPoint = event.data.getLocalPosition(this.parent);
      this.dragPoint.x -= this.x;
      this.dragPoint.y -= this.y;
      this.on('mousemove', onDragMove).on('touchmove', onDragMove);
    }

    function onDragEnd(event) {
      event.stopPropagation();
      bubling.up=true;
      this.off('mousemove');

      this.displayGroup = this.oldGroup;
      this.alpha=1;
      this.data = null;
    }

    function onDragMove(event) {
      event.stopPropagation()
      var newPosition = this.data.getLocalPosition(this.parent);
      var x = newPosition.x - this.dragPoint.x;
      var y = newPosition.y - this.dragPoint.y;
      console.log('element moving',x,y);
      this.x = x;
      this.y = y;
    }
    function subscribe(obj) {
        obj.on('mousedown', onDragStart)
            .on('touchstart', onDragStart)
            .on('mouseup', onDragEnd)
            .on('mouseupoutside', onDragEnd)
            .on('touchend', onDragEnd)
            .on('touchendoutside', onDragEnd);
            
    } 

    //ADD_OBJECT
    function addObject(container=stage,image="cat.png",x=0,y=0){
      //Create the `cat` sprite, add it to the stage, and render it
      var obj = new Sprite(resources[image].texture);
      obj.anchor.set(0.5);
      obj.position.set(x, y)
      obj.interactive=true;
      obj.buttonMode=true;
      obj.displayGroup=stageLayer;

      subscribe(obj); // add events
      container.addChild(obj);
      return obj
    }

    function setup() {
      //Selection
      selected = new Container();
      selected.interactive=true;
      selected.buttonMode=true;
      selected.vx = 0;
      selected.vy = 0;
      
      addObject();
      addKeyboard();
      // addSelection();
      addPan();
      state = play;
      gameLoop();

      subscribe(selected)
      // addObject(selected,"cat.png",100,100)
      stage.addChild(selected)

      

      function hitTestRectangle(r1, r2) {

        //Define the variables we'll need to calculate
        var hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

        //hit will determine whether there's a collision
        hit = false;

        //Find the center points of each sprite
        r1.centerX = r1.x + r1.width / 2;
        r1.centerY = r1.y + r1.height / 2;
        r2.centerX = r2.x + r2.width / 2;
        r2.centerY = r2.y + r2.height / 2;

        //Find the half-widths and half-heights of each sprite
        r1.halfWidth = r1.width / 2;
        r1.halfHeight = r1.height / 2;
        r2.halfWidth = r2.width / 2;
        r2.halfHeight = r2.height / 2;

        //Calculate the distance vector between the sprites
        vx = r1.centerX - r2.centerX;
        vy = r1.centerY - r2.centerY;

        //Figure out the combined half-widths and half-heights
        combinedHalfWidths = r1.halfWidth + r2.halfWidth;
        combinedHalfHeights = r1.halfHeight + r2.halfHeight;

        //Check for a collision on the x axis
        if (Math.abs(vx) < combinedHalfWidths) {

          //A collision might be occuring. Check for a collision on the y axis
          if (Math.abs(vy) < combinedHalfHeights) {

            //There's definitely a collision happening
            hit = true;
          } else {

            //There's no collision on the y axis
            hit = false;
          }
        } else {

          //There's no collision on the x axis
          hit = false;
        }

        //`hit` will be either `true` or `false`
        return hit;
      };

      //ZONES ARE GROUPS WITH DRAG AND DROP FUNCTIONALITY
      // -> DRAG AND DROP, ONLY WAY TO ADD/REMOVE ELEMENTS TO ZONE
      // -> DELETE ZONE, DELETE ALL


      //SELECTION ( ONLY ONE LEVEL SELECTION ON STAGE!)
      var Selecta = function(){
        
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
            console.log("selection current state:",state);
            fsm.goTo(state,data)
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
                //reset all internal values
                r.rect = null;
                r.area = null;
                r.anchor = null;
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
                  console.log('up unselected?')
                  if(!bubling.up){
                    bubling.up=true;
                    var selectedElements = [];
                    renderer.plugins.interaction.off("mousemove");
                    for (var i = stage.children.length - 1; i >= 0; i--) {
                      if (hitTestRectangle(stage.children[i],r.area)) {
                        if(stage.children[i]!==selected)
                          selectedElements.push(stage.children[i]) //addChild removes from stage
                      }
                    }
                    //keep unselected or change to selected state 
                    if(!selectedElements.length){
                      selected.removeChild(r.rect)
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
                console.log("elements",elements);
                for (var i = elements.length - 1; i >= 0; i--) {
                  selected.addChild(elements[i])
                }
                

                // r.rect must have same bounds then elements
                selected.removeChild(r.rect)
                r.area = selected.getBounds();
                r.draw();
                selected.addChild(r.rect);
                // add mouse event for selected state
                renderer.plugins.interaction.on('mouseup', function(){
                  if(!bubling.up){
                    bubling.down=true;
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
                  stage.addChild(selected.children[i]);
                }
                console.log("stage",stage.children);
                console.log("selected",selected.children);
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
          start:function(){
            r.setState("unselected");
          },
          stop:function(){
            r.setState("uninitialized");
          }
        }
      };
      var s = new Selecta();
      s.start();

    }
    var selection;
    // function addSelection(){
    //   //state machine to load and unload current mouse event!!!!
    //   selection = new machina.Fsm( {
    //     initialize: function( options ) {
    //       console.log("MOUSE MANAGER ON",options);  
    //     },
    //     namespace: "mouse-manager",
    //     initialState: "uninitialized",
    //     actions:{
    //       clearSelectBox: function(){
    //         // mouseDownX = null;
    //         // mouseDownY = null;
    //         // leftPos = null;
    //         // topPos = null;
    //         // selectWidth = null;
    //         // selectHeight = null;
    //         // $("#tpSelectBox").hide();
    //         // $("#tpSelectBox").css({"width":0, "height":0});
    //       },
    //       addSelectBox : function(ev){
    //         // ev.stopPropagation();
    //         // console.log("select box",ev);
    //         // mouseDownX = ev.data.global.x;
    //         // mouseDownY = ev.data.global.y;
    //         // canvasLeft = $(renderer.view).position().left;
    //         // canvasTop = $(renderer.view).position().top;
    //         // $("#tpSelectBox").css({left:mouseDownX+canvasLeft, top:mouseDownY+canvasTop}).show();
            
    //         var local = ev.data.getLocalPosition(stage);
    //         console.log("local", local);
    //         leftPos = local.x
    //         topPos = local.y;
    //         r = this.actions.drawHitArea({x:leftPos,y:topPos,width:0,height:0});
    //         stage.addChild(r);
    //         r.x = leftPos;
    //         r.y = topPos;
    //         console.log('pos',r.position)
    //         renderer.plugins.interaction.on('mousemove', this.actions.drawSelectBox);
    //       },
    //       drawSelectBox : function(ev){

    //         ev.stopPropagation();
    //         var x = ev.data.global.x;
    //         var y = ev.data.global.y;
    //         console.log("select",x,y);
    //         selectWidth = Math.abs(x - mouseDownX);
    //         selectHeight = Math.abs(y - mouseDownY);
    //         var minX = Math.min(ev.data.global.x, mouseDownX);
    //         var minY = Math.min(ev.data.global.y, mouseDownY);
    //         leftPos = minX+canvasLeft;
    //         topPos = minY+canvasTop;
    //         var posCss = {
    //               "left":leftPos, 
    //               "top":topPos,
    //               "width":selectWidth,
    //                "height":selectHeight
    //          };
    //         //  $("#tpSelectBox").css(posCss);
    //         var local = ev.data.getLocalPosition(stage);
    //         console.log("local_m", local);
    //         Rwidth = local.x-leftPos;
    //         Rheight = local.y-topPos;
            
    //       },
    //       transitionToSelect : function(ev){
    //         renderer.plugins.interaction.off('mousemove', this.actions.drawSelectBox);
    //         // var rect = {x:leftPos,y:topPos,width:selectWidth,height:selectHeight};
    //         // stage.removeChild(r);
    //         var rect = {x:r.x,y:r.y,width:r.width,height:r.height};
    //         this.transition("selected",rect);
    //       },
    //       drawHitArea:function(rect){
    //           var rectangle = new Graphics();
    //           rectangle.lineStyle(1, 0xFF3300, 1);
    //           rectangle.drawRect(rect.x, rect.y, rect.width, rect.height);
    //           return rectangle;
    //       },

    //       handleSelection:function(rect){

    //         //helping functions
    //         function hitTestRectangle(r1, r2) {

    //           //Define the variables we'll need to calculate
    //           var hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

    //           //hit will determine whether there's a collision
    //           hit = false;

    //           //Find the center points of each sprite
    //           r1.centerX = r1.x + r1.width / 2;
    //           r1.centerY = r1.y + r1.height / 2;
    //           r2.centerX = r2.x + r2.width / 2;
    //           r2.centerY = r2.y + r2.height / 2;

    //           //Find the half-widths and half-heights of each sprite
    //           r1.halfWidth = r1.width / 2;
    //           r1.halfHeight = r1.height / 2;
    //           r2.halfWidth = r2.width / 2;
    //           r2.halfHeight = r2.height / 2;

    //           //Calculate the distance vector between the sprites
    //           vx = r1.centerX - r2.centerX;
    //           vy = r1.centerY - r2.centerY;

    //           //Figure out the combined half-widths and half-heights
    //           combinedHalfWidths = r1.halfWidth + r2.halfWidth;
    //           combinedHalfHeights = r1.halfHeight + r2.halfHeight;

    //           //Check for a collision on the x axis
    //           if (Math.abs(vx) < combinedHalfWidths) {

    //             //A collision might be occuring. Check for a collision on the y axis
    //             if (Math.abs(vy) < combinedHalfHeights) {

    //               //There's definitely a collision happening
    //               hit = true;
    //             } else {

    //               //There's no collision on the y axis
    //               hit = false;
    //             }
    //           } else {

    //             //There's no collision on the x axis
    //             hit = false;
    //           }

    //           //`hit` will be either `true` or `false`
    //           return hit;
    //         };

    //         function drawHitArea(rect){
    //           var rectangle = new Graphics();
    //           rectangle.lineStyle(1, 0xFF3300, 1);
    //           rectangle.drawRect(rect.x, rect.y, rect.width, rect.height);
    //           return rectangle;
    //         }
    //         function drawSelection(rect){
    //           var rectangle = new Graphics();
    //           rectangle.beginFill(1,0.5);
    //           rectangle.lineStyle(1, 0xFF3300, 1);
    //           rectangle.endFill();
    //           rectangle.drawRect(rect.x, rect.y, rect.width, rect.height);
    //           return rectangle;
    //         }

    //         var hitArea = drawHitArea(rect);
    //         console.log(hitArea)
    //         stage.addChild(hitArea);
    //         console.log(stage.children)
    //         // var children = stage.children;
    //         // for (var i = children.length - 1; i >= 0; i--) {
    //         //   if (hitTestRectangle(children[i],hitArea)) {
    //         //     selected.addChild(children[i])
    //         //   }
    //         // }
    //         //user selected something
    //         // if(selected.children.length){
    //         //   var rectangle = drawSelection(selected.getBounds());
    //         //   selected.addChild(rectangle)
    //         //   stage.addChild(selected)  
    //         // }
    //       },handleUnselection:function(){
    //         console.log('unselecting')
    //         var children = selected.children;
    //         children.pop()
    //         for (var i = children.length - 1; i >= 0; i--) {
    //           selected.removeChild(children[i])
    //           stage.addChild(children[i]);
    //         }
    //         this.transition("unselected");
    //       },
    //       unsubscribe : function(){
    //         selected
    //           .off("mousemove")
    //           .off("mouseup")
    //           .off("mousemove");

    //         renderer.plugins.interaction
    //           .off("mousedown")
    //           .off("mouseup")
    //       }

    //     },
    //     states: {
    //       uninitialized: {
    //         _onEnter: function() {
    //           console.log("ENTER UNITIALIZED");
    //         },
    //         _onExit:function(){
    //           console.log("EXIT UNITIALIZED");
    //         },
    //       },
    //       unselected: {
    //         _onEnter: function() {
    //           console.log("ENTER UNSELECTD");
    //           this.actions.clearSelectBox();
    //         },
    //         _onExit: function() {
    //           console.log("EXIT UNSELECTD");
    //           this.actions.clearSelectBox();
    //         }
    //       },
    //       drawSelection:{
    //         onEnter:function(area){

    //         },
    //         onExit:function(){

    //         }
    //       },
    //       selected: {
    //         _onEnter: function(area) {
    //           console.log("ENTER SELECTED",area);

    //           this.actions.handleSelection(area);
    //           // if(selected.children.length){
    //           //   console.log(selected.)
    //           // }else{
                
    //           // }
    //         },
    //         _onExit: function() {
    //           console.log("EXIT SELECTED");
    //         }
    //       },
    //     },
    //     start : function(){
    //       this.transition("unselected");
    //     },
    //     stop: function(){
    //       this.transition("uninitialized");
    //     }
    //   });
    // };


    //Particle container can only have one sprite object!!!!
    // for (var i = 100 - 1; i >= 0; i--) {
    //   var rectangle = new Graphics();
    //   rectangle.lineStyle(1, 0xFF3300, 1);
    //   rectangle.drawRect(0, 0, i, i);
    //   var img = new Sprite(renderer.generateTexture(rectangle))
    //   img.x = i;
    //   img.y = i;
    //   selected.addChild(img)
    // }
  

    function keyboard(keyCode) {
      var key = {};
      key.code = keyCode;
      key.isDown = false;
      key.isUp = true;
      key.press = undefined;
      key.release = undefined;
      //The `downHandler`
      key.downHandler = function(event) {
        if (event.keyCode === key.code) {
          if (key.isUp && key.press) key.press();
          key.isDown = true;
          key.isUp = false;
        }
        event.preventDefault();
      };

      //The `upHandler`
      key.upHandler = function(event) {
        if (event.keyCode === key.code) {
          if (key.isDown && key.release) key.release();
          key.isDown = false;
          key.isUp = true;
        }
        event.preventDefault();
      };

      //Attach event listeners
      window.addEventListener(
        "keydown", key.downHandler.bind(key), false
      );
      window.addEventListener(
        "keyup", key.upHandler.bind(key), false
      );
      return key;
    }

    function addKeyboard(){
      //Capture the keyboard arrow keys
      var left = keyboard(37),
          up = keyboard(38),
          right = keyboard(39),
          down = keyboard(40),
          shift = keyboard(16);

      //Left arrow key `press` method
      left.press = function() {

        //Change the cat's velocity when the key is pressed
        selected.vx = -5;
        selected.vy = 0;
      };

      //Left arrow key `release` method
      left.release = function() {

        //If the left arrow has been released, and the right arrow isn't down,
        //and the cat isn't moving vertically:
        //Stop the cat
        if (!right.isDown && selected.vy === 0) {
          selected.vx = 0;
        }
      };

      //Up
      up.press = function() {
        selected.vy = -5;
        selected.vx = 0;
      };
      up.release = function() {
        if (!down.isDown && selected.vx === 0) {
          selected.vy = 0;
        }
      };

      //Right
      right.press = function() {
        selected.vx = 5;
        selected.vy = 0;
      };
      right.release = function() {
        if (!left.isDown && selected.vy === 0) {
          selected.vx = 0;
        }
      };

      //Down
      down.press = function() {
        selected.vy = 5;
        selected.vx = 0;
      };
      down.release = function() {
        if (!up.isDown && selected.vx === 0) {
          selected.vy = 0;
        }
      };

      //Down
      shift.press = function() {
        selection.start();
      };
      shift.release = function() {
        selection.stop();
      };

    }

    function gameLoop() {
      requestAnimationFrame(gameLoop);
      state();
      renderer.render(stage);
    }
    function play() {
      if(selected.children){
        selected.x += selected.vx;
        selected.y += selected.vy  
      }
      if(r){
        r.width=Rwidth;
        r.height =Rheight;
      }
    }


    // //global interaction manager events
    // var bubling=false; // to prevent bubling in between elements/"renderer glass"/canvas
    // //detect if there was a event before or not
    // renderer.plugins.interaction.on('mousedown', function(ev) {
    //   if(!bubling){
    //     //selection
    //     if(selection && selection.state !== "uninitialized"){
    //       bubling=true;
    //       var point = ev.data.getLocalPosition(stage);
    //       addSelectBox(point);
    //       this.on("mousemove",function(ev){
    //         var local = ev.data.getLocalPosition(stage);

    //         drawSelectBox({});
    //       })
    //     }
    //   }
    // });

    // renderer.plugins.interaction.on('mouseup', function(ev) {
    //   bubling=false;
    //   this.off("mousemove");
    // })

    renderer.plugins.interaction.on('rightdown', function(ev) {
        var local = ev.data.getLocalPosition(stage);
        addObject(stage,"cat.png",local.x,local.y);
    });
