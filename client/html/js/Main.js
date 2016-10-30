// Define namespace
var APP = APP || {};

APP.GameMode = {
  SinglePlayer: 1, MultiPlayer: 2
};

APP.Difficulty = {
  Easy: {
    ballspeed: 1.6,
    opponentPaddleSpeed: 0.2
  },
  Hard: {
    ballspeed: 2.5,
    opponentPaddleSpeed: 0.3
  },
  Multiplayer: {
    ballspeed: 0.5 //2
  }
};
var InitialBallSpeed = 0.5; //1.2; // Speed of the ball at start of each round

APP.Model = {score: {me: 0, opponent: 0}};

// Constants
var PaddleDistance = 1.7; // From the camera
var PhysicsGravity = 0.0; // m/s^2 (-9.81 to simulate real-world)
var EndScore = 1;

// 'Globals'
var camera, scene, renderer, environment, myPaddle, opponentPaddle, ball;
var particleSystem, ballPointLight, clock;
var stats;
var ui, input, physics, networking;
var myPaddleStartLocation, opponentPaddleStartLocation;

function init() {
  scene = new THREE.Scene();

  // Start a clock for timing particle spawns
  clock = new THREE.Clock(true);

  // Start Networking
  networking = new APP.Networking(networkCalllback);

  // Create UI handler
  ui = new APP.Ui(networking);

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
  var pointLight = new THREE.PointLight(0xFFFFFF, 0.8, environment.Length);
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

  // Create a lightsource at the ball
  ballPointLight = new THREE.PointLight(0xCCCCFF, 0.5, 2.5);
  ball.add(ballPointLight);

  // Attach a particle system
  particleSystem = new THREE.GPUParticleSystem({maxParticles: 250000});
  scene.add(particleSystem);

  // Initialize physics
  physics = new APP.Physics(PhysicsGravity, ball, myPaddle,
    opponentPaddle, environment, networking);

  // Create our renderer..
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

  // Update the html UI
  ui.update();
}

function isSinglePlayer() {
  return (APP.Model.gameMode == APP.GameMode.SinglePlayer);
}

function isMultiPlayer() {
  return (APP.Model.gameMode == APP.GameMode.MultiPlayer);
}

function isMultiPlayerHost() {
  return ((APP.Model.gameMode === APP.GameMode.MultiPlayer) &&
  APP.Model.multiplayer && APP.Model.multiplayer.youAreHost);
}

function multiplayerGameEnded() {
  console.log('Multiplayer game ended');

  delete APP.Model.multiplayer;
  showMenu();
}

function serverConnectionDisconnected(msg) {
  console.log('disconnected');
  APP.Model.connectedToServer = false;

  if (APP.Model.gameMode === APP.GameMode.MultiPlayer) {
    multiplayerGameEnded()
  } else {
    ui.update();
  }
}

function multiplayerGameStarting(gameData) {
  console.log('multiplayer game starting; gameData', gameData);

  APP.Model.multiplayer = gameData;

  ui.doStartGameAnimations(function() {
    startGame(APP.GameMode.MultiPlayer);
  });
}

function serverUpdateReceived(data) {
  var mirror = function(vector) {
    return {x: -vector.x, y: vector.y, z: -vector.z};
  };

  // Update the opponent's paddle position if present
  if (data.paddle) {
    console.log('Got opponent paddle update: ', data.paddle);
    opponentPaddle.moveTo(mirror(data.paddle.position));
    opponentPaddle.physicsBody.velocity.copy(mirror(data.paddle.velocity));
    opponentPaddle.lastUpdateTime = moment().utc().valueOf();
  }

  if (data.ball) {
    console.log('Got ball update: ', data.ball);
    var mirroredPos = mirror(data.ball.position);
    ball.position.copy(mirroredPos);
    ball.physicsBody.position.copy(mirroredPos);
    ball.physicsBody.velocity.copy(mirror(data.ball.velocity));
    ball.physicsBody.angularVelocity.copy(mirror(data.ball.angularVelocity));
  }

  if (data.score) {
    if (isMultiPlayerHost()) {
      console.log('ERROR - receiving score update as host!');
      return;
    }

    APP.Model.score.me = data.score.newOtherPlayerScore;
    APP.Model.score.opponent = data.score.newHostScore;
    updateScore(data.score.otherPlayerScored);
  }

  if (data.win) {
    if (isMultiPlayerHost()) {
      console.log('ERROR - receiving win update as host!');
      return;
    }
    console.log('Got won update');
    showWinMessage(data.win.otherPlayerWon);
  }
}

