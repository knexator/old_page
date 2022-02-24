import { engine_update, isButtonDown, isKeyDown, mouse, wasButtonPressed, wasButtonReleased, wasKeyPressed } from 'engine';
import { layout, board, Tile, Cable, board2str, MAX_T, swappers, control_tracks, contradictions, Contradiction, magicAdjacentCable, TimeDirection, BlockedAt, ValidBefore, ValidAfter } from 'hexGame';
import { beginFrame, cableSample, canvas, ctx, drawBoard, drawGhostCable, drawGhostHex, highlightCable } from './graphics';
import { Hex, Point } from './hexLib';

let EDITOR = false;
let FREEHAND_INPUT = false;

let last_time = 0;
let wheel_off = 0;
let grabbing_time_slider = false;

let time = 5.5;
let anim_t = 0;
export let time_dir = 0;

let contra_anim: {
  contradiction: Contradiction,
  cur_cable: Cable | null,
  click_t: number,
  click_real_t: number,
  done: boolean,
  reverse: boolean,
} | null = null;

export let contra_cable_highlight: Cable | null = null;

const BUTTON_W = 100;
const BUTTON_H = 50;
let ui_t_offset = -BUTTON_H;
// let ui_t_offset = Math.floor(MAX_T / 2) * BUTTON_W - canvas.width * 3;

window.addEventListener("resize", e => {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  layout.size = 85 * canvas.width / 1920;
});

function initOnce() {
  window.dispatchEvent(new Event('resize'));
  window.requestAnimationFrame(update);
}

