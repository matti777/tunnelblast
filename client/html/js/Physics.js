// Define namespace
var APP = APP || {};

// Constants
var PhysicsFixedTimeStep = 1.0 / 60.0; // Seconds. Do not change.
var PhysicsMaxSubSteps = 3; // Do not change.
var BallMinZSpeed = 1; // The ball must move at least this fast in z-dir
var OpponentPaddleMaxSpeed = 0.2; // m/s

APP.Physics = function(gravity, ball, myPaddle, opponentPaddle, environment) {

  //TODO move this to Physics.js?
// function onCollision(event) {
//   console.log('Ball collision, velocity', ball.physicsBody.velocity.z);
//
//   //TODO since the velocity only updates AFTER the step (thus outside this callback),
//   // we must store event.contact (eg.) and process it after the physics step has finished!
//
//   var myPaddleId = myPaddle.physicsBody.id;
//   var opponentPaddleId = opponentPaddle.physicsBody.id;
//
//   if (event.body.id === myPaddleId) {
//     var contact = event.contact;
//
//     // console.log('hit my paddle!', event);
//     var r = (contact.bi.id == myPaddleId) ? contact.ri : contact.rj;
//
//     var worldR = myPaddle.physicsBody.position.vadd(r);
//     var localR = myPaddle.physicsBody.pointToLocalFrame(worldR);
//     //console.log('localR', localR);
//     //TODO adjust ball velocity using localR (discard z)
//
//     // Make sure the ball has at least some z velocity
//     // console.log('velocity', ball.physicsBody.velocity);
//
//     if ((ball.physicsBody.velocity.z >= 0) &&
//       (ball.physicsBody.velocity.z < BallMinZSpeed)) {
//       console.log('myPaddle adjusted ball velocity');
//       ball.physicsBody.velocity.z = BallMinZSpeed;
//     }
//   } else if ((APP.gameType === APP.GameTypes.SinglePlayer) &&
//     (event.body.id === opponentPaddleId)) {
//     // We only handle physics for the opponent paddle when in singleplayer mode
//     console.log('Ball hit opponent paddle');
//     // console.log('velocity', ball.physicsBody.velocity);
//
//     //TODO check same stuff as with myPaddle above
//   }
//
//   // If hit anything else then opponent's paddle while in sinpleplayer mode,
//   // update the computer player's prediction of where the ball will hit
//   if ((APP.gameType === APP.GameTypes.SinglePlayer) &&
//     (event.body.id !== opponentPaddleId)) {
//    console.log('Correcting hit estimate..');
//     // Get the current velocity vector and use it to make direction Ray
//     var direction = new THREE.Vector3(ball.physicsBody.velocity).normalize();
//     var ray = new THREE.Ray(ball.physicsBody.position, direction);
//
//     var intersectPoint = ray.intersectPlane(opponentIntersectPlane);
//     if (intersectPoint) {
//       console.log('new intersectPoint is', intersectPoint);
//       //TODO update the computer opponents velocity = moving direction * OpponentPaddleMaxSpeed
//
//     }
//   }
// }

  /**
   Processes a contact with the ball and another body.
   *
   * @param body physics body in contact with the ball
   * @oaram localR the contact point in body's local coordinates. undefined if
   * the body is not one of the paddles
   */
  this.processContact = function(body, localR) {
    var ballv = this.ball.physicsBody.velocity;
    console.log('ball velocity', ballv);

    if (body.id == this.myPaddle.physicsBody.id) {
      // Adjust ball bounce angle slightly by the contact point
      var relX = localR.x / (this.myPaddle.Width / 2);
      ballv.x += relX;
      var relY = localR.y / (this.myPaddle.Width / 2);
      ballv.y += relY;

      // Make sure the ball's z velocity is at least BallMinZSpeed
      //TODO instead of doing this, rotate the vector towards Z- axis so that its length is preserved
      if ((ball.physicsBody.velocity.z < 0) &&
        (ball.physicsBody.velocity.z > -BallMinZSpeed)) {
        console.log('myPaddle adjusted ball velocity');
        ball.physicsBody.velocity.z = -BallMinZSpeed;
      }
    }

    // If hit anything else then opponent's paddle while in sinpleplayer mode,
    // update the computer player's prediction of where the ball will hit
    if ((APP.gameType === APP.GameTypes.SinglePlayer) &&
      (body.id !== this.opponentPaddle.physicsBody.id)) {
      console.log('Correcting hit estimate..');
      // Get the current velocity vector and use it to make direction Ray
      var direction = new THREE.Vector3(this.ball.physicsBody.velocity).normalize();
      var ray = new THREE.Ray(this.ball.physicsBody.position, direction);

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
    this.opponentIntersectPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1),
      -opponentPaddle.position.z);
  };

  this.init(gravity, ball, myPaddle, opponentPaddle, environment);
}

APP.Physics.constructor = APP.Physics;
