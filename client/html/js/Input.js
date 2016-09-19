// Define namespace
var APP = APP || {};

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var intersectPlane; // Plane of intersect (= at myPaddle's z) for pointer events
var intersectPoint = new THREE.Vector3();
var intersectOffset = new THREE.Vector3();
var draggingPaddle = false;

APP.Input = function(renderer, camera, myPaddle) {
  this.onMouseMove = function(event) {
    event.preventDefault();

    if (draggingPaddle) {
      // Transform touch point coordinates into normalized device coordinates [-1,1]
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);

      if (raycaster.ray.intersectPlane(intersectPlane, intersectPoint)) {
        this.myPaddle.moveTo(intersectPoint.sub(intersectOffset), environment);
      }
    }
  };

  this.onMouseDown = function(event) {
    console.log('mouse down');
    event.preventDefault();

    // Transform touch point coordinates into normalized device coordinates [-1,1]
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

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

  this.onMouseUp = function(event) {
    draggingPaddle = false;
  };

  this.camera = camera;
  this.myPaddle = myPaddle;

//  full-screen
  var inputElement = $('#full-screen');
  inputElement.mousedown(this.onMouseDown.bind(this));
  inputElement.mouseup(this.onMouseUp.bind(this));
  inputElement.mouseout(this.onMouseUp.bind(this));
  inputElement.mousemove(this.onMouseMove.bind(this));
};

APP.Input.constructor = APP.Input;
