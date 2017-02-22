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

    

    $(document.body).append("<div style='z-index:1000;position:absolute; display:none; border: 1px dashed white' id='tpSelectBox'></div>");
    $('body').on('contextmenu', '#stage', function(e){ return false; });

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

    var lastPos = null
    
    //zoomm
    addWheelListener(canvasDOM, function (e) {
        zoom(e.deltaY, e.offsetX, e.offsetY)
    });
    
    //pan
    renderer.plugins.interaction.on("mousedown",function(e) {
      console.log('stage DOWN')
      lastPos = {x:e.offsetX,y:e.offsetY};
    }).on("mouseup",function(event) {
      console.log('stage UP')
      lastPos = null;
    }).on("mousemove",function(e){
      console.log('stage MOVE')
      if(lastPos) {
        stage.x += (e.offsetX-lastPos.x);
        stage.y += (e.offsetY-lastPos.y);  
        lastPos = {x:e.offsetX,y:e.offsetY};
      }
    }).on("addChild",function(child){
      console.log("addChild",child)
    });


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
        selected;
    
    //SELECTION
    stage.displayList = new PIXI.DisplayList();
    var stageLayer = new DisplayGroup(0, true);
    var dragLayer = new DisplayGroup(1000, false);

    // Seat
    // Row


    function addObject(container=stage,image="cat.png",x=0,y=0){
      //Create the `cat` sprite, add it to the stage, and render it
      var obj = new Sprite(resources[image].texture);
      obj.anchor.set(0.5);
      obj.position.set(x, y)
      obj.interactive=true;
      obj.buttonMode=true;
      obj.displayGroup=stageLayer;

      function onDragStart(event) {
        event.stopPropagation()
        this.data = event.data;
        this.oldGroup = this.displayGroup;
        this.displayGroup = dragLayer;
        this.defaultCursor="move"    
        
        this.alpha=0.7;
        this.dragPoint = event.data.getLocalPosition(this.parent);
        this.dragPoint.x -= this.x;
        this.dragPoint.y -= this.y;
        this.on('mousemove', onDragMove)
            .on('touchmove', onDragMove);
      }

      function onDragEnd(event) {
        event.stopPropagation()
        this.displayGroup = this.oldGroup;
        this.alpha=1;
        this.data = null;
        this.off('mousemove');
      }

      function onDragMove(event) {
        event.stopPropagation()
        var newPosition = this.data.getLocalPosition(this.parent);
        var x = newPosition.x - this.dragPoint.x;
        var y = newPosition.y - this.dragPoint.y;
        //prevent off renderer
        if( x > 0 && 
            x <= renderer.width && 
            y > 0 &&
            y <= renderer.height
          ){
            console.log('moving',x,y);
            this.x = x;
            this.y = y;
        } 
      } 
      function subscribe(obj) {
          obj.on('mousedown', onDragStart)
              .on('touchstart', onDragStart)
              .on('mouseup', onDragEnd)
              .on('mouseupoutside', onDragEnd)
              .on('touchend', onDragEnd)
              .on('touchendoutside', onDragEnd);
              
      }
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
      addSelection();
      state = play;
      gameLoop();

    }

    function addSelection(){
      //state machine to load and unload current mouse event!!!!
      var selection = new machina.Fsm( {
        initialize: function( options ) {
          console.log("MOUSE MANAGER ON",options);  
        },
        namespace: "mouse-manager",
        initialState: "uninitialized",
        actions:{
          clearSelectBox: function(){
            mouseDownX = null;
            mouseDownY = null;
            leftPos = null;
            topPos = null;
            selectWidth = null;
            selectHeight = null;
            $("#tpSelectBox").hide();
            $("#tpSelectBox").css({"width":0, "height":0});
          },
          addSelectBox : function(ev){
            mouseDownX = ev.data.global.x;
            mouseDownY = ev.data.global.y;
            canvasLeft = $(renderer.view).position().left;
            canvasTop = $(renderer.view).position().top;
            $("#tpSelectBox").css({left:mouseDownX+canvasLeft, top:mouseDownY+canvasTop}).show();
            renderer.plugins.interaction.on('mousemove', this.actions.drawSelectBox);
          },
          drawSelectBox : function(ev){
            var x = ev.data.global.x;
            var y = ev.data.global.y;
            selectWidth = Math.abs(x - mouseDownX);
            selectHeight = Math.abs(y - mouseDownY);
            var minX = Math.min(ev.data.global.x, mouseDownX);
            var minY = Math.min(ev.data.global.y, mouseDownY);
            leftPos = minX+canvasLeft;
            topPos = minY+canvasTop;
            var posCss = {
                  "left":leftPos, 
                  "top":topPos,
                  "width":selectWidth,
                   "height":selectHeight
             };
             $("#tpSelectBox").css(posCss);
          },
          transitionToSelect : function(ev){
            renderer.plugins.interaction.off('mousemove', this.actions.drawSelectBox);
            var rect = {x:leftPos,y:topPos,width:selectWidth,height:selectHeight};
            this.transition("selected",rect);
          },
          handleSelection:function(rect){

            //helping functions
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

            function drawHitArea(rect){
              var rectangle = new Graphics();
              rectangle.lineStyle(0, 0xFF3300, 0);
              rectangle.drawRect(rect.x, rect.y, rect.width, rect.height);
              return rectangle;
            }
            function drawSelection(rect){
              var rectangle = new Graphics();
              rectangle.lineStyle(1, 0xFF3300, 1);
              rectangle.drawRect(rect.x, rect.y, rect.width, rect.height);
              return rectangle;
            }

            var hitArea = drawHitArea(rect);
            var children = stage.children;
            for (var i = children.length - 1; i >= 0; i--) {
              if (hitTestRectangle(children[i],hitArea)) {
                selected.addChild(children[i])
              }
            }
            //user selected something
            if(selected.children.length){
              var rectangle = drawSelection(selected.getBounds());
              selected.addChild(rectangle)
              stage.addChild(selected)  
            }
          },handleUnselection:function(){
            console.log('unselecting')
            var children = selected.children;
            children.pop()
            // for (var i = children.length - 1; i >= 0; i--) {
            //   selected.removeChild(children[i])
            //   stage.addChild(children[i]);
            // }
            this.transition("unselected");
          },dragStart:function(event){
              renderer.plugins.interaction.off('mousedown', this.actions.handleUnselection)
              this.data = event.data;
              this.alpha = 0.5;
              this.dragging = true;
          },dragEnd:function(event){
              this.alpha = 1;

              this.dragging = false;

              // set the interaction data to null
              this.data = null;
          },dragMove:function(event){
              if (this.dragging)
              {
                  // var newPosition = this.data.getLocalPosition(this.parent);
                  this.position.x = event.data.global.x;
                  this.position.y = event.data.global.y;
              }
          }

        },
        states: {
          uninitialized: {
            "*": function() {
              this.deferUntilTransition();
              this.transition( "unselected" );
            }
          },
          unselected: {
            _onEnter: function() {
              console.log("ENTER UNSELECTD");
              this.actions.clearSelectBox();

              renderer.plugins.interaction.on('mousedown', this.actions.addSelectBox.bind(this));
              renderer.plugins.interaction.on('mouseup', this.actions.transitionToSelect.bind(this));
            },
            _onExit: function() {
              console.log("EXIT UNSELECTD");
              this.actions.clearSelectBox();
            }
                  // // If all you need to do is transition to a new state
                  // // inside an input handler, you can provide the string
                  // // name of the state in place of the input handler function.
                  // timeout: "green-interruptible",
                  // pedestrianWaiting: function() {
                  //     this.deferUntilTransition( "green-interruptible" );
                  // },  
          },
          selected: {
            _onEnter: function(area) {
              console.log("ENTER SELECTED",area);
              this.actions.handleSelection(area);
              if(selected.children.length){
                this.transition("movable");  
              }else{
                this.transition("unselected")
              }
              renderer.plugins.interaction.on('mouseup', this.actions.handleUnselection.bind(this));
            },
            _onExit: function() {
              console.log("EXIT SELECTED");
            }
          },
          movable:{
            _onEnter: function() {
              selected.defaultCursor="move"
              selected
                .on("mousedown",this.actions.dragStart.bind(this))
                .on("mouseup",this.actions.dragEnd.bind(this))
                .on("mousemove",this.actions.dragMove.bind(this))
            },
            _onExit:function(){

            }
          }
        },
        reset: function() {
          this.handle( "_reset" );
        },
        start : function(){
            this.handle("unselected");
        }
      });
      // selection.start();
    };


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
    

    function detectSelection(x,y,w,h){
      
      var area = drawSelectedArea(x,y,w,h);
      var children = stage.children;
      for (var i = children.length - 1; i >= 0; i--) {
        if (hitTestRectangle(children[i],area)) {
          selected.addChild(children[i])
        }
      }
      area = null; // clear the selection
      
      //user selected something
      if(selected.children.length){
        var rectangle = drawSelection(selected.getBounds())
        selected.addChild(rectangle)
        stage.addChild(selected)  
      }
    }

    

    

    

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
          down = keyboard(40);

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
    }
      
      




      

       renderer.plugins.interaction.on('rightdown', function(ev) {
           addObject(stage,"cat.png",ev.data.global.x,ev.data.global.y);
       });
