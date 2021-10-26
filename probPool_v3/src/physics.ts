import { CONFIG, pos_data, vel_data, won_data, IJ2K } from 'base'
import { XY2Hole, afterHolePos } from 'board'

export function advanceGame(deltaTime: number) {
  let BORDER_R = CONFIG.BORDER_R
  let BORDER_R_SQ = BORDER_R * BORDER_R
  let BALL_R = CONFIG.BALL_R
  let BALL_R_SQ = BALL_R * BALL_R
  let N_BALLS = CONFIG.N_BALLS
  let N_WORLDS = CONFIG.N_WORLDS
  const right_border = 1 - (BORDER_R + BALL_R);
  const top_border = .5 - (BORDER_R + BALL_R);

  // Velocity, crash against borders
  for (let i = 0; i < N_BALLS; i++) {
    for (let j = 0; j < N_WORLDS; j++) {
      let k = IJ2K(i, j, true);
      let k_won = IJ2K(i, j, false);
      if (won_data[k_won] == 0) {
        // Advance
        pos_data[k] += deltaTime * vel_data[k]
        vel_data[k] *= .99
        pos_data[k + 1] += deltaTime * vel_data[k + 1]
        vel_data[k + 1] *= .99

        let x = Math.abs(pos_data[k])
        let y = Math.abs(pos_data[k + 1])
        // Check corner holes
        if (x > 1 - (1 + Math.SQRT2) * BORDER_R && y > .5 - (1 + Math.SQRT2) * BORDER_R) {  // quick corner check
          let dx = (1 - Math.SQRT2 * BORDER_R) - x
          let dy = (.5 - Math.SQRT2 * BORDER_R) - y
          if (dx * dx + dy * dy < BORDER_R) {
            let offset = afterHolePos(i, XY2Hole(pos_data[k], pos_data[k + 1], true));
            pos_data[k] = offset[0]
            pos_data[k + 1] = offset[1]
            won_data[k_won] = 1;
            continue;
          }
        }

        if (x > right_border) {
          // Check horizontal borders
          x = 2 * right_border - x
          vel_data[k] *= -1
          pos_data[k] = x * Math.sign(pos_data[k])
          // continue;
        } else if (y > top_border) {
          // Check vertical borders & middle holes
          if (x < BORDER_R) { // fast check for middle hole
            // let x = Math.abs(cur_ball_pos[k - 1])
            // let y = top_border - cur_ball_pos[k]
            let dy = top_border - y
            if (x * x + dy * dy < BORDER_R_SQ) { // inside the hole!
              // let offset = ballOffset(n);
              let hole = XY2Hole(pos_data[k], pos_data[k + 1], false)
              let offset = afterHolePos(i, hole);
              pos_data[k] = offset[0]
              pos_data[k + 1] = offset[1]
              //cur_ball_pos[k + 1] = (0.5 - BORDER_R) * Math.sign(cur_ball_pos[k + 1]) + offset[1]
              // cur_ball_pos[k + 1] = 0.5 + EXTRA_MARGIN / 2
              /*cur_ball_vel[k - 1] = 0.0
              cur_ball_vel[k] = 0.0*/
              won_data[k_won] = hole;
              continue;
            }/* else {
              // TODO: proper rebound against corners
              cur_ball_pos[k] = 2 * top_border - cur_ball_pos[k]
              cur_ball_vel[k] *= -1
            }*/
          }

          y = 2 * top_border - y
          vel_data[k + 1] *= -1
          pos_data[k + 1] = y * Math.sign(pos_data[k + 1])

          //cur_ball_pos[k] = 2 * top_border - cur_ball_pos[k]
          //cur_ball_vel[k] *= -1
        }
      }
    }
  }


  // Ball collisions
  for (let j = 0; j < N_WORLDS; j++) {
    for (let i1 = 0; i1 < N_BALLS; i1++) {
      let k1 = IJ2K(i1, j, true);
      if (won_data[IJ2K(i1, j, false)] !== 0) continue;
      let b1px = pos_data[k1]
      let b1py = pos_data[k1 + 1]
      let b1vx = vel_data[k1]
      let b1vy = vel_data[k1 + 1]
      for (let i2 = i1 + 1; i2 < N_BALLS; i2++) {
        if (won_data[IJ2K(i2, j, false)] !== 0) continue;
        let k2 = IJ2K(i2, j, true);
        let b2px = pos_data[k2]
        let b2py = pos_data[k2 + 1]
        let b2vx = vel_data[k2]
        let b2vy = vel_data[k2 + 1]
        let dx = b1px - b2px;
        let dy = b1py - b2py;
        let distSq = dx * dx + dy * dy;
        if (distSq < 4 * BALL_R_SQ && distSq > 0) {
          let dist = Math.sqrt(distSq);
          let nx = dy / dist;
          let ny = -dx / dist;
          let [dd1x, dd1y] = dotpart(b1vx, b1vy, nx, ny);
          let [dd2x, dd2y] = dotpart(b2vx, b2vy, nx, ny);

          if (2 * BALL_R - dist > 0) {
            let push = (2 * BALL_R - dist) * 0.5 / dist;
            // let push = Math.max(0, 2 * BALL_R - dist) * 0.5 / dist;
            pos_data[k1] += dx * push;
            pos_data[k1 + 1] += dy * push;
            pos_data[k2] -= dx * push;
            pos_data[k2 + 1] -= dy * push;

            /*b1.vx = b1.vx - dd1x + dd2x;
            b1.vy = b1.vy - dd1y + dd2y;
            b2.vx = b2.vx - dd2x + dd1x;
            b2.vy = b2.vy - dd2y + dd1y;*/
            vel_data[k1] -= dd1x - dd2x;
            vel_data[k1 + 1] -= dd1y - dd2y;
            vel_data[k2] -= dd2x - dd1x;
            vel_data[k2 + 1] -= dd2y - dd1y;
          }
        }
      }
    }
  }


}

function dotpart(vx: number, vy: number, nx: number, ny: number) {
  var dot = vx * nx + vy * ny;
  return [vx - dot * nx, vy - dot * ny];
}
