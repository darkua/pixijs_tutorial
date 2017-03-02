 
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
        DisplayGroup = PIXI.DisplayGroup,
        DisplayList  = PIXI.DisplayList;

    //Create a Pixi stage and renderer and add the
    //renderer.view to the DOM

    //GLOBALS
    var canvas = document.getElementById("canvas_spc"),
        stage = new Container(),
        renderer = autoDetectRenderer(256, 256,{view:canvas}),
        bubling = {
          down:false,
          up:false
        };

    renderer.backgroundColor = 0x061639;
    renderer.view.style.position = "absolute";
    renderer.view.style.display = "block";
    renderer.autoResize = true;
    renderer.resize(window.innerWidth, window.innerHeight);

    //no right click menu on canvas, just for testing
    $('body').on('contextmenu', '#canvas_spc', function(e){ return false; });

    //LAYERS
    stage.displayList = new DisplayList();
    var stageLayer = new DisplayGroup(0, true);
    var dragLayer = new DisplayGroup(1000, false);


    var PixiObject = function(options){

      //gouping capabilities on objects
      if(options.type === "group"){
        this.sprite = new Container();  
      } else {
        //images needed to be loaded on resources before starting creating object
        this.sprite = new Sprite(resources[options.image].texture);
        this.sprite.anchor.set(0.5);  
      }

      this.sprite.interactive=true;
      this.sprite.buttonMode=true;
      this.sprite.displayGroup=options.layer;

      this.container = options.container;

      var onDragStart = function(event) {
        console.log("start drag!!");
        event.stopPropagation(); //only works with parents
        bubling.down = true;
        this.data = event.data;
        this.oldGroup = this.displayGroup;
        this.displayGroup = dragLayer;
        this.defaultCursor="move";
        this.alpha=0.7;
        this.dragPoint = event.data.getLocalPosition(this.parent);
        this.dragPoint.x -= this.x;
        this.dragPoint.y -= this.y;
        this.on('mousemove', onDragMove).on('touchmove', onDragMove);
      };

      var onDragEnd = function (event) {
        event.stopPropagation();
        bubling.up=true;
        this.off('mousemove').off('touchmove');
        this.displayGroup = this.oldGroup;
        this.alpha=1;
        this.data = null;
      };

      var onDragMove = function (event) {
        event.stopPropagation();
        var newPosition = this.data.getLocalPosition(this.parent);
        var x = newPosition.x - this.dragPoint.x;
        var y = newPosition.y - this.dragPoint.y;
        console.log('element moving',x,y);
        this.x = x;
        this.y = y;
      };

      this.subscribe = function(){
        this.sprite.on('mousedown', onDragStart)
            .on('touchstart', onDragStart)
            .on('mouseup', onDragEnd)
            .on('mouseupoutside',onDragEnd)
            .on('touchend', onDragEnd)
            .on('touchendoutside', onDragEnd);
      };
      
      this.unsubscribe = function(){
        this.sprite.off('mousedown')
          .off('touchstart')
          .off('mouseup')
          .off('mouseupoutside')
          .off('touchend')
          .off('touchendoutside');
      };

      this.add = function(x,y){
        this.container.addChild(this.sprite);
        this.sprite.position.set(x, y);
        this.subscribe();
      };

      this.remove = function(){
        this.unsubscribe();
        this.stage.removeChild(this.sprite);
      }
    };

    //LOAD ALL SPRITES REQUIRED AND RUN SETUP!
    loader
      .add("cat.png")
      .load(setup);
    
    function gameLoop() {
      requestAnimationFrame(gameLoop);
      play();
      renderer.render(stage);
    }
    function play() {
      //anything that requires animation!
      // if(selected.children){
      //   selected.x += selected.vx;
      //   selected.y += selected.vy  
      // }
    }

    function setup() {
      //pan and zoom
      Pan.start({'canvas':canvas,stage:stage,bubling:bubling});
      Zoom.start({'canvas':canvas,stage:stage});

      //create the a froup container
      var selectionGroup = new PixiObject({type:"group",container:stage,layer:dragLayer});
      selectionGroup.add();
      //use group container for selection tool
      var s = new Selecta({selected:selectionGroup.sprite,stage:stage});
      
      //keyboards shortcuts for selection
      var shift = utils.keyboard(16);
      shift.press = s.start;
      shift.release = s.stop;

      //add object to stage on right click
      var cat = new PixiObject({container:stage,image:"cat.png",layer:stageLayer});
      console.log(cat)
      cat.add(300,300);
      
      renderer.plugins.interaction.on('rightdown', function(ev) {
          var local = ev.data.getLocalPosition(stage);
          var cat = new PixiObject({container:stage,image:"cat.png",layer:stageLayer});
          cat.add(local.x,local.y);
      });

      //ZONES ARE GROUPS WITH DRAG AND DROP FUNCTIONALITY
      // -> DRAG AND DROP, ONLY WAY TO ADD/REMOVE ELEMENTS TO ZONE
      // -> DELETE ZONE, DELETE ALL

      //keyboard handlers
      // addKeyboard();
      
      //loop it!
      gameLoop();

    }
    
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
