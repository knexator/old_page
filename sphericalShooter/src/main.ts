// ES6:
import { engine_pre_update, engine_post_update, game_time, delta_time, mouse, wasButtonPressed, wasButtonReleased, wasKeyPressed, isKeyDown } from './engine';
import * as twgl from './../external/twgl-full'
import { vs, fs } from './shaders'
import { Matrix4, Vec4, projMat, identity, multMatVec, pureRot, multMatMat } from './math';
import { createCustomCubeBufferInfo, createGreatTubeVerticesBufferInfo } from './geometry';

twgl.setDefaults({attribPrefix: "a_"});

const gl = document.querySelector('canvas')!.getContext("webgl2")!;
gl.enable(gl.DEPTH_TEST);

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
// const bufferInfo = createCustomCubeBufferInfo(gl, .1);
// const bufferInfo = twgl.primitives.createCubeBufferInfo(gl, .1);
// const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
const bufferInfo = createGreatTubeVerticesBufferInfo(gl, 1.0, 0.02, 64, 32)
const vertexArrayInfo = twgl.createVertexArrayInfo(gl, programInfos, bufferInfo);

const z0 = 0.1
const projNear = projMat(z0, true)
const projFar = projMat(z0, false)

let viewInverse = identity();
let farviewInverse = identity();

// Called when loading the page
function initOnce() {
  init();
  window.requestAnimationFrame(update);
}

// Called when game is reset
function init() {
  console.log(bufferInfo)
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

  multMatMat(pureRot(Math.PI, 2, 3), viewInverse, farviewInverse)

  twgl.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const commonUniforms = {
    time: game_time * 0.001,
    resolution: [gl.canvas.width, gl.canvas.height],
  };

  gl.useProgram(debugUnlitProgramInfo.program);
  twgl.setBuffersAndAttributes(gl, debugUnlitProgramInfo, vertexArrayInfo);

  twgl.setUniforms(debugUnlitProgramInfo, commonUniforms);

  // Draw near hemisphere
  twgl.setUniforms(debugUnlitProgramInfo, {
    u_projection: projNear,
    u_viewInverse: viewInverse,
  });
  twgl.drawBufferInfo(gl, bufferInfo);
  // Draw far hemisphere
  twgl.setUniforms(debugUnlitProgramInfo, {
    u_projection: projFar,
    u_viewInverse: farviewInverse,
  });
  twgl.drawBufferInfo(gl, bufferInfo);


  engine_post_update()
  window.requestAnimationFrame(update);
}

initOnce()
