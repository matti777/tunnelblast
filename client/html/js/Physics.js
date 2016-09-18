// Define namespace
var APP = APP || {};

// Constants
var PhysicsFixedTimeStep = 1.0 / 60.0; // Seconds. Do not change.
var PhysicsMaxSubSteps = 3; // Do not change.
var BallMinZSpeed = 1; // The ball must move at least this fast in z-dir
var BallMaxZAngle = (25 / 180) * Math.PI; // Radians
var OpponentPaddleMaxSpeed = 0.2; // m/s
var PositiveZAxis = new CANNON.Vec3(0, 0, 1);
var NegativeZAxis = new CANNON.Vec3(0, 0, -1);

APP.Physics = function(gravity, ball, myPaddle, opponentPaddle, environment) {
  /**
   * Checks that the ball's velocity vector differs no more than
   * BallMaxZAngle from the given vector (Z- / Z+ axes), and if it does,
   * adjusts the vector.
   */
  this.adjustBallVelocityVector = function(axis) {
    var ballv = this.ball.physicsBody.velocity;

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
      var newVelocity = quaternion.vmult(ballv, this.ball.physicsBody.velocity);
    }
  };

  /**
   Processes a contact with the ball and another body.
   *
   * @param body physics body in contact with the ball
   * @oaram localR the contact point in body's local coordinates. undefined if
   * the body is not one of the paddles
   */
  this.processContact = function(body, localR) {
    var ballv = this.ball.physicsBody.velocity;
    var ballp = this.ball.physicsBody.position;

    // console.log('ball velocity', ballv);

    if (body.id == this.myPaddle.physicsBody.id) {
      // Adjust ball bounce angle slightly by the contact point
      var multiplier = 0.4;
      ballv.x += ((localR.x / (this.myPaddle.Width / 2)) * multiplier);
      ballv.y += ((localR.y / (this.myPaddle.Height / 2)) * multiplier);

      // Make sure the ball's velocity is not at too steep angle
      this.adjustBallVelocityVector(NegativeZAxis);
    }

    // If hit anything else then opponent's paddle while in sinpleplayer mode,
    // update the computer player's prediction of where the ball will hit
    if ((APP.gameType === APP.GameTypes.SinglePlayer) &&
      (body.id !== this.opponentPaddle.physicsBody.id)) {
      console.log('Correcting hit estimate..');
      var ray = new THREE.Ray(ballp, ballv.unit());
      var intersectPoint = ray.intersectPlane(this.opponentIntersectPlane);
      if (intersectPoint) {
        console.log('new intersectPoint is', intersectPoint);
        //TODO update the computer opponents velocity = moving direction * OpponentPaddleMaxSpeed

      }
    }
  }

  // Callback for world post step event (called each time world has updated)
  this.onWorldPostStep = function() {
    if (this.world.contacts.length === 0) {
      // Nothing to do
      return;
    }

    // Extract the 'other' object (another being always the ball) and its r
    var c = this.world.contacts[0];
    var r, body;

    if (c.bi.id === this.ball.physicsBody.id) {
      body = c.bj;
      r = c.rj;
    } else if (c.bj.id === this.ball.physicsBody.id) {
      body = c.bi;
      r = c.ri;
    } else {
      console.log('Invalid contact; ball not present!');
      return;
    }

    if ((body.id == this.myPaddle.physicsBody.id) ||
      (body.id === this.opponentPaddle.physicsBody.id)) {
      // Calculate contact point in body's local coordinate space
      var worldR = body.position.vadd(r);
      var localR = body.pointToLocalFrame(worldR);
      this.processContact(body, localR);
    } else {
      this.processContact(body);
    }
  };

  // Called by the main loop to generate physics step
  this.update = function(time) {
    if (this.lastTickTime) {
      // Update (step) physics simulation
      var dt = (time - this.lastTickTime) / 1000;
      this.world.step(PhysicsFixedTimeStep, dt, PhysicsMaxSubSteps);
    }

    this.lastTickTime = time;
  };

  // Initialize physics
  this.init = function(gravity, ball, myPaddle, opponentPaddle, environment) {
    this.ball = ball;
    this.myPaddle = myPaddle;
    this.opponentPaddle = opponentPaddle;

    this.world = new CANNON.World();
    this.world.gravity.set(0, gravity, 0);
    this.world.addEventListener('postStep', this.onWorldPostStep.bind(this));
    this.world.addEventListener('postStep', ball.onWorldPostStep.bind(ball));

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
