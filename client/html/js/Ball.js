// Define namespace
var APP = APP || {};

APP.Ball = function() {
  this.Radius = 0.2;

  // Called after a physics tick. Updates the ball's position and orientation
  this.onWorldPostStep = function() {
    // Match the position of the physics body on the visual mesh
    this.position.copy(this.physicsBody.position);

    //TODO Make the ball tracjectory curved based on the angular velocity
    //TODO make sure the speed (len of velocity) remains the same!
    //this.physicsBody.velocity.x += this.physicsBody.angularVelocity.x / 10;

    //TODO rotate ball velocity around ball.physicsBody.angularVelocity vector,
    // by ball.physicsBody.angularVelocity.length() radians / second.

    // Match the orientation of the physics body via quaternion
    this.rotation.setFromQuaternion(this.physicsBody.quaternion);
  };

  this.reset = function() {
    this.speedMultiplier = 1;
    this.position.set(0, 0, 0);
    this.physicsBody.position.setZero();
    this.physicsBody.velocity.setZero();
    this.physicsBody.angularVelocity.setZero();
  };

  // Initialize Cannon physics
  this.initPhysics = function() {
    this.physicsBody = new CANNON.Body({
      mass: 1, // kg
      material: new CANNON.Material({
        friction: 10,
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
