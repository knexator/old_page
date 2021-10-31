// ES6:
import * as dat from 'dat.gui.min.js';

import { ball_shader, drawBallAt, drawTaco, outline_ball_shader, taco_shader } from 'graphics'
import { pintar, ball_colors, pos_data, vel_data, won_data, CONFIG, IJ2K, VARS, original_pos_data, ball_hex_colors } from 'base'
import { initialPosition } from 'board';
import { advanceGame, ballPosSTD } from 'physics';
import { engine_update, mouse, wasButtonPressed, wasButtonReleased, wasKeyPressed } from 'engine';
import { collapse, addChaos, select, drawSelected, collapseBallAt } from 'collapses';

declare let PintarJS: any;

export let wheel_offset = 0
// let cur_taco_head = [0, 0]
// let cur_taco_tail = [0, 0]
let last_time = 0
let last_pressed: { y: number; x: number; } | null = null
let std_sliders: any[];

function initOnce() {
  std_sliders = []
  pintar.canvas.insertAdjacentHTML('afterend',
   `<input class="gameSlider" type="range" min="0" max="1" step="0.00001" \
   style="width: 80%; background-color: #000;">`);
  std_sliders.push(pintar.canvas.nextElementSibling)
  for (let i=0; i<CONFIG.N_BALLS; i++) {
    let stuff = pintar.canvas.insertAdjacentHTML('afterend',
     `<input class="gameSlider" type="range" min="0" max="1" step="0.00001" \
     style="width: 80%; background-color: #${ball_hex_colors[i]};">`);
    std_sliders.push(pintar.canvas.nextElementSibling)
  }

  pintar._renderer._setBlendMode(PintarJS.BlendModes.AlphaBlend)
  init();
  window.requestAnimationFrame(update);
}

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

  let anim_time = VARS.anim_time
  if (anim_time > 0) {
    console.log(anim_time);

    anim_time = Math.max(anim_time - deltaTime * 0.001 / CONFIG.ANIM_DURATION, 0.0)
    VARS.anim_time = anim_time

    anim_time = 1 - anim_time
    anim_time *= anim_time

    pintar.startFrame()
    // ball i, world j
    pintar._renderer.setShader(ball_shader);
    for (let i = 0; i < CONFIG.N_BALLS; i++) {
      for (let j = 0; j < CONFIG.N_WORLDS; j++) {
        let k = IJ2K(i, j, true)
        drawBallAt(
          lerp(original_pos_data[k], pos_data[k], anim_time),
          lerp(original_pos_data[k + 1], pos_data[k + 1], anim_time),
           ball_colors[i]
        )
      }
    }
    pintar.endFrame()
  } else {
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

    for (let i = 0; i < CONFIG.N_BALLS; i++) {
      if (wasKeyPressed(i.toString())) {
        collapseBallAt(i, mouse.x, mouse.y)
      }
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
  }

  let mean_std = 0.0
  for (let i = 0; i < CONFIG.N_BALLS; i++) {
    let cur_std = ballPosSTD(i)
    mean_std += cur_std
    std_sliders[i + 1].value = cur_std
  }
  std_sliders[0].value = mean_std / CONFIG.N_BALLS

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
gamefeelFolder.add(CONFIG, 'FRICTION', 0.00, 0.05)
gamefeelFolder.add(CONFIG, 'BALL_BOUNCE', 0.00, 1.00)
gamefeelFolder.add(CONFIG, 'WALL_BOUNCE', 0.00, 1.00)
gamefeelFolder.add(CONFIG, 'HOLES_ENABLED')
gamefeelFolder.add(CONFIG, 'CHAOS_AMOUNT', 0.0, .01)
gamefeelFolder.add(CONFIG, 'ANIM_DURATION', 0.01, 1.00)
gamefeelFolder.open()
gui.remember(CONFIG);

initOnce()

function lerp(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t
}