function update(curTime: number) {
  let deltaTime = curTime - last_time
  deltaTime = Math.min(deltaTime, 30.0)
  last_time = curTime;

  wheel_off += mouse.wheel;
  time_dir = 0;

  beginFrame();

  if (wasButtonReleased("left")) {
    grabbing_time_slider = false;
  }

  let circle_draw: Point | null = null;
  if (contra_anim) {
    const SPEED = 0.003; // 0.005
    if (contra_anim.done) {
      let cur_cable = contra_anim.cur_cable!;
      let cable_t = mod(anim_t + .5, 1);
      if (cur_cable.direction === "backward") cable_t = 1 - cable_t;
      let trainCenter = cableSample(cur_cable, cable_t, time + anim_t);
      circle_draw = trainCenter;
      anim_t = moveToZero(anim_t, SPEED * deltaTime);
      time_dir = Math.sign(anim_t);

      if (wasKeyPressed('d') || wasKeyPressed('a') || wasButtonPressed("left") || wasButtonPressed("right")) contra_anim = null;
    } else if (contra_anim.cur_cable) {
      let cur_cable = contra_anim.cur_cable;

      let done = false;
      if (contra_anim.reverse) {
        done = cur_cable === contra_anim.contradiction.source_cable && time - .5 === contra_anim.contradiction.source_t;
      } else {
        done = cur_cable === contra_anim.contradiction.cable && time - .5 === contra_anim.contradiction.time;
      }
      if (done) {
        contra_anim.done = true;
      } else {
        let cable_t = 0;
        if (cur_cable.direction === "forward") cable_t = mod(anim_t + .5, 1);
        if (cur_cable.direction === "backward") cable_t = 1 - mod(anim_t + .5, 1);
        let trainCenter = cableSample(cur_cable, cable_t, time + anim_t);
        circle_draw = trainCenter;
        let actual_dir = maybeReverseDir(contra_anim.contradiction.direction, contra_anim.reverse);
        let target_anim_t = actual_dir === cur_cable.direction ? 0.5 : -.5;
        anim_t = moveToTarget(anim_t, SPEED * deltaTime, target_anim_t);
        time_dir = Math.sign(anim_t - target_anim_t);
        if (anim_t === target_anim_t) {
          let next_cable = magicAdjacentCable(cur_cable, time, actual_dir);
          time += anim_t;
          anim_t = 0;
          if (next_cable!.direction === actual_dir) {
            time += .5;
            anim_t -= .5;
          } else {
            time -= .5;
            anim_t += .5;
          }
          contra_anim.cur_cable = next_cable;
          console.log(time);
        }
      }
    } else {
      // haven't yet started
      let t = (last_time - contra_anim.click_real_t) / 1000;
      t = easeInOutCubic(Math.min(1, Math.max(0, t)));
      let target_t = contra_anim.reverse ? contra_anim.contradiction.time : contra_anim.contradiction.source_t;
      time = lerp(contra_anim.click_t, target_t + .5, t)
      // time = moveToTarget(time, 0.005 * deltaTime, contra_anim.contradiction.source_t + .5);
      // click_t: time + anim_t,
      // click_real_t: last_time
      if (time === target_t + .5) {
        if (contra_anim.reverse) {
          contra_anim.cur_cable = contra_anim.contradiction.cable;
        } else {
          contra_anim.cur_cable = contra_anim.contradiction.source_cable;
        }
      }
    }
    // let new_anim_t = moveToZero(anim_t, 0.005 * deltaTime);
    // anim_t = new_anim_t;
  }

  if (!contra_anim) {
    let cur_raw = layout.pixelToHex(mouse);
    let cur_hex = cur_raw.round();
    let cur_frac = cur_raw.subtract(cur_hex);
    let cur_frozen = cur_hex.freeze();
    let exists = board.has(cur_frozen);

    let mi = Math.floor((mouse.y + ui_t_offset) / BUTTON_H);
    let mj = Math.floor((canvas.width - mouse.x) / BUTTON_W);
    if (FREEHAND_INPUT) mj -= 1;

    if (mj === control_tracks.length || grabbing_time_slider) {
      document.body.style.cursor = 'pointer';
      if (isButtonDown("left")) {
        grabbing_time_slider = true;
        time = (mouse.y + ui_t_offset) / BUTTON_H;
      }
      /*time += 1;
      anim_t -= .99;*/
    } else if (control_tracks.length > mj && mj >= 0 && mi >= 0 && mi + 1 <= MAX_T) {
      document.body.style.cursor = 'pointer';
      if (wasButtonPressed("left")) {
        control_tracks[mj].cycleInput(mi);
      }
      if (wasButtonPressed("right")) {
        let contra = contradictions.find(x => x.time === mi && x.cable === control_tracks[mj]);
        if (contra) {
          contra_anim = {
            contradiction: contra,
            cur_cable: null,
            click_t: time + anim_t,
            click_real_t: last_time,
            done: false,
            reverse: false,
          };
          time += anim_t;
          anim_t = 0;
        }
      }
    } else {
      document.body.style.cursor = 'default';
      if (exists) {
        let cur_tile = board.get(cur_frozen)!;
        let cur_dir = cur_frac.mainDir();
        let cur_cable = cur_tile.getCable(cur_dir, time);
        if (cur_cable === null) {
          if (EDITOR) {
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
          }
        } else {
          // yes cable
          /*ctx.strokeStyle = "white";
          ctx.lineWidth = 3;
          drawGhostCable(cur_hex, cur_cable.getOrigin(time), cur_cable.getTarget(time));
          ctx.strokeStyle = "black";
          ctx.lineWidth = 1;*/
          let contra = contradictions.find(x => Math.floor(x.time) === Math.floor(time) && x.cable === cur_cable);
          if (contra) {
            contra_cable_highlight = cur_cable;
            // highlightCable(cur_hex, cur_cable.getOrigin(time), cur_cable.getTarget(time));
            if (wasButtonPressed("right")) {
              contra_anim = {
                contradiction: contra,
                cur_cable: null,
                click_t: time + anim_t,
                click_real_t: last_time,
                done: false,
                reverse: true,
              };
              time += anim_t;
              anim_t = 0;
            }
          } else {
            contra_cable_highlight = null;
          }

          if (wasKeyPressed('y')) {
            console.log(cur_hex, cur_cable.getOrigin(time))
          }
          if (FREEHAND_INPUT || EDITOR || contains(control_tracks, cur_cable)) {
            highlightCable(cur_hex, cur_cable.getOrigin(time), cur_cable.getTarget(time));
            if (wasButtonPressed("left") && (FREEHAND_INPUT || cur_cable.swapper)) {
              cur_cable.cycleInput(Math.floor(time));
            } else if (wasButtonPressed("right") && EDITOR) {
              cur_tile.deleteCable(cur_dir);
            }
          }
        }
      } else {
        if (EDITOR) {
          drawGhostHex(cur_hex);
          if (wasButtonPressed("left")) {
            board.set(cur_hex.freeze(), new Tile(cur_hex));
          }
        }
      }
    }

    if (anim_t === 0) {
      if (wasKeyPressed('d') && time + 1 < MAX_T) {
        time += 1;
        anim_t -= .99;
      } else if (wasKeyPressed('a') && time >= 1) {
        time -= 1;
        anim_t += .99;
      }
    } else {
      time_dir = Math.sign(anim_t);
      let new_anim_t = moveToZero(anim_t, 0.005 * deltaTime);
      anim_t = new_anim_t;
    }
  }

  /*if (wasKeyPressed('s')) {
    localStorage.setItem("cool", board2str());
  }
  if (wasKeyPressed('m')) {
    board.clear();
  }*/
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
  ui_t_offset += deltaTime * mouse.wheel * 2.0;

  drawBoard(time + anim_t);

  if (circle_draw) {
    ctx.beginPath();
    ctx.strokeStyle = "#42f575";
    ctx.lineWidth = 5;
    ctx.arc(circle_draw.x, circle_draw.y, layout.size, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  // UI
  let min_t_ui = Math.max(0, Math.ceil(ui_t_offset / BUTTON_H));
  let max_t_ui = Math.min(MAX_T, Math.floor((ui_t_offset + canvas.height) / BUTTON_H));
  // ctx.strokeStyle = "black";
  // ctx.fillStyle = "red";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${BUTTON_H * .7}px Arial`;
  for (let t=min_t_ui; t<max_t_ui; t++) {
    let y = t * BUTTON_H - ui_t_offset;
    for (let k=0; k<control_tracks.length; k++) {
      let x = canvas.width - (k + 1) * BUTTON_W;
      if (FREEHAND_INPUT) x -= BUTTON_W;
      // fillstyle input etc
      let input_val = control_tracks[k].inputReqs[t];
      //let contradiction = contradictions.some(x => x.time === t && x.cable === control_tracks[k]);

      if (input_val) {
        ctx.fillRect(x, y, BUTTON_W, BUTTON_H);
        ctx.fillStyle = "black";
        ctx.fillText("DCBA"[k], x + BUTTON_W / 2, y + BUTTON_H / 2);

        ctx.fillStyle = ValidBefore(3-k, t) ? "cyan" : "red";
        ctx.fillRect(x, y, BUTTON_W, BUTTON_H / 5);

        ctx.fillStyle = ValidAfter(3-k, t) ? "cyan" : "red";
        ctx.fillRect(x, y + 4 * BUTTON_H / 5, BUTTON_W, BUTTON_H / 5);

        ctx.fillStyle = "white";
      } else {
        ctx.fillText("·", x + BUTTON_W / 2, y + BUTTON_H / 2);
      }

      /*let text = contradiction ? "?" : input_val ? "✓" : "-";
      ctx.fillText(text, x + BUTTON_W / 2, y + BUTTON_H / 2);*/

      /*if (input_val || contradiction) {
        ctx.beginPath();
        ctx.arc(x + BUTTON_W / 2, y + BUTTON_H / 2, BUTTON_H / 3, 0, Math.PI * 2);
      }
      if (input_val) ctx.stroke();
      if (contradiction) ctx.fill();*/

      /*if (input_val !== null) {
        ctx.fillStyle = input_val ? "white" : "black";
        ctx.fillRect(x + MARGIN * BUTTON_W, y + MARGIN * BUTTON_H, BUTTON_W * (1-2*MARGIN), BUTTON_H * (1-2*MARGIN));
      }*/

      // ctx.strokeStyle = contradiction ? "red" : "black";
      // ctx.strokeRect(x + MARGIN * BUTTON_W, y + MARGIN * BUTTON_H, BUTTON_W * (1-2*MARGIN), BUTTON_H * (1-2*MARGIN));
    }
    /*let extra_contradiction = contradictions.some(x => x.time === t && control_tracks.indexOf(x.cable) === -1);
    if (extra_contradiction) {
      let x = canvas.width - (FREEHAND_INPUT ? BUTTON_H : BUTTON_H * (control_tracks.length + 1));
      ctx.fillText('?', x + BUTTON_W / 2, y + BUTTON_H / 2);
    }*/
  }
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let t=min_t_ui; t<=max_t_ui; t++) {
    let y = t * BUTTON_H - ui_t_offset;
    ctx.moveTo(canvas.width - (control_tracks.length + (FREEHAND_INPUT ? 1 : 0)) * BUTTON_W, y);
    ctx.lineTo(canvas.width, y);
  }
  for (let k=0; k<control_tracks.length + (FREEHAND_INPUT ? 1 : 0); k++) {
    let x = canvas.width - (k + 1) * BUTTON_W;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }
  ctx.stroke();
  ctx.lineWidth = 1;

  const post_names = ['A', 'B', 'C', 'D'];
  const post_locations = [
    new Hex(5.24, 1.69, -6.93),
    new Hex(6.62, -1.61, -5.01),
    new Hex(4.64, 0.32, -4.96),
    new Hex(6.87, 0.25, -7.22),
  ];

  for (let k=0; k<4; k++) {
    let x = canvas.width - ((3-k) + (FREEHAND_INPUT ? 2 : 1)) * BUTTON_W;
    ctx.fillText(post_names[k], x + BUTTON_W / 2, -ui_t_offset - BUTTON_H / 2);

    let asdf = layout.hexToPixel(post_locations[k]);
    ctx.fillText(post_names[k], asdf.x, asdf.y);
  }

  if (wasKeyPressed('t')) {
    console.log(layout.pixelToHex(mouse));
  }

  /*for (let k=0; k<swappers.length; k++) {
    let y = canvas.height - (k + (FREEHAND_INPUT ? 2 : 1)) * BUTTON_H;
    ctx.fillText(swapper_names[k], -ui_t_offset - BUTTON_W / 2, y + BUTTON_H / 2);

    let asdf = layout.hexToPixel(swappers[k].tile.coords.add(offsets[k]));
    ctx.fillText(swapper_names[k], asdf.x, asdf.y);
  }*/

  /*ctx.beginPath();
  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  let ui_cur_t_x = (time + anim_t) * BUTTON_W - ui_t_offset;
  ctx.moveTo(ui_cur_t_x, canvas.height - swappers.length * BUTTON_H);
  ctx.lineTo(ui_cur_t_x, canvas.height);
  ctx.stroke();
  ctx.lineWidth = 1;*/

  ctx.fillStyle = "#AAAAAA";
  let x_bar = canvas.width - control_tracks.length * BUTTON_W - BUTTON_W / 5;
  let w_bar = BUTTON_W / 8;
  ctx.fillRect(x_bar - w_bar / 2, 0, w_bar, canvas.height);

  ctx.beginPath();
  ctx.fillStyle = "white";
  let y = (time + anim_t) * BUTTON_H - ui_t_offset;
  let x = canvas.width - control_tracks.length * BUTTON_W;
  if (FREEHAND_INPUT) x -= BUTTON_W;
  ctx.moveTo(x, y);
  ctx.lineTo(x - BUTTON_W / 3, y + BUTTON_H / 5);
  ctx.lineTo(x - BUTTON_W / 3, y - BUTTON_H / 5);
  ctx.closePath();
  ctx.fill();

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

function moveToTarget(value: number, speed: number, target: number) {
  if (value > target) {
    return Math.max(target, value - speed)
  } else if (value < target) {
    return Math.min(target, value + speed)
  } else {
    return value
  }
}

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function maybeReverseDir(direction: TimeDirection, reverse: boolean): TimeDirection {
  if (reverse) {
    if (direction === "backward") return "forward";
    return "backward";
  } else {
    return direction;
  }
}

export function contains(list: any[], element: any): boolean {
  return list.indexOf(element) !== -1;
}
