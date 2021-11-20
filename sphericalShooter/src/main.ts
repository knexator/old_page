// ES6:
import { engine_pre_update, engine_post_update, game_time, delta_time, mouse, wasButtonPressed, wasButtonReleased, wasKeyPressed } from './engine';
import * as twgl from './twgl';
import { vs, fs } from './shaders'



const canvas = document.querySelector('canvas')!
const gl = canvas.getContext("webgl")!

const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

const arrays = {
    position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
  };
const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

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


  twgl.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  const uniforms = {
    time: game_time * 0.001,
    resolution: [gl.canvas.width, gl.canvas.height],
  };

  gl.useProgram(programInfo.program);
  twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
  twgl.setUniforms(programInfo, uniforms);
  twgl.drawBufferInfo(gl, bufferInfo);


  engine_post_update()
  window.requestAnimationFrame(update);
}

initOnce()
