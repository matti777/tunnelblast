// Define namespace
var APP = APP || {};

APP.GameMode = {
  SinglePlayer: 1, Duel: 2
};
APP.gameMode = APP.GameMode.SinglePlayer;

APP.Difficulty = {
  Easy: 1, Hard: 2
};

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
  //   ui.displayFadingLargeText('4-2', 100);
  // }, 2000);
}

function showCountdownTimer(timerValue, completionCb) {
  if (timerValue === 0) {
    completionCb();
  } else {
    ui.displayFadingLargeText(timerValue, 100);
    setTimeout(function() {
      showCountdownTimer(timerValue - 1, completionCb);
    }, 1000);
  }
}

function startGame(mode, difficulty) {
  assert(mode === APP.GameMode.SinglePlayer, 'Multiplayer not supported yet');
  assert(difficulty === APP.Difficulty.Easy, 'Hard not supported yet');

  // Reset ball position && initial velocity
  if (!ball.parent) {
    scene.add(ball);
  }
  ball.moveTo(new THREE.Vector3(0, 0, 0));
  ui.score = {me: 0, opponent: 0};
  ui.update();

  showCountdownTimer(3, function() {
    // Game starts!
    // Give the ball its initial velocity vector
    ball.physicsBody.velocity = new CANNON.Vec3(0, 0, BallSpeed);
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function checkForScoring() {
  var updateScore = function(iScored) {
    if (iScored) {
      ui.score.me++;
      ui.displayFadingLargeText('You scored!', 200);
    } else {
      ui.score.opponent++;
      ui.displayFadingLargeText('Opponent scored!', 200);
    }

    //TODO check here whether the game got won!

    ui.update();
    ball.moveTo(new THREE.Vector3(0, 0, 0));
    ball.physicsBody.velocity.set(0, 0, 0);

    setTimeout(function() {
      ball.physicsBody.velocity = new CANNON.Vec3(0, 0, BallSpeed);
    }, 1200);
  };

  // Check if ball has passed behind my paddle ie. opponent scores
  if (ball.position.z > (myPaddle.position.z + ball.Radius)) {
    updateScore(false);
  }

  // Check if ball has passed behind the opponent paddle ie. I have scored.
  if (ball.position.z < (opponentPaddle.position.z - ball.Radius)) {
    updateScore(true);
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

  //TODO remove and do this from UI menu
  setTimeout(function() {
    startGame(APP.GameMode.SinglePlayer, APP.Difficulty.Easy);
  }, 1000);
};
