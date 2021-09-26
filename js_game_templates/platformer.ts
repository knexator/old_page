let canvas = document.getElementById("canvas") as HTMLCanvasElement;
let ctx = canvas.getContext('2d');

// VECTORS

type IVector = {
  x: number, y: number
}

function add(u: IVector, v: IVector): IVector {
  return { x: u.x + v.x, y: u.y + v.y }
}

function scale(a: number, u: IVector): IVector {
  return { x: u.x * a, y: u.y * a }
}

function clone(u: IVector): IVector {
  return { x: u.x, y: u.y }
}

// NUMBERS

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}

class Player {
  position: IVector
  velocity: IVector
  onGround: boolean
  level: Level
  static readonly WALK_ACC: number = 2.0; // perfect
  static readonly JUMP_SPEED: number = 22.0;
  static readonly GRAVITY: number = 50.0;
  static readonly VERTICAL_FRICTION: number = 0.02;
  static readonly HORIZONTAL_FRICTION: number = 0.3; // perfect
  // readonly MAX_VEL: number = 5.0;


  constructor(level: Level, initPos: IVector) {
    this.position = initPos
    this.velocity = { x: 0, y: 0 }
    this.onGround = true
    this.level = level
  }

  draw() {
    let pos = this.position
    ctx.fillStyle = "red";
    ctx.fillRect(OFFX + TILE * (pos!.x - .5), OFFY + TILE * (pos!.y - 2.0), TILE, TILE * 2)
  }

  update(input: PlayerInput, dt: number) {
    let playerVel = clone(this.velocity);
    let playerPos = clone(this.position);

    // if (!this.onGround.prevValue) playerVel.y += dt * this.GRAVITY
    playerVel.y += dt * Player.GRAVITY

    // console.log(input.jump, this.onGround.prevValue)
    if (input.jump && this.onGround) {
      playerVel.y -= Player.JUMP_SPEED
      // console.log(playerVel.y)
    }

    // Apply friction
    playerVel = add(playerVel, scale(Player.WALK_ACC, { x: input.di, y: 0 }))
    // let friction = this.onGround.prevValue ? this.GROUND_FRICTION : this.AIR_FRICTION
    // playerVel = scale(Math.exp(-friction * dt), playerVel)
    playerVel.x *= Math.exp(-Player.HORIZONTAL_FRICTION)
    playerVel.y *= Math.exp(-Player.VERTICAL_FRICTION)
    // playerVel.x -= Math.exp(-Player.HORIZONTAL_FRICTION)
    // playerVel.y -= Math.exp(-Player.VERTICAL_FRICTION * dt)
    // playerVel.x

    if (playerVel.x != 0) {
      let dx = playerVel.x * dt;
      if (this.wouldOverlapAfterMove(playerPos, dx, 0)) {
        // Round position to stick to wall
        playerPos.x = Math.round(playerPos.x + dx) + (dx < 0 ? 0.5 : -0.5)
        playerVel.x = 0
      } else {
        playerPos.x += dx
      }
    }

    if (playerVel.y != 0) {
      let dy = playerVel.y * dt;
      if (this.wouldOverlapAfterMove(playerPos, 0, dy)) {
        // Round position to stick to floor / ceiling
        // playerPos.y = Math.round(playerPos.y + dy)
        playerPos.y = Math.round(playerPos.y)
        playerVel.y = 0
        this.onGround = (dy > 0);
      } else {
        playerPos.y += dy
        this.onGround = false
      }
    }

    this.velocity = playerVel;
    this.position = playerPos;
  }

  wouldOverlapAfterMove(pos: IVector, dx: number, dy: number) {
    let margin = 0.01
    return this.level.overlaps({
      i: pos.x + dx - 0.5 + margin, j: pos.y + dy - 2 + margin, w: 1 - margin * 2, h: 2 - margin * 2
    })
  }
}

class Level {
  geo: Array<Array<number>>
  w: number
  h: number
  player!: Player;

  constructor(strData: string) {
    // level data
    let rows = strData.split("\n")
    this.w = rows[0].length
    this.h = rows.length
    this.geo = []
    for (let j = 0; j < this.h; j++) {
      let row = []
      const rowData = rows[j]
      for (let i = 0; i < this.w; i++) {
        const chr = rowData[i];

        let geoNum = 0
        if (chr == '#') {
          geoNum = 1
        } else if (chr == '.') {

        } else if (chr == '@') {
          this.player = new Player(this, { x: i + 0.5, y: j + 1 })
        }

        row.push(geoNum)
      }
      this.geo.push(row)
    }
  }

