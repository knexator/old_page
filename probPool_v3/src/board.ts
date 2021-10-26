import { CONFIG } from 'base'

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

export function initialPosition(ball_n: number) {
  if (ball_n === 0) {
    return [-.5, 0.0]
  }
  let n_i = ball_n;
  let n_k = 2;
  let i = 1;
  while (n_i > 0) {
    i += 1;
    n_i -= n_k;
    n_k += 1;
  }
  let j = n_i + i / 2 - .5;
  if (i == 4) j+=1;
  i -= 3;
  return [
    .5 + i * CONFIG.BALL_R * Math.sin(Math.PI / 3) * (2 + CONFIG.INITIAL_SPACING),
    j * CONFIG.BALL_R * (2 + CONFIG.INITIAL_SPACING)
  ]
}
