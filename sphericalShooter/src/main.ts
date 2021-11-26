// ES6:
import { engine_pre_update, engine_post_update, game_time, delta_time, mouse, wasButtonPressed, wasButtonReleased, wasKeyPressed, isKeyDown } from './engine';
import * as twgl from './../external/twgl-full'
import { vs, fs } from './shaders'
import { Matrix4, Vec4, projMat, identity, negateMat, multMatVec, pureRot, multMatMat, inverse, copyMat } from './math';
import { createCustomCubeBufferInfo, createCustomSphereBufferInfo, createGreatTubeBufferInfo } from './geometry';

twgl.setDefaults({attribPrefix: "a_"});

const gl = document.querySelector('canvas')!.getContext("webgl2")!;
gl.enable(gl.DEPTH_TEST);

const vecX = new Float32Array([1,0,0,0])
const vecY = new Float32Array([0,1,0,0])
const vecZ = new Float32Array([0,0,1,0])
const vecW = new Float32Array([0,0,0,1])

// Passing in attribute names binds attribute location by index
// In WebGL 2 we can also assign locations in GLSL (not sure which is better. This is global)
//
// We need to do this to make sure attirbute locations are consistent across
// programs of else we'd need one vertex array object per program+bufferInfo combination
const attributes = [
  "a_position",
  "a_normal",
  "a_texcoord",
];
const debugUnlitProgramInfo = twgl.createProgramInfo(gl, [vs, fs], attributes);
const programInfos = [debugUnlitProgramInfo];

const arrays = {
  position: {
    numComponents: 4,
    data: [
      -.1, -.1, -1, 0,
      .1, -.1, -1, 0,
      -.1, .1, -1, 0,
      // -.1, .1, -1, 0,
      // .1, -.1, -1, 0,
      .1, .1, -1, 0,
    ],
  },
  texcoord: {
    numComponents: 2,
    type: Uint8Array,
    data: [
       0, 0,
       255, 0,
       0, 255,
       // 0, 255,
       // 255, 0,
       255, 255,
    ],
  },
  /*a_color: {
    numComponents: 3,
    type: Uint8Array,
    data: [
       0, 0, 0,
       255, 0, 0,
       0, 255, 0,
       // 0, 255, 0,
       // 255, 0, 0,
       255, 255, 0,
    ],
  },*/
  indices: [0, 1, 2, 2, 1, 3]
};
const arrays2 = {
  position: {
    numComponents: 4,
    data: [
       0, -.1,  -1, 0,
       0,  .1,  -1, 0,
      .5, -.1, -.5, 0,
      .5,  .1, -.5, 0,
       1, -.1,   0, 0,
       1,  .1,   0, 0,
      .5, -.1,  .5, 0,
      .5,  .1,  .5, 0,
       0, -.1,   1, 0,
       0,  .1,   1, 0,
     -.5, -.1,  .5, 0,
     -.5,  .1,  .5, 0,
      -1, -.1,   0, 0,
      -1,  .1,   0, 0,
     -.5, -.1, -.5, 0,
     -.5,  .1, -.5, 0,
    ],
  },
  /*texcoord: {
    numComponents: 2,
    type: Uint8Array,
    data: [
       0, 0,
       255, 0,
       0, 255,
       255, 255,
    ],
  },*/
  indices: [
    0, 1, 2,    1, 2, 3,
    2, 3, 4,    3, 4, 5,
    4, 5, 6,    5, 6, 7,
    6, 7, 8,    7, 8, 9,
    8, 9,10,    9,10,11,
    10,11,12,  11,12,13,
    12,13,14,  13,14,15,
    14,15,0,  15,0,1,
  ]
};
// const bufferInfo = createCustomCubeBufferInfo(gl, .1);
// const bufferInfo = twgl.primitives.createCubeBufferInfo(gl, .1);
// const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
// const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays2);
// const bufferInfo = createGreatTubeBufferInfo(gl, 1.0, 0.02, 32, 16)
// const vertexArrayInfo = twgl.createVertexArrayInfo(gl, programInfos, bufferInfo);

const shapes = {
  cube: twgl.createVertexArrayInfo(gl, programInfos,
    createCustomCubeBufferInfo(gl, 0.4)),
  greatCircle: twgl.createVertexArrayInfo(gl, programInfos,
    createGreatTubeBufferInfo(gl, 1.0, 0.02, 32, 16)),
  sphere: twgl.createVertexArrayInfo(gl, programInfos,
    createCustomSphereBufferInfo(gl, 0.05, 32, 32, 0, Math.PI, 0, Math.PI * 2)),
  /*quad: twgl.createVertexArrayInfo(gl, programInfos,
    twgl.createBufferInfoFromArrays(gl, arrays)),*/
}

let temp = pureRot(Math.PI / 2, 1, 2);//xz
multMatMat(temp, pureRot(Math.PI / 2, 0, 3), temp)//zw
let myStaticObjects = [
  {
    vertexArrayInfo: shapes.greatCircle,
    transform: identity(),  // xy
  },
  {
    vertexArrayInfo: shapes.greatCircle,
    transform: pureRot(Math.PI / 2, 1, 2), // xz
  },
  {
    vertexArrayInfo: shapes.greatCircle,
    transform: pureRot(Math.PI / 2, 0, 2), // yz
  },
  {
    vertexArrayInfo: shapes.greatCircle,
    transform: pureRot(Math.PI / 2, 1, 3),  //xw
  },
  {
    vertexArrayInfo: shapes.greatCircle,
    transform: pureRot(Math.PI / 2, 0, 3),  // yw
  },
  {
    vertexArrayInfo: shapes.greatCircle,
    transform: temp,  // zw
  },
]

