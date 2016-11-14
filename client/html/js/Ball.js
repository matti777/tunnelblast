// Define namespace
var APP = APP || {};

// How much the ball curves through air due to its angular velocity.
var BallCurveFactor = 0.08;

APP.Ball = function() {
  this.Radius = 0.2;

  /**
   * Called after a physics tick. Updates the ball's position and orientation.
   */
  this.onWorldPostStep = function() {
    // Match the position of the physics body on the visual mesh
    this.position.copy(this.physicsBody.position);

    // Match the orientation of the physics body via quaternion
    this.rotation.setFromQuaternion(this.physicsBody.quaternion);

    var now = moment().utc().valueOf();
    if (this.prevVelocityAdjustTime) {
      // Adjust the velocity (thus, ball trajectory) by the angular velocity
      // ('spin'), to make it curve through the air.
      var timeDelta = (now - this.prevVelocityAdjustTime) / 1000; // seconds

      var v = this.physicsBody.velocity;
      var adjustAxis = this.physicsBody.angularVelocity.clone();
      var magnitude = adjustAxis.normalize() * BallCurveFactor;
      var adjustAngle = magnitude * timeDelta;

      var quaternion = new CANNON.Quaternion();
      quaternion.setFromAxisAngle(adjustAxis, adjustAngle);
      quaternion.vmult(v, v);
    }
    this.prevVelocityAdjustTime = now;
  };

  /**
   * Called when ever the ball velocity has changed (ie. it has hit something)
   */
  this.velocityChanged = function() {
    delete this.prevVelocityAdjustTime;
  };

  this.reset = function() {
    this.speedMultiplier = 1;
    this.position.set(0, 0, 0);
    this.physicsBody.position.setZero();
    this.physicsBody.velocity.setZero();
    this.physicsBody.angularVelocity.setZero();
    delete this.prevVelocityAdjustTime;
  };

  // Initialize Cannon physics
  this.initPhysics = function() {
    this.physicsBody = new CANNON.Body({
      mass: 1, // kg
      material: new CANNON.Material({
        friction: 1,
        restitution: 0.9 // Bounces with no damping
      }),
      position: this.getWorldPosition(),
      shape: new CANNON.Sphere(this.Radius)
    });
  };

  // Initialize threejs visuals
  this.initVisuals = function() {
    var geometry = new THREE.SphereGeometry(this.Radius, 22, 22);

    var material = new THREE.MeshPhongMaterial({
      map: new THREE.TextureLoader().load('textures/ball.jpg')
    });

    THREE.Mesh.call(this, geometry, material);
  };

  this.speedMultiplier = 1;

  this.initVisuals();
  this.initPhysics();
};

APP.Ball.prototype = Object.create(THREE.Mesh.prototype);
APP.Ball.constructor = APP.Ball;
