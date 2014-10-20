( function( global, doc, $, ns ) {
  'use strict';
  ns = ns || {};  

  function EventDispatcher() {
    this._events = {};
  }

  EventDispatcher.prototype.checkEvent = function( eventName ) {
    return !!this._events[ eventName ];
  };

  EventDispatcher.prototype.listen = function( eventName, callback ) {
    if ( this.checkEvent(eventName) ) {
      var events = this._events[ eventName ];
      var i;
      var eventsLength = events.length;
      for ( i = 0; i < eventsLength; i++ ) {
        if ( events[ i ] === callback ) {
          return;
        }
      }
      events.push( callback );
    }
    else{
      this._events[ eventName ] = [ callback ];
    }
    return this;
  };

  EventDispatcher.prototype.removeEvent = function( eventName, callback ) {
    if ( !this.checkEvent(eventName) ) {
      return;
    }
    else{
      var events = this._events[ eventName ],
          i      = events.length,
          index;
      while ( i-- ) {
        if ( events[ i ] === callback ) {
          index = i;
        }
      }
      events.splice( index, 1 );
    }
    return this;
  };

  EventDispatcher.prototype.fire = function( eventName, opt_this ) {
    if ( !this.checkEvent(eventName) ) {
      return;
    }
    else{
      var events = this._events[ eventName ];
      var i;
      var copyEvents = $.merge( [], events );
      var copyEventsLength = copyEvents.length;
      var arg        = $.merge( [], arguments );
      arg.splice( 0, 2 );
      for ( i = 0; i < copyEventsLength; i++ ) {
        copyEvents[ i ].apply( opt_this || this, arg );
      }
    }
  };

  ns.EventDispatcher = EventDispatcher;
  global.yujitive = ns;
})( this, document, jQuery, this.yujitive );

( function( global, doc, $, ns ) {
  'use strict';
  ns = ns || {};  

  function Throttle( minInterval ){
    this.interval = minInterval;
    this.prevTime = 0;
    this.timer = function(){};
  }

  Throttle.prototype.exec = function( callback ){
    var now = + new Date(),
        delta = now - this.prevTime;

    clearTimeout( this.timer );
    if ( delta >= this.interval ){
      this.prevTime = now;
      callback();
    }
    else{
      this.timer = setTimeout( callback, this.interval );
    }
  };

  ns.Throttle = Throttle;
  global.yujitive = ns;
})( this, document, jQuery, this.yujitive );

( function( global, doc, $, ns, undefined ){
	'use strict';
	ns = ns || {};
  var	instance;
  var originalConstructor;

  /*-------------------------------------------
    PUBLIC
  -------------------------------------------*/
	function ResizeHandler(){
    var _this = this;

    ns.EventDispatcher.call( _this );
    _setEvent( _this );

    function _setEvent( _this ){
      var throttle = new ns.Throttle(250);
      var $wrapper = $( '#wrapper' );

      $( window ).on('load resize', function(){
        throttle.exec(function(){
          _this.fire( 'RESIZE', _this, $wrapper.width(), $wrapper.height() );
        });
      });
    }
 	}

  /*-------------------------------------------
    INHERIT
  -------------------------------------------*/
  originalConstructor = ResizeHandler.prototype.constructor;
  ResizeHandler.prototype = new ns.EventDispatcher();
  ResizeHandler.prototype.constructor = originalConstructor;

  /*-------------------------------------------
    EXPORT (singleton)
  -------------------------------------------*/
  function getInstance(){
    if ( !instance ){
      instance = new ResizeHandler();
    }
    return instance;
  }

  ns.ResizeHandler = {
    getInstance: getInstance
  };

	global.yujitive = ns;
})( this, document, jQuery, this.yujitive );

( function( global, doc, $, ns, undefined ){
	'use strict';
	ns = ns || {};
  var	instance;

  var $canvas = $( '#canvas' );
  var context;

  /*-------------------------------------------
    PUBLIC
  -------------------------------------------*/
	function CanvasManager(){
    if ( !$canvas.get( 0 ).getContext ){
      alert( 'This browser doesn\'t supoort HTML5 Canvas.');
      return;
    }
    context = $canvas.get( 0 ).getContext( '2d' );
 	}

  /*-------------------------------------------
    PROTOTYPE
  -------------------------------------------*/
  CanvasManager.prototype.resetContext = function( width, height ){
    $canvas.get( 0 ).width = width;
    $canvas.get( 0 ).height = height;
  };

  CanvasManager.prototype.clear = function( width, height ){
    context.clearRect( 0, 0, width, height );
  };

  CanvasManager.prototype.drawImage = function( obj ){
    console.log( obj.imageUrl );
    context.drawImage( obj.imageUrl, obj.posX, obj.posY,
                       obj.sizeX, obj.sizeY );
  };

  /*-------------------------------------------
    EXPORT (singleton)
  -------------------------------------------*/
  function getInstance(){
    if (!instance) {
      instance = new CanvasManager();
    }
    return instance;
  }

  ns.CanvasManager = {
    getInstance: getInstance
  };

	global.yujitive = ns;
})( this, document, jQuery, this.yujitive );

