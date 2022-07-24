var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "engine", "noise"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const engine_1 = require("engine");
    const noise = __importStar(require("noise"));
    // import * as asdf from 'tweenjs'
    // var Module = require('module');
    // Snakanake
    let canvas = document.querySelector("canvas");
    let ctx = canvas.getContext("2d");
    let last_time = 0; //
    let W = 16;
    let H = 16;
    let T = Infinity;
    let S = 512 / 16;
    let MAX_TURNS = 96;
    let TURN_DURATION = .15;
    let SNAKE_LENGTH = 4;
    let CHEAT_INMORTAL = false;
    let cur_turn_duration = TURN_DURATION;
    let SNAKE_PASIVE_COLORS = generateColor('#888888', '#ffffff', SNAKE_LENGTH);
    let SNAKE_ACTIVE_COLORS = generateColor('#888888', '#88FF88', SNAKE_LENGTH);
    let SNAKE_LOST_COLORS = generateColor('#888888', '#FF8888', SNAKE_LENGTH);
    let cam_noise = noise.makeNoise3D(0);
    let score = 0;
    // console.log(SNAKE_PASIVE_COLORS)
    /*let T = 1000;
    
    let GRID = */
    let cur_apple = applePlace();
    let turn = -16; // always int
    let turn_offset = 0.99; // always between -1..1
    let time_direction = 1; // 1 or -1
    let input_queue = [];
    // let next_input = {di: 0, dj: 0};
    let head = [
        { i: 8, j: 8, t: turn, di: 0, dj: 0, dt: 1 },
    ];
    let changes = [];
    let remaining_skip_turns = 0;
    let cur_screen_shake = { x: 0, y: 0, targetMag: 0, actualMag: 0 };
    let game_state = "waiting";
    function restart() {
        game_state = "waiting";
        input_queue = [];
        cur_apple = applePlace();
        turn = -16; // always int
        head = [{ i: 8, j: 8, t: turn, di: 0, dj: 0, dt: 1 }];
        turn_offset = 0.99; // always between -1..1
        time_direction = 1;
        score = 0;
        changes = [];
        remaining_skip_turns = 0;
        cur_screen_shake.targetMag = 0;
        cur_turn_duration = TURN_DURATION;
    }
    function initOnce() {
        window.requestAnimationFrame(update);
    }
    function update(curTime) {
        let deltaTime = curTime - last_time;
        deltaTime = Math.min(deltaTime, 30.0);
        last_time = curTime;
        if ((0, engine_1.wasKeyPressed)("r")) {
            restart();
        }
        if ((0, engine_1.wasKeyPressed)("d") || (0, engine_1.wasKeyPressed)("a") || (0, engine_1.wasKeyPressed)("s") || (0, engine_1.wasKeyPressed)("w")) {
            if (game_state === "lost")
                restart();
            input_queue.push({
                di: ((0, engine_1.wasKeyPressed)("d") ? 1 : 0) - ((0, engine_1.wasKeyPressed)("a") ? 1 : 0),
                dj: ((0, engine_1.wasKeyPressed)("s") ? 1 : 0) - ((0, engine_1.wasKeyPressed)("w") ? 1 : 0)
            });
            if (game_state === "waiting")
                game_state = "main";
            // next_input.di = 
            // next_input.dj = 
        }
        // console.log(game_state);
        if (game_state === "main")
            turn_offset += deltaTime * time_direction / (cur_turn_duration * 1000);
        while (Math.abs(turn_offset) >= 1) {
            turn_offset -= time_direction;
            turn += time_direction;
            turn = mod(turn, T);
            // if (turn === 0) console.log(head);
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
                // special case: very first input is invalid
                if (Math.abs(di) + Math.abs(dj) !== 1) {
                    di = 1;
                    dj = 0;
                }
                // assert: turn == last_head.t + time_direction
                let new_head = { i: mod(last_head.i + di, W), j: mod(last_head.j + dj, H), di: di, dj: dj, t: turn, dt: time_direction };
                head.push(new_head);
                let collision = false;
                for (let k = 0; k < SNAKE_LENGTH; k++) {
                    if (head.length > k) {
                        ctx.fillStyle = SNAKE_ACTIVE_COLORS[k];
                        let cur_index = head.length - k - 1;
                        let cur_i = head[cur_index].i;
                        let cur_j = head[cur_index].j;
                        collision = head.some(({ i, j, t, dt }, index) => {
                            return index !== cur_index && i === cur_i && j === cur_j && between(t, turn, turn - SNAKE_LENGTH * dt);
                        });
                        if (collision || head[cur_index].dt !== time_direction) {
                            break;
                        }
                    }
                }
                if (!CHEAT_INMORTAL && collision) {
                    lose();
                }
                /*let collision = head.some(({i, j, t, dt}) => {
                  return i === new_head.i && j === new_head.j && between(t, turn, turn - SNAKE_LENGTH * dt)
                })
                // todo: old head colliding against current body?
                console.log(collision);
                */
                if (new_head.i === cur_apple.i && new_head.j === cur_apple.j) {
                    cur_apple = { i: -1, j: -1 };
                    remaining_skip_turns = SNAKE_LENGTH - 1;
                    cur_turn_duration = TURN_DURATION / 5;
                    changes.push({ i: new_head.i, j: new_head.j, t: turn, dt: time_direction });
                    cur_screen_shake.actualMag = 100.0;
                    score += 1;
                    // time_direction *= -1;
                }
            }
            else {
                // cur_turn_duration = lerp(cur_turn_duration, TURN_DURATION / 10, .2);
                remaining_skip_turns -= 1;
                if (remaining_skip_turns === 0) {
                    // console.log("finish skipping");
                    time_direction *= -1;
                    cur_apple = applePlace();
                    // console.log(cur_apple);
                }
            }
        }
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(cur_screen_shake.x, cur_screen_shake.y);
        let cur_shake_mag = cur_screen_shake.actualMag * (1 + Math.cos(last_time * .25) * .25);
        let cur_shake_phase = cam_noise(last_time * 0.01, 0, 0) * Math.PI;
        cur_screen_shake.x = Math.cos(cur_shake_phase) * cur_shake_mag;
        cur_screen_shake.y = Math.sin(cur_shake_phase) * cur_shake_mag;
        if (game_state !== "main")
            cur_screen_shake.targetMag = 0;
        cur_screen_shake.actualMag = towards(cur_screen_shake.actualMag, cur_screen_shake.targetMag, deltaTime * 1);
        // cur_screen_shake.actualMag = lerp(cur_screen_shake.actualMag, cur_screen_shake.targetMag, .1);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        let danger_size = .2;
        let cur_angle = (turn + turn_offset) * Math.PI * 2 / MAX_TURNS - Math.PI / 2;
        let distance_to_danger = Math.min(Math.abs((cur_angle + Math.PI * 2) - Math.PI / 2), Math.abs(cur_angle - Math.PI / 2)) - danger_size;
        let getting_closer_to_danger = (cur_angle > 0 && time_direction > 0) || (cur_angle < -Math.PI && time_direction < 0);
        // console.log(cur_angle)
        // if (!getting_closer_to_danger) cur_screen_shake.actualMag = 0;
        if (distance_to_danger > .9) {
            ctx.fillStyle = "#331111";
            cur_screen_shake.targetMag = 0;
        }
        else {
            let val = lerp(1, 3 / 16, distance_to_danger / .9) * 255;
            ctx.fillStyle = convertToHex([val, val / 3, val / 3]);
            if (!getting_closer_to_danger)
                val *= .5;
            cur_screen_shake.targetMag = val * .05;
        }
        ctx.beginPath();
        ctx.lineTo(canvas.width / 2, canvas.height / 2);
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 48, Math.PI / 2 - danger_size, Math.PI / 2 + danger_size);
        ctx.fill();
        ctx.strokeStyle = "#111111";
        ctx.lineWidth = 48;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 48, 0, 2 * Math.PI);
        ctx.stroke();
        if (distance_to_danger > .7) {
            ctx.fillStyle = "#111111";
        }
        else {
            let val = lerp(1, 1 / 16, distance_to_danger / .7) * 255;
            if (!getting_closer_to_danger)
                val *= .5;
            ctx.fillStyle = convertToHex([val, val, val]);
        }
        // ctx.fillStyle = "#111111";
        let hand_dist = canvas.width / 2 - 48 * 2;
        let inner_dist = 48;
        let inner_angle = 0.5;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 + Math.cos(cur_angle) * hand_dist, canvas.height / 2 + Math.sin(cur_angle) * hand_dist);
        ctx.lineTo(canvas.width / 2 + Math.cos(cur_angle + inner_angle) * inner_dist, canvas.height / 2 + Math.sin(cur_angle + inner_angle) * inner_dist);
        ctx.arc(canvas.width / 2, canvas.height / 2, inner_dist, cur_angle + inner_angle, cur_angle - inner_angle);
        ctx.fill();
        if (!CHEAT_INMORTAL && distance_to_danger <= 0) {
            // ran out of time!
            lose();
        }
        // ctx.fillStyle = "#111133";
        // ctx.fillRect(0, canvas.height-S, canvas.width, S);
        // ctx.fillStyle = "#333399";
        // ctx.fillRect(0, canvas.height-S, ((turn + turn_offset) / MAX_TURNS + .5) * canvas.width, S);
        ctx.strokeStyle = "#883333";
        ctx.fillStyle = "#883333";
        ctx.lineWidth = 4;
        changes.forEach(({ i, j, t, dt }) => {
            let normalized_t = (turn - t) * dt;
            if (normalized_t >= 0 && normalized_t <= SNAKE_LENGTH) {
                ctx.fillRect((i - .5) * S, (j - .5) * S, S * 2, S * 2);
            }
            /*if (t + SNAKE_LENGTH * dt === turn) {
              console.log("drawing change");
              ctx.fillRect((i - .5) * S, (j - .5) * S, S*2, S*2);
            }*/
        });
        for (let k = 0; k < SNAKE_LENGTH; k++) {
            ctx.fillStyle = SNAKE_PASIVE_COLORS[k];
            head.forEach(({ i, j, t, dt }) => {
                if (t !== mod(turn - k * dt, T))
                    return;
                /*if (i === 8 && j === 8) {
                  console.log(head)
                }*/
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
        ctx.font = '30px sans-serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "white";
        if (game_state === "waiting") {
            ctx.fillText("WASD or Arrow Keys to move", canvas.width / 2, canvas.height / 2);
        }
        else if (game_state === "lost") {
            ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);
            // ctx.fillText("", canvas.width / 2, canvas.height / 2);
        }
        (0, engine_1.engine_update)();
        window.requestAnimationFrame(update);
    }
    function lose() {
        game_state = "lost";
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
    function between(t, a, b) {
        return t >= Math.min(a, b) && t <= Math.max(a, b);
    }
    function towards(a, b, v) {
        if (a < b)
            return Math.min(a + v, b);
        return Math.max(a - v, b);
    }
    function applePlace() {
        return { i: Math.floor(Math.random() * W), j: Math.floor(Math.random() * H) };
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
