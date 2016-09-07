// Define namespace
var APP = APP || {};

APP.Paddle = function(type) {
  assert(type, 'Type must be defined');
  assert(type === APP.Paddle.Type.Mine || type === APP.Paddle.Type.Opponent);

  this.Width = 1.2;
  this.Height = this.Width * (683/1024);

  // console.log(type, APP.Paddle.Type.Mine);
  // console.log(type === APP.Paddle.Type.Mine);

  var textureName = (type === APP.Paddle.Type.Mine) ?
    'textures/my-paddle.png' : 'textures/opponent-paddle.png';

  // console.log('textureName', textureName);

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

APP.Paddle.Type = {
  Mine: 1,
  Opponent: 2
};

APP.Paddle.prototype = Object.create(THREE.Mesh.prototype);
APP.Paddle.constructor = APP.Paddle;
