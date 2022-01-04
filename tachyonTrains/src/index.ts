import { engine_update, isKeyDown, mouse, wasButtonPressed, wasButtonReleased, wasKeyPressed } from 'engine';
import { layout, board, Tile, Cable, board2str, MAX_T, swappers, contradictions } from 'hexGame';
import { beginFrame, canvas, ctx, drawBoard, drawGhostCable, drawGhostHex } from './graphics';

let last_time = 0;

let wheel_off = 0;

let time = Math.floor(MAX_T / 2);
let anim_t = 0;

const BUTTON = 100;
const MARGIN = 0.05;
let ui_t_offset = Math.floor(MAX_T / 2) * BUTTON - canvas.width * 3;

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

  let mi = Math.floor((mouse.x + ui_t_offset) / BUTTON);
  let mj = Math.floor((canvas.height - mouse.y) / BUTTON);

  if (swappers.length > mj) {
    if (wasButtonPressed("left")) {
      swappers[mj].cycleInput(mi);
    }
  } else {
    if (exists) {
      let cur_tile = board.get(cur_frozen)!;
      let cur_dir = cur_frac.mainDir();
      let cur_cable = cur_tile.getCable(cur_dir, time);
      if (cur_cable === null) {
        // no cable
        let cur_target_dir = mod(cur_dir + mod(wheel_off + 2, 5) + 1, 6);
        drawGhostCable(cur_hex, cur_dir, cur_target_dir);
        if (wasKeyPressed('1')) {
          let cur_cable = new Cable(cur_tile, cur_dir, cur_target_dir, "forward", false);
          cur_tile.addCable(cur_cable);
        } else if (wasKeyPressed('2')) {
          let cur_cable = new Cable(cur_tile, cur_dir, cur_target_dir, "backward", false);
          cur_tile.addCable(cur_cable);
        } else if (wasKeyPressed('3')) {
          let cur_cable = new Cable(cur_tile, cur_dir, cur_target_dir, "forward", true);
          cur_tile.addCable(cur_cable);
        } else if (wasKeyPressed('4')) {
          let cur_cable = new Cable(cur_tile, cur_dir, cur_target_dir, "backward", true);
          cur_tile.addCable(cur_cable);
        }
      } else {
        // yes cable
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        drawGhostCable(cur_hex, cur_cable.getOrigin(time), cur_cable.getTarget(time));
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        if (wasButtonPressed("left")) {
          cur_cable.cycleInput(Math.floor(time));
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
  }

  if (anim_t === 0) {
    if (wasKeyPressed('d') && time + 1 < MAX_T) {
      time += 1;
      anim_t -= .99;
    } else if (wasKeyPressed('a') && time > 0) {
      time -= 1;
      anim_t += .99;
    }
  } else {
    let new_anim_t = moveToZero(anim_t, 0.005 * deltaTime);
    anim_t = new_anim_t;
  }

  if (wasKeyPressed('s')) {
    localStorage.setItem("level", board2str());
  }
  if (wasKeyPressed('m')) {
    board.clear();
  }
  /*if (wasKeyPressed('w')) {
    localStorage.setItem("sentient", board2str_onlyVisible());
    // localStorage.setItem("yay", board2str_onlyVisible());
  }*/

  if (isKeyDown('k')) layout.origin.y -= deltaTime * 0.4;
  if (isKeyDown('i')) layout.origin.y += deltaTime * 0.4;
  if (isKeyDown('l')) layout.origin.x -= deltaTime * 0.4;
  if (isKeyDown('j')) layout.origin.x += deltaTime * 0.4;

  if (isKeyDown('o')) ui_t_offset -= deltaTime * 1.0;
  if (isKeyDown('p')) ui_t_offset += deltaTime * 1.0;

  drawBoard(time + anim_t);

  // UI
  let min_t_ui = Math.max(0, Math.ceil(ui_t_offset / BUTTON));
  let max_t_ui = Math.min(MAX_T, Math.floor((ui_t_offset + canvas.width) / BUTTON));
  ctx.strokeStyle = "black";
  for (let t=min_t_ui; t<max_t_ui; t++) {
    let x = t * BUTTON - ui_t_offset;
    for (let k=0; k<swappers.length; k++) {
      let y = canvas.height - (k + 1) * BUTTON;
      // fillstyle input etc
      let input_val = swappers[k].inputReqs[t];
      if (input_val !== null) {
        ctx.fillStyle = input_val ? "white" : "black";
        ctx.fillRect(x + MARGIN * BUTTON, y + MARGIN * BUTTON, BUTTON * (1-2*MARGIN), BUTTON * (1-2*MARGIN));
      }
      let contradiction = contradictions.some(x => x.time === t && x.cable === swappers[k]);
      ctx.strokeStyle = contradiction ? "red" : "black";
      ctx.strokeRect(x + MARGIN * BUTTON, y + MARGIN * BUTTON, BUTTON * (1-2*MARGIN), BUTTON * (1-2*MARGIN));
    }
    let extra_contradiction = contradictions.some(x => x.time === t && swappers.indexOf(x.cable) === -1);
    if (extra_contradiction) {
      ctx.strokeStyle = "red";
      let y = canvas.height - (swappers.length + 1) * BUTTON;
      ctx.strokeRect(x + MARGIN * BUTTON, y + MARGIN * BUTTON, BUTTON * (1-2*MARGIN), BUTTON * (1-2*MARGIN));
    }
  }
  ctx.strokeStyle = "white";
  let ui_cur_t_x = (time + anim_t) * BUTTON - ui_t_offset;
  ctx.strokeRect(ui_cur_t_x, canvas.height - swappers.length * BUTTON, BUTTON, BUTTON * swappers.length);

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
