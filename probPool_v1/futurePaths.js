"use strict";
let pintar = new PintarJS();
// pintar.makeFullscreen()
let slider = document.getElementById("slider");
let DEBUG_TRUE_OPACITY = false;
let N_BALLS = 8;
let N_WORLDS = 512;
let BALL_R = 0.05;
let BALL_R_SQ = BALL_R * BALL_R;
let FORCE_SCALER = 0.01;
let CHAOS_AMOUNT = 0.001;
let balls_pos = [];
let balls_vel = [];
let balls_won = [];
for (let k = 0; k < N_BALLS; k++) {
    balls_pos.push(new Float32Array(N_WORLDS * 2));
    balls_vel.push(new Float32Array(N_WORLDS * 2).fill(0.0));
    balls_won.push(new Int8Array(N_WORLDS).fill(0));
}
let colors = [
    [0.9, 0.8, 0.9],
    [0.7, 0.4, 0.2],
    [0.1, 0.6, 0.9],
    [0.2, 0.8, 0.3],
    [0.5, 0.2, 0.6],
    [0.9, 0.8, 0.1],
    [0.1, 0.9, 0.8],
    [0.9, 0.1, 0.8],
];
let cur_drawing = 0;
let cur_selected = 0;
let last_time = 0;
let last_pressed = null;
let INITIAL_POSITIONS = [
    [-.5, 0.0],
    [0.4, 0.0],
    [0.5, 0.0],
    [0.6, 0.0],
    [.45, -BALL_R * Math.sin(Math.PI / 3) * 2],
    [.45, BALL_R * Math.sin(Math.PI / 3) * 2],
    [.55, -BALL_R * Math.sin(Math.PI / 3) * 2],
    [.55, BALL_R * Math.sin(Math.PI / 3) * 2],
];
for (let n = 1; n < N_BALLS; n++) {
    let cur_ball_pos = balls_pos[n];
    // let cur_ball_vel = balls_vel[n]
    let cur_initial_pos = INITIAL_POSITIONS[n];
    for (let k = 0; k < N_WORLDS * 2; k += 2) {
        cur_ball_pos[k] = cur_initial_pos[0]; // + Math.random() * 0.001
        cur_ball_pos[k + 1] = cur_initial_pos[1]; // + Math.random() * 0.001
    }
}
for (let k = 0; k < N_WORLDS * 2; k += 2) {
    balls_pos[0][k] = INITIAL_POSITIONS[0][0] + Math.cos(Math.PI * k / N_WORLDS) * CHAOS_AMOUNT;
    balls_pos[0][k + 1] = INITIAL_POSITIONS[0][1] + Math.sin(Math.PI * k / N_WORLDS) * CHAOS_AMOUNT;
}
window.addEventListener("load", _e => {
    window.requestAnimationFrame(update);
});
// set our custom shader
class MyShader extends PintarJS.ShaderBase {
    get uniformNames() {
        return ["u_resolution", "u_balls_pos", "u_color"];
    }
    get vertexShaderCode() {
        return `
      attribute vec2 a_position;

      // screen resolution to project quad
      uniform vec2 u_resolution;

      // output texture coord
      varying vec2 v_texCoord;

      // main vertex shader func
      void main()
      {
          gl_Position = vec4((a_position - .5) * 2.0, 0, 1);
          v_texCoord.y = (a_position.y - .5);
          v_texCoord.x = (a_position.x - .5) * u_resolution.x / u_resolution.y;
      }
      `;
    }
    /**
     * Return fragment shader code.
     */
    get fragmentShaderCode() {
        return `
    precision mediump float;

    uniform vec2 u_balls_pos[${N_WORLDS}];
    uniform vec3 u_color;

    // the texCoords passed in from the vertex shader.
    varying vec2 v_texCoord;

    // main fragment shader func
    void main()
    {
      /*if (dot(v_texCoord - vec2(0,${.5 - BALL_R}), v_texCoord - vec2(0,${.5 - BALL_R})) < ${BALL_R * BALL_R}) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      } else if (abs(v_texCoord.y) > ${0.5 - BALL_R} || abs(v_texCoord.x) > ${1.0 - BALL_R}) {
        gl_FragColor = vec4(0.4, 0.2, 0.1, 1.0);
      } else {*/
        // float inv = 1.0 / ${N_WORLDS}.0;
        float inv = ${DEBUG_TRUE_OPACITY ? 1.0 / N_WORLDS : 0.01};
        float weight = 0.0;
        for(int j = 0; j < ${N_WORLDS}; j++){
          vec2 delta = v_texCoord - u_balls_pos[j];
          float distSq = dot(delta, delta);
          if (distSq < ${BALL_R * BALL_R}) {
            weight += inv;
          }
          // weight += smoothstep(${BALL_R * BALL_R * 1.07 * 1.07}, ${BALL_R * BALL_R}, distSq) * inv;
          // weight += inv + distSq * 0.0;
        //}

        /*if (weight > 0.0) {
          weight = max(0.05, weight);
        }*/
        weight = min(weight, 1.0);
        // weight = weight + weight - weight*weight;

        gl_FragColor = vec4(u_color * weight, weight);
      }
    }
      `;
    }
    get haveTexture() {
        return false;
    }
    prepare(_renderable, _viewport) {
        //super.prepare(renderable, viewport);
        //this.setUniform2f(this.uniforms.u_ball_pos, 0, 0);
        this._gl.uniform2fv(this.uniforms.u_balls_pos, balls_pos[cur_drawing]);
        this.setUniform3f(this.uniforms.u_color, ...colors[cur_drawing]);
        // gl.uniform1f(shaderProgram.lightsUniform, new Float32Array([3,1,2,3,4,5]));
        //deltaTime += 0.1;
    }
}
class BallShader extends PintarJS.ShaderBase {
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
        vec2 asdf = (a_position - .5) * ${BALL_R * 2};
        asdf.y *= 2.0;
        gl_Position = vec4(asdf + u_pos * vec2(1, 2), 0, 1);
        // gl_Position = vec4((a_position - .5) * 2.0, 0, 1);
        v_texCoord.y = (a_position.y - .5);
        v_texCoord.x = (a_position.x - .5);
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
      float weight = smoothstep(0.25, .23, distSq) * ${DEBUG_TRUE_OPACITY ? 1.0 / N_WORLDS : 0.05};
      // gl_FragColor = vec4(u_color + 0.0 * v_texCoord, 1.0);
      gl_FragColor = vec4(u_color * weight, weight);
      //
    }
      `;
    }
    get haveTexture() {
        return false;
    }
    prepare(_renderable, _viewport) {
        this._gl.uniform3f(this.uniforms.u_color, ...colors[cur_drawing]);
        this._gl.uniform2f(this.uniforms.u_pos, balls_pos[cur_drawing][cur_selected * 2], balls_pos[cur_drawing][cur_selected * 2 + 1]);
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
        vec2 asdf = (a_position - .5) * ${BALL_R * 2};
        asdf.y *= 2.0;
        gl_Position = vec4(asdf + u_pos * vec2(1, 2), 0, 1);
        // gl_Position = vec4((a_position - .5) * 2.0, 0, 1);
        v_texCoord.y = (a_position.y - .5);
        v_texCoord.x = (a_position.x - .5);
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
      // float weight = smoothstep(0.25, .23, distSq) * ${DEBUG_TRUE_OPACITY ? 1.0 / N_WORLDS : 0.05};
      // gl_FragColor = vec4(u_color + 0.0 * v_texCoord, 1.0);
      gl_FragColor = vec4((u_color * (1.0 - outline) + outline) * alpha, alpha);
      //
    }
      `;
    }
    get haveTexture() {
        return false;
    }
    prepare(_renderable, _viewport) {
        this._gl.uniform3f(this.uniforms.u_color, ...colors[cur_drawing]);
        this._gl.uniform2f(this.uniforms.u_pos, balls_pos[cur_drawing][cur_selected * 2], balls_pos[cur_drawing][cur_selected * 2 + 1]);
    }
}
let myShader = new MyShader();
let ballShader = new BallShader();
let outlineBallShader = new OutlineBallShader();
/*let gl: WebGL2RenderingContext;

gl.uniform2fv()*/
const left_border = -1 + BALL_R * 2;
const right_border = 1 - BALL_R * 2;
const bottom_border = -.5 + BALL_R * 2;
const top_border = .5 - BALL_R * 2;
function do_physics_advancing(deltaTime) {
    for (let n = 0; n < N_BALLS; n++) {
        balls_pos[n][0] = balls_pos[n][2];
        balls_pos[n][1] = balls_pos[n][3];
        balls_vel[n][0] = balls_vel[n][2];
        balls_vel[n][1] = balls_vel[n][3];
        balls_won[n][0] = balls_won[n][1];
    }
    do_physics(deltaTime);
}
function do_physics(deltaTime) {
    // Velocity, crash against borders
    for (let k = 2; k < N_WORLDS * 2; k += 2) { // for each step
        for (let n = 0; n < N_BALLS; n++) {
            let cur_ball_pos = balls_pos[n];
            let cur_ball_vel = balls_vel[n];
            let cur_ball_won = balls_won[n];
            cur_ball_won[k / 2] = cur_ball_won[k / 2 - 1];
            if (cur_ball_won[k / 2 - 1]) {
                cur_ball_pos[k] = cur_ball_pos[k - 2];
                cur_ball_vel[k] = 0;
                cur_ball_pos[k + 1] = cur_ball_pos[k - 1];
                cur_ball_vel[k + 1] = 0;
                continue;
            }
            // Advance
            cur_ball_pos[k] = cur_ball_pos[k - 2] + deltaTime * cur_ball_vel[k - 2];
            cur_ball_vel[k] = cur_ball_vel[k - 2] * .99;
            cur_ball_pos[k + 1] = cur_ball_pos[k - 1] + deltaTime * cur_ball_vel[k - 1];
            cur_ball_vel[k + 1] = cur_ball_vel[k - 1] * .99;
            // Crash against borders & holes
            let x = Math.abs(cur_ball_pos[k]);
            let y = Math.abs(cur_ball_pos[k + 1]);
            // Check corner holes
            if (x > 1 - (1 + Math.SQRT2) * BALL_R && y > .5 - (1 + Math.SQRT2) * BALL_R) { // quick corner check
                let dx = (1 - Math.SQRT2 * BALL_R) - x;
                let dy = (.5 - Math.SQRT2 * BALL_R) - y;
                if (dx * dx + dy * dy < BALL_R_SQ) {
                    cur_ball_pos[k] = (1 - Math.SQRT2 * BALL_R) * Math.sign(cur_ball_pos[k]);
                    cur_ball_pos[k + 1] = (.5 - Math.SQRT2 * BALL_R) * Math.sign(cur_ball_pos[k + 1]);
                    cur_ball_won[k / 2] = 1;
                    continue;
                }
            }
            if (x > right_border) {
                // Check horizontal borders
                x = 2 * right_border - x;
                cur_ball_vel[k] *= -1;
                cur_ball_pos[k] = x * Math.sign(cur_ball_pos[k]);
                // continue;
            }
            else if (y > top_border) {
                // Check vertical borders & middle holes
                if (x < BALL_R) { // fast check for middle hole
                    // let x = Math.abs(cur_ball_pos[k - 1])
                    // let y = top_border - cur_ball_pos[k]
                    let dy = top_border - y;
                    if (x * x + dy * dy < BALL_R_SQ) { // inside the hole!
                        cur_ball_pos[k] = 0.0;
                        cur_ball_pos[k + 1] = (0.5 - BALL_R) * Math.sign(cur_ball_pos[k + 1]);
                        /*cur_ball_vel[k - 1] = 0.0
                        cur_ball_vel[k] = 0.0*/
                        cur_ball_won[k / 2] = 1;
                        continue;
                    } /* else {
                        // TODO: proper rebound against corners
                        cur_ball_pos[k] = 2 * top_border - cur_ball_pos[k]
                        cur_ball_vel[k] *= -1
                      }*/
                }
                y = 2 * top_border - y;
                cur_ball_vel[k + 1] *= -1;
                cur_ball_pos[k + 1] = y * Math.sign(cur_ball_pos[k + 1]);
                //cur_ball_pos[k] = 2 * top_border - cur_ball_pos[k]
                //cur_ball_vel[k] *= -1
            }
        }
        // Ball collisions
        for (let n = 0; n < N_BALLS; n++) {
            if (balls_won[n][k / 2])
                continue;
            let b1px = balls_pos[n][k];
            let b1py = balls_pos[n][k + 1];
            let b1vx = balls_vel[n][k];
            let b1vy = balls_vel[n][k + 1];
            for (let m = n + 1; m < N_BALLS; m++) {
                if (balls_won[m][k / 2])
                    continue;
                let b2px = balls_pos[m][k];
                let b2py = balls_pos[m][k + 1];
                let b2vx = balls_vel[m][k];
                let b2vy = balls_vel[m][k + 1];
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
function dotpart(vx, vy, nx, ny) {
    var dot = vx * nx + vy * ny;
    return [vx - dot * nx, vy - dot * ny];
}
function update(cur_time) {
    let deltaTime = Math.min(50, cur_time - last_time);
    last_time = cur_time;
    /*for (let k = 0; k < N_WORLDS * 2; k++) {
      balls_array[k] += (Math.random() - .5) * .01
      // balls_array[k] = .2
    }*/
    if (wasButtonPressed("left")) {
        last_pressed = { x: mouse.x, y: mouse.y };
    }
    else if (wasButtonReleased("left")) {
        last_pressed = null;
    }
    /* else if (wasButtonReleased("left") && last_pressed) {
      for (let k = 0; k < N_WORLDS * 2; k += 2) {
        balls_vel[0][k] += -(mouse.x - last_pressed.x) * FORCE_SCALER;
        balls_vel[0][k + 1] += (mouse.y - last_pressed.y) * FORCE_SCALER;
      }
    }*/
    if (isButtonDown("left")) {
        balls_vel[0][0] = -(mouse.x - last_pressed.x) * FORCE_SCALER;
        balls_vel[0][1] = (mouse.y - last_pressed.y) * FORCE_SCALER;
        do_physics(deltaTime * 0.001);
    }
    else {
        /*for (let k=0; k<N_BALLS; k++) {
          balls_pos[k][0] = balls_pos[k][1]
        }*/
        do_physics_advancing(deltaTime * 0.001);
        /*let cur_ball_pos = balls_pos[n]
        let cur_ball_vel = balls_vel[n]
        let cur_ball_won = balls_won[n]*/
    }
    // console.log(deltaTime * 0.001)
    // cur_selected = Number(slider.value)
    pintar.startFrame();
    pintar._renderer._setBlendMode(PintarJS.BlendModes.AlphaBlend);
    /*pintar._renderer.setShader(myShader); // TODO: is this necessary?
    for (let k = 0; k < N_BALLS; k++) {
      cur_drawing = k;
      myShader.draw();
    }
    pintar._renderer.setShader(ballShader);
    for (let k = 0; k < N_BALLS; k++) {
      cur_drawing = k;
      ballShader.draw();
    }*/
    pintar._renderer.setShader(ballShader); // simpler version
    for (let k = 0; k < N_BALLS; k++) {
        cur_drawing = k;
        for (let n = 0; n < N_WORLDS; n++) {
            cur_selected = n;
            ballShader.draw();
        }
    }
    // cur_selected = Number(slider.value)
    // cur_selected = selectClosestToMouse()
    cur_selected = 0;
    pintar._renderer.setShader(outlineBallShader); // outline selected
    for (let k = 0; k < N_BALLS; k++) {
        cur_drawing = k;
        outlineBallShader.draw();
    }
    pintar.endFrame();
    mouse_prev = Object.assign({}, mouse);
    mouse.wheel = 0;
    keyboard_prev = Object.assign({}, keyboard);
    window.requestAnimationFrame(update);
}
pintar.canvas.addEventListener('mousemove', (e) => _mouseEvent(e));
pintar.canvas.addEventListener('mousedown', (e) => _mouseEvent(e));
pintar.canvas.addEventListener('mouseup', (e) => _mouseEvent(e));
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
    let i = b == "left" ? 0 : b == "right" ? 1 : 2;
    return (mouse.buttons & (1 << i)) != 0;
}
function wasButtonPressed(b) {
    let i = b == "left" ? 0 : b == "right" ? 1 : 2;
    return ((mouse.buttons & (1 << i)) !== 0) && ((mouse_prev.buttons & (1 << i)) === 0);
}
function wasButtonReleased(b) {
    let i = b == "left" ? 0 : b == "right" ? 1 : 2;
    return ((mouse.buttons & (1 << i)) === 0) && ((mouse_prev.buttons & (1 << i)) !== 0);
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
