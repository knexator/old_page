import { CONFIG } from 'base'

// ball i, world j corresponds to won_data[ball_i, world_j]
export function IJ2K(ball_i: number, world_j: number, xy_data: boolean) {
  // Chunk by color, that is, ball_j
  // p_11, p_21, p_31 ... p_12, p_22, ...
  // For x/y, multiply by 2:
  // p_11x, p_11y, p_21x, p_21y ... p_12x, p_12y ...
  let res = world_j + ball_i * CONFIG.N_WORLDS
  if (xy_data) return res * 2
  return res
}

export function XY2Hole(x: number, y: number, corner: boolean) {
  if (corner) {
    if (x > 0) {
      if (y > 0) {
        return 1
      } else {
        return 2
      }
    } else {
      if (y > 0) {
        return 3
      } else {
        return 4
      }
    }
  } else {
    if (y > 0) {
      return 5
    } else {
      return 6
    }
  }
}

/*export function Hole2XY(h: number) {

}*/

export function afterHolePos(ball_n: number, hole_n: number) {
  let t = (ball_n + .5) / CONFIG.N_BALLS - .5;
  if (hole_n === 5 || hole_n === 6) {
    let x = t * CONFIG.N_BALLS * CONFIG.BALL_R * 2;
    let y = .5 + CONFIG.EXTRA_MARGIN / 2;
    if (hole_n === 5) {
      return [x, y]
    } else {
      return [-x, -y]
    }
  } else {
    let dA = t >= 0 ? 0.0 : CONFIG.N_BALLS * CONFIG.BALL_R * 2 * -t;
    let dB = t <= 0 ? 0.0 : CONFIG.N_BALLS * CONFIG.BALL_R * 2 * t;
    if (hole_n === 1) {
      return [1 + CONFIG.EXTRA_MARGIN / 2 - dA, 0.5 + CONFIG.EXTRA_MARGIN / 2 - dB]
    } else if (hole_n === 2) {
      return [1 + CONFIG.EXTRA_MARGIN / 2 - dB, - 0.5 - CONFIG.EXTRA_MARGIN / 2 + dA]
    } else if (hole_n === 4) {
      return [-1 - CONFIG.EXTRA_MARGIN / 2 + dA, -0.5 - CONFIG.EXTRA_MARGIN / 2 + dB]
    } else if (hole_n === 3) {
      return [-1  - CONFIG.EXTRA_MARGIN / 2 + dB, 0.5 + CONFIG.EXTRA_MARGIN / 2 - dA]
    }
  }
  throw new Error("hole doesn't exists!")
}
