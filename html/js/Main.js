// Define namespace
var APP = APP || {};

// Constants
var PaddleDistance = 1.7; // From the camera

// Variables accessible from all the methods
var camera, scene, renderer, environment, myPaddle;

// Paddle moving / raycasting
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var intersectPlane;
var intersectPoint = new THREE.Vector3();
var intersectOffset = new THREE.Vector3();
var draggingPaddle = false;

function init() {
  scene = new THREE.Scene();

  // Create the surrounding environment (tunnel)
  environment = new APP.Environment();
  scene.add(environment);

  // Add a little bit of ambient lighting
  var ambientLight = new THREE.AmbientLight(0x444444);
  scene.add(ambientLight);

  // Our camera; place at the back of the environment
  var aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(70, aspect, 1, 1000);
  var cameraZ = (environment.Length / 2) - 0.5;
  camera.translateZ(cameraZ);
  scene.add(camera);

  // Add a point light to where our camera is
  var pointLight = new THREE.PointLight(0xFFFFFF, 1, environment.Length);
  camera.add(pointLight);

  // Add my paddle and position it somewhat in front of the camera
  myPaddle = new APP.Paddle();
  myPaddle.translateZ(cameraZ - PaddleDistance);
  scene.add(myPaddle);

  // Finally, our renderer..
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Add event listeners
  renderer.domElement.addEventListener('mousemove', onMouseMove, false);
  renderer.domElement.addEventListener('mousedown', onMouseDown, false);
  renderer.domElement.addEventListener('mouseup', onMouseUp, false);
  window.addEventListener('resize', onWindowResize, false);
}

function onMouseMove(event) {
  event.preventDefault();

  if (draggingPaddle) {
    // Transform touch point coordinates into normalized device coordinates [-1,1]
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (raycaster.ray.intersectPlane(intersectPlane, intersectPoint)) {
      myPaddle.position.copy(intersectPoint.sub(intersectOffset));
    }

    // Bound paddle movement by the walls
    var pw2 = (myPaddle.Width / 2);
    var ew2 = (environment.Width / 2);
    var ph2 = (myPaddle.Height / 2);
    var eh2 = (environment.Height / 2);

    // Left wall
    if ((myPaddle.position.x - pw2) < -ew2) {
      myPaddle.position.x = -ew2 + pw2;
    }

    // Right wall
    if ((myPaddle.position.x + pw2) > ew2) {
      myPaddle.position.x = ew2 - pw2;
    }

    // Roof
    if ((myPaddle.position.y + ph2) > eh2) {
      myPaddle.position.y = eh2 - ph2;
    }

    // Floor
    if ((myPaddle.position.y - ph2) < -eh2) {
      myPaddle.position.y = -eh2 + ph2;
    }
  }
}

function onMouseDown(event) {
  event.preventDefault();

  // Transform touch point coordinates into normalized device coordinates [-1,1]
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  var intersects = raycaster.intersectObjects([myPaddle]);
  if (intersects.length > 0) {
    draggingPaddle = true;

    // Create the intersection plane to match the paddle's plane
    intersectPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1),
      -myPaddle.position.z);

    // Calculate the offset (distance) from touch point (or, more accurately,
    // the projected point on the 'screen' plane) to paddle origin
    if (raycaster.ray.intersectPlane(intersectPlane, intersectPoint)) {
      intersectOffset.copy(intersectPoint).sub(myPaddle.position);
    }
  }
}

function onMouseUp(event) {
  draggingPaddle = false;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  // Request next frame to be drawn after this one completes
  requestAnimationFrame(animate);

//    mesh.rotation.x += 0.0006;
//    mesh.rotation.y += 0.00085;

  stats.begin();
  render();
  stats.end();
}

function render() {
  renderer.render(scene, camera);
}

APP.main = function() {
  // Init the scene + all needed instances
  init();

  // Start animating!
  animate();
};
