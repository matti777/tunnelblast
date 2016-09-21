// Define namespace
var APP = APP || {};

APP.GameTypes = {
  SinglePlayer: 1, Duel: 2
};
APP.gameType = APP.GameTypes.SinglePlayer;

// Constants
var PaddleDistance = 1.7; // From the camera
var PhysicsGravity = 0.0; // m/s^2 (-9.81 to simulate real-world)

// 'Globals'
var camera, scene, renderer, environment, myPaddle, opponentPaddle, ball;
var stats;
var ui, input, physics;

function init() {
  scene = new THREE.Scene();

  // Create UI handler
  ui = new APP.Ui();

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
  myPaddle = new APP.Paddle(APP.Paddle.Type.Mine, environment);
  var myPaddlePos = new CANNON.Vec3(0, 0, cameraZ - PaddleDistance);
  myPaddle.moveTo(myPaddlePos, environment);
  scene.add(myPaddle);

  // Add opponent's paddle to the other side of the environment
  opponentPaddle = new APP.Paddle(APP.Paddle.Type.Opponent, environment);
  var opponentPaddlePos = new CANNON.Vec3(0, 0, -myPaddle.position.z);
  opponentPaddle.moveTo(opponentPaddlePos, environment);
  scene.add(opponentPaddle);

  // Add the ball
  ball = new APP.Ball();
  scene.add(ball);

  // Initialize physics
  physics = new APP.Physics(PhysicsGravity, ball, myPaddle,
    opponentPaddle, environment);

  // Finally, our renderer..
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  $('#renderer').append(renderer.domElement)

  // Add a statistics panel
  stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);

  // Attach input handler(s)
  input = new APP.Input(renderer, camera, myPaddle);

  // Add event listeners
  window.addEventListener('resize', onWindowResize, false);

  //TODO remove this; testing..
  // setTimeout(function() {
  //   console.log('displaying text..');
  //   ui.displayFadingLargeText('TEXT!');
  // }, 500);
  // setTimeout(function() {
  //   ui.displayFadingLargeText('4-2');
  // }, 2000);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
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
  physics.update(time);

  // Render the visuals
  render();

  // Check if either player scored this frame
  checkForScoring();

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
