// ES6:
import { engine_pre_update, engine_post_update, game_time, delta_time, mouse, wasButtonPressed, wasButtonReleased, wasKeyPressed } from 'engine';

declare let PintarJS: any;
let pintar = new PintarJS();

PintarJS.Sprite.defaults.smoothingEnabled = false

let sprites: any[];
let global_texture = new PintarJS.Texture("texture.png", () => {
  let _4x4 = new PintarJS.Point(4, 4)
  sprites = [];
  for (let k = 0; k < 16; k++) {
    let cur = new PintarJS.Sprite(global_texture)
    cur.setSourceFromSpritesheet(new PintarJS.Point(k % 4, Math.floor(k / 4)), _4x4);
    sprites.push(cur)
  }
});

function startingState() {
  let next_id = 1;

  let hole_i = 2;
  let hole_j = 2;

  let board_0 = [];
  for (let j = 0; j < 3; j++) {
    let row = []
    for (let i = 0; i < 3; i++) {
      if (i == hole_i && j == hole_j) {
        row.push(0)
      } else {
        row.push(next_id++)
      }
    }
    board_0.push(row)
  }

  let board_1 = [];
  for (let j = 0; j < 4; j++) {
    let row = []
    for (let i = 0; i < 4; i++) {
      row.push(0)
    }
    board_1.push(row)
  }
  board_1[1][1] = next_id++
  board_1[1][2] = next_id++
  board_1[2][1] = next_id++
  board_1[2][2] = next_id++

  return [hole_i, hole_j, board_0, board_1]
}

// Called when loading the page
function initOnce() {
  init();
  window.requestAnimationFrame(update);
}

/*let board_0: number[][];
let board_1: number[][];
let hole_i: number;
let hole_j: number;*/
let game_history: any[];
let anim_t: number;
let input_queue: any[];

// Called when game is reset
function init() {
  game_history = [startingState()]
  anim_t = 0
  input_queue = []
}

// Called every frame
function update(curTime: number) {
  engine_pre_update(curTime)
  // ctx.clearRect(0,0,canvas.width,canvas.height);

  for (let n=0; n<6; n++) {
    if (wasKeyPressed('wasdzr'[n])) input_queue.push('wasdzr'[n])
  }

  if (anim_t > 0) {
    anim_t -= delta_time * 0.02
    if (anim_t < 0) anim_t = 0
    let cur_state = game_history[game_history.length - 1]
    let prev_state = game_history[game_history.length - 2]

    // drawing
    pintar.startFrame();

    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < 3; i++) {
        let cur_tile = cur_state[2][j][i]
        if (cur_tile === 0) continue
        if (cur_tile === prev_state[2][j][i]) {
          drawRect(i, j, cur_tile)
        } else {
          let [prev_i, prev_j] = find_tile(prev_state[2], cur_tile)
          drawRect(lerp(i, prev_i, anim_t), lerp(j, prev_j, anim_t), cur_tile)
        }
      }
    }

    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < 4; i++) {
        let cur_tile = cur_state[3][j][i]
        if (cur_tile === 0) continue
        if (cur_tile === prev_state[3][j][i]) {
          drawRect(i - .5, j - .5, cur_tile)
        } else {
          let [prev_i, prev_j] = find_tile(prev_state[3], cur_tile)
          drawRect(lerp(i, prev_i, anim_t) - .5, lerp(j, prev_j, anim_t) - .5, cur_tile)
        }
      }
    }

    pintar.endFrame();
  } else {
    let cur_state = game_history[game_history.length - 1]

    // drawing
    pintar.startFrame();

    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < 3; i++) {
        let cur = cur_state[2][j][i]
        if (cur === 0) continue
        drawRect(i, j, cur)
      }
    }

    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < 4; i++) {
        let cur = cur_state[3][j][i]
        if (cur === 0) continue
        drawRect(i - .5, j - .5, cur)
      }
    }

    pintar.endFrame();

    if (input_queue.length > 0) {
      let cur_input = input_queue.shift()
      let di = 0;
      let dj = 0;
      if (cur_input == 'd') di += 1
      if (cur_input == 'a') di -= 1
      if (cur_input == 's') dj += 1
      if (cur_input == 'w') dj -= 1

      let new_state = applyInput(di, dj, game_history[game_history.length - 1])
      if (new_state !== false) {
        game_history.push(new_state)
        anim_t = 1
        // [hole_i, hole_j, board_0, board_1] = new_state
      }

      if (cur_input == 'z' && game_history.length > 1) {
        game_history.pop()
      }
      if (cur_input == 'r') {
        game_history.push(startingState())
      }
    }
  }



  engine_post_update()
  window.requestAnimationFrame(update);
}

initOnce()

// let stuff = startingState()
// let dis = [1, 0, -1, 0];
// let djs = [0, 1, 0, -1];
// for (let n=0; n<50; n++) {
//   let k = Math.floor(Math.random() * 4)
//   let new_stuff = applyInput(dis[k], djs[k], stuff)
//   if (new_stuff) stuff = new_stuff
// }
// solve(stuff)

