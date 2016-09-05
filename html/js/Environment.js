// Define namespace
var APP = APP || {};

APP.Environment = function() {
  this.Width = 3;
  this.Height = 2.2;
  this.Length = 15;

  var geometry = new THREE.BoxGeometry(this.Width, this.Height, this.Length);
  var textureMap = new THREE.TextureLoader().load('textures/tunnel_wall.jpg');
  textureMap.wrapS = THREE.RepeatWrapping;
  textureMap.wrapT = THREE.RepeatWrapping;
  textureMap.repeat.set(4, 4);

  var material = new THREE.MeshPhongMaterial({
    color: 0xDDDDDD,
    side: THREE.DoubleSide,
    specular: 0x222222,
    shininess: 35,
    map: textureMap,
    //normalMap: normalMap,
    //normalScale: new THREE.Vector2(1, 1)
  });

  THREE.Mesh.call(this, geometry, material);
};

APP.Environment.prototype = Object.create(THREE.Mesh.prototype);
APP.Environment.constructor = APP.Environment;
