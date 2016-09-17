// Define namespace
var APP = APP || {};

// Constants
var PhysicsFixedTimeStep = 1.0 / 60.0; // Seconds. Do not change.
var PhysicsMaxSubSteps = 3; // Do not change.

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

  // Callback for world post step event (called each time world has updated)
  this.onWorldPostStep = function() {

    if (this.world.contacts.length === 0) {
      // Nothing to do
      return;
    }

    //TODO move onCollision stuff here

    console.log('contact; ball velocity: ', ball.physicsBody.velocity);
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
  };

  this.init(gravity, ball, myPaddle, opponentPaddle, environment);
}

APP.Physics.constructor = APP.Physics;
