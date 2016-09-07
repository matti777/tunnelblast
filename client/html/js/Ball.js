// Define namespace
var APP = APP || {};

APP.Ball = function() {
  this.Radius = 0.3;

  var geometry = new THREE.SphereGeometry(this.Radius, 22, 22);

  var material = new THREE.MeshPhongMaterial({
    color: 0x2222FF,
    opacity: 0.8
  });

  THREE.Mesh.call(this, geometry, material);
};

APP.Ball.prototype = Object.create(THREE.Mesh.prototype);
APP.Ball.constructor = APP.Ball;
