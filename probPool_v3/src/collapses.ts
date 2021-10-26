import { selected, CONFIG, pos_data, vel_data, won_data, IJ2K, ball_colors, pintar } from 'base'
import { mouse } from './engine';
import { ball_shader, drawBallOutlineAt, outline_ball_shader } from './graphics';
import { wheel_offset } from './main';

export function select() {
  let [selected_ball, selected_world] = selectClosestToMouse_anyColor()
  selected.ball = selected_ball
  selected.world = selected_world
}

function selectClosestToMouse_anyColor() {
  let PICK_TOLERANCE = 0.0
  let mx = mouse.x;
  let my = mouse.y;
  let best_ks: Array<[number, number, number]> = [];
  let best_distSq = Infinity;
  for (let i = 0; i < CONFIG.N_BALLS; i++) {
    for (let j = 0; j < CONFIG.N_WORLDS; j++) {
      let k = IJ2K(i,j,true)
      let dx = mx - pos_data[k]
      let dy = my - pos_data[k+1]
      let distSq = dx * dx + dy * dy;
      if (distSq < best_distSq + PICK_TOLERANCE) {
        if (distSq < best_distSq) {
          best_distSq = distSq;
          // Cleanup the list
          best_ks = best_ks.filter(([_k, d]) => {
            return d < best_distSq + PICK_TOLERANCE;
          });
        }
        best_ks.push([j, distSq, i]);
      }
    }
  }
  let offset = indexOfSmallest(best_ks.map(a => a[1]));
  // best_ks = best_ks.sort((a, b) => a[1] - b[1]) // loses the nice continuum
  let result = best_ks[mod(offset + wheel_offset, best_ks.length)]; //[0]
  if (result[1] < CONFIG.BALL_R * CONFIG.BALL_R || CONFIG.ALWAYS_PICK) {
    return [result[2], result[0]];
  } else {
    return [null, null];
  }
}

export function collapse() {
  console.log("collapse()")
  // collapseIndividualMean(0)
  // addChaos()
  console.log(selected)
  if (selected.ball === null) {
    return;
    // throw new Error("selected_ball is not defined")
  }
  collapseIndividualMean(selected.ball)
  collapseIndividualMean(0)
  addChaos()
}

function collapseIndividualMean(ball_i: number) {
  let mean_px = 0;
  let mean_py = 0;
  let mean_vx = 0;
  let mean_vy = 0;
  let n_won = 0;
  let n_lost = 0;
  // let example_won = null;
  for (let j = 0; j < CONFIG.N_WORLDS; j++) {
    if (won_data[IJ2K(ball_i, j, false)] === 0) {
      let k = IJ2K(ball_i, j, true)
      mean_px += pos_data[k]
      mean_py += pos_data[k + 1]
      mean_vx += vel_data[k]
      mean_vy += vel_data[k + 1]
      n_lost += 1
    } else {
      /*if (!example_won) {
        let k = IJ2K(ball_i, j, true)
        example_won = [pos_data[k], pos_data[k + 1]]
      }*/
      n_won += 1
    }
  }
  mean_px /= n_lost
  mean_py /= n_lost
  mean_vx /= n_lost
  mean_vy /= n_lost

  if (CONFIG.PERMANENT_HOLES) {
    for (let j = 0; j < CONFIG.N_WORLDS; j++) {
      if (won_data[IJ2K(ball_i, j, false)] === 0) {
        let k = IJ2K(ball_i, j, true)
        pos_data[k] = mean_px
        pos_data[k + 1] = mean_py
        vel_data[k] = mean_vx
        vel_data[k + 1] = mean_vy
      }
    }
  } else {
    throw new Error("unimplemented!")
    /*if (n_lost > n_won) {
      let cur_ball_pos = balls_pos[n_b]
      let cur_ball_vel = balls_vel[n_b]
      for (let k = 0; k < N_WORLDS * 2; k += 2) {
        cur_ball_pos[k] = mean_px
        cur_ball_pos[k + 1] = mean_py
        cur_ball_vel[k] = mean_vx
        cur_ball_vel[k + 1] = mean_vy
        balls_won[n_b][k / 2] = 0
      }
    } else {
      let cur_ball_pos = balls_pos[n_b]
      let cur_ball_vel = balls_vel[n_b]
      for (let k = 0; k < N_WORLDS * 2; k += 2) {
        cur_ball_pos[k] = example_won![0]
        cur_ball_pos[k + 1] = example_won![1]
        cur_ball_vel[k] = 0
        cur_ball_vel[k + 1] = 0
        balls_won[n_b][k / 2] = 1
      }
    }*/
  }
}

export function drawSelected() {
  if (selected.ball === null || selected.world === null) return
  pintar._renderer.setShader(outline_ball_shader);
  let k = IJ2K(selected.ball, selected.world, true)
  drawBallOutlineAt(pos_data[k], pos_data[k+1], ball_colors[selected.ball])
  pintar._renderer.setShader(ball_shader);
}

export function addChaos() {
  for (let j = 0; j < CONFIG.N_WORLDS; j++) {
    let k = IJ2K(0, j, true);
    pos_data[k] += Math.cos(Math.PI * j / CONFIG.N_WORLDS) * CONFIG.CHAOS_AMOUNT;
    pos_data[k + 1] += Math.sin(Math.PI * j / CONFIG.N_WORLDS) * CONFIG.CHAOS_AMOUNT;
  }
}




function mod(n: number, m: number) {
    return ((n % m) + m) % m;
}

function indexOfSmallest<T>(a: Array<T>) {
  var lowest = -1;
  for (var i = 1; i < a.length; i++) {
    if (a[i] < a[lowest])
      lowest = i;
  }
  return lowest;
}
