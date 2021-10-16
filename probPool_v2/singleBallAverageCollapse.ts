declare let PintarJS: any;

let pintar = new PintarJS();
// pintar.makeFullscreen()

let DEBUG_TRUE_OPACITY = false;

let N_BALLS = 8 // 11 // 16
let N_WORLDS = 512
let BALL_R = 0.03 // 0.025
let BALL_R_SQ = BALL_R * BALL_R
let BORDER_R = 0.05
let BORDER_R_SQ = BORDER_R * BORDER_R
let EXTRA_MARGIN = 0.1
let FORCE_SCALER = 1
let CHAOS_AMOUNT = 0.001
let PICK_TOLERANCE = 0.0005
let ALLOW_NO_PICK = true
let INITIAL_SPACING = 0.1
let OPAQUE_BALLS = false
let COLLAPSE_WHITE = false

let balls_pos: Float32Array[] = []
let balls_vel: Float32Array[] = []
let balls_won: Int8Array[] = []

for (let k = 0; k < N_BALLS; k++) {
  balls_pos.push(new Float32Array(N_WORLDS * 2))
  balls_vel.push(new Float32Array(N_WORLDS * 2).fill(0.0))
  balls_won.push(new Int8Array(N_WORLDS).fill(0))
}

let colors = [
  "FFFFFF",
  "F7DE1B",
  "4C8AF0",
  "ED4A44",
  "D246EE",
  // "14110F",
  "2E8943",
  "DD7933",
  // "BB4B23",
  "04E762",
  "17BEBB",  //64B6AC
].map(hex => {
  let r = parseInt(hex.slice(0,2), 16) / 255;
  let g = parseInt(hex.slice(2,4), 16) / 255;
  let b = parseInt(hex.slice(4,6), 16) / 255;
  return [r,g,b]
})

let cur_selected = null
let wheel_offset = 0
let cur_taco_head = [0, 0]
let cur_taco_tail = [0, 0]
let last_time = 0
let last_pressed: { y: number; x: number; } | null = null

let INITIAL_POSITIONS = [
  [-.5, 0.0],
  [0.5 - BALL_R * 2, 0.0],
  [0.5, 0.0],
  [0.5 + BALL_R * 2, 0.0],
  [.5 - BALL_R, -BALL_R * Math.sin(Math.PI / 3) * 2],
  [.5 - BALL_R, BALL_R * Math.sin(Math.PI / 3) * 2],
  [.5 + BALL_R, -BALL_R * Math.sin(Math.PI / 3) * 2],
  [.5 + BALL_R, BALL_R * Math.sin(Math.PI / 3) * 2],
]

