// ES6:
import { engine_pre_update, engine_post_update, game_time, delta_time, mouse, wasButtonPressed, wasButtonReleased, wasKeyPressed } from 'engine';

declare let PintarJS: any;
let pintar = new PintarJS();

class Piece {
  i: number;
  j: number;
  k: number;
  id: number;
  constructor(i: number, j: number, k: number, id: number) {
    this.i = i;
    this.j = j;
    this.k = k;
    this.id = id;
  }
}

// Called when loading the page
function initOnce() {
  init();
  window.requestAnimationFrame(update);
}

let board_0 = [];
let board_1 = [];

// Called when game is reset
function init() {
  board_0 = [];
  for (let n=0; n<8; n++) {
    board_0.push(new Piece(n % 3, Math.floor(n / 3), 0, n))
  }
  board_1 = [];
  board_1.push(new Piece(2, 1, 1, 10))
  board_1.push(new Piece(1, 2, 1, 11))
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

  }

  pintar.drawRectangle(
    new PintarJS.ColoredRectangle(
      new PintarJS.Point(x_start, y_start),
      new PintarJS.Point(x_end - x_start, y_end - y_start),
      PintarJS.Color.fromHex(COLORS.transition), null, true));

  engine_post_update()
  window.requestAnimationFrame(update);
}

initOnce()

function lerp(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t
}
