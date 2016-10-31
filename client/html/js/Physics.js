// Define namespace
var APP = APP || {};

// Constants
var BallBounceAngleModifier = 0.5; // How much hitting side of paddle tilts bounce angle
var PhysicsFixedTimeStep = 1.0 / 60.0; // Seconds. Do not change.
var PhysicsMaxSubSteps = 3; // Do not change.
var BallMaxZAngle = (40 / 180) * Math.PI; // Radians
var PositiveZAxis = new CANNON.Vec3(0, 0, 1);
var NegativeZAxis = new CANNON.Vec3(0, 0, -1);
var SpeedBoostMin = 2; // Min speed to give ballspeed boost
var SpeedBoostModifier = 0.15;

APP.Physics = function(gravity, ball, myPaddle, opponentPaddle, environment, networking) {
  /**
   * Checks that the ball's velocity vector differs no more than
   * BallMaxZAngle from the given vector (Z- / Z+ axes), and if it does,
   * adjusts the vector.
   */
  this.adjustBallVelocityVector = function(axis) {
    var ballv = ball.physicsBody.velocity;

    // Calculate the current angle
    var unitv = ballv.unit();
    var origAngle = Math.acos(axis.dot(unitv));

    if ((origAngle < (Math.PI / 2)) && (origAngle > BallMaxZAngle)) {
      // Ok ball is moving towards opponent but at too steep an angle; adjust
      // by rotating the velocity towards the axis vector by angle difference
      var angleDifference = origAngle - BallMaxZAngle;
      var rotationAxis = unitv.cross(axis);
      var quaternion = new CANNON.Quaternion();
      quaternion.setFromAxisAngle(rotationAxis, angleDifference);
      quaternion.vmult(ballv, ball.physicsBody.velocity);
    }
  };

  /**
   Processes a contact with the ball and another body.
   *
   * @param body physics body in contact with the ball
   * @param localR the contact point in body's local coordinates. undefined if
   * the body is not one of the paddles
   * @param ballWorldR contact point in world space
   */
  this.processBallContact = function(body, localR, ballWorldR) {
    assert(APP.Model.difficulty.ballspeed, 'Must be defined');

    var ballBody = ball.physicsBody;
    var ballv = ballBody.velocity;
    var ballp = ballBody.position;
    var pw2 = (myPaddle.Width / 2);
    var ph2 = (myPaddle.Height / 2);

    if (body.id === myPaddle.physicsBody.id) {
      // Add a surface impulse from the striking paddle's velocity
      // to induce spin in the ball
      var v = myPaddle.physicsBody.velocity;
      var impulse = v.scale(0.1);
      ball.physicsBody.applyImpulse(impulse, ballWorldR);

      // Adjust ball bounce angle slightly by the contact point
      ballv.x += ((localR.x / pw2) * BallBounceAngleModifier);
      ballv.y += ((localR.y / ph2) * BallBounceAngleModifier);

      var speed = v.length();
      if (speed >= SpeedBoostMin) {
        ball.speedMultiplier += (speed - SpeedBoostMin) * SpeedBoostModifier;
      }

      // Make sure the ball's velocity is not at too steep angle
      this.adjustBallVelocityVector(NegativeZAxis);
    } else if (body.id === opponentPaddle.physicsBody.id) {
      // Only handle opponent paddle collisions in single player mode
      if (isSinglePlayer()) {
        // Adjust ball bounce angle slightly by the contact point
        ballv.x += ((localR.x / pw2) * BallBounceAngleModifier);
        ballv.y += ((localR.y / ph2) * BallBounceAngleModifier);

        // Make sure the ball's velocity is not at too steep angle
        this.adjustBallVelocityVector(PositiveZAxis);

        ball.speedMultiplier = 1;
      }
    }

    if (body.id !== myPaddle.physicsBody.id) {
      // Hit something else than my paddle; dampen the angular velocity (spin)
      ballBody.angularVelocity.scale(0.80, ballBody.angularVelocity);
    }

    // If hit anything else then opponent's paddle while in sinpleplayer mode,
    // update the computer player's prediction of where the ball will hit
    if (isSinglePlayer()) {
      if (body.id === opponentPaddle.physicsBody.id) {
        // Opponent paddle hit in single player mode; start moving to center
        opponentPaddle.setMovementTarget(opponentPaddleStartLocation);
      } else {
        var ray = new THREE.Ray(ballp, ballv.unit());
        var intersectPoint = ray.intersectPlane(this.opponentIntersectPlane);
        opponentPaddle.setMovementTarget(intersectPoint);
      }
    }

    // Make sure the ball is moving at correct speed after the contact
    ball.speedMultiplier =
      Math.min(MaxBallSpeedMultiplier, ball.speedMultiplier);
   // console.log('speedMultiplier', ball.speedMultiplier);
    var ballSpeed = APP.Model.difficulty.ballspeed * ball.speedMultiplier;
    ballv.unit(ballv).scale(ballSpeed, ballv);

    // console.log('ball.speedMultiplier: ', ball.speedMultiplier);

    // Send state updates to network if in multiplayer mode
    if (APP.Model.gameMode === APP.GameMode.MultiPlayer) {
      if ((body.id === myPaddle.physicsBody.id) ||
        (APP.Model.multiplayer.youAreHost && (body.id !== opponentPaddle.physicsBody.id))) {
        // Host sends all updates except contact with opponent paddle (both handle
        // their own paddle contacts). Non-host sends contacts with own paddle only.
        console.log('physics: sending ball update after contact');
        networking.updateBallState(ballp, ballv, ball.physicsBody.angularVelocity);
      }
    }
  };

  // Callback for world post step event (called each time world has updated)
  this.onWorldPostStep = function() {
    if (this.world.contacts.length === 0) {
      // Nothing to do
      return;
    }

    // Extract the 'other' object (another being always the ball) and its r
    var c = this.world.contacts[0];
    var r, body, ballR;

    if (c.bi.id === ball.physicsBody.id) {
      ballR = c.ri;
      body = c.bj;
      r = c.rj;
    } else if (c.bj.id === ball.physicsBody.id) {
      ballR = c.rj;
      body = c.bi;
      r = c.ri;
    } else {
      console.log('Invalid contact; ball not present!');
      return;
    }

    if ((body.id == myPaddle.physicsBody.id) ||
      (body.id === opponentPaddle.physicsBody.id)) {
      // Calculate contact point in body's local coordinate space
      var worldR = body.position.vadd(r);
      var localR = body.pointToLocalFrame(worldR);
      var ballWorldR = ball.physicsBody.position.vadd(ballR);

      this.processBallContact(body, localR, ballWorldR);
    } else {
      this.processBallContact(body);
    }
  };

  // Called by the main loop to generate physics step
  this.update = function(time) {
    if (this.lastTickTime) {
      // Update (step) physics simulation
      var dt = (time - this.lastTickTime) / 1000;
      this.world.step(PhysicsFixedTimeStep, dt, PhysicsMaxSubSteps);
    }

    // Call these from here to ensure it is called after executing the step
    ball.onWorldPostStep();
    if (opponentPaddle.movementTarget) {
      opponentPaddle.moveTowardsTarget();
    };

    this.lastTickTime = time;
  };

  // Initialize physics
  this.init = function(gravity, ball, myPaddle, opponentPaddle, environment) {
    this.world = new CANNON.World();
    this.world.gravity.set(0, gravity, 0);
    this.world.addEventListener('postStep', this.onWorldPostStep.bind(this));

    // Add physics bodies to the simulation
    this.world.addBody(ball.physicsBody);
    this.world.addBody(environment.physicsBody);
    this.world.addBody(myPaddle.physicsBody);
    this.world.addBody(opponentPaddle.physicsBody);

    // Create an intersect plane for computer opponent to guess where the ball
    // is coming. Make it match the opponent paddle's z depth.
    this.opponentIntersectPlane = new THREE.Plane(PositiveZAxis,
      -opponentPaddle.position.z);
  };

  this.init(gravity, ball, myPaddle, opponentPaddle, environment);
}

APP.Physics.constructor = APP.Physics;
