// Define namespace
var APP = APP || {};

// Constants

APP.Paddle = function(type, environment) {
  assert(type, 'Type must be defined');
  assert(type === APP.Paddle.Type.Mine || type === APP.Paddle.Type.Opponent);
  assert(environment);

  var self = this;
  
  self.Width = 1.2;
  self.Height = self.Width * (683/1024);

  /** Velocity as received over a network update (opponent paddle) */
  self.velocity = new CANNON.Vec3(0, 0, 0);

  /**
   * Call this when a game starts to reset some game-time paddle attributes.
   */
  self.reset = function() {
    self.positionSamples = [];

    delete self.lastTickTime;
    delete self.lastUpdateTime;
  };

  /**
   * Called when user moves the paddle
   * @param newPosition
   */
  self.moveTo = function(newPosition) {
    assert(newPosition, 'Mandatory param missing');

    // Bound paddle movement by the walls
    var pw2 = (self.Width / 2);
    var ew2 = (self.environment.Width / 2);
    var ph2 = (self.Height / 2);
    var eh2 = (self.environment.Height / 2);

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
    self.position.copy(newPosition);

    // Also update the physics body position
    self.physicsBody.position.copy(self.getWorldPosition());

    // console.log('pos, phys pos', self.position, self.physicsBody.position);
  };

  /**
   * Moves self (single player mode opponent's) paddle towards movementTarget
   * at OpponentPaddleSpeed speed, using the lastTickTime vs current time
   * for time measurement.
   */
  self.moveTowardsTarget = function() {
    assert(self.movementTarget, 'Must be set!');
    assert(self.lastTickTime, 'Must be set!');

    // Calculate the distance self paddle can travel self tick
    var now = moment().utc().valueOf();
    var diff = (now - self.lastTickTime) / 1000;
    var distance = diff * APP.Model.difficulty.opponentPaddleSpeed;

    // Get vector from position to target
    var v = new THREE.Vector3().subVectors(self.movementTarget, self.position);
    if (v.length() < distance) {
      // We have arrived at the destination.
      self.moveTo(self.movementTarget);
      delete self.movementTarget;
    } else {
      // Move towards the destination
      var newPos = new THREE.Vector3().addVectors(self.position,
        v.setLength(distance));
      self.moveTo(newPos);
    }

    self.lastTickTime = now;
  };

  /**
   * Moves the opponent paddle (multiplayer mode) according to its current
   * velocity and elapsed time since last update.
   */
  self.moveWithVelocity = function() {
    //TODO REMOVE ME!
    return;

    if (!self.lastUpdateTime || self.velocity.almostZero()) {
      // Not received any network updates yet or velocity is 0
      return;
    }

    var now = moment().utc().valueOf();
    var diff = (now - self.lastUpdateTime) / 1000.0; // Time delta in seconds
    assert(diff >= 0, 'Time difference must be positive');

    // console.log('diff, velocity: ', diff, self.physicsBody.velocity.length());
    var v = self.velocity.clone().scale(diff);
    var newPos = self.physicsBody.position.vadd(v);

    self.moveTo(newPos);
    self.lastUpdateTime = now;
  };

  /**
   * Returns the latest position sample. If there are no position samples,
   * throws an assertion error.
   *
   * @returns {*|T} latest position sample
   */
  self.getLatestPosition = function() {
    assert(self.positionSamples, 'Position sample array must exist');
    assert(self.positionSamples.length > 0, 'Must have at least 1 sample');

    return self.positionSamples[self.positionSamples.length - 1];
  };

  /**
   * Appends the current position to the end of position samples with the
   * current timestamp (```moment().utc().valueOf()```).
   */
  self.updatePositionSamples = function() {
    self.positionSamples.push({
      time: moment().utc().valueOf(),
      x: self.position.x,
      y: self.position.y
    });
  };

  /* old:
  // Adds a position sample and recalculates current speed.
  self.updateVelocity = function() {
    var now = moment().utc().valueOf();
    var positionSample = {
      time: now,
      x: self.position.x,
      y: self.position.y
    };
    self.positionSamples.push(positionSample);

    var MeasurementInterval = 500; // In milliseconds

    // Remove any samples older than MeasurementInterval
    while (true) {
      var diff = now - self.positionSamples[0].time;
      if (diff > MeasurementInterval) {
        self.positionSamples.shift();
      } else {
        break;
      }
    }

    // Check if not enough samples
    if (self.positionSamples.length <= 1) {
      self.physicsBody.velocity.set(0, 0, 0);
      return;
    }

    //TODO do not calculate this here; instead, calculate this on demand when
    //TODO networking is about to send a paddle update.

    // Calculate paddle velocity from the first sample (which should be about
    // MeasureInterval ms in the past if the buffer has been filled already) to
    // the current position & moment.
    var firstSample = self.positionSamples[0];
    var seconds = (now - firstSample.time) / 1000;

    var v = {x: (self.position.x - firstSample.x) / seconds,
      y: (self.position.y - firstSample.y) / seconds};

    // Also set the velocity to the physics body
    self.physicsBody.velocity.set(v.x, v.y, 0);
  };
  */

  /**
   * Calculates the velocity vector for the paddle having moved from the location
   * nest 'fromTime' to the current (latest) position.
   *
   * @param fromTime Point in time to use as the starting point
   */
  self.getVelocitySince = function(fromTime) {
    assert(self.positionSamples, 'Position sample array must exist');
    assert(self.positionSamples.length > 0, 'Must have at least 1 sample');

    if (!fromTime) {
      return {x: 0, y: 0};
    }

    // Find the position sample closest to fromTime
    var selectedSample = null;
    var selectedIndex = null;

    for (var i = 0; i < self.positionSamples.length; i++) {
      var sample = self.positionSamples[i];
      if (sample.time > fromTime) {
        break;
      }
      selectedSample = sample;
      selectedIndex = i;
    }

    if (selectedSample === null) {
      console.log("Could not find sample older than fromTime - using oldest");
      selectedSample = self.positionSamples[0];
    }

    if (selectedIndex !== null) {
      // For efficient scanning of the array and to preserve RAM,
      // remove older samples from the samples array
      self.positionSamples = self.positionSamples.slice(selectedIndex);
    }

    // Calculate the paddle velocity from the selected sample close to
    // fromTime to the current time / position.
    var now = moment().utc().valueOf();
    var seconds = (now - selectedSample.time) / 1000.0;

    return {x: (self.position.x - selectedSample.x) / seconds,
      y: (self.position.y - selectedSample.y) / seconds};
  };

  // Sets the target location where self (single player mode opponent's) paddle
  // should be moving. It will move according to OpponentPaddleSpeed speed
  // every time moveTowardsTarget() is called.
  self.setMovementTarget = function(target) {
    self.movementTarget = target;
    self.lastTickTime = moment().utc().valueOf();
  };

  // Initialize Cannon physics
  self.initPhysics = function() {
    self.physicsBody = new CANNON.Body({
      mass: 0, // // mass == 0 makes the body static (moved w/ user interaction)
      material: new CANNON.Material({
        friction: 0.0,
        restitution: 1.0 // Bounces with no damping
      }),
      position: self.getWorldPosition(),
      shape: new CANNON.Box(new CANNON.Vec3(
        self.Width / 2, self.Height / 2, 0.001))
    });
  };

  // Initialize threejs visuals
  self.initVisuals = function() {
    self.environment = environment;
    var textureName = (type === APP.Paddle.Type.Mine) ?
      'textures/my-paddle.png' : 'textures/opponent-paddle.png';

    var geometry = new THREE.PlaneGeometry(self.Width, self.Height);
    var textureMap = new THREE.TextureLoader().load(textureName);
    textureMap.minFilter = THREE.LinearFilter;

    var material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      map: textureMap
    });

    THREE.Mesh.call(self, geometry, material);
  };

  self.reset();
  self.initVisuals();
  self.initPhysics();
};

APP.Paddle.Type = {
  Mine: 1,
  Opponent: 2
};

APP.Paddle.prototype = Object.create(THREE.Mesh.prototype);
APP.Paddle.constructor = APP.Paddle;
