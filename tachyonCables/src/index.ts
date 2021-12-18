import { engine_update, mouse, wasButtonPressed, wasButtonReleased, wasKeyPressed } from 'engine';
import { layout, board, Tile, Cable, updateToNext, updateToPrev, } from 'hexGame';
import { beginFrame, ctx, drawBoard, drawGhostCable, drawGhostHex } from './graphics';

let last_time = 0;

let wheel_off = 0;

let time = 0;
let anim_t = 0;

function initOnce() {
  window.dispatchEvent(new Event('resize'));
  window.requestAnimationFrame(update);
}

function update(curTime: number) {
  let deltaTime = curTime - last_time
  deltaTime = Math.min(deltaTime, 30.0)
  last_time = curTime;

  wheel_off += mouse.wheel;

  beginFrame();

  let cur_raw = layout.pixelToHex(mouse);
  let cur_hex = cur_raw.round();
  let cur_frac = cur_raw.subtract(cur_hex);
  let cur_frozen = cur_hex.freeze();
  let exists = board.has(cur_frozen);

  if (exists) {
    let cur_tile = board.get(cur_frozen)!;
    let cur_dir = cur_frac.mainDir();
    if (cur_tile.cables[cur_dir] === null) {
      // no cable
      let cur_target_dir = mod(cur_dir + mod(wheel_off + 2, 5) + 1, 6);
      drawGhostCable(cur_hex, cur_dir, cur_target_dir);
      if (wasKeyPressed('1')) {
        let cur_cable = new Cable(cur_tile, cur_dir, cur_target_dir, "standard", false);
        cur_tile.addCable(cur_cable);
      } else if (wasKeyPressed('2')) {
        let cur_cable = new Cable(cur_tile, cur_dir, cur_target_dir, "tachyon", false);
        cur_tile.addCable(cur_cable);
      } else if (wasKeyPressed('3')) {
        let cur_cable = new Cable(cur_tile, cur_dir, cur_target_dir, "bridgeBackward", false);
        cur_tile.addCable(cur_cable);
      } else if (wasKeyPressed('4')) {
        let cur_cable = new Cable(cur_tile, cur_dir, cur_target_dir, "bridgeForward", false);
        cur_tile.addCable(cur_cable);
      }
    } else {
      // yes cable
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      drawGhostCable(cur_hex, cur_tile.cables[cur_dir]!.origin, cur_tile.cables[cur_dir]!.target);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      if (wasButtonPressed("left")) {
        cur_tile.cables[cur_dir]!.cycleInput(Math.floor(time));
      } else if (wasButtonPressed("right")) {
        cur_tile.deleteCable(cur_dir);
      }
    }
  } else {
    drawGhostHex(cur_hex);
    if (wasButtonPressed("left")) {
      board.set(cur_hex.freeze(), new Tile(cur_hex));
    }
  }

  if (anim_t === 0) {
    if (wasKeyPressed('d')) {
      time += 1;
      anim_t -= .99;
    } else if (wasKeyPressed('a')) {
      updateToPrev(time);
      time -= 1;
      anim_t += .99;
    }
  } else {
    let new_anim_t = moveToZero(anim_t, 0.001 * deltaTime);
    if (new_anim_t === 0 && anim_t < 0) {
      updateToNext(time - 1);
    }
    anim_t = new_anim_t;
  }

  drawBoard(time + anim_t);

  engine_update();
  window.requestAnimationFrame(update);
}

initOnce()

function lerp(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t
}

export function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

function moveToZero(value: number, speed: number) {
  if (value > 0) {
    return Math.max(0, value - speed)
  } else if (value < 0) {
    return Math.min(0, value + speed)
  } else {
    return value
  }
}
