// create an new instance of a pixi stage
var stage = new PIXI.Stage(0x66FF99);
// create a renderer instance
var renderer = PIXI.autoDetectRenderer(400, 300);
// create a manager instance, passing stage and renderer.view
var manager = new PIXI.InteractionManager(stage, renderer.view);

stage
    .on('click', function (event) {
        console.log(event.type, event.target); // 'click', PIXI.DisplayObject {}
    });
    .on('start', function (event) {
        console.log(event.type, event.target); // 'start', PIXI.DisplayObject {}
    });
    .on('move', function (event) {
        console.log(event.type, event.target); // 'move', PIXI.DisplayObject {}
    });
    .on('end', function (event) {
        console.log(event.type, event.target); // 'end', PIXI.DisplayObject {}
    });
    .on('cancel', function (event) {
        console.log(event.type, event.target); // 'cancel', PIXI.DisplayObject {}
    });

// create a new Sprite
var bunny = new PIXI.Sprite(PIXI.Texture.fromImage("bunny.png"));
stage.addChild(bunny);
bunny.on('click', function(event) {
    console.log(event.type, event.target); // 'click', PIXI.Sprite {}
});

/**
 * Check for support, this may be replaced by Modernizr
 */
var hasPointer = window.navigator.msPointerEnabled;
var hasTouch = 'ontouchstart' in renderer.view;

/**
 * implements EventListener Interface (DOM Events Level 3)
 */
var DOMEventListener = {
    /**
     * Defaults to mouse events
     */
    START  : hasPointer ? 'MSPointerDown' : hasTouch ? 'touchstart' : 'mousedown',
    MOVE   : hasPointer ? 'MSPointerMove' : hasTouch ? 'touchmove': 'mousemove',
    END    : hasPointer ? 'MSPointerUp' : hasTouch ? 'touchend' : 'mouseup',
    CANCEL : hasPointer ? 'MSPointerOut' : hasTouch ? 'touchcancel' : 'mouseout',
    /**
     * This could also be done with...
     *
     * interactionFactory: hasPointer ? PIXI.Interaction.fromPointerEvent :
     *     hasTouch ? PIXI.Interaction.fromTouchEvent : PIXI.Interaction.fromMouseEvent,
     */
    interactionFactory: PIXI.Interaction.autoDetectEvent,
    /**
     * Implement the EventListener Interface
     */
    handleEvent: function (event) {
        switch (event.type) {

        case this.START:
            event.preventDefault();
            window.addEventListener(this.MOVE, this);
            window.addEventListener(this.END, this);
            window.addEventListener(this.CANCEL, this);
            manager.handleStart(this.interactionFactory(event));
            break;

        case this.MOVE:
            manager.handleMove(this.interactionFactory(event));
            break;

        case this.END:
        case this.CANCEL:
            window.removeEventListener(this.MOVE, this);
            window.removeEventListener(this.END, this);
            window.removeEventListener(this.CANCEL, this);

            // If the target is not the view, it is considered a cancel
            if (event.type === this.END && event.target === renderer.view) {
                manager.handleEnd(this.interactionFactory(event));
            } else {
                manager.handleCancel(this.interactionFactory(event));
            }
            break;
        }
    }
}

// Add the listener to the renderer.view
renderer.view.addEventListener(DOMEventListener.START, DOMEventListener);