( function( global, doc, $, ns, undefined ){
	'use strict';
	ns = ns || {};

  /*-------------------------------------------
    PUBLIC
  -------------------------------------------*/
	function ObjectManager(){
    // arg should includes,
    // speedX, speedY, posX, posY, radius, imageUrl
    var arg = arguments[ 0 ];
    var img = new Image();
    img.src = arg.imageUrl;

    for ( var param in arg ){
      if ( param !== 'imageUrl' ){
        this[ param ] = arg[ param ];
      }
    }
    this.imageUrl = img;
 	}

  /*-------------------------------------------
    EXPORT
  -------------------------------------------*/
  ns.ObjectManager = ObjectManager;

	global.yujitive = ns;
})( this, document, jQuery, this.yujitive );

( function( global, doc, $, ns, undefined ){
  'use strict';
  ns = ns || {};
  var context_width = $( global ).width();
  var context_height = $( global ).height();
  var requestAnimationFrame = global.requestAnimationFrame ||
                              global.mozRequestAnimationFrame ||
                              global.webkitRequestAnimationFrame ||
                              global.msRequestAnimationFrame;
  global.requestAnimationFrame = requestAnimationFrame;

  /*-------------------------------------------
    MAIN 
  -------------------------------------------*/
  $(function() {
    var resizeHandler = ns.ResizeHandler.getInstance();
    var canvasManager = ns.CanvasManager.getInstance();
    var object        = [];
    var OBJECT_NUM    = 20;
    var SPEED_MIN     = 50;
    var SPEED_MAX     = 100;
    var SIZE_MIN      = 100;
    var SIZE_MAX      = 200;
    var IMAGE_LENGTH  = 5;
    var is_animate    = true;

    resizeHandler.listen( 'RESIZE', function( width, height ){
      context_width = width;
      context_height = height;
      canvasManager.resetContext( width, height );
    });

    $( doc ).on( 'keypress', function( event ) {
      if ( ( event.which && event.which === 13 ) || 
           ( event.keyCode && event.keyCode === 13 ) ) { // enter key
             is_animate = !is_animate;
      }
    });



    // INIT
    for ( var object_i = 0; object_i < OBJECT_NUM; object_i++ ){
      object[ object_i ] = new ns.ObjectManager( {
        speedX  : _random( SPEED_MIN, SPEED_MAX ),
        speedY  : _random( SPEED_MIN, SPEED_MAX ),
        posX    : _random( 0, context_width - SIZE_MAX ),
        posY    : _random( 0, context_height - SIZE_MAX ),
        sizeX : _random( SIZE_MIN, SIZE_MAX ),
        sizeY : _random( SIZE_MIN, SIZE_MAX ),
        imageUrl  : 'img/' + ( '00' +
                object_i % IMAGE_LENGTH ).slice( -2 ) + '.png'
      } );
    }
    global.requestAnimationFrame( _update );

    /*-------------------------------------------
      PRIVATE 
    -------------------------------------------*/
    function _update(){
      var _obj;

      if ( is_animate ){
        for ( object_i = 0; object_i < OBJECT_NUM; object_i++ ){
          _obj = object[ object_i ];
          _obj.posX += _obj.speedX; 
          _obj.posY += _obj.speedY; 

          // overflow check
          if ( _obj.posX + _obj.sizeX  > context_width ||
               _obj.posX < 0 ){
                 _obj.speedX *= -1;
          }
          if ( _obj.posY + _obj.sizeY  > context_height ||
               _obj.posY < 0 ){
                 _obj.speedY *= -1;
          }
        }
        _render();
      }
      global.requestAnimationFrame( _update );
    }

    function _render(){
      canvasManager.clear( context_width, context_height );
      for ( object_i = 0; object_i < OBJECT_NUM; object_i++ ){
        canvasManager.drawImage( object[ object_i ] );
      }
    }

    function _random( min, max ){
      return parseInt( Math.random() * max ) + min;
    }
  });

  global.yujitive = ns;
})( this, document, jQuery, this.yujitive );
