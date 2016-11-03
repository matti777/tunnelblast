// Define namespace
var APP = APP || {};

APP.Environment = function() {
  this.Width = 3;
  this.Height = 2.2;
  this.Length = 8;

  function addPlane(body, axis, angle, position) {
    var shape = new CANNON.Plane();
    var quaternion = new CANNON.Quaternion();
    quaternion.setFromAxisAngle(axis, angle);
    body.addShape(shape, position, quaternion);
  }

  // Initialize Cannon physics
  this.initPhysics = function() {
    this.physicsBody = new CANNON.Body({
      mass: 0, // mass == 0 makes the body static
      material: new CANNON.Material({
        friction: 10,
        restitution: 0.9
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
    // addPlane(this.physicsBody, new CANNON.Vec3(0, 1, 0), 0,
    //   new CANNON.Vec3(0, 0, -this.Length / 2));
  };

  // Create a material for the given texture
  function createMaterial(texture, normalMapTexture) {
    return new THREE.MeshPhongMaterial({
      color: 0xDDDDDD,
      side: THREE.DoubleSide,
      specular: 0x222222,
      shininess: 195,
      normalScale: new THREE.Vector2(4, 4),
      map: texture,
      normalMap: normalMapTexture
    });
  }

  // Initialize threejs visuals
  this.initVisuals = function() {
    var geometry = new THREE.BoxGeometry(this.Width, this.Height, this.Length);

    // Create & load texture maps
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

    // Create & load normal maps
    var normalMap1 = new THREE.Texture();
    normalMap1.wrapS = THREE.RepeatWrapping;
    normalMap1.wrapT = THREE.RepeatWrapping;
    normalMap1.repeat.set(6, 2);
    var normalMap2 = new THREE.Texture();
    normalMap2.wrapS = THREE.RepeatWrapping;
    normalMap2.wrapT = THREE.RepeatWrapping;
    normalMap2.repeat.set(2, 3);

    imageLoader.load('textures/tunnel_wall_normalmap.jpg', function onLoaded(image) {
      normalMap1.image = image;
      normalMap1.needsUpdate = true;
      normalMap2.image = image;
      normalMap2.needsUpdate = true;
    });

    // Create different materials for walls and floor/ceiling
    var material1 = createMaterial(texture1, normalMap1);
    var material2 = createMaterial(texture2, normalMap2);

    var faceMaterials = [
      material1, material1, material2, material2, material2,
      material1, material1
    ];
    var meshMaterial = new THREE.MeshFaceMaterial(faceMaterials);

    THREE.Mesh.call(this, geometry, meshMaterial);
  };

  this.initVisuals();
  this.initPhysics();
};

APP.Environment.prototype = Object.create(THREE.Mesh.prototype);
APP.Environment.constructor = APP.Environment;
