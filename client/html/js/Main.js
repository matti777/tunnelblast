// Define namespace
var APP = APP || {};

APP.GameMode = {
  SinglePlayer: 1, Duel: 2
};

APP.Difficulty = {
  Easy: 1, Hard: 2
};

// Constants
var PaddleDistance = 1.7; // From the camera
var PhysicsGravity = 0.0; // m/s^2 (-9.81 to simulate real-world)
var EndScore = 2;

// 'Globals'
var camera, scene, renderer, environment, myPaddle, opponentPaddle, ball;
var stats;
var ui, input, physics;
var myPaddleStartLocation, opponentPaddleStartLocation;

function init() {
  scene = new THREE.Scene();

  APP.Model = {score: {me: 0, opponent: 0}};

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
  myPaddleStartLocation = new CANNON.Vec3(0, 0, cameraZ - PaddleDistance);
  myPaddle.moveTo(myPaddleStartLocation, environment);
  scene.add(myPaddle);

  // Add opponent's paddle to the other side of the environment
  opponentPaddle = new APP.Paddle(APP.Paddle.Type.Opponent, environment);
  opponentPaddleStartLocation = new CANNON.Vec3(0, 0, -myPaddle.position.z);
  opponentPaddle.moveTo(opponentPaddleStartLocation, environment);
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

function showMenu() {
  APP.Model.gameRunning = false;
  APP.Model.score = {me: 0, opponent: 0};
  activateBall(false);
  ball.reset();
  ui.update();
  ui.showMenu(true);
}

// Either adds or removes ball from/to 3D scene and physics world
function activateBall(activate) {
  if (activate) {
    if (!ball.parent) {
      scene.add(ball);
    }
    if (!ball.physicsBody.world) {
      physics.world.addBody(ball.physicsBody);
    }
  } else {
    scene.remove(ball);
    physics.world.removeBody(ball.physicsBody);
  }
}

function startGame(mode, difficulty) {
  assert(mode === APP.GameMode.SinglePlayer, 'Multiplayer not supported yet');
  assert(difficulty === APP.Difficulty.Easy, 'Hard not supported yet');

  APP.Model.gameMode = mode;
  APP.Model.myName = 'Matti'; //TODO
  APP.Model.opponentName = 'AI'; //TODO only for singleplayer
  console.log('set model', APP.Model);

  activateBall(true);
  ball.physicsBody.velocity = new CANNON.Vec3(0, 0, BallSpeed);
  APP.Model.gameRunning = true;
  ui.update();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function checkForScoring() {
  var updateScore = function(iScored) {
    if (iScored) {
      APP.Model.score.me++;
      ui.displayFadingLargeText('You scored!', 200);
    } else {
      APP.Model.score.opponent++;
      ui.displayFadingLargeText(APP.Model.opponentName + ' scored!', 200);
    }
    ui.update();

    // Move ball + paddles to their starting locations
    ball.reset();
    activateBall(false);
    myPaddle.moveTo(myPaddleStartLocation, environment);
    opponentPaddle.moveTo(opponentPaddleStartLocation, environment);

    // Check if the game was won
    var winMsg;
    if (APP.Model.score.me >= EndScore) {
      winMsg = 'You won!';
    } else if (APP.Model.score.opponent >= EndScore) {
      winMsg = APP.Model.opponentName + ' won!';
    }
    if (winMsg) {
      setTimeout(function() {
        ui.displayFadingLargeText(winMsg, 200);
        setTimeout(function() {
          console.log('Showing menu again..');
          showMenu();
        }, 1700);
      }, 1500);

      return;
    }

    // Reset the ball to the middle
    activateBall(true);

    setTimeout(function() {
      // Launch the ball again!
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
  stats.begin();

  // Render the visuals
  render();

  if (APP.Model.gameRunning) {
    // Physics tick
    physics.update(time);

    // Check if either player scored this frame
    checkForScoring();
  }

  // Request next frame to be drawn after this one completes
  requestAnimationFrame(animate);

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

  // Initially, show the menu
  showMenu();
};
