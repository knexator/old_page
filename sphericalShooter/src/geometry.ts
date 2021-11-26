import * as twgl from "../external/twgl-full";

function createBufferInfoFunc(fn) {
  return function (gl: WebGLRenderingContext) {
    var arrays = fn.apply(null, Array.prototype.slice.call(arguments, 1));
    return twgl.createBufferInfoFromArrays(gl, arrays);
  };
}

export var createCustomCubeBufferInfo = createBufferInfoFunc(createCubeVertices);

var CUBE_FACE_INDICES = [[3, 7, 5, 1], // right
[6, 2, 0, 4], // left
[6, 7, 3, 2], // ??
[0, 1, 5, 4], // ??
[7, 6, 4, 5], // front
[2, 3, 1, 0] // back
];
/**
 * Creates a BufferInfo for a cube.
 *
 * The cube is created around the origin. (-size / 2, size / 2).
 *
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext.
 * @param {number} [size] width, height and depth of the cube.
 * @return {module:twgl.BufferInfo} The created BufferInfo.
 * @memberOf module:twgl/primitives
 * @function createCubeBufferInfo
 */

/**
 * Creates the buffers and indices for a cube.
 *
 * The cube is created around the origin. (-size / 2, size / 2).
 *
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext.
 * @param {number} [size] width, height and depth of the cube.
 * @return {Object.<string, WebGLBuffer>} The created buffers.
 * @memberOf module:twgl/primitives
 * @function createCubeBuffers
 */

/**
 * Creates the vertices and indices for a cube.
 *
 * The cube is created around the origin. (-size / 2, size / 2).
 *
 * @param {number} [size] width, height and depth of the cube.
 * @return {Object.<string, TypedArray>} The created vertices.
 * @memberOf module:twgl/primitives
 */

function createCubeVertices(size?: number) {
  size = size || 1;
  var k = size / 2;
  var cornerVertices = [[-k, -k, -k, 1], [+k, -k, -k, 1], [-k, +k, -k, 1], [+k, +k, -k, 1], [-k, -k, +k, 1], [+k, -k, +k, 1], [-k, +k, +k, 1], [+k, +k, +k, 1]];
  var faceNormals = [[+1, +0, +0], [-1, +0, +0], [+0, +1, +0], [+0, -1, +0], [+0, +0, +1], [+0, +0, -1]];
  var uvCoords = [[1, 0], [0, 0], [0, 1], [1, 1]];
  var numVertices = 6 * 4;
  var positions = twgl.primitives.createAugmentedTypedArray(4, numVertices);
  var normals = twgl.primitives.createAugmentedTypedArray(3, numVertices);
  var texcoords = twgl.primitives.createAugmentedTypedArray(2, numVertices);
  var indices = twgl.primitives.createAugmentedTypedArray(3, 6 * 2, Uint16Array);

  for (var f = 0; f < 6; ++f) {
    var faceIndices = CUBE_FACE_INDICES[f];

    for (var v = 0; v < 4; ++v) {
      var position = cornerVertices[faceIndices[v]];
      var normal = faceNormals[f];
      var uv = uvCoords[v]; // Each face needs all four vertices because the normals and texture
      // coordinates are not all the same.

      positions.push(position);
      normals.push(normal);
      texcoords.push(uv);
    } // Two triangles make a square face.


    var offset = 4 * f;
    indices.push(offset + 0, offset + 1, offset + 2);
    indices.push(offset + 0, offset + 2, offset + 3);
  }

  return {
    position: positions,
    normal: normals,
    texcoord: texcoords,
    indices: indices
  };
}



export var createGreatTubeBufferInfo = createBufferInfoFunc(createGreatTubeVertices);
export var createCustomSphereBufferInfo = createBufferInfoFunc(createCustomSphereVertices);

