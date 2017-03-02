//PAN and ZOOM

var Pan = {
  status:false,
  options:null,
  canvas : null,
  toggle:function(){
    (this.status)?this.stop():this.start(this.options);
  },
  start:function(options){
    this.options=options;
    var lastPos;
    var canvas = options.canvas;
    var stage = options.stage;
    var bubling = options.bubling;

    $(canvas).on("mousedown",function(e) {
      if(!bubling.down){
        lastPos = {x:e.offsetX,y:e.offsetY};
        $(canvas).on("mousemove",function(e){
          stage.x += (e.offsetX-lastPos.x);
          stage.y += (e.offsetY-lastPos.y);  
          lastPos = {x:e.offsetX,y:e.offsetY};
          console.log("canvasMOVE");
        })
      }
      //surface set bubling back to false!
      bubling.down=false;
    }).on("mouseup",function(e) {
      $(canvas).off("mousemove");
      //surface set bubling back to false!
      bubling.up=false;
    });
    this.status=true;
    this.canvas=canvas;
  },
  stop:function(){
    $(this.canvas)
    .off("mousedown")
    .off("mouseup")
    .off("mousemove")
    this.status=false;
  }
};

var Zoom = {
  status:false,
  canvas:null,
  toggle:function(){
    (this.status)?this.stop():this.start();
  },
  start:function(options){
    this.canvas = options.canvas;
    var stage = options.stage;
    function zoom(s,x,y){
        s = s > 0 ? 1.05 : 0.95;
        
        var worldPos = {x: (x - stage.x) / stage.scale.x, y: (y - stage.y)/stage.scale.y};
        var newScale = {x: stage.scale.x * s, y: stage.scale.y * s};
        var newScreenPos = {x: (worldPos.x ) * newScale.x + stage.x, y: (worldPos.y) * newScale.y + stage.y};
        //prevent infinite
        
        if(newScale.x > 0.1 && newScale.x < 10){
          stage.x -= (newScreenPos.x-x) ;
          stage.y -= (newScreenPos.y-y) ;
          stage.scale.x = newScale.x;
          stage.scale.y = newScale.y;
        }
    };
    addWheelListener(this.canvas, function (e) {
      zoom(e.deltaY, e.offsetX, e.offsetY)
    });
    this.status = true;
  },
  stop:function(){
    $(this.canvas).off("wheel");
    this.status = false;
  }
};