  draw() {
    ctx.fillStyle = "cyan";
    ctx.fillRect(OFFX, OFFY, this.w * TILE, this.h * TILE)
    for (let j = 0; j < this.h; j++) {
      for (let i = 0; i < this.w; i++) {
        if (this.geo[j][i] === 1) {
          ctx.fillStyle = "blue";
          ctx.fillRect(OFFX + TILE * i, OFFY + TILE * j, TILE, TILE)
        }
      }
    }
    this.player.draw()
  }

  update(input: PlayerInput, dt: number) {
    this.player.update(input, dt);
    /*if (input.undo) {

    }*/
  }

  overlaps(rect: Rect): boolean {
    let i1 = Math.floor(rect.i);
    let i2 = Math.floor(rect.i + rect.w);
    let j1 = Math.floor(rect.j);
    let j2 = Math.floor(rect.j + rect.h);
    if (i1 < 0 || j1 < 0 || i2 >= this.w || j2 >= this.h) return true
    for (let i = i1; i <= i2; i++) {
      for (let j = j1; j <= j2; j++) {
        if (this.geo[j][i] == 1) return true
      }
    }
    return false
  }
}

type Rect = {
  i: number, j: number, w: number, h: number
}

type PlayerInput = {
  'di': number,
  //'dj': number,
  'jump': boolean,
  'undo': number
}

let levels = [
  new Level(`\
#..................#
#..................#
#.........@........#
#.........#........#
#..................#
#..................#
#..................#
#..................#
#..................#
#.........###......#
#..............#####
#..............#...#
#..................#
####################
####################`)
]

let cur_level_n = 0
let cur_level = levels[cur_level_n]

let TILE = 30;
let OFFX = 30;
let OFFY = 30;

let last_time = 0
function update(curTime: number) {
  let deltaTime = curTime - last_time
  // console.log(deltaTime)
  last_time = curTime;

  let tile_w = Math.floor(canvas.width / cur_level.w)
  let tile_h = Math.floor(canvas.height / cur_level.h)
  TILE = Math.floor(Math.min(tile_h, tile_w))
  OFFX = Math.floor((canvas.width - (TILE * cur_level.w)) / 2)
  OFFY = Math.floor((canvas.height - (TILE * cur_level.h)) / 2)

  let cur_undo = 0
  if (isKeyDown('z')) cur_undo = 1
  if (isKeyDown('x')) cur_undo = 2
  if (isKeyDown('c')) cur_undo = 3

  let cur_input: PlayerInput = {
    di: Number(isKeyDown('d')) - Number(isKeyDown('a')),
    //dj: 0,
    jump: wasKeyPressed(' '),
    undo: cur_undo
  }
  cur_level.update(cur_input, deltaTime * 0.001);

  cur_level.draw()


  mouse_prev = Object.assign({}, mouse);
  mouse.wheel = 0;
  keyboard_prev = Object.assign({}, keyboard);
  window.requestAnimationFrame(update);
}


window.addEventListener("resize", e => {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
});

window.addEventListener("load", e => {
  window.dispatchEvent(new Event('resize'));
  window.requestAnimationFrame(update);
});

window.addEventListener('mousemove', e => _mouseEvent(e));
window.addEventListener('mousedown', e => _mouseEvent(e));
window.addEventListener('mouseup', e => _mouseEvent(e));

function _mouseEvent(e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.buttons = e.buttons;
  return false;
}

window.addEventListener('wheel', e => {
  let d = e.deltaY > 0 ? 1 : -1;
  return mouse.wheel = d;
});

let mouse = { x: 0, y: 0, buttons: 0, wheel: 0 };
let mouse_prev = Object.assign({}, mouse);

function isButtonDown(b) {
  return (mouse.buttons & (1 << b)) != 0;
}

function wasButtonPressed(b) {
  return ((mouse.buttons & (1 << b)) !== 0) && ((mouse_prev.buttons & (1 << b)) === 0);
}

function wasButtonReleased(b) {
  return ((mouse.buttons & (1 << b)) === 0) && ((mouse_prev.buttons & (1 << b)) !== 0);
}

let keyboard = {};
let keyboard_prev = {};

function keyMap(e) {
  // use key.code if key location is important
  return e.key.toLowerCase();
}

window.addEventListener('keydown', e => {
  let k = keyMap(e);
  keyboard[k] = true;
});

window.addEventListener('keyup', e => {
  let k = keyMap(e);
  keyboard[k] = false;
});

function isKeyDown(k) {
  return keyboard[k] || false;
}

function wasKeyPressed(k) {
  return (keyboard[k] || false) && (!keyboard_prev[k] || false);
}

function wasKeyReleased(k) {
  return (!keyboard[k] || false) && (keyboard_prev[k] || false);
}

// utility functions
function mod(n, m) {
  return ((n % m) + m) % m;
}
