// Define namespace
var APP = APP || {};

APP.GameTypes = {
  SinglePlayer: 1, Duel: 2
};
APP.gameType = APP.GameTypes.SinglePlayer;

// Constants
var PaddleDistance = 1.7; // From the camera
var PhysicsFixedTimeStep = 1.0 / 60.0; // Seconds. Do not change.
var PhysicsMaxSubSteps = 3; // Do not change.
var PhysicsGravity = -0.1; // m/s^2 (-9.81 to simulate real-world)
var BallMinZSpeed = 1; // The ball must move at least this fast in z-dir
var OpponentPaddleMaxSpeed = 0.2; // m/s

// Threejs (graphics) scene objects
var camera, scene, renderer, environment, myPaddle, opponentPaddle, ball;

// Physics objects
var world;
var lastTickTime;

// Paddle moving / raycasting
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var intersectPlane; // Plane of intersect (= at myPaddle's z) for pointer events
var intersectPoint = new THREE.Vector3();
var intersectOffset = new THREE.Vector3();
var draggingPaddle = false;
var opponentIntersectPlane;

//TODO move this to Physics.js?
function onCollision(event) {
  console.log('Ball collision, velocity', ball.physicsBody.velocity.z);

  //TODO since the velocity only updates AFTER the step (thus outside this callback),
  // we must store event.contact (eg.) and process it after the physics step has finished!

  var myPaddleId = myPaddle.physicsBody.id;
  var opponentPaddleId = opponentPaddle.physicsBody.id;

  if (event.body.id === myPaddleId) {
    var contact = event.contact;

    // console.log('hit my paddle!', event);
    var r = (contact.bi.id == myPaddleId) ? contact.ri : contact.rj;

    var worldR = myPaddle.physicsBody.position.vadd(r);
    var localR = myPaddle.physicsBody.pointToLocalFrame(worldR);
    //console.log('localR', localR);
    //TODO adjust ball velocity using localR (discard z)

    // Make sure the ball has at least some z velocity
    // console.log('velocity', ball.physicsBody.velocity);

    if ((ball.physicsBody.velocity.z >= 0) &&
      (ball.physicsBody.velocity.z < BallMinZSpeed)) {
      console.log('myPaddle adjusted ball velocity');
      ball.physicsBody.velocity.z = BallMinZSpeed;
    }
  } else if ((APP.gameType === APP.GameTypes.SinglePlayer) &&
    (event.body.id === opponentPaddleId)) {
    // We only handle physics for the opponent paddle when in singleplayer mode
    console.log('Ball hit opponent paddle');
    // console.log('velocity', ball.physicsBody.velocity);

    //TODO check same stuff as with myPaddle above
  }

  // If hit anything else then opponent's paddle while in sinpleplayer mode,
  // update the computer player's prediction of where the ball will hit
  if ((APP.gameType === APP.GameTypes.SinglePlayer) &&
    (event.body.id !== opponentPaddleId)) {
   console.log('Correcting hit estimate..');
    // Get the current velocity vector and use it to make direction Ray
    var direction = new THREE.Vector3(ball.physicsBody.velocity).normalize();
    var ray = new THREE.Ray(ball.physicsBody.position, direction);

    var intersectPoint = ray.intersectPlane(opponentIntersectPlane);
    if (intersectPoint) {
      console.log('new intersectPoint is', intersectPoint);
      //TODO update the computer opponents velocity = moving direction * OpponentPaddleMaxSpeed

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
  world.addBody(opponentPaddle.physicsBody);

  // Listen to collisions between the ball and other bodies
  ball.physicsBody.addEventListener('collide', onCollision);

  //TODO remove - use for testing env physics
  ball.physicsBody.applyImpulse(new CANNON.Vec3(-0.8, 1, 1.0), ball.physicsBody.position);
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
  camera = new THREE.PerspectiveCamera(70, aspect, 0.2, environment.Length);
  var cameraZ = (environment.Length / 2) - 0.5;
  camera.translateZ(cameraZ);
  scene.add(camera);

  // Add a point light to where our camera is
  var pointLight = new THREE.PointLight(0xFFFFFF, 1, environment.Length);
  camera.add(pointLight);

  // Add my paddle and position it somewhat in front of the camera
  myPaddle = new APP.Paddle(APP.Paddle.Type.Mine);
  var myPaddlePos = new CANNON.Vec3(0, 0, cameraZ - PaddleDistance);
  myPaddle.moveTo(myPaddlePos, environment);
  scene.add(myPaddle);

  // Add opponent's paddle to the other side of the environment
  opponentPaddle = new APP.Paddle(APP.Paddle.Type.Opponent);
  var opponentPaddlePos = new CANNON.Vec3(0, 0, -myPaddle.position.z);
  opponentPaddle.moveTo(opponentPaddlePos, environment);
  scene.add(opponentPaddle);

  // Create an intersect plane for computer opponent to guess where the ball
  // is coming. Make it match the opponent paddle's z depth.
  opponentIntersectPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1),
    -opponentPaddle.position.z);

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
  if (lastTickTime) {
    // Update (step) physics simulation
    var dt = (time - lastTickTime) / 1000;
    world.step(PhysicsFixedTimeStep, dt, PhysicsMaxSubSteps);

    // Update ball position based on physics
    ball.onPhysicsUpdated();
  }
}

function checkForScoring() {
  // Check if ball has passed behind my paddle ie. opponent scores
  if (ball.position.z > (myPaddle.position.z + ball.Radius)) {
    console.log('opponent scores');

    //TODO start new ball, update scores, send network update etc.
  }

  // Check if ball has passed behind the opponent paddle ie. I have scored.
  if (ball.position.z < (opponentPaddle.position.z - ball.Radius)) {
    console.log('I scored!');

    //TODO start new ball, update scores, send network update etc.
  }
}

function animate(time) {
  // Request next frame to be drawn after this one completes
  requestAnimationFrame(animate);

  stats.begin();

  // Physics tick
  updatePhysics(time);

  // Render the visuals
  render();

  // Check if either player scored this frame
  checkForScoring();

  stats.end();

  lastTickTime = time;
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
