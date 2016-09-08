// Define namespace
var APP = APP || {};

APP.Environment = function() {
  this.Width = 3;
  this.Height = 2.2;
  this.Length = 12;

  this.createMaterial = function createMaterial(texture) {
    return new THREE.MeshPhongMaterial({
      color: 0xDDDDDD,
      side: THREE.DoubleSide,
      specular: 0x222222,
      shininess: 35,
      map: texture
    });
  }

  function addPlane(body, axis, angle, position) {
    var shape = new CANNON.Plane();
    var quaternion = new CANNON.Quaternion();
    quaternion.setFromAxisAngle(axis, angle);
    body.addShape(shape, position, quaternion);
  }

  this.createPhysicsBody = function createPhysicsBody() {
    this.physicsBody = new CANNON.Body({
      mass: 0, // mass == 0 makes the body static
      material: new CANNON.Material({
        friction: 0.0,
        restitution: 1.0
      }),
    });

    // Create a collision plane for floor, ceiling and walls
    var pi2 = Math.PI / 2;
    addPlane(this.physicsBody, new CANNON.Vec3(1, 0, 0), -pi2,
      new CANNON.Vec3(0, -this.Height / 2, 0));
    addPlane(this.physicsBody, new CANNON.Vec3(1, 0, 0), pi2,
      new CANNON.Vec3(0, this.Height / 2, 0));
    addPlane(this.physicsBody, new CANNON.Vec3(0, 1, 0), pi2,
      new CANNON.Vec3(-this.Width / 2, 0, 0));
    addPlane(this.physicsBody, new CANNON.Vec3(0, 1, 0), -pi2,
      new CANNON.Vec3(this.Width / 2, 0, 0));

    //TODO remove this when done testing, this is the back wall which we dont need
    addPlane(this.physicsBody, new CANNON.Vec3(0, 1, 0), 0,
      new CANNON.Vec3(0, 0, -this.Length / 2));
  };

  this.createPhysicsBody();

  var geometry = new THREE.BoxGeometry(this.Width, this.Height, this.Length);

  var texture1 = new THREE.Texture();
  texture1.wrapS = THREE.RepeatWrapping;
  texture1.wrapT = THREE.RepeatWrapping;
  texture1.repeat.set(6, 2);
  var texture2 = new THREE.Texture();
  texture2.wrapS = THREE.RepeatWrapping;
  texture2.wrapT = THREE.RepeatWrapping;
  texture2.repeat.set(2, 3);

  var imageLoader = new THREE.ImageLoader();
  imageLoader.load('textures/tunnel_wall.jpg', function onLoaded(image) {
    texture1.image = image;
    texture1.needsUpdate = true;
    texture2.image = image;
    texture2.needsUpdate = true;
  });

  //TODO reuse these materials!
  var faceMaterials = [
    this.createMaterial(texture1),
    this.createMaterial(texture1),
    this.createMaterial(texture2),
    this.createMaterial(texture2),
    this.createMaterial(texture1),
    this.createMaterial(texture1)
  ];
  var material = new THREE.MeshFaceMaterial(faceMaterials);

  THREE.Mesh.call(this, geometry, material);
};

APP.Environment.prototype = Object.create(THREE.Mesh.prototype);
APP.Environment.constructor = APP.Environment;
