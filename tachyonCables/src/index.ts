import { engine_update, isKeyDown, mouse, wasButtonPressed, wasButtonReleased, wasKeyPressed } from 'engine';
import { layout, board, Tile, Cable, updateToNext, updateToPrev, board2str, board2str_onlyVisible, hacky_printAllPaths, hacky_printAllLoops, hacky_drawStuff, } from 'hexGame';
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
      } else if (wasKeyPressed('5')) {
        let cur_cable = new Cable(cur_tile, cur_dir, cur_target_dir, "swapper", false);
        cur_tile.addCable(cur_cable);
      } else if (wasKeyPressed('6')) {
        let cur_cable = new Cable(cur_tile, cur_dir, cur_target_dir, "swapperBackward", false);
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
    let new_anim_t = moveToZero(anim_t, 0.005 * deltaTime);
    if (new_anim_t === 0 && anim_t < 0) {
      updateToNext(time - 1);
    }
    anim_t = new_anim_t;
  }

  /*if (wasKeyPressed('s')) {
    localStorage.setItem("level", board2str());
  }
  if (wasKeyPressed('m')) {
    board.clear();
  }*/
  if (wasKeyPressed('w')) {
    localStorage.setItem("sentient", board2str_onlyVisible());
    // localStorage.setItem("yay", board2str_onlyVisible());
  }
  if (wasKeyPressed('q')) {
    hacky_printAllPaths(time);
  }
  if (wasKeyPressed('e')) {
    hacky_printAllLoops(time);
  }
  if (wasKeyPressed('y')) {
    hacky_dontDrawMain = true;
  }

  if (isKeyDown('k')) layout.origin.y -= deltaTime * 0.4;
  if (isKeyDown('i')) layout.origin.y += deltaTime * 0.4;
  if (isKeyDown('l')) layout.origin.x -= deltaTime * 0.4;
  if (isKeyDown('j')) layout.origin.x += deltaTime * 0.4;

  if (!hacky_dontDrawMain) drawBoard(time + anim_t);
  hacky_drawStuff();

  engine_update();
  window.requestAnimationFrame(update);
}
let hacky_dontDrawMain = false;
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
