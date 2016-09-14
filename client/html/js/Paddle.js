// Define namespace
var APP = APP || {};

APP.Paddle = function(type) {
  assert(type, 'Type must be defined');
  assert(type === APP.Paddle.Type.Mine || type === APP.Paddle.Type.Opponent);

  this.Width = 1.2;
  this.Height = this.Width * (683/1024);

  // Called when user moves the paddle
  this.moveTo = function(newPosition, environment) {
    assert(newPosition, 'Mandatory param missing');
    assert(environment, 'Mandatory param missing');

    // Bound paddle movement by the walls
    var pw2 = (this.Width / 2);
    var ew2 = (environment.Width / 2);
    var ph2 = (this.Height / 2);
    var eh2 = (environment.Height / 2);

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