function latencyUpdate(data) {
//  console.log('Latency: (ms) ', data);

  //TODO update latency value in the UI
}

function networkCalllback(message, data) {
  // console.log('Network callback', message, data);

  switch (message) {
    case networking.messages.serverUpdate:
      serverUpdateReceived(data);
      break;
    case networking.messages.connected:
      APP.Model.connectedToServer = true;
      ui.update();
      break;
    case networking.messages.disconnected:
      serverConnectionDisconnected(data);
      break;
    case networking.messages.quitGame:
    case networking.messages.opponentDisconnected:
      multiplayerGameEnded();
      break;
    case networking.messages.gameStarting:
      multiplayerGameStarting(data);
      break;
    case networking.messages.latency:
      latencyUpdate(data);
      break;
  }
}

function showMenu() {
  APP.Model.gameRunning = false;
  APP.Model.score = {me: 0, opponent: 0};
  activateBall(false);
  ball.reset();
  ui.update();
  ui.showFindingGameMenu(false);
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
    scene.remove(particleSystem);
    physics.world.removeBody(ball.physicsBody);
  }
}

function startGame(mode, difficulty) {
  assert((mode === APP.GameMode.SinglePlayer) ||
    (mode === APP.GameMode.MultiPlayer), 'Invalid mode value');

  APP.Model.gameMode = mode;
  myPaddle.moveTo(myPaddleStartLocation, environment);
  opponentPaddle.moveTo(opponentPaddleStartLocation, environment);
  delete opponentPaddle.movementTarget;

  if (mode === APP.GameMode.SinglePlayer) {
    // Single player game starts immediately
    assert((difficulty === APP.Difficulty.Easy) ||
      (difficulty === APP.Difficulty.Hard), 'Invalid difficulty value');

    APP.Model.difficulty = difficulty;
    APP.Model.opponentName = 'AI';
    console.log('Selected difficulty:', APP.Model.difficulty);

    activateBall(true);
    ball.physicsBody.velocity.set(0, 0, InitialBallSpeed);
    APP.Model.gameRunning = true;
  } else {
    assert(APP.Model.multiplayer, 'Multiplayer game data missing');
    assert(APP.Model.multiplayer.opponent, 'Invalid multiplayer game data');

    APP.Model.difficulty = APP.Difficulty.Multiplayer;
    APP.Model.opponentName = APP.Model.multiplayer.opponent.nickname;
    activateBall(true);
    APP.Model.gameRunning = true;

    // Multiplayer game starts immediately for the host; after the first
    // received server update for the other player
    if (isMultiPlayerHost()) {
      ball.physicsBody.velocity.set(0, 0, InitialBallSpeed);

      // Also send ball velocity update to the other player
      networking.updateBallState(ball.physicsBody.position,
        ball.physicsBody.velocity, ball.physicsBody.angularVelocity);
    }
  }

  ui.update();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function showWinMessage(iWon) {
  var winMsg = (iWon) ? 'You won!' : APP.Model.opponentName + ' won!';

  APP.Model.gameRunning = false;
  setTimeout(function () {
    ui.displayFadingLargeText(winMsg, 200);
    setTimeout(function () {
      if (isSinglePlayer() || isMultiPlayerHost()) {
        // Make the host quit the game; the other player will end up in the menu
        // as the game disconnects.
        networking.quitGame();
        console.log('Showing menu again..');
        showMenu();
      }
    }, 1700);
  }, 1500);
}

function updateScore(iScored) {
  if (iScored) {
    ui.displayFadingLargeText('You scored!', 200);
  } else {
    ui.displayFadingLargeText(APP.Model.opponentName + ' scored!', 200);
  }
  ui.update();

  // Move ball + paddles to their starting locations
  ball.reset();
  activateBall(false);
  myPaddle.moveTo(myPaddleStartLocation, environment);
  opponentPaddle.moveTo(opponentPaddleStartLocation, environment);
  delete opponentPaddle.movementTarget;

  if (isSinglePlayer() || isMultiPlayerHost()) {
    // Check if the game was won
    var youWon, opponentWon;

    if (APP.Model.score.me >= EndScore) {
      youWon = true;
    } else if (APP.Model.score.opponent >= EndScore) {
      opponentWon = true;
    }

    if (isMultiPlayerHost()) {
      // Send network events about scoring & winning
      networking.updateScoreState(iScored, APP.Model.score.me,
        APP.Model.score.opponent);

      if (youWon || opponentWon) {
        networking.updateWinState(youWon);
      }
    }

    if (youWon || opponentWon) {
      showWinMessage(youWon);
      return; 
    }

    setTimeout(function() {
      // Launch the ball again!
      ball.physicsBody.velocity.set(0, 0, InitialBallSpeed);

      if (isMultiPlayerHost()) {
        // Also send ball velocity update to the other player
        networking.updateBallState(ball.physicsBody.position,
          ball.physicsBody.velocity, ball.physicsBody.angularVelocity);
      }
    }, 1200);
  }

  // Reset the ball to the middle
  activateBall(true);
}

function checkForScoring() {
  // Check if ball has passed behind my paddle ie. opponent scores
  if (ball.position.z > (myPaddle.position.z + ball.Radius)) {
    APP.Model.score.opponent++;
    updateScore(false);
  }

  // Check if ball has passed behind the opponent paddle ie. I have scored.
  if (ball.position.z < (opponentPaddle.position.z - ball.Radius)) {
    APP.Model.score.me++;
    updateScore(true);
  }
}

var ParticleSystemOptions = {
  position: new THREE.Vector3(),
  positionRandomness: 0.26,
  velocity: new THREE.Vector3(),
  velocityRandomness: 0.001,
  color: 0xCCAAFF,
  colorRandomness: 0.2,
  turbulence: 0,
  lifetime: 2,
  size: 5,
  sizeRandomness: 1
};

var ParticleSpawnRate = 15000; // Number of particles spawned per second

function updateParticleSystem() {
  var particlesToSpawn = ParticleSpawnRate * clock.getDelta();
  var options = ParticleSystemOptions;

  // Make the particle 'tail' point to the opposite direction
  options.velocity.x = -ball.physicsBody.velocity.x / 200;
  options.velocity.y = -ball.physicsBody.velocity.y / 200;
  options.velocity.z = -ball.physicsBody.velocity.z / 200;
  options.position.copy(ball.position);

  for (var i = 0; i < particlesToSpawn; i++) {
    particleSystem.spawnParticle(options);
  }

  particleSystem.update(clock.getElapsedTime());
}

function animate(time) {
  stats.begin();

  // Render the visuals
  render();

  if (APP.Model.gameRunning) {
    // Update paddle velocity from it's position history
    myPaddle.updateVelocity();

    if (particleSystem.parent) {
      // Update the particle system (spawn more particles)
      updateParticleSystem();
    }

    // Physics tick
    physics.update(time);

    if (isSinglePlayer() || isMultiPlayerHost()) {
      // Check if either player scored this frame
      checkForScoring();
    }

    // Update the paddle state to the server
    networking.updatePaddleState(myPaddle.physicsBody.position,
      myPaddle.physicsBody.velocity);

    if (isMultiPlayer()) {
      // Update the opponent paddle position according to its velocity
      opponentPaddle.moveWithVelocity();
    }
  }

  // Request next frame to be drawn after this one completes
  requestAnimationFrame(animate);

  stats.end();
}

function render() {
  renderer.render(scene, camera);
}

APP.main = function() {
  APP.Model.myName = localStorage.getItem('myNickname');
  if (!APP.Model.myName || (APP.Model.myName.length < 1)) {
    // Generate an initial nickname
    APP.Model.myName = randomString(8);
    localStorage.setItem('myNickname', APP.Model.myName);
  }

  // Init the scene + all needed instances
  init();

  // Start animating!
  animate();

  // Initially, show the menu
  showMenu();
};
