// Define namespace
var APP = APP || {};

// Constants

APP.Paddle = function(type, environment) {
  assert(type, 'Type must be defined');
  assert(type === APP.Paddle.Type.Mine || type === APP.Paddle.Type.Opponent);
  assert(environment);

  this.Width = 1.2;
  this.Height = this.Width * (683/1024);

  // Called when user moves the paddle
  this.moveTo = function(newPosition) {
    assert(newPosition, 'Mandatory param missing');

    // Bound paddle movement by the walls
    var pw2 = (this.Width / 2);
    var ew2 = (this.environment.Width / 2);
    var ph2 = (this.Height / 2);
    var eh2 = (this.environment.Height / 2);

    // Left wall
    if ((newPosition.x - pw2) < -ew2) {
      newPosition.x = -ew2 + pw2;
    }

    // Right wall
    if ((newPosition.x + pw2) > ew2) {
      newPosition.x = ew2 - pw2;
    }

    // Roof
    if ((newPosition.y + ph2) > eh2) {
      newPosition.y = eh2 - ph2;
    }

    // Floor
    if ((newPosition.y - ph2) < -eh2) {
      newPosition.y = -eh2 + ph2;
    }

    // Update the object position
    this.position.copy(newPosition);

    // Also update the physics body position
    this.physicsBody.position.copy(this.getWorldPosition());
  };

  // Moves this (single player mode opponent's) paddle towards movementTarget
  // at OpponentPaddleSpeed speed, using the lastTickTime vs current time
  // for time measurement.
  this.moveTowardsTarget = function() {
    assert(this.movementTarget, 'Must be set!');
    assert(this.lastTickTime, 'Must be set!');

    // Calculate the distance this paddle can travel this tick
    var now = new Date().getTime();
    var diff = (now - this.lastTickTime) / 1000;
    var distance = diff * APP.Model.difficulty.opponentPaddleSpeed;

    // Get vector from position to target
    var v = new THREE.Vector3().subVectors(this.movementTarget, this.position);
    if (v.length() < distance) {
      // We have arrived at the destination.
      this.moveTo(this.movementTarget);
      delete this.movementTarget;
    } else {
      // Move towards the destination
      var newPos = new THREE.Vector3().addVectors(this.position,
        v.setLength(distance));
      this.moveTo(newPos);
    }

    this.lastTickTime = now;
  };

  // Sets the target location where this (single player mode opponent's) paddle
  // should be moving. It will move according to OpponentPaddleSpeed speed
  // every time moveTowardsTarget() is called.
  this.setMovementTarget = function(target) {
    this.movementTarget = target;
    this.lastTickTime = new Date().getTime();
  };

  // Initialize Cannon physics
  this.initPhysics = function() {
    this.physicsBody = new CANNON.Body({
      mass: 0, // // mass == 0 makes the body static (moved w/ user interaction)
      material: new CANNON.Material({
        friction: 0.0,
        restitution: 1.0 // Bounces with no damping
      }),
      position: this.getWorldPosition(),
      shape: new CANNON.Box(new CANNON.Vec3(
        this.Width / 2, this.Height / 2, 0.001))
    });
  };

  // Initialize threejs visuals
  this.initVisuals = function() {
    this.environment = environment;
    var textureName = (type === APP.Paddle.Type.Mine) ?
      'textures/my-paddle.png' : 'textures/opponent-paddle.png';

    var geometry = new THREE.PlaneGeometry(this.Width, this.Height);
    var textureMap = new THREE.TextureLoader().load(textureName);
    textureMap.minFilter = THREE.LinearFilter;

    var material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      map: textureMap,
    });

    THREE.Mesh.call(this, geometry, material);
  };

  this.initVisuals();
  this.initPhysics();
};

APP.Paddle.Type = {
  Mine: 1,
  Opponent: 2
};

APP.Paddle.prototype = Object.create(THREE.Mesh.prototype);
APP.Paddle.constructor = APP.Paddle;
