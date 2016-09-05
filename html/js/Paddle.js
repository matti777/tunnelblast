// Define namespace
var APP = APP || {};

APP.Paddle = function() {
  this.Width = 1;
  this.Height = this.Width * (683/1024);

  var geometry = new THREE.PlaneGeometry(this.Width, this.Height);
  var textureMap = new THREE.TextureLoader().load('textures/paddle.png');
  textureMap.minFilter = THREE.LinearFilter;

  var material = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    map: textureMap,
  });

  THREE.Mesh.call(this, geometry, material);
};

APP.Paddle.prototype = Object.create(THREE.Mesh.prototype);
APP.Paddle.constructor = APP.Paddle;