function holeXYtoI(x: number, y:number, corner:boolean) {
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

function afterHolePos(ball_n: number, hole_n: number) {
  let t = (ball_n + .5) / N_BALLS - .5;
  if (hole_n === 5 || hole_n === 6) {
    let x = t * N_BALLS * BALL_R * 2;
    let y = .5 + EXTRA_MARGIN / 2;
    if (hole_n === 5) {
      return [x, y]
    } else {
      return [-x, -y]
    }
  } else {
    let dA = t >= 0 ? 0.0 : N_BALLS * BALL_R * 2 * -t;
    let dB = t <= 0 ? 0.0 : N_BALLS * BALL_R * 2 * t;
    if (hole_n === 1) {
      return [1 + EXTRA_MARGIN / 2 - dA, 0.5 + EXTRA_MARGIN / 2 - dB]
    } else if (hole_n === 2) {
      return [1 + EXTRA_MARGIN / 2 - dB, - 0.5 - EXTRA_MARGIN / 2 + dA]
    } else if (hole_n === 4) {
      return [-1 - EXTRA_MARGIN / 2 + dA, -0.5 - EXTRA_MARGIN / 2 + dB]
    } else if (hole_n === 3) {
      return [-1  - EXTRA_MARGIN / 2 + dB, 0.5 + EXTRA_MARGIN / 2 - dA]
    }
  }
  throw new Error("hole doesn't exists!")
}

function ballOffset(n: number) {
  /*if (i >= 13) {
    return [Math.random() * 2 - 1, Math.random() - .5]
  } else*/ /*if (i >= 8) {
    return [5*BALL_R, (i - 10) * BALL_R * 2]
  }*/
  let n_i = n;
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
  return [i * BALL_R * Math.sin(Math.PI / 3) * (2 + INITIAL_SPACING), j * BALL_R * (2 + INITIAL_SPACING)];

  /*return [
    [0,0],
    [-BALL_R * 2,0],
    [0,0],
    [BALL_R * 2,0],
    [-BALL_R, -BALL_R * Math.sin(Math.PI / 3) * 2],
    [-BALL_R, BALL_R * Math.sin(Math.PI / 3) * 2],
    [BALL_R, -BALL_R * Math.sin(Math.PI / 3) * 2],
    [BALL_R, BALL_R * Math.sin(Math.PI / 3) * 2],
  ][i];*/
}

for (let n = 1; n < N_BALLS; n++) {
  let cur_ball_pos = balls_pos[n]
  // let cur_ball_vel = balls_vel[n]
  let cur_initial_pos = ballOffset(n) // INITIAL_POSITIONS[n]
  for (let k = 0; k < N_WORLDS * 2; k += 2) {
    cur_ball_pos[k] = cur_initial_pos[0] + .5     // + Math.random() * 0.001
    cur_ball_pos[k + 1] = cur_initial_pos[1] // + Math.random() * 0.001
  }
}

for (let k = 0; k < N_WORLDS * 2; k += 2) {
  balls_pos[0][k] = INITIAL_POSITIONS[0][0] + Math.cos(Math.PI * k / N_WORLDS) * CHAOS_AMOUNT;
  balls_pos[0][k + 1] = INITIAL_POSITIONS[0][1] + Math.sin(Math.PI * k / N_WORLDS) * CHAOS_AMOUNT;
}

function collapse() {
  if (COLLAPSE_WHITE) {
    collapse_White()
  } else {
    collapse_noWhite()
  }
}

function collapse_White() {
  if (cur_selected === null) return;
  let [n_w, n_b] = cur_selected;

  let mean_px = 0;
  let mean_py = 0;
  let mean_vx = 0;
  let mean_vy = 0;
  let n_won = 0;
  let n_lost = 0;
  let example_won = null;
  for (let k = 0; k < N_WORLDS * 2; k += 2) {
    if (balls_won[n_b][k / 2] === 0) {
      mean_px += balls_pos[n_b][k]
      mean_py += balls_pos[n_b][k + 1]
      mean_vx += balls_vel[n_b][k]
      mean_vy += balls_vel[n_b][k + 1]
      n_lost += 1
    } else {
      if (!example_won) example_won = [balls_pos[n_b][k], balls_pos[n_b][k + 1]]
      n_won += 1
    }
  }
  mean_px /= N_WORLDS
  mean_py /= N_WORLDS
  mean_vx /= N_WORLDS
  mean_vy /= N_WORLDS


  if (n_lost > n_won) {
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
  }

  n_b = 0
  mean_px = 0;
  mean_py = 0;
  mean_vx = 0;
  mean_vy = 0;
  n_won = 0;
  n_lost = 0;
  example_won = null;
  for (let k = 0; k < N_WORLDS * 2; k += 2) {
    if (balls_won[n_b][k / 2] === 0) {
      mean_px += balls_pos[n_b][k]
      mean_py += balls_pos[n_b][k + 1]
      mean_vx += balls_vel[n_b][k]
      mean_vy += balls_vel[n_b][k + 1]
      n_lost += 1
    } else {
      if (!example_won) example_won = [balls_pos[n_b][k], balls_pos[n_b][k + 1]]
      n_won += 1
    }
  }
  mean_px /= N_WORLDS
  mean_py /= N_WORLDS
  mean_vx /= N_WORLDS
  mean_vy /= N_WORLDS


  if (n_lost > n_won) {
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
  }
  for (let k = 0; k < N_WORLDS * 2; k += 2) {
    balls_pos[0][k] += Math.cos(Math.PI * k / N_WORLDS) * CHAOS_AMOUNT;
    balls_pos[0][k + 1] += Math.sin(Math.PI * k / N_WORLDS) * CHAOS_AMOUNT;
  }
}

function collapse_noWhite() {
  if (cur_selected === null) return;
  let [n_w, n_b] = cur_selected;

  let mean_px = 0;
  let mean_py = 0;
  let mean_vx = 0;
  let mean_vy = 0;
  let n_won = 0;
  let n_lost = 0;
  let example_won = null;
  for (let k = 0; k < N_WORLDS * 2; k += 2) {
    if (balls_won[n_b][k / 2] === 0) {
      mean_px += balls_pos[n_b][k]
      mean_py += balls_pos[n_b][k + 1]
      mean_vx += balls_vel[n_b][k]
      mean_vy += balls_vel[n_b][k + 1]
      n_lost += 1
    } else {
      if (!example_won) example_won = [balls_pos[n_b][k], balls_pos[n_b][k + 1]]
      n_won += 1
    }
  }
  mean_px /= N_WORLDS
  mean_py /= N_WORLDS
  mean_vx /= N_WORLDS
  mean_vy /= N_WORLDS


  if (n_lost > n_won) {
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
  }

  for (let k = 0; k < N_WORLDS * 2; k += 2) {
    balls_pos[0][k] += Math.cos(Math.PI * k / N_WORLDS) * CHAOS_AMOUNT;
    balls_pos[0][k + 1] += Math.sin(Math.PI * k / N_WORLDS) * CHAOS_AMOUNT;
  }
}

function selectClosestToMouse_anyColor() {
  let mx = mouse.x
  let my = mouse.y
  let best_ks: number[][] = [];
  let best_distSq = Infinity;
  for (let n = 0; n < N_BALLS; n++) {
    for (let k = 0; k < N_WORLDS; k++) {
      let dx = mx - balls_pos[n][k * 2];
      let dy = my - balls_pos[n][k * 2 + 1];
      let distSq = dx * dx + dy * dy;
      if (distSq < best_distSq + PICK_TOLERANCE) {
        if (distSq < best_distSq) {
          best_distSq = distSq;
          // Cleanup the list
          best_ks = best_ks.filter(([_k, d]) => {
            return d < best_distSq + PICK_TOLERANCE
          })
        }
        best_ks.push([k, distSq, n])
      }
      /*if (distSq < best_distSq) {
        best_distSq = distSq;
        best_ks = [k];
      } else if (distSq == best_distSq) {
        best_ks.push(k);
      }*/
    }
  }

  let offset = indexOfSmallest(best_ks.map(a => a[1]))
  // best_ks = best_ks.sort((a, b) => a[1] - b[1]) // loses the nice continuum
  let result = best_ks[mod(offset + wheel_offset, best_ks.length)] //[0]

  if (result[1] < BALL_R_SQ || !ALLOW_NO_PICK) {
    return [result[0], result[2]]
  } else {
    return null;
  }

}

function indexOfSmallest(a: number[]) {
  var lowest = 0;
  for (var i = 1; i < a.length; i++) {
    if (a[i] < a[lowest]) lowest = i;
  }
  return lowest;
}

window.addEventListener("resize", _e => {
  let height = Math.min(window.innerHeight * 0.75, window.innerWidth * 0.75 / 2);
  pintar.canvas.height = height * (1 + EXTRA_MARGIN * 2);
  pintar.canvas.width = height * (2 + EXTRA_MARGIN * 2);
});

window.addEventListener("load", _e => {
  window.dispatchEvent(new Event('resize'));
  window.requestAnimationFrame(update);
});

class BallShader extends PintarJS.ShaderBase {
  get uniformNames() {
    return ["u_pos", "u_color", "u_transparent"];
  }

  get vertexShaderCode() {
    return `
      attribute vec2 a_position;

      // screen resolution to project quad
      // uniform vec2 u_resolution;

      uniform vec2 u_pos;

      // output texture coord
      varying vec2 v_texCoord;

      // main vertex shader func
      void main()
      {
        vec2 res = u_pos + (a_position - .5) * ${BALL_R * 2};
        vec2 clip_pos = vec2(res.x / (1.0 + ${EXTRA_MARGIN}), res.y / (0.5 + ${EXTRA_MARGIN}));
        // vec2 clip_pos = vec2(res.x / (1.0 + ${EXTRA_MARGIN * 2}), res.y / (0.5 + ${EXTRA_MARGIN * 2}));
        gl_Position = vec4(clip_pos, 0, 1);
        v_texCoord = a_position - .5;
      }
      `;
  }

  /**
   * Return fragment shader code.
   */
  get fragmentShaderCode() {
    return `
    precision mediump float;

    // uniform vec2 u_balls_pos[${N_WORLDS}];
    uniform vec3 u_color;
    uniform float u_transparent;

    // the texCoords passed in from the vertex shader.
    varying vec2 v_texCoord;

    // main fragment shader func
    void main()
    {
      float distSq = dot(v_texCoord, v_texCoord);
      float weight = smoothstep(0.25, .23, distSq);
      // gl_FragColor = vec4(u_color.xy * 0.0 + v_texCoord, 0.0, 1.0);
      if (u_transparent < 0.5) {
        weight *= ${DEBUG_TRUE_OPACITY ? 1.0 / N_WORLDS : 0.05};
      }
      gl_FragColor = vec4(u_color * weight, weight);
    }
      `
  }

  get haveTexture() {
    return false;
  }

  prepare(_renderable: any, _viewport: any) {
    this._gl.uniform3f(this.uniforms.u_color, ...colors[cur_selected[1]]);
    this._gl.uniform2f(
      this.uniforms.u_pos,
      balls_pos[cur_selected[1]][cur_selected[0] * 2],
      balls_pos[cur_selected[1]][cur_selected[0] * 2 + 1]
    );
    this._gl.uniform1f(this.uniforms.u_transparent, OPAQUE_BALLS ? 1.0 : 0.0)
  }
}

class OutlineBallShader extends PintarJS.ShaderBase {
  get uniformNames() {
    return ["u_pos", "u_color"];
  }

  get vertexShaderCode() {
    return `
      attribute vec2 a_position;

      // screen resolution to project quad
      // uniform vec2 u_resolution;

      uniform vec2 u_pos;

      // output texture coord
      varying vec2 v_texCoord;

      // main vertex shader func
      void main()
      {
        vec2 res = u_pos + (a_position - .5) * ${BALL_R * 2};
        vec2 clip_pos = vec2(res.x / (1.0 + ${EXTRA_MARGIN}), res.y / (0.5 + ${EXTRA_MARGIN}));
        gl_Position = vec4(clip_pos, 0, 1);
        v_texCoord = a_position - .5;
      }
      `;
  }

  /**
   * Return fragment shader code.
   */
  get fragmentShaderCode() {
    return `
    precision mediump float;

    // uniform vec2 u_balls_pos[${N_WORLDS}];
    uniform vec3 u_color;

    // the texCoords passed in from the vertex shader.
    varying vec2 v_texCoord;

    // main fragment shader func
    void main()
    {
      float distSq = dot(v_texCoord, v_texCoord);
      float alpha = smoothstep(0.25, .23, distSq);
      float outline = smoothstep(0.05, 0.04, abs(distSq - .24));
      vec3 outline_color = vec3(0.0);
      // float weight = smoothstep(0.25, .23, distSq) * ${DEBUG_TRUE_OPACITY ? 1.0 / N_WORLDS : 0.05};
      // gl_FragColor = vec4(u_color + 0.0 * v_texCoord, 1.0);
      gl_FragColor = vec4((u_color * (1.0 - outline) + outline * outline_color) * alpha, alpha);
      //
    }
      `
  }

  get haveTexture() {
    return false;
  }

  prepare(_renderable: any, _viewport: any) {
    this._gl.uniform3f(this.uniforms.u_color, ...colors[cur_selected[1]]);
    this._gl.uniform2f(
      this.uniforms.u_pos,
      balls_pos[cur_selected[1]][cur_selected[0] * 2],
      balls_pos[cur_selected[1]][cur_selected[0] * 2 + 1]
    );
  }
}

class TacoShader extends PintarJS.ShaderBase {
  get uniformNames() {
    return ["u_head", "u_tail"];
  }

  get vertexShaderCode() {
    return `
      attribute vec2 a_position;

      // screen resolution to project quad
      // uniform vec2 u_resolution;

      uniform vec2 u_head;
      uniform vec2 u_tail;

      // output texture coord
      varying vec2 v_texCoord;

      // main vertex shader func
      void main()
      {
        vec2 delta = u_tail - u_head;
        // vec2 perp = normalize(vec2(delta.y, -delta.x));
        vec2 perp = vec2(delta.y, -delta.x);

        // vec2 res = (a_position - .5);
        // vec2 coords = vec2(a_position.y, (a_position.x - .5) * 0.05 * (a_position.y + 0.6));
        vec2 coords = vec2(a_position.y, (a_position.x - .5) * 0.125);
        // res = delta * (res.y + .5) + perp * res.x * 0.05 * (res.y + 1.1);
        vec2 res = delta * coords.x + perp * coords.y + u_head;

        vec2 clip_pos = vec2(res.x / (1.0 + ${EXTRA_MARGIN}), res.y / (0.5 + ${EXTRA_MARGIN}));

        gl_Position = vec4(clip_pos, 0, 1);

        // vec2 asdf = (a_position - .5) * ${BALL_R * 2};
        // asdf.y *= 2.0;
        // gl_Position = vec4((res + u_head) * vec2(1,2), 0, 1);
        // gl_Position = vec4(asdf + u_head * vec2(1, 2) + u_tail * 0.0, 0, 1);
        // gl_Position = vec4((a_position - .5) * 2.0, 0, 1);
        // v_texCoord = a_position - .5;
        // v_texCoord.y *= length(delta);
        float l = length(delta);
        v_texCoord = vec2((a_position.x - .5) * l, a_position.y * l * 0.5);
      }
      `;
  }

  /**
   * Return fragment shader code.
   */
  get fragmentShaderCode() {
    return `
    precision mediump float;

    // uniform vec2 u_balls_pos[${N_WORLDS}];
    // uniform vec3 u_color;

    // the texCoords passed in from the vertex shader.
    varying vec2 v_texCoord;

    // main fragment shader func
    void main()
    {
      float d = abs(v_texCoord.x - v_texCoord.y * sign(v_texCoord.x));
      d = smoothstep(0.04, 0.03, d);
      vec3 color = vec3(${colors[0][0]}, ${colors[0][1]}, ${colors[0][2]});
      gl_FragColor = vec4(color * d, d);
    }
      `
  }

  get haveTexture() {
    return false;
  }

  prepare(_renderable: any, _viewport: any) {
    this._gl.uniform2f(
      this.uniforms.u_head,
      cur_taco_head[0],
      cur_taco_head[1],
    );
    this._gl.uniform2f(
      this.uniforms.u_tail,
      cur_taco_tail[0],
      cur_taco_tail[1],
    );
  }
}

let ballShader = new BallShader();
let outlineBallShader = new OutlineBallShader();
let tacoShader = new TacoShader();

/*let gl: WebGL2RenderingContext;

gl.uniform2fv()*/

const left_border = -1 + (BORDER_R + BALL_R);
const right_border = 1 - (BORDER_R + BALL_R);
const bottom_border = -.5 + (BORDER_R + BALL_R);
const top_border = .5 - (BORDER_R + BALL_R);

function do_physics(deltaTime: number) {
  // Velocity, crash against borders
  for (let n = 0; n < N_BALLS; n++) {
    let cur_ball_pos = balls_pos[n]
    let cur_ball_vel = balls_vel[n]
    let cur_ball_won = balls_won[n]
    // Advance
    for (let k = 0; k < N_WORLDS * 2; k += 2) {
      if (cur_ball_won[k / 2] == 0) {
        cur_ball_pos[k] += deltaTime * cur_ball_vel[k]
        cur_ball_vel[k] *= .99
        cur_ball_pos[k + 1] += deltaTime * cur_ball_vel[k + 1]
        cur_ball_vel[k + 1] *= .99
      }
    }

    // Crash against borders & holes
    for (let k = 0; k < N_WORLDS * 2; k += 2) {
      if (cur_ball_won[k / 2] == 0) {

        let x = Math.abs(cur_ball_pos[k])
        let y = Math.abs(cur_ball_pos[k + 1])
        // Check corner holes
        if (x > 1 - (1 + Math.SQRT2) * BORDER_R && y > .5 - (1 + Math.SQRT2) * BORDER_R) {  // quick corner check
          let dx = (1 - Math.SQRT2 * BORDER_R) - x
          let dy = (.5 - Math.SQRT2 * BORDER_R) - y
          if (dx * dx + dy * dy < BORDER_R) {
            let offset = afterHolePos(n, holeXYtoI(cur_ball_pos[k], cur_ball_pos[k+1], true));
            // let offset ballOffset(n);
            cur_ball_pos[k] = offset[0]
            cur_ball_pos[k + 1] = offset[1]
            // cur_ball_pos[k] = (1 - Math.SQRT2 * BORDER_R) * Math.sign(cur_ball_pos[k]) + offset[0]
            // cur_ball_pos[k + 1] = (.5 - Math.SQRT2 * BORDER_R) * Math.sign(cur_ball_pos[k + 1]) + offset[1]
            cur_ball_won[k / 2] = 1;
            continue;
          }
        }

        if (x > right_border) {
          // Check horizontal borders
          x = 2 * right_border - x
          cur_ball_vel[k] *= -1
          cur_ball_pos[k] = x * Math.sign(cur_ball_pos[k])
          // continue;
        } else if (y > top_border) {
          // Check vertical borders & middle holes
          if (x < BORDER_R) { // fast check for middle hole
            // let x = Math.abs(cur_ball_pos[k - 1])
            // let y = top_border - cur_ball_pos[k]
            let dy = top_border - y
            if (x * x + dy * dy < BORDER_R_SQ) { // inside the hole!
              // let offset = ballOffset(n);
              let offset = afterHolePos(n, holeXYtoI(cur_ball_pos[k], cur_ball_pos[k+1], false));
              cur_ball_pos[k] = offset[0]
              cur_ball_pos[k + 1] = offset[1]
              //cur_ball_pos[k + 1] = (0.5 - BORDER_R) * Math.sign(cur_ball_pos[k + 1]) + offset[1]
              // cur_ball_pos[k + 1] = 0.5 + EXTRA_MARGIN / 2
              /*cur_ball_vel[k - 1] = 0.0
              cur_ball_vel[k] = 0.0*/
              cur_ball_won[k / 2] = 1;
              continue;
            }/* else {
              // TODO: proper rebound against corners
              cur_ball_pos[k] = 2 * top_border - cur_ball_pos[k]
              cur_ball_vel[k] *= -1
            }*/
          }

          y = 2 * top_border - y
          cur_ball_vel[k + 1] *= -1
          cur_ball_pos[k + 1] = y * Math.sign(cur_ball_pos[k + 1])

          //cur_ball_pos[k] = 2 * top_border - cur_ball_pos[k]
          //cur_ball_vel[k] *= -1
        }
      }
    }
  }


  // Ball collisions
  for (let k = 0; k < N_WORLDS * 2; k += 2) {
    for (let n = 0; n < N_BALLS; n++) {
      if (balls_won[n][k / 2]) continue;
      let b1px = balls_pos[n][k]
      let b1py = balls_pos[n][k + 1]
      let b1vx = balls_vel[n][k]
      let b1vy = balls_vel[n][k + 1]
      for (let m = n + 1; m < N_BALLS; m++) {
        if (balls_won[m][k / 2]) continue;
        let b2px = balls_pos[m][k]
        let b2py = balls_pos[m][k + 1]
        let b2vx = balls_vel[m][k]
        let b2vy = balls_vel[m][k + 1]
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
            balls_pos[n][k] += dx * push;
            balls_pos[n][k + 1] += dy * push;
            balls_pos[m][k] -= dx * push;
            balls_pos[m][k + 1] -= dy * push;

            /*b1.vx = b1.vx - dd1x + dd2x;
            b1.vy = b1.vy - dd1y + dd2y;
            b2.vx = b2.vx - dd2x + dd1x;
            b2.vy = b2.vy - dd2y + dd1y;*/
            balls_vel[n][k] -= dd1x - dd2x;
            balls_vel[n][k + 1] -= dd1y - dd2y;
            balls_vel[m][k] -= dd2x - dd1x;
            balls_vel[m][k + 1] -= dd2y - dd1y;
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



function update(cur_time: number) {
  let deltaTime = Math.min(50, cur_time - last_time)
  last_time = cur_time
  /*for (let k = 0; k < N_WORLDS * 2; k++) {
    balls_array[k] += (Math.random() - .5) * .01
    // balls_array[k] = .2
  }*/

  if (wasButtonPressed("left")) {
    last_pressed = { x: mouse.x, y: mouse.y }
    cur_taco_head = [
      last_pressed.x,
      last_pressed.y
    ]
  } else if (wasButtonReleased("left") && last_pressed) {
    for (let k = 0; k < N_WORLDS * 2; k += 2) {
      balls_vel[0][k] -= (mouse.x - last_pressed.x) * FORCE_SCALER;
      balls_vel[0][k + 1] -= (mouse.y - last_pressed.y) * FORCE_SCALER;
    }
  }

  wheel_offset += mouse.wheel

  do_physics(deltaTime * 0.001)

  if (wasButtonPressed("right")) {
    collapse()
    wheel_offset = 0;
  }

  cur_selected = [0,0]

  pintar.startFrame()
  pintar._renderer._setBlendMode(PintarJS.BlendModes.AlphaBlend)
  pintar._renderer.setShader(ballShader); // simpler version
  if (OPAQUE_BALLS) {
    for (let n = 0; n < N_WORLDS; n++) {
      cur_selected[0] = n;
      for (let k = 0; k < N_BALLS; k++) {
        cur_selected[1] = k;
        ballShader.draw();
      }
    }
  } else {
    for (let k = 0; k < N_BALLS; k++) {
      cur_selected[1] = k;
      for (let n = 0; n < N_WORLDS; n++) {
        cur_selected[0] = n;
        ballShader.draw();
      }
    }
  }


  if (mouse.active) {
    cur_selected = selectClosestToMouse_anyColor()
  } else {
    cur_selected = null
  }
  if (cur_selected !== null) {
    pintar._renderer.setShader(outlineBallShader); // outline selected
    outlineBallShader.draw();
  }

  if (isButtonDown("left") && last_pressed) {
    cur_taco_tail = [
      mouse.x,
      mouse.y
    ]
    // pintar.drawSprite(taco_sprite);
    pintar._renderer.setShader(tacoShader);
    tacoShader.draw();
  }
  pintar.endFrame()

  mouse_prev = Object.assign({}, mouse);
  mouse.wheel = 0;
  keyboard_prev = Object.assign({}, keyboard);
  window.requestAnimationFrame(update);
}

window.addEventListener('mousemove', (e: MouseEvent) => _mouseEvent(e));
window.addEventListener('mousedown', (e: MouseEvent) => _mouseEvent(e));
window.addEventListener('mouseup', (e: MouseEvent) => _mouseEvent(e));



function _mouseEvent(e: MouseEvent) {
  //mouse.x =  e.offsetX / pintar.canvas.clientHeight - 1.0;
  //mouse.y = -(e.offsetY / pintar.canvas.clientHeight - 0.5);
  let rect = pintar.canvas.getBoundingClientRect();
  let x = e.clientX - rect.x;
  let y = e.clientY - rect.y;
  mouse.x =  (x / pintar.canvas.clientWidth  - .5) * (2 + EXTRA_MARGIN * 2);
  mouse.y = -(y / pintar.canvas.clientHeight - .5) * (1 + EXTRA_MARGIN * 2);
  // mouse.x = (e.offsetX / pintar.canvas.clientWidth  - .5) * (2 + EXTRA_MARGIN * 2);
  // mouse.y =-(e.offsetY / pintar.canvas.clientHeight - .5) * (1 + EXTRA_MARGIN * 2);
  mouse.buttons = e.buttons;
  return false;
}

window.addEventListener('wheel', e => {
  let d = e.deltaY > 0 ? 1 : -1;
  return mouse.wheel = d;
});

pintar.canvas.addEventListener('mouseleave', (_e: MouseEvent) => {
  mouse.active = false
});

pintar.canvas.addEventListener('mouseenter', (_e: MouseEvent) => {
  mouse.active = true
});

let mouse = { x: 0, y: 0, buttons: 0, wheel: 0, active: true };
let mouse_prev = Object.assign({}, mouse);

type MouseButton = "left" | "right" | "middle"

function isButtonDown(b: MouseButton) {
  let i = b == "left" ? 0 : b == "right" ? 1 : 2;
  return (mouse.buttons & (1 << i)) != 0;
}

function wasButtonPressed(b: MouseButton) {
  let i = b == "left" ? 0 : b == "right" ? 1 : 2;
  return ((mouse.buttons & (1 << i)) !== 0) && ((mouse_prev.buttons & (1 << i)) === 0);
}

function wasButtonReleased(b: MouseButton) {
  let i = b == "left" ? 0 : b == "right" ? 1 : 2;
  return ((mouse.buttons & (1 << i)) === 0) && ((mouse_prev.buttons & (1 << i)) !== 0);
}

let keyboard: Record<string, boolean> = {};
let keyboard_prev: Record<string, boolean> = {};

function keyMap(e: KeyboardEvent) {
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

function isKeyDown(k: string) {
  return keyboard[k] || false;
}

function wasKeyPressed(k: string) {
  return (keyboard[k] || false) && (!keyboard_prev[k] || false);
}

function wasKeyReleased(k: string) {
  return (!keyboard[k] || false) && (keyboard_prev[k] || false);
}

function RGBToHex(r = 0, g = 0, b = 0) {
  // clamp and convert to hex
  let hr = Math.max(0, Math.min(255, Math.round(r))).toString(16);
  let hg = Math.max(0, Math.min(255, Math.round(g))).toString(16);
  let hb = Math.max(0, Math.min(255, Math.round(b))).toString(16);
  return "#" +
    (hr.length < 2 ? "0" : "") + hr +
    (hg.length < 2 ? "0" : "") + hg +
    (hb.length < 2 ? "0" : "") + hb;
}

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}
