// Define namespace
var APP = APP || {};

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var intersectPlane; // Plane of intersect (= at myPaddle's z) for pointer events
var intersectPoint = new THREE.Vector3();
var intersectOffset = new THREE.Vector3();
var draggingPaddle = false;

APP.Input = function(renderer, camera, myPaddle) {
  this.pointerDown = function(location) {
    if (!APP.Model.gameRunning) {
      return;
    }

    // Transform touch point coordinates into normalized device coordinates [-1,1]
    mouse.x = (location.x / window.innerWidth) * 2 - 1;
    mouse.y = -(location.y / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, this.camera);

    var intersects = raycaster.intersectObjects([myPaddle]);
    if (intersects.length > 0) {
      draggingPaddle = true;

      // Create the intersection plane to match the paddle's plane
      intersectPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1),
        -this.myPaddle.position.z);

      // Calculate the offset (distance) from touch point (or, more accurately,
      // the projected point on the 'screen' plane) to paddle origin
      if (raycaster.ray.intersectPlane(intersectPlane, intersectPoint)) {
        intersectOffset.copy(intersectPoint).sub(this.myPaddle.position);
      }
    }
  };

  this.pointerMoved = function(location) {
    if (!APP.Model.gameRunning) {
      return;
    }

    if (draggingPaddle) {
      // Transform touch point coordinates into normalized device coordinates [-1,1]
      mouse.x = (location.x / window.innerWidth) * 2 - 1;
      mouse.y = -(location.y / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);

      if (raycaster.ray.intersectPlane(intersectPlane, intersectPoint)) {
        this.myPaddle.moveTo(intersectPoint.sub(intersectOffset), environment);
      }
    }
  };

  this.pointerUp = function() {
    draggingPaddle = false;
  };

  /**
   * Calls event.preventDefault() unless we are handling our text input..
   *
   * @param event
   */
  this.processEvent = function(event) {
    var elementId = (event.target || event.srcElement).id;
    if (elementId !== 'nickname-input') { // TODO This hacky or what! do we have another way?
      event.preventDefault();
    }
  };

  this.onMouseMove = function(event) {
    event.preventDefault();

    this.pointerMoved({x: event.clientX, y: event.clientY});
  };

  this.onMouseDown = function(event) {
    this.processEvent(event);

    this.pointerDown({x: event.clientX, y: event.clientY});
  };

  this.onMouseUp = function(event) {
    this.pointerUp();
  };

  function touchForId(touches, touchId) {
    for (var i = 0; i < touches.length; i++) {
      if (touches[i].identifier === touchId) {
        return touches[i];
      }
    }
  }

  this.onTouchStart = function(event) {
    this.processEvent(event);

    if (this.touchId === null) {
      var touch = event.originalEvent.touches[0];
      this.touchId = touch.identifier;
      this.pointerDown({x: touch.pageX, y: touch.pageY});
    }
  };

  this.onTouchMove = function(event) {
    event.preventDefault();

    if (this.touchId !== null) {
      var touch = touchForId(event.originalEvent.touches, this.touchId);
      if (touch) {
        this.pointerMoved({x: touch.pageX, y: touch.pageY});
      }
    }
  };

  this.onTouchEnd = function(event) {
    this.processEvent(event);

    if (this.touchId !== null) {
      var touch = touchForId(event.originalEvent.touches, this.touchId);
      if (!touch) {
        this.touchId = null;
        this.pointerUp();
      }
    }
  };

  this.camera = camera;
  this.myPaddle = myPaddle;
  this.touchId = null;

  var inputElement = $('#full-screen');
  inputElement.mousedown(this.onMouseDown.bind(this));
  inputElement.mouseup(this.onMouseUp.bind(this));
  inputElement.mouseout(this.onMouseUp.bind(this));
  inputElement.mousemove(this.onMouseMove.bind(this));
  inputElement.bind('touchstart', this.onTouchStart.bind(this));
  inputElement.bind('touchmove', this.onTouchMove.bind(this));
  inputElement.bind('touchend', this.onTouchEnd.bind(this));
  inputElement.bind('touchcancel', this.onTouchEnd.bind(this));
};

APP.Input.constructor = APP.Input;
