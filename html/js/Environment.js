// Define namespace
var APP = APP || {};

APP.Environment = function() {
  var geometry = new THREE.BoxGeometry(20, 10, 50);
  var textureMap = new THREE.TextureLoader().load('textures/rock_wall.jpg');
  textureMap.wrapS = THREE.RepeatWrapping;
  textureMap.wrapT = THREE.RepeatWrapping;
  textureMap.repeat.set(4, 4);
  
  var material = new THREE.MeshPhongMaterial({
    color: 0xdddddd,
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
