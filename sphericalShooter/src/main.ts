// ES6:
import { engine_pre_update, engine_post_update, game_time, delta_time, mouse, wasButtonPressed, wasButtonReleased, wasKeyPressed, isKeyDown } from './engine';
import * as twgl from './twgl';
import { vs, fs } from './shaders'
import { Matrix4, Vec4, projMat, identity, multMatVec, pureRot, multMatMat } from './math';


const gl = document.querySelector('canvas')!.getContext("webgl")!;

const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

const arrays = {
  a_position: {
    numComponents: 4,
    data: [
      -.1, -.1, -1, 0,
      .1, -.1, -1, 0,
      -.1, .1, -1, 0,
      -.1, .1, -1, 0,
      .1, -.1, -1, 0,
      .1, .1, -1, 0,
    ],
  },
  a_color: {
    numComponents: 3,
    type: Uint8Array,
    data: [
       0, 0, 0,
       255, 0, 0,
       0, 255, 0,
       0, 255, 0,
       255, 0, 0,
       255, 255, 0,
    ],
  }
};
const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

const z0 = 0.01
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

  const uniforms = {
    time: game_time * 0.001,
    resolution: [gl.canvas.width, gl.canvas.height],
    u_projection: projNear,
    u_viewInverse: viewInverse,
  };

  gl.useProgram(programInfo.program);
  twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
  twgl.setUniforms(programInfo, uniforms);
  twgl.drawBufferInfo(gl, bufferInfo);
  twgl.setUniforms(programInfo, {
    u_projection: projFar,
    u_viewInverse: farviewInverse,
  });
  twgl.drawBufferInfo(gl, bufferInfo);


  engine_post_update()
  window.requestAnimationFrame(update);
}

initOnce()