let bullets = [
  /*{
    transform: identity(),
  }*/
]

const z0 = 0.1
const projNear = projMat(z0, true)
const projFar = projMat(z0, false)

let viewInverse = identity();
let view = identity();

let tempMat = identity()

// Called when loading the page
function initOnce() {
  init();
  window.requestAnimationFrame(update);
}

// Called when game is reset
function init() {
}

// Called every frame
function update(curTime: number) {
  engine_pre_update(curTime)

  // rotate -z into w, a positive distance (go forward)
  if (isKeyDown('w')) multMatMat(pureRot(-0.001 * delta_time, 2, 3), viewInverse, viewInverse)
  // rotate z into w, a positive distance (go backward)
  if (isKeyDown('s')) multMatMat(pureRot( 0.001 * delta_time, 2, 3), viewInverse, viewInverse)

  // rotate x into w, a positive distance (go right)
  if (isKeyDown('d')) multMatMat(pureRot( 0.001 * delta_time, 0, 3), viewInverse, viewInverse)
  // rotate -x into w, a positive distance (go left)
  if (isKeyDown('a')) multMatMat(pureRot(-0.001 * delta_time, 0, 3), viewInverse, viewInverse)

  // rotate y into w, a positive distance (go up)
  if (isKeyDown('e')) multMatMat(pureRot( 0.001 * delta_time, 1, 3), viewInverse, viewInverse)
  // rotate -y into w, a positive distance (go up)
  if (isKeyDown('q')) multMatMat(pureRot(-0.001 * delta_time, 1, 3), viewInverse, viewInverse)

  // rotate y into -z, a positive distance (look up)
  if (isKeyDown('i')) multMatMat(pureRot(-0.001 * delta_time, 1, 2), viewInverse, viewInverse)
  // rotate y into z, a positive distance (look down)
  if (isKeyDown('k')) multMatMat(pureRot( 0.001 * delta_time, 1, 2), viewInverse, viewInverse)

  // rotate x into -z, a positive distance (look right)
  if (isKeyDown('l')) multMatMat(pureRot(-0.001 * delta_time, 0, 2), viewInverse, viewInverse)
  // rotate x into z, a positive distance (look left)
  if (isKeyDown('j')) multMatMat(pureRot( 0.001 * delta_time, 0, 2), viewInverse, viewInverse)

  // rotate y into x, a positive distance (roll left)
  if (isKeyDown('u')) multMatMat(pureRot( 0.001 * delta_time, 1, 0), viewInverse, viewInverse)
  // rotate x into y, a positive distance (roll right)
  if (isKeyDown('o')) multMatMat(pureRot( 0.001 * delta_time, 0, 1), viewInverse, viewInverse)
  inverse(viewInverse, view)

  if (wasKeyPressed(' ')) {
    console.log("Pew!")
    bullets.push({
      transform: copyMat(view),
    })
  }

  bullets.forEach(bullet => {
    pureRot(delta_time * 0.002, 2, 3, tempMat),
    multMatMat(bullet.transform, tempMat, bullet.transform);
  })

  twgl.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const commonUniforms = {
    time: game_time * 0.001,
    resolution: [gl.canvas.width, gl.canvas.height],
    u_viewInverse: viewInverse,
  };

  /*myStaticObjects.forEach(obj => {
    pureRot(game_time * 0.001, 1, 2, obj.transform)
  })*/

  gl.useProgram(debugUnlitProgramInfo.program);
  // twgl.setBuffersAndAttributes(gl, debugUnlitProgramInfo, vertexArrayInfo);

  twgl.setUniforms(debugUnlitProgramInfo, commonUniforms);

  // Draw near hemisphere
  twgl.setUniforms(debugUnlitProgramInfo, {
    u_projection: projNear,
  });
  myStaticObjects.forEach(obj => {
    twgl.setUniforms(debugUnlitProgramInfo, {
      u_transform: obj.transform,
    });
    twgl.setBuffersAndAttributes(gl, debugUnlitProgramInfo, obj.vertexArrayInfo);
    twgl.drawBufferInfo(gl, obj.vertexArrayInfo);
  })
  bullets.forEach(obj => {
    // console.log(obj.position);
    twgl.setUniforms(debugUnlitProgramInfo, {
      u_transform: obj.transform,
    });
    twgl.setBuffersAndAttributes(gl, debugUnlitProgramInfo, shapes.sphere);
    twgl.drawBufferInfo(gl, shapes.sphere);
  })
  // Draw far hemisphere
  twgl.setUniforms(debugUnlitProgramInfo, {
    u_projection: projFar,
  });
  myStaticObjects.forEach(obj => {
    twgl.setUniforms(debugUnlitProgramInfo, {
      u_transform: obj.transform,
    });
    twgl.setBuffersAndAttributes(gl, debugUnlitProgramInfo, obj.vertexArrayInfo);
    twgl.drawBufferInfo(gl, obj.vertexArrayInfo);
  })
  bullets.forEach(obj => {
    twgl.setUniforms(debugUnlitProgramInfo, {
      u_transform: obj.transform,
    });
    twgl.setBuffersAndAttributes(gl, debugUnlitProgramInfo, shapes.sphere);
    twgl.drawBufferInfo(gl, shapes.sphere);
  })


  engine_post_update()
  window.requestAnimationFrame(update);
}

initOnce()
