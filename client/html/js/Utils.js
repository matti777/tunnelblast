function assert(condition, message) {
  if (!condition) {
    message = message || "Assertion failed";
    if (typeof Error !== "undefined") {
      throw new Error(message);
    }
    throw message; // Fallback
  }
}

// Creates a CANNON.Vec3 out of a THREE.Vector3
function cannonVec3(v) {
  return new CANNON.Vec3(v.x, v.y, v.z);
}

// Copies a CANNON.Vec3 into a THREE.Vec3
THREE.Vector3.prototype.copyCannonVec3 = function(vec) {
  this.x = vec.x;
  this.y = vec.y;
  this.z = vec.z;
};