function createGreatTubeVertices(radius: number, thickness: number, radialSubdivisions: number, bodySubdivisions: number, startAngle: number, endAngle: number) {
  if (radialSubdivisions < 3) {
    throw new Error('radialSubdivisions must be 3 or greater');
  }

  if (bodySubdivisions < 3) {
    throw new Error('verticalSubdivisions must be 3 or greater');
  }

  startAngle = startAngle || 0;
  endAngle = endAngle || Math.PI * 2;
  var range = endAngle - startAngle;
  var radialParts = radialSubdivisions + 1;
  var bodyParts = bodySubdivisions + 1;
  var numVertices = radialParts * bodyParts;
  var positions = twgl.primitives.createAugmentedTypedArray(4, numVertices);
  // var normals = twgl.primitives.createAugmentedTypedArray(4, numVertices);
  var texcoords = twgl.primitives.createAugmentedTypedArray(2, numVertices);
  var indices = twgl.primitives.createAugmentedTypedArray(4, radialSubdivisions * bodySubdivisions * 2, Uint16Array);

  for (var slice = 0; slice < bodyParts; ++slice) {
    var v = slice / bodySubdivisions;
    var sliceAngle = v * Math.PI * 2;
    // var sliceSin = Math.sin(sliceAngle);
    // var ringRadius = radius + sliceSin * thickness;
    // var ny = Math.cos(sliceAngle);
    // var y = ny * thickness;

    for (var ring = 0; ring < radialParts; ++ring) {
      var u = ring / radialSubdivisions;
      var ringAngle = startAngle + u * range;
      // var xSin = Math.sin(ringAngle);
      // var zCos = Math.cos(ringAngle);
      // var x = xSin * ringRadius;
      // var z = zCos * ringRadius;
      // var nx = xSin * sliceSin;
      // var nz = zCos * sliceSin;
      let x = Math.cos(ringAngle) * radius
      let y = Math.sin(ringAngle) * radius
      let z = Math.cos(sliceAngle) * thickness
      let w = Math.sin(sliceAngle) * thickness
      positions.push(x, y, z, w);
      // normals.push(nx, ny, nz);
      texcoords.push(u, 1 - v);
    }
  }

  for (var _slice = 0; _slice < bodySubdivisions; ++_slice) {
    // eslint-disable-line
    for (var _ring = 0; _ring < radialSubdivisions; ++_ring) {
      // eslint-disable-line
      var nextRingIndex = 1 + _ring;
      var nextSliceIndex = 1 + _slice;
      indices.push(radialParts * _slice + _ring, radialParts * nextSliceIndex + _ring, radialParts * _slice + nextRingIndex);
      indices.push(radialParts * nextSliceIndex + _ring, radialParts * nextSliceIndex + nextRingIndex, radialParts * _slice + nextRingIndex);
    }
  }

  return {
    position: positions,
    // normal: normals,
    texcoord: texcoords,
    indices: indices
  };
}

function createCustomSphereVertices(radius, subdivisionsAxis, subdivisionsHeight, opt_startLatitudeInRadians, opt_endLatitudeInRadians, opt_startLongitudeInRadians, opt_endLongitudeInRadians) {
  if (subdivisionsAxis <= 0 || subdivisionsHeight <= 0) {
    throw new Error('subdivisionAxis and subdivisionHeight must be > 0');
  }

  opt_startLatitudeInRadians = opt_startLatitudeInRadians || 0;
  opt_endLatitudeInRadians = opt_endLatitudeInRadians || Math.PI;
  opt_startLongitudeInRadians = opt_startLongitudeInRadians || 0;
  opt_endLongitudeInRadians = opt_endLongitudeInRadians || Math.PI * 2;
  var latRange = opt_endLatitudeInRadians - opt_startLatitudeInRadians;
  var longRange = opt_endLongitudeInRadians - opt_startLongitudeInRadians; // We are going to generate our sphere by iterating through its
  // spherical coordinates and generating 2 triangles for each quad on a
  // ring of the sphere.

  var numVertices = (subdivisionsAxis + 1) * (subdivisionsHeight + 1);
  var positions = twgl.primitives.createAugmentedTypedArray(4, numVertices);
  // var normals = twgl.primitives.createAugmentedTypedArray(3, numVertices);
  var texcoords = twgl.primitives.createAugmentedTypedArray(2, numVertices); // Generate the individual vertices in our vertex buffer.

  for (var y = 0; y <= subdivisionsHeight; y++) {
    for (var x = 0; x <= subdivisionsAxis; x++) {
      // Generate a vertex based on its spherical coordinates
      var u = x / subdivisionsAxis;
      var v = y / subdivisionsHeight;
      var theta = longRange * u + opt_startLongitudeInRadians;
      var phi = latRange * v + opt_startLatitudeInRadians;
      var sinTheta = Math.sin(theta);
      var cosTheta = Math.cos(theta);
      var sinPhi = Math.sin(phi);
      var cosPhi = Math.cos(phi);
      var ux = cosTheta * sinPhi;
      var uy = cosPhi;
      var uz = sinTheta * sinPhi;
      positions.push(radius * ux, radius * uy, radius * uz, 1.0);
      // normals.push(ux, uy, uz);
      texcoords.push(1 - u, v);
    }
  }

  var numVertsAround = subdivisionsAxis + 1;
  var indices = twgl.primitives.createAugmentedTypedArray(3, subdivisionsAxis * subdivisionsHeight * 2, Uint16Array);

  for (var _x2 = 0; _x2 < subdivisionsAxis; _x2++) {
    // eslint-disable-line
    for (var _y = 0; _y < subdivisionsHeight; _y++) {
      // eslint-disable-line
      // Make triangle 1 of quad.
      indices.push((_y + 0) * numVertsAround + _x2, (_y + 0) * numVertsAround + _x2 + 1, (_y + 1) * numVertsAround + _x2); // Make triangle 2 of quad.

      indices.push((_y + 1) * numVertsAround + _x2, (_y + 0) * numVertsAround + _x2 + 1, (_y + 1) * numVertsAround + _x2 + 1);
    }
  }

  return {
    position: positions,
    // normal: normals,
    texcoord: texcoords,
    indices: indices
  };
}
