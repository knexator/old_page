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
    let W = 16;
    let H = 16;
    let T = Infinity;
    let S = 512 / 16;
    let TURN_DURATION = .15;
    let SNAKE_LENGTH = 5;
    let cur_turn_duration = TURN_DURATION;
    let SNAKE_PASIVE_COLORS = generateColor('#222222', '#ffffff', SNAKE_LENGTH);
    let SNAKE_ACTIVE_COLORS = generateColor('#222222', '#22FF22', SNAKE_LENGTH);
    console.log(SNAKE_PASIVE_COLORS);
    /*let T = 1000;
    
    let GRID = */
    let head = [
        { i: 1, j: 1, t: 0, di: 1, dj: 0, dt: 1 },
    ];
    let cur_apple = { i: 5, j: 3 };
    let turn = 0; // always int
    let turn_offset = 0; // always between -1..1
    let time_direction = 1; // 1 or -1
    let input_queue = [];
    // let next_input = {di: 0, dj: 0};
    let remaining_skip_turns = 0;
    function initOnce() {
        window.requestAnimationFrame(update);
    }
    function update(curTime) {
        let deltaTime = curTime - last_time;
        deltaTime = Math.min(deltaTime, 30.0);
        last_time = curTime;
        turn_offset += deltaTime * time_direction / (cur_turn_duration * 1000);
        if ((0, engine_1.wasKeyPressed)("d") || (0, engine_1.wasKeyPressed)("a") || (0, engine_1.wasKeyPressed)("s") || (0, engine_1.wasKeyPressed)("w")) {
            input_queue.push({
                di: ((0, engine_1.wasKeyPressed)("d") ? 1 : 0) - ((0, engine_1.wasKeyPressed)("a") ? 1 : 0),
                dj: ((0, engine_1.wasKeyPressed)("s") ? 1 : 0) - ((0, engine_1.wasKeyPressed)("w") ? 1 : 0)
            });
            // next_input.di = 
            // next_input.dj = 
        }
        while (Math.abs(turn_offset) >= 1) {
            turn_offset -= time_direction;
            turn += time_direction;
            turn = mod(turn, T);
            if (remaining_skip_turns === 0) {
                // cur_turn_duration = lerp(cur_turn_duration, TURN_DURATION, .1);
                cur_turn_duration = TURN_DURATION;
                // do turn
                let last_head = head[head.length - 1];
                /*let di = next_input.di
                let dj = next_input.dj
                next_input = {di: 0, dj: 0};*/
                let next_input = { di: 0, dj: 0 };
                while (input_queue.length > 0) {
                    next_input = input_queue.shift();
                    if (Math.abs(next_input.di) + Math.abs(next_input.dj) !== 1 ||
                        (next_input.di === -last_head.di && next_input.dj === -last_head.dj)) {
                        // unvalid input
                    }
                    else {
                        break;
                    }
                }
                let di = next_input.di;
                let dj = next_input.dj;
                // let dj = (isKeyDown("s") ? 1 : 0) - (isKeyDown("w") ? 1 : 0)
                if (Math.abs(di) + Math.abs(dj) !== 1 ||
                    (di === -last_head.di && dj === -last_head.dj)) {
                    di = last_head.di;
                    dj = last_head.dj;
                }
                // assert: turn == last_head.t + time_direction
                let new_head = { i: mod(last_head.i + di, W), j: mod(last_head.j + dj, H), di: di, dj: dj, t: turn, dt: time_direction };
                head.push(new_head);
                if (new_head.i === cur_apple.i && new_head.j === cur_apple.j) {
                    cur_apple = { i: -1, j: -1 };
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
                    cur_apple = { i: Math.floor(Math.random() * W), j: Math.floor(Math.random() * H) };
                    console.log(cur_apple);
                }
            }
        }
        /*ctx.fillStyle = "black";
        ctx.fillRect(mouse.x, mouse.y, 100, 100);*/
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let k = 0; k < SNAKE_LENGTH; k++) {
            ctx.fillStyle = SNAKE_PASIVE_COLORS[k];
            head.forEach(({ i, j, t, dt }) => {
                if (t !== mod(turn - k * dt, T))
                    return;
                ctx.fillRect(i * S, j * S, S, S);
            });
        }
        if (remaining_skip_turns > 0) {
            for (let k = 0; k < remaining_skip_turns; k++) {
                ctx.fillStyle = SNAKE_ACTIVE_COLORS[k - remaining_skip_turns + SNAKE_LENGTH];
                let { i, j, t, dt } = head[head.length - k - 1];
                // if (dt === time_direction) {
                ctx.fillRect(i * S, j * S, S, S);
            }
        }
        else {
            let still_drawing_active = true;
            for (let k = 0; k < SNAKE_LENGTH; k++) {
                if (head.length > k && still_drawing_active) {
                    ctx.fillStyle = SNAKE_ACTIVE_COLORS[k];
                    let { i, j, t, dt } = head[head.length - k - 1];
                    if (dt === time_direction) {
                        ctx.fillRect(i * S, j * S, S, S);
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
        ctx.fillRect(cur_apple.i * S, cur_apple.j * S, S, S);
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
            console.log(alpha);
        }
        return saida;
    }
});
