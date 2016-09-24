// Define namespace
var APP = APP || {};

APP.Ball = function() {
  this.Radius = 0.2;

  // Called after a physics tick. Updates the ball's position and orientation
  this.onWorldPostStep = function() {
    // Match the position of the physics body on the visual mesh
    this.position.copy(this.physicsBody.position);

    // Match the orientation of the physics body via quaternion
    // this.quaternion.copy(this.physicsBody.quaternion);
   // this.matrix.makeRotationFromQuaternion(this.physicsBody.quaternion)
    //this.matrix.makeRotationX(angle);
    this.rotation.setFromQuaternion(this.physicsBody.quaternion);
//    console.log('rotation', this.rotation);
    //console.log('angle', angle);
   // this.matrixWorldNeedsUpdate = true;
    //console.log('quaternion: ', this.physicsBody.quaternion);
  };

  this.reset = function() {
    this.speedMultiplier = 1;
    this.position.set(0, 0, 0);
    this.physicsBody.position.set(0, 0, 0);
    this.physicsBody.velocity.set(0, 0, 0);
  }

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
    var geometry = new THREE.SphereGeometry(this.Radius, 4, 4);

    var material = new THREE.MeshPhongMaterial({
      color: 0x2222FF,
      opacity: 0.8
    });

    THREE.Mesh.call(this, geometry, material);
  };

  this.speedMultiplier = 1;

  this.initVisuals();
  this.initPhysics();
};

APP.Ball.prototype = Object.create(THREE.Mesh.prototype);
APP.Ball.constructor = APP.Ball;
