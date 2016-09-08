// Define namespace
var APP = APP || {};

// Constants
var PaddleDistance = 1.7; // From the camera

// Threejs (graphics) scene objects
var camera, scene, renderer, environment, myPaddle, opponentPaddle, ball;

// Physics objects
var world, ballBody, envBody;

// Misc physics variables
var physicsLastTickTime;
var physicsFixedTimeStep = 1.0 / 60.0; // seconds
var physicsMaxSubSteps = 3;

// Paddle moving / raycasting
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var intersectPlane;
var intersectPoint = new THREE.Vector3();
var intersectOffset = new THREE.Vector3();
var draggingPaddle = false;

function onCollision(event) {
  console.log('Ball collision');
}

function initPhysics() {
  world = new CANNON.World();
  world.gravity.set(0, -1.5, 0); // m/s²

  // Create a physics body for the ball
  ballBody = new CANNON.Body({
    mass: 1, // kg
    material: new CANNON.Material({
      friction: 0.0,
      restitution: 0.999
    }),
    position: cannonVec3(ball.position),
    shape: new CANNON.Sphere(ball.Radius)
  });
 // ballBody.linearDamping = ballBody.angularDamping = 0.4; // ?
  ballBody.addEventListener('collide', onCollision);
  world.addBody(ballBody);

  // Create a physics body for the environment
  //TODO replace by box for the env tunnel
//   envBody = new CANNON.Body({
//     mass: 0, // mass == 0 makes the body static
// //    position: new CANNON.Vec3(0, -environment.Height / 2, 0),
//     shape: new CANNON.Box(new CANNON.Vec3(environment.Width / 2,
//       environment.Height / 2, environment.Length / 2))
//   });
//   world.addBody(envBody);
//   console.log('box', JSON.stringify(envBody.shapes));

  world.addBody(environment.physicsBody);

  //TODO remove - use for testing env physics
  ballBody.applyImpulse(new CANNON.Vec3(-0.8, 3, -2), ballBody.position);
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

function updatePhysics(time) {
  if (physicsLastTickTime) {
    var dt = (time - physicsLastTickTime) / 1000;
    world.step(physicsFixedTimeStep, dt, physicsMaxSubSteps);
  }
  // console.log("Sphere position: " +  ballBody.position);
  physicsLastTickTime = time;

  // Update ball position from physics
  ball.position.copyCannonVec3(ballBody.position);
 // ball.position.y = ballBody.position.y;
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
