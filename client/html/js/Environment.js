// Define namespace
var APP = APP || {};

function createMaterial(texture) {
  return new THREE.MeshPhongMaterial({
    color: 0xDDDDDD,
    side: THREE.DoubleSide,
    specular: 0x222222,
    shininess: 35,
    map: texture
  });
}

APP.Environment = function() {
  this.Width = 3;
  this.Height = 2.2;
  this.Length = 12;

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

  var faceMaterials = [
    createMaterial(texture1),
    createMaterial(texture1),
    createMaterial(texture2),
    createMaterial(texture2),
    createMaterial(texture1),
    createMaterial(texture1)
  ];
  var material = new THREE.MeshFaceMaterial(faceMaterials);

  THREE.Mesh.call(this, geometry, material);
};

APP.Environment.prototype = Object.create(THREE.Mesh.prototype);
APP.Environment.constructor = APP.Environment;
