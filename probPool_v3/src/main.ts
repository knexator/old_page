// ES6:
import * as dat from 'dat.gui.min.js';

import { ball_shader, drawBallAt, drawTaco, outline_ball_shader, taco_shader } from 'graphics'
import { pintar, ball_colors, pos_data, vel_data, won_data, CONFIG, IJ2K } from 'base'
import { initialPosition } from 'board';
import { advanceGame } from 'physics';
import { engine_update, mouse, wasButtonPressed, wasButtonReleased } from 'engine';
import { collapse, addChaos, select, drawSelected } from 'collapses';

declare let PintarJS: any;

export let wheel_offset = 0
// let cur_taco_head = [0, 0]
// let cur_taco_tail = [0, 0]
let last_time = 0
let last_pressed: { y: number; x: number; } | null = null

function init() {
  wheel_offset = 0
  // cur_taco_head = [0, 0]
  // cur_taco_tail = [0, 0]
  last_time = 0
  last_pressed = null
  // Reset initial positions & velocities
  for (let i = 0; i < CONFIG.N_BALLS; i++) {
    let cur_initial_pos = initialPosition(i)
    for (let j = 0; j < CONFIG.N_WORLDS; j++) {
      let k = IJ2K(i, j, true)
      pos_data[k] = cur_initial_pos[0]
      pos_data[k + 1] = cur_initial_pos[1]
      vel_data[k] = 0.0
      vel_data[k + 1] = 0.0
      won_data[IJ2K(i, j, false)] = 0
    }
  }
  // Add noise to white ball
  addChaos()
}

function update(curTime: number) {
  let deltaTime = curTime - last_time
  deltaTime = Math.min(deltaTime, 30.0)
  last_time = curTime;
  // ctx.clearRect(0,0,canvas.width,canvas.height);

  if (wasButtonPressed("left")) {
    last_pressed = { x: mouse.x, y: mouse.y }
    // cur_taco_head = [
    //   last_pressed.x,
    //   last_pressed.y
    // ]
  } else if (wasButtonReleased("left") && last_pressed) {
    for (let j = 0; j < CONFIG.N_WORLDS; j++) {
      let k = IJ2K(0, j, true)
      vel_data[k] -= (mouse.x - last_pressed.x) * CONFIG.FORCE_SCALER;
      vel_data[k + 1] -= (mouse.y - last_pressed.y) * CONFIG.FORCE_SCALER;
    }
    last_pressed = null
  }

  wheel_offset += mouse.wheel

  select()
  if (wasButtonPressed("right")) {
    collapse()
    wheel_offset = 0;
  }

  advanceGame(deltaTime * 0.001)
  // console.log(pos_data[0]);


  pintar.startFrame()
  pintar._renderer._setBlendMode(PintarJS.BlendModes.AlphaBlend)
  // ball i, world j
  pintar._renderer.setShader(ball_shader);
  for (let i = 0; i < CONFIG.N_BALLS; i++) {
    for (let j = 0; j < CONFIG.N_WORLDS; j++) {
      let k = IJ2K(i, j, true)
      drawBallAt(pos_data[k], pos_data[k + 1], ball_colors[i])
    }
  }
  pintar._renderer.setShader(outline_ball_shader);
  drawSelected()
  if (last_pressed) {
    pintar._renderer.setShader(taco_shader);
    drawTaco(last_pressed, mouse)
  }
  pintar.endFrame()

  engine_update()
  window.requestAnimationFrame(update);
}

// CONFIG.init = init
const gui = new dat.GUI();
// const initialFolder = gui.addFolder('Initial')
// // initialFolder.add(CONFIG, 'N_BALLS', 1, 16, 1)
// // initialFolder.add(CONFIG, 'N_WORLDS', 1, 512, 1)
// initialFolder.add(CONFIG, 'BALL_R', 0.0, 0.5)
// initialFolder.add(CONFIG, 'INITIAL_SPACING', 0.0, 0.5)
// // initialFolder.add(CONFIG, 'init')
// initialFolder.open()
const collapseFolder = gui.addFolder('Collapse')
collapseFolder.add(CONFIG, 'PERMANENT_HOLES')
collapseFolder.add(CONFIG, 'COLLAPSE_EXTENT', ["ball", "world"])
collapseFolder.add(CONFIG, 'COLLAPSE_TARGET', ["mean", "selected"])
collapseFolder.add(CONFIG, 'AUTOCOLLAPSE_WHITE')
collapseFolder.open()
const gamefeelFolder = gui.addFolder('Gamefeel')
gamefeelFolder.add(CONFIG, 'FORCE_SCALER', 0.01, 4)
gamefeelFolder.add(CONFIG, 'CHAOS_AMOUNT', 0.0, .01)
gamefeelFolder.open()
gui.remember(CONFIG);

init();
window.requestAnimationFrame(update);
