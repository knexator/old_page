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

// Called when loading the page
function initOnce() {
  init();
  window.requestAnimationFrame(update);
}

let board_0: number[][];
let board_1: number[][];
let hole_i: number;
let hole_j: number;

// Called when game is reset
function init() {
  let next_id = 1;

  hole_i = 2;
  hole_j = 2;

  board_0 = [];
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

  board_1 = [];
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
}

// Called every frame
function update(curTime: number) {
  engine_pre_update(curTime)
  // ctx.clearRect(0,0,canvas.width,canvas.height);

  let di = 0;
  let dj = 0;
  if (wasKeyPressed('d')) di += 1
  if (wasKeyPressed('a')) di -= 1
  if (wasKeyPressed('s')) dj += 1
  if (wasKeyPressed('w')) dj -= 1

  if (di !== 0 || dj !== 0) {
    let moving_i = hole_i - di
    let moving_j = hole_j - dj
    if (moving_i < 0 || moving_i > 2 || moving_j < 0 || moving_j > 2) {

    } else {
      if (di > 0) {
        pushTopTile(moving_i + 1, moving_j, di, 0)
        pushTopTile(moving_i + 1, moving_j + 1, di, 0)
        pushTopTile(moving_i, moving_j, di, 0)
        pushTopTile(moving_i, moving_j + 1, di, 0)
      } else if (di < 0) {
        pushTopTile(moving_i, moving_j, di, 0)
        pushTopTile(moving_i, moving_j + 1, di, 0)
        pushTopTile(moving_i + 1, moving_j, di, 0)
        pushTopTile(moving_i + 1, moving_j + 1, di, 0)
      } else if (dj > 0) {
        pushTopTile(moving_i, moving_j + 1, 0, dj)
        pushTopTile(moving_i + 1, moving_j + 1, 0, dj)
        pushTopTile(moving_i, moving_j, 0, dj)
        pushTopTile(moving_i + 1, moving_j, 0, dj)
      } else if (dj < 0) {
        pushTopTile(moving_i, moving_j, 0, dj)
        pushTopTile(moving_i + 1, moving_j, 0, dj)
        pushTopTile(moving_i, moving_j + 1, 0, dj)
        pushTopTile(moving_i + 1, moving_j + 1, 0, dj)
      } else {
        console.log("terrible error")
      }


      board_0[hole_j][hole_i] = board_0[moving_j][moving_i]
      board_0[moving_j][moving_i] = 0
      hole_i = moving_i
      hole_j = moving_j
    }
  }

  // drawing
  pintar.startFrame();

  for (let j = 0; j < 3; j++) {
    for (let i = 0; i < 3; i++) {
      let cur = board_0[j][i]
      if (cur === 0) continue
      drawRect(i, j, cur)
    }
  }

  for (let j = 0; j < 4; j++) {
    for (let i = 0; i < 4; i++) {
      let cur = board_1[j][i]
      if (cur === 0) continue
      drawRect(i - .5, j - .5, cur)
    }
  }

  pintar.endFrame();



  engine_post_update()
  window.requestAnimationFrame(update);
}

initOnce()

function pushTopTile(i, j, di, dj) {
  if (i < 0 || i > 3 || j < 0 || j > 3) return false;
  if (i + di < 0 || i + di > 3 || j + dj < 0 || j + dj > 3) return false;
  if (board_1[j][i] === 0)
    return false;
  if (board_1[j + dj][i + di] !== 0) {
    // Don't allow pushing
    //     return;
    if (!pushTopTile(i + di, j + dj, di, dj)) {
      return false
    }
  }
  board_1[j + dj][i + di] = board_1[j][i];
  board_1[j][i] = 0;
  return true
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

function lerp(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t
}
