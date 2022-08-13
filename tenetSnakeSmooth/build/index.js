(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "engine"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const engine_1 = require("engine");
    let canvas = document.querySelector("canvas");
    let ctx = canvas.getContext("2d");
    let last_time = 0; //
    let W = 512;
    let H = 512;
    /*let T = Infinity;
    let S = 512 / W;*/
    let MAX_TURNS = 320;
    let MOVE_SPEED = 256;
    let TURN_DURATION = .03;
    let SNAKE_LENGTH = 25;
    let TURN_SPEED = 10;
    let SNAKE_WIDTH = 16;
    let cur_turn_duration = TURN_DURATION;
    let SNAKE_PASIVE_COLORS = generateColor('#888888', '#ffffff', SNAKE_LENGTH);
    let SNAKE_ACTIVE_COLORS = generateColor('#888888', '#88FF88', SNAKE_LENGTH);
    // console.log(SNAKE_PASIVE_COLORS)
    /*let T = 1000;
    
    let GRID = */
    let head = [
        { i: 1, j: 1, t: 0, di: MOVE_SPEED, dj: 0, dt: 1 },
    ];
    let cur_apple = { i: 256, j: 256 };
    let turn = 0; // always int
    let turn_offset = 0; // always between -1..1
    let time_direction = 1; // 1 or -1
    // let input_queue: {di: number, dj: number}[] = [];
    let next_input = { di: MOVE_SPEED, dj: 0 };
    let remaining_skip_turns = 0;
    function initOnce() {
        window.requestAnimationFrame(update);
    }
    function update(curTime) {
        let deltaTime = curTime - last_time;
        deltaTime = Math.min(deltaTime, 30.0) / 1000;
        last_time = curTime;
        // todo: cur_turn_duration is currently buggy
        turn_offset += deltaTime * time_direction / cur_turn_duration;
        // turn_offset += deltaTime * time_direction / TURN_DURATION;
        /*if (wasKeyPressed("d") || wasKeyPressed("a") || wasKeyPressed("s") || wasKeyPressed("w")) {
          input_queue.push({
            di: (wasKeyPressed("d") ? 1 : 0) - (wasKeyPressed("a") ? 1 : 0),
            dj: (wasKeyPressed("s") ? 1 : 0) - (wasKeyPressed("w") ? 1 : 0)
          })
          // next_input.di =
          // next_input.dj =
        }*/
        if ((0, engine_1.isKeyDown)("d") || (0, engine_1.isKeyDown)("a")) {
            let delta_angle = (((0, engine_1.isKeyDown)("d") ? 1 : 0) - ((0, engine_1.isKeyDown)("a") ? 1 : 0)) * (TURN_SPEED * deltaTime);
            let cos = Math.cos(delta_angle);
            let sin = Math.sin(delta_angle);
            let new_di = next_input.di * cos - next_input.dj * sin;
            let new_dj = next_input.di * sin + next_input.dj * cos;
            next_input = { di: new_di, dj: new_dj };
            // console.log(new_di);
        }
        // todo: this "if" should be a "while", but that gets stuck due to touching apple in a mid loop
        while (Math.abs(turn_offset) >= 1) {
            let debug_dir = Math.sign(turn_offset);
            turn_offset -= debug_dir;
            turn += debug_dir;
            // turn_offset -= time_direction
            // turn += time_direction
            // turn = mod(turn, T);
            if (remaining_skip_turns === 0) {
                // cur_turn_duration = lerp(cur_turn_duration, TURN_DURATION, .1);
                cur_turn_duration = TURN_DURATION;
                // do turn
                let last_head = head[head.length - 1];
                let di = next_input.di;
                let dj = next_input.dj;
                // let dj = (isKeyDown("s") ? 1 : 0) - (isKeyDown("w") ? 1 : 0)
                /*if (Math.abs(di) + Math.abs(dj) !== 1 ||
                  (di === -last_head.di && dj === -last_head.dj)) {
                  di = last_head.di
                  dj = last_head.dj
                }*/
                // assert: turn == last_head.t + time_direction
                let new_head = { i: mod(last_head.i + di * deltaTime, W), j: mod(last_head.j + dj * deltaTime, H), di: di, dj: dj, t: turn, dt: time_direction };
                head.push(new_head);
                //if (new_head.i === cur_apple.i && new_head.j === cur_apple.j) {
                if (touching(new_head, cur_apple)) {
                    cur_apple = { i: -1000, j: -1000 };
                    remaining_skip_turns = SNAKE_LENGTH - 1;
                    cur_turn_duration = TURN_DURATION / 5;
                    // time_direction *= -1;
                }
            }
            else {
                // cur_turn_duration = lerp(cur_turn_duration, TURN_DURATION / 10, .2);
                remaining_skip_turns -= 1;
                if (remaining_skip_turns === 0) {
                    console.log("finish skipping");
                    time_direction *= -1;
                    console.log(time_direction);
                    cur_apple = { i: Math.floor(Math.random() * W), j: Math.floor(Math.random() * H) };
                    // console.log(cur_apple);
                }
            }
        }
        /*ctx.fillStyle = "black";
        ctx.fillRect(mouse.x, mouse.y, 100, 100);*/
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#331111";
        let danger_angle = .2;
        ctx.beginPath();
        ctx.lineTo(canvas.width / 2, canvas.height / 2);
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 48, Math.PI / 2 - danger_angle, Math.PI / 2 + danger_angle);
        ctx.fill();
        ctx.strokeStyle = "#111111";
        ctx.lineWidth = 48;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 48, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = "#111111";
        let hand_dist = canvas.width / 2 - 48 * 2;
        let inner_dist = 48;
        let inner_angle = 0.5;
        let cur_angle = turn * Math.PI * 2 / MAX_TURNS - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 + Math.cos(cur_angle) * hand_dist, canvas.height / 2 + Math.sin(cur_angle) * hand_dist);
        ctx.lineTo(canvas.width / 2 + Math.cos(cur_angle + inner_angle) * inner_dist, canvas.height / 2 + Math.sin(cur_angle + inner_angle) * inner_dist);
        ctx.arc(canvas.width / 2, canvas.height / 2, inner_dist, cur_angle + inner_angle, cur_angle - inner_angle);
        ctx.fill();
        /*ctx.fillStyle = "#111133";
        ctx.fillRect(0, canvas.height-S, canvas.width, S);
        ctx.fillStyle = "#333399";
        ctx.fillRect(0, canvas.height-S, ((turn + turn_offset) / MAX_TURNS + .5) * canvas.width, S);*/
        for (let k = 0; k < SNAKE_LENGTH; k++) {
            ctx.fillStyle = SNAKE_PASIVE_COLORS[k];
            head.forEach(({ i, j, t, dt }) => {
                if (t !== turn - k * dt)
                    return;
                ctx.beginPath();
                // ctx.fillRect(i, j, SNAKE_WIDTH, SNAKE_WIDTH)
                ctx.arc(i, j, SNAKE_WIDTH, 0, 2 * Math.PI);
                ctx.fill();
            });
        }
        if (remaining_skip_turns > 0) {
            for (let k = 0; k < remaining_skip_turns; k++) {
                ctx.fillStyle = SNAKE_ACTIVE_COLORS[k - remaining_skip_turns + SNAKE_LENGTH];
                let { i, j, t, dt } = head[head.length - k - 1];
                // if (dt === time_direction) {
                // ctx.fillRect(i, j, SNAKE_WIDTH, SNAKE_WIDTH)
                ctx.beginPath();
                ctx.arc(i, j, SNAKE_WIDTH, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
        else {
            let still_drawing_active = true;
            for (let k = 0; k < SNAKE_LENGTH; k++) {
                if (head.length > k && still_drawing_active) {
                    ctx.fillStyle = SNAKE_ACTIVE_COLORS[k];
                    let { i, j, t, dt } = head[head.length - k - 1];
                    if (dt === time_direction) {
                        // ctx.fillRect(i, j, SNAKE_WIDTH, SNAKE_WIDTH)
                        ctx.beginPath();
                        ctx.arc(i, j, SNAKE_WIDTH, 0, 2 * Math.PI);
                        ctx.fill();
                    }
                    else {
                        still_drawing_active = false;
                    }
                }
            }
        }
        /*ctx.fillStyle = "white";
        head.forEach(({i, j, t}) => {
          if (t !== turn) return;
          // if (t < turn ) {
          ctx.fillRect(i * S, j * S, S, S)
          // }
        });
        ctx.fillStyle = "#AAAAAA";
        head.forEach(({i, j, t, dt}) => {
          if (t !== mod(turn - 1*dt, T)) return;
          ctx.fillRect(i * S, j * S, S, S)
        });
        ctx.fillStyle = "#888888";
        head.forEach(({i, j, t, dt}) => {
          if (t !== mod(turn - 2*dt, T)) return;
          ctx.fillRect(i * S, j * S, S, S)
        });
        ctx.fillStyle = "#555555";
        head.forEach(({i, j, t, dt}) => {
          if (t !== mod(turn - 3*dt, T)) return;
          ctx.fillRect(i * S, j * S, S, S)
        });
        ctx.fillStyle = "#222222";
        head.forEach(({i, j, t, dt}) => {
          if (t !== mod(turn - 4*dt, T)) return;
          ctx.fillRect(i * S, j * S, S, S)
        });*/
        ctx.fillStyle = "red";
        // ctx.fillRect(cur_apple.i, cur_apple.j, SNAKE_WIDTH, SNAKE_WIDTH)
        ctx.beginPath();
        ctx.arc(cur_apple.i, cur_apple.j, SNAKE_WIDTH, 0, 2 * Math.PI);
        ctx.fill();
        (0, engine_1.engine_update)();
        window.requestAnimationFrame(update);
    }
    initOnce();
    function lerp(a, b, t) {
        return a * (1 - t) + b * t;
    }
    function mod(n, m) {
        if (m === Infinity)
            return n;
        return ((n % m) + m) % m;
    }
    function touching(new_head, cur_apple) {
        let di = new_head.i - cur_apple.i;
        let dj = new_head.j - cur_apple.j;
        return di * di + dj * dj < SNAKE_WIDTH * SNAKE_WIDTH;
    }
    // https://stackoverflow.com/questions/3080421/javascript-color-gradient
    function hex(i) {
        var s = "0123456789abcdef";
        // var i = parseInt (c);
        if (i == 0 || isNaN(i))
            return "00";
        i = Math.round(Math.min(Math.max(0, i), 255));
        return s.charAt((i - i % 16) / 16) + s.charAt(i % 16);
    }
    /* Convert an RGB triplet to a hex string */
    function convertToHex(rgb) {
        return '#' + hex(rgb[0]) + hex(rgb[1]) + hex(rgb[2]);
    }
    /* Remove '#' in color hex string */
    function trim(s) { return (s.charAt(0) == '#') ? s.substring(1, 7) : s; }
    /* Convert a hex string to an RGB triplet */
    function convertToRGB(hex) {
        var color = [];
        color[0] = parseInt((trim(hex)).substring(0, 2), 16);
        color[1] = parseInt((trim(hex)).substring(2, 4), 16);
        color[2] = parseInt((trim(hex)).substring(4, 6), 16);
        return color;
    }
    function generateColor(colorStart, colorEnd, colorCount) {
        // The beginning of your gradient
        var start = convertToRGB(colorStart);
        // The end of your gradient
        var end = convertToRGB(colorEnd);
        // The number of colors to compute
        var len = colorCount;
        //Alpha blending amount
        // var alpha = 0.0;
        var saida = [];
        for (let i = 0; i < len; i++) {
            var c = [];
            let alpha = i / (len - 1);
            // alpha += (1.0/len);
            c[0] = start[0] * alpha + (1 - alpha) * end[0];
            c[1] = start[1] * alpha + (1 - alpha) * end[1];
            c[2] = start[2] * alpha + (1 - alpha) * end[2];
            saida.push(convertToHex(c));
            // console.log(alpha);
        }
        return saida;
    }
});
