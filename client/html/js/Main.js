// Define namespace
var APP = APP || {};

// Constants
var PaddleDistance = 1.7; // From the camera
var PhysicsFixedTimeStep = 1.0 / 60.0; // Seconds. Do not change.
var PhysicsMaxSubSteps = 3; // Do not change.
var PhysicsGravity = -1; // m/s^2 (-9.81 to simulate real-world)

// Threejs (graphics) scene objects
var camera, scene, renderer, environment, myPaddle, opponentPaddle, ball;

// Physics objects
var world;
var physicsLastTickTime;

// Paddle moving / raycasting
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var intersectPlane;
var intersectPoint = new THREE.Vector3();
var intersectOffset = new THREE.Vector3();
var draggingPaddle = false;

function onCollision(event) {
  console.log('Ball collision');

  if (event.body.id === myPaddle.physicsBody.id) {
    console.log('hit my paddle!', event);
    if (event.contact.bi.id == myPaddle.physicsBody.id) {
      console.log('I am bi');
    }
    if (event.contact.bj.id == myPaddle.physicsBody.id) {
      console.log('I am bj');
      //TODO should look at event.contact.rj to find local contact point
    }
  }
}

function initPhysics() {
  world = new CANNON.World();
  world.gravity.set(0, PhysicsGravity, 0);

  // Add physics bodies to the simulation
  world.addBody(ball.physicsBody);
  world.addBody(environment.physicsBody);
  world.addBody(myPaddle.physicsBody);

  // Listen to collisions between the ball and other bodies
  ball.physicsBody.addEventListener('collide', onCollision);

  //TODO remove - use for testing env physics
  ball.physicsBody.applyImpulse(new CANNON.Vec3(-0.8, 3, -2), ball.physicsBody.position);
}

function initGraphics() {
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
  myPaddle = new APP.Paddle(APP.Paddle.Type.Mine);
  myPaddle.translateZ(cameraZ - PaddleDistance);
  scene.add(myPaddle);

  // Add opponent's paddle to the other side of the environment
  opponentPaddle = new APP.Paddle(APP.Paddle.Type.Opponent);
  opponentPaddle.translateZ(-myPaddle.position.z);
  scene.add(opponentPaddle);

  // Add the ball
  ball = new APP.Ball();
  scene.add(ball);

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
      myPaddle.moveTo(intersectPoint.sub(intersectOffset), environment);
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

function updatePhysics(time) {
  if (physicsLastTickTime) {
    // Update (step) physics simulation
    var dt = (time - physicsLastTickTime) / 1000;
    world.step(PhysicsFixedTimeStep, dt, PhysicsMaxSubSteps);

    // Update ball position based on physics
    ball.onPhysicsUpdated();
  }

  physicsLastTickTime = time;
}

function animate(time) {
  // Request next frame to be drawn after this one completes
  requestAnimationFrame(animate);

  stats.begin();

  // Physics tick
  updatePhysics(time);

  // Render the visuals
  render();
  stats.end();
}

function render() {
  renderer.render(scene, camera);
}

APP.main = function() {
  // Init the scene + all needed instances
  initGraphics();

  // Init the physics
  initPhysics();

  // Start animating!
  animate();
};
