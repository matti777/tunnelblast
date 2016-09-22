// Define namespace
var APP = APP || {};

APP.Ball = function() {
  this.Radius = 0.2;

  // Called after a physics tick. Updates the ball's position and orientation
  this.onWorldPostStep = function() {
    this.position.copy(this.physicsBody.position);
    //TODO update orientation using quaternion
  };

  this.reset = function() {
    this.position.set(0, 0, 0);
    this.physicsBody.position.set(0, 0, 0);
    this.physicsBody.velocity.set(0, 0, 0);
  }
  // this.moveTo = function(location) {
  //   this.position.copy(location);
  //   this.physicsBody.position.copy(location);
  // };

  // Initialize Cannon physics
  this.initPhysics = function() {
    this.physicsBody = new CANNON.Body({
      mass: 1, // kg
      material: new CANNON.Material({
        friction: 0.0,
        restitution: 1.0 // Bounces with no damping
      }),
      position: this.getWorldPosition(),
      shape: new CANNON.Sphere(this.Radius)
    });
  };

    // Initialize threejs visuals
  this.initVisuals = function() {
    var geometry = new THREE.SphereGeometry(this.Radius, 22, 22);

    var material = new THREE.MeshPhongMaterial({
      color: 0x2222FF,
      opacity: 0.8
    });

    THREE.Mesh.call(this, geometry, material);
  };

  this.initVisuals();
  this.initPhysics();
};

APP.Ball.prototype = Object.create(THREE.Mesh.prototype);
APP.Ball.constructor = APP.Ball;