function find_tile(prev_state, cur_tile) {
  for (let j=0; j<prev_state.length; j++) {
    for (let i=0; i<prev_state[0].length; i++) {
      if (prev_state[j][i] === cur_tile) return [i,j]
    }
  }
  return [-1,-1]
}

function pushTopTile(board_1, i, j, di, dj) {
  if (i < 0 || i > 3 || j < 0 || j > 3) return false;
  if (i + di < 0 || i + di > 3 || j + dj < 0 || j + dj > 3) return false;
  if (board_1[j][i] === 0)
    return false;
  if (board_1[j + dj][i + di] !== 0) {
    // Don't allow pushing
    //     return;
    if (!pushTopTile(board_1, i + di, j + dj, di, dj)) {
      return false
    }
  }
  board_1[j + dj][i + di] = board_1[j][i];
  board_1[j][i] = 0;
  return true
}

function applyInput(di, dj, [hole_i, hole_j, board_0, board_1]) {
  if (di !== 0 || dj !== 0) {
    let moving_i = hole_i - di
    let moving_j = hole_j - dj
    if (moving_i < 0 || moving_i > 2 || moving_j < 0 || moving_j > 2) {
      return false
    }
    let new_board_0 = JSON.parse(JSON.stringify(board_0))
    let new_board_1 = JSON.parse(JSON.stringify(board_1))
    if (di > 0) {
      pushTopTile(new_board_1, moving_i + 1, moving_j, di, 0)
      pushTopTile(new_board_1, moving_i + 1, moving_j + 1, di, 0)
      pushTopTile(new_board_1, moving_i, moving_j, di, 0)
      pushTopTile(new_board_1, moving_i, moving_j + 1, di, 0)
    } else if (di < 0) {
      pushTopTile(new_board_1, moving_i, moving_j, di, 0)
      pushTopTile(new_board_1, moving_i, moving_j + 1, di, 0)
      pushTopTile(new_board_1, moving_i + 1, moving_j, di, 0)
      pushTopTile(new_board_1, moving_i + 1, moving_j + 1, di, 0)
    } else if (dj > 0) {
      pushTopTile(new_board_1, moving_i, moving_j + 1, 0, dj)
      pushTopTile(new_board_1, moving_i + 1, moving_j + 1, 0, dj)
      pushTopTile(new_board_1, moving_i, moving_j, 0, dj)
      pushTopTile(new_board_1, moving_i + 1, moving_j, 0, dj)
    } else if (dj < 0) {
      pushTopTile(new_board_1, moving_i, moving_j, 0, dj)
      pushTopTile(new_board_1, moving_i + 1, moving_j, 0, dj)
      pushTopTile(new_board_1, moving_i, moving_j + 1, 0, dj)
      pushTopTile(new_board_1, moving_i + 1, moving_j + 1, 0, dj)
    } else {
      console.log("terrible error")
    }
    new_board_0[hole_j][hole_i] = new_board_0[moving_j][moving_i]
    new_board_0[moving_j][moving_i] = 0
    hole_i = moving_i
    hole_j = moving_j
    return [hole_i, hole_j, new_board_0, new_board_1]
  } else {
    return false
  }
}

function drawRect(i: number, j: number, id: number) {
  if (!sprites) return
  let TILE_SIZE = 64;
  let OFF_X = 64;
  let OFF_Y = 64;

  let spr = sprites[id]
  spr.position = new PintarJS.Point(OFF_X + i * TILE_SIZE, OFF_Y + j * TILE_SIZE)
  spr.scale = new PintarJS.Point(TILE_SIZE / 32, TILE_SIZE / 32)
  pintar.drawSprite(spr);

  /*let color = (id < 9) ? PintarJS.Color.red() : PintarJS.Color.green()
  pintar.drawRectangle(
    new PintarJS.ColoredRectangle(
      new PintarJS.Point(i * TILE_SIZE + OFF_X, j * TILE_SIZE + OFF_Y),
      new PintarJS.Point(TILE_SIZE * 0.9, TILE_SIZE * 0.9),
      color, null, true));*/
}

function solve(state) {
  let dis = [1, 0, -1, 0];
  let djs = [0, 1, 0, -1];
  let goal_state = JSON.stringify(startingState())
  let visited_states = [JSON.stringify(state)]
  let pending_states = [visited_states[0]]
  while (pending_states.length > 0) {
    let cur_state = JSON.parse(pending_states.shift()!)
    for (let k=0; k<4; k++) {
      let child_state = applyInput(dis[k], djs[k], cur_state)
      if (child_state === false) continue
      let child_state_str = JSON.stringify(child_state)
      if (visited_states.indexOf(child_state_str) === -1) {
        visited_states.push(child_state_str)
        pending_states.push(child_state_str)
        if (child_state_str === goal_state) {
          console.log("DONE!")
          return
        }
      }
    }
    if (visited_states.length % 1000 === 0) console.log("still alive")
  }
}

function lerp(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t
}

document.addEventListener('swiped', function (e) {
  const dir2key = { 'left': 'a', 'right': 'd', 'up': 'w', 'down': 's' }
  let key = dir2key[e.detail.dir]
  input_queue.push(key)
  // alert(e.detail.dir); // swipe direction
})
