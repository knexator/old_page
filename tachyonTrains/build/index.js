(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "engine", "hexGame", "./graphics", "./hexLib"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mod = exports.contra_cable_highlight = exports.time_dir = void 0;
    const engine_1 = require("engine");
    const hexGame_1 = require("hexGame");
    const graphics_1 = require("./graphics");
    const hexLib_1 = require("./hexLib");
    let EDITOR = false;
    let FREEHAND_INPUT = false;
    let last_time = 0;
    let wheel_off = 0;
    let time = 3.5;
    let anim_t = 0;
    exports.time_dir = 0;
    let contra_anim = null;
    exports.contra_cable_highlight = null;
    const BUTTON_W = 100;
    const BUTTON_H = 50;
    let ui_t_offset = -BUTTON_W;
    // let ui_t_offset = Math.floor(MAX_T / 2) * BUTTON_W - canvas.width * 3;
    function initOnce() {
        window.dispatchEvent(new Event('resize'));
        window.requestAnimationFrame(update);
    }
    function update(curTime) {
        let deltaTime = curTime - last_time;
        deltaTime = Math.min(deltaTime, 30.0);
        last_time = curTime;
        wheel_off += engine_1.mouse.wheel;
        exports.time_dir = 0;
        (0, graphics_1.beginFrame)();
        let circle_draw = null;
        if (contra_anim) {
            const SPEED = 0.003; // 0.005
            if (contra_anim.done) {
                let cur_cable = contra_anim.cur_cable;
                let cable_t = mod(anim_t + .5, 1);
                if (cur_cable.direction === "backward")
                    cable_t = 1 - cable_t;
                let trainCenter = (0, graphics_1.cableSample)(cur_cable, cable_t, time + anim_t);
                circle_draw = trainCenter;
                anim_t = moveToZero(anim_t, SPEED * deltaTime);
                exports.time_dir = Math.sign(anim_t);
                if ((0, engine_1.wasKeyPressed)('d') || (0, engine_1.wasKeyPressed)('a') || (0, engine_1.wasButtonPressed)("left") || (0, engine_1.wasButtonPressed)("right"))
                    contra_anim = null;
            }
            else if (contra_anim.cur_cable) {
                let cur_cable = contra_anim.cur_cable;
                let done = false;
                if (contra_anim.reverse) {
                    done = cur_cable === contra_anim.contradiction.source_cable && time - .5 === contra_anim.contradiction.source_t;
                }
                else {
                    done = cur_cable === contra_anim.contradiction.cable && time - .5 === contra_anim.contradiction.time;
                }
                if (done) {
                    contra_anim.done = true;
                }
                else {
                    let cable_t = 0;
                    if (cur_cable.direction === "forward")
                        cable_t = mod(anim_t + .5, 1);
                    if (cur_cable.direction === "backward")
                        cable_t = 1 - mod(anim_t + .5, 1);
                    let trainCenter = (0, graphics_1.cableSample)(cur_cable, cable_t, time + anim_t);
                    circle_draw = trainCenter;
                    let actual_dir = maybeReverseDir(contra_anim.contradiction.direction, contra_anim.reverse);
                    let target_anim_t = actual_dir === cur_cable.direction ? 0.5 : -.5;
                    anim_t = moveToTarget(anim_t, SPEED * deltaTime, target_anim_t);
                    exports.time_dir = Math.sign(anim_t - target_anim_t);
                    if (anim_t === target_anim_t) {
                        let next_cable = (0, hexGame_1.magicAdjacentCable)(cur_cable, time, actual_dir);
                        time += anim_t;
                        anim_t = 0;
                        if (next_cable.direction === actual_dir) {
                            time += .5;
                            anim_t -= .5;
                        }
                        else {
                            time -= .5;
                            anim_t += .5;
                        }
                        contra_anim.cur_cable = next_cable;
                        console.log(time);
                    }
                }
            }
            else {
                // haven't yet started
                let t = (last_time - contra_anim.click_real_t) / 1000;
                t = easeInOutCubic(Math.min(1, Math.max(0, t)));
                let target_t = contra_anim.reverse ? contra_anim.contradiction.time : contra_anim.contradiction.source_t;
                time = lerp(contra_anim.click_t, target_t + .5, t);
                // time = moveToTarget(time, 0.005 * deltaTime, contra_anim.contradiction.source_t + .5);
                // click_t: time + anim_t,
                // click_real_t: last_time
                if (time === target_t + .5) {
                    if (contra_anim.reverse) {
                        contra_anim.cur_cable = contra_anim.contradiction.cable;
                    }
                    else {
                        contra_anim.cur_cable = contra_anim.contradiction.source_cable;
                    }
                }
            }
            // let new_anim_t = moveToZero(anim_t, 0.005 * deltaTime);
            // anim_t = new_anim_t;
        }
        if (!contra_anim) {
            let cur_raw = hexGame_1.layout.pixelToHex(engine_1.mouse);
            let cur_hex = cur_raw.round();
            let cur_frac = cur_raw.subtract(cur_hex);
            let cur_frozen = cur_hex.freeze();
            let exists = hexGame_1.board.has(cur_frozen);
            let mi = Math.floor((engine_1.mouse.x + ui_t_offset) / BUTTON_W);
            let mj = Math.floor((graphics_1.canvas.height - engine_1.mouse.y) / BUTTON_H);
            if (FREEHAND_INPUT)
                mj -= 1;
            if (hexGame_1.swappers.length > mj && mj >= 0 && mi > 0 && mi + 1 < hexGame_1.MAX_T) {
                document.body.style.cursor = 'pointer';
                if ((0, engine_1.wasButtonPressed)("left")) {
                    hexGame_1.swappers[mj].cycleInput(mi);
                }
                if ((0, engine_1.wasButtonPressed)("right")) {
                    let contra = hexGame_1.contradictions.find(x => x.time === mi && x.cable === hexGame_1.swappers[mj]);
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
            }
            else {
                document.body.style.cursor = 'default';
                if (exists) {
                    let cur_tile = hexGame_1.board.get(cur_frozen);
                    let cur_dir = cur_frac.mainDir();
                    let cur_cable = cur_tile.getCable(cur_dir, time);
                    if (cur_cable === null) {
                        if (EDITOR) {
                            // no cable
                            let cur_target_dir = mod(cur_dir + mod(wheel_off + 2, 5) + 1, 6);
                            (0, graphics_1.drawGhostCable)(cur_hex, cur_dir, cur_target_dir);
                            if ((0, engine_1.wasKeyPressed)('1')) {
                                let cur_cable = new hexGame_1.Cable(cur_tile, cur_dir, cur_target_dir, "forward", false);
                                cur_tile.addCable(cur_cable);
                            }
                            else if ((0, engine_1.wasKeyPressed)('2')) {
                                let cur_cable = new hexGame_1.Cable(cur_tile, cur_dir, cur_target_dir, "backward", false);
                                cur_tile.addCable(cur_cable);
                            }
                            else if ((0, engine_1.wasKeyPressed)('3')) {
                                let cur_cable = new hexGame_1.Cable(cur_tile, cur_dir, cur_target_dir, "forward", true);
                                cur_tile.addCable(cur_cable);
                            }
                            else if ((0, engine_1.wasKeyPressed)('4')) {
                                let cur_cable = new hexGame_1.Cable(cur_tile, cur_dir, cur_target_dir, "backward", true);
                                cur_tile.addCable(cur_cable);
                            }
                        }
                    }
                    else {
                        // yes cable
                        /*ctx.strokeStyle = "white";
                        ctx.lineWidth = 3;
                        drawGhostCable(cur_hex, cur_cable.getOrigin(time), cur_cable.getTarget(time));
                        ctx.strokeStyle = "black";
                        ctx.lineWidth = 1;*/
                        let contra = hexGame_1.contradictions.find(x => Math.floor(x.time) === Math.floor(time) && x.cable === cur_cable);
                        if (contra) {
                            exports.contra_cable_highlight = cur_cable;
                            // highlightCable(cur_hex, cur_cable.getOrigin(time), cur_cable.getTarget(time));
                            if ((0, engine_1.wasButtonPressed)("right")) {
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
                        }
                        else {
                            exports.contra_cable_highlight = null;
                        }
                        if (FREEHAND_INPUT || EDITOR || cur_cable.swapper) {
                            (0, graphics_1.highlightCable)(cur_hex, cur_cable.getOrigin(time), cur_cable.getTarget(time));
                            if ((0, engine_1.wasButtonPressed)("left") && (FREEHAND_INPUT || cur_cable.swapper)) {
                                cur_cable.cycleInput(Math.floor(time));
                            }
                            else if ((0, engine_1.wasButtonPressed)("right") && EDITOR) {
                                cur_tile.deleteCable(cur_dir);
                            }
                        }
                    }
                }
                else {
                    if (EDITOR) {
                        (0, graphics_1.drawGhostHex)(cur_hex);
                        if ((0, engine_1.wasButtonPressed)("left")) {
                            hexGame_1.board.set(cur_hex.freeze(), new hexGame_1.Tile(cur_hex));
                        }
                    }
                }
            }
            if (anim_t === 0) {
                if ((0, engine_1.wasKeyPressed)('d') && time + 1 < hexGame_1.MAX_T) {
                    time += 1;
                    anim_t -= .99;
                }
                else if ((0, engine_1.wasKeyPressed)('a') && time >= 1) {
                    time -= 1;
                    anim_t += .99;
                }
            }
            else {
                exports.time_dir = Math.sign(anim_t);
                let new_anim_t = moveToZero(anim_t, 0.005 * deltaTime);
                anim_t = new_anim_t;
            }
        }
        if ((0, engine_1.wasKeyPressed)('s')) {
            localStorage.setItem("simple", (0, hexGame_1.board2str)());
        }
        if ((0, engine_1.wasKeyPressed)('m')) {
            hexGame_1.board.clear();
        }
        /*if (wasKeyPressed('w')) {
          localStorage.setItem("sentient", board2str_onlyVisible());
          // localStorage.setItem("yay", board2str_onlyVisible());
        }*/
        if ((0, engine_1.isKeyDown)('k'))
            hexGame_1.layout.origin.y -= deltaTime * 0.4;
        if ((0, engine_1.isKeyDown)('i'))
            hexGame_1.layout.origin.y += deltaTime * 0.4;
        if ((0, engine_1.isKeyDown)('l'))
            hexGame_1.layout.origin.x -= deltaTime * 0.4;
        if ((0, engine_1.isKeyDown)('j'))
            hexGame_1.layout.origin.x += deltaTime * 0.4;
        if ((0, engine_1.isKeyDown)('o'))
            ui_t_offset -= deltaTime * 1.0;
        if ((0, engine_1.isKeyDown)('p'))
            ui_t_offset += deltaTime * 1.0;
        (0, graphics_1.drawBoard)(time + anim_t);
        if (circle_draw) {
            graphics_1.ctx.beginPath();
            graphics_1.ctx.strokeStyle = "#42f575";
            graphics_1.ctx.lineWidth = 5;
            graphics_1.ctx.arc(circle_draw.x, circle_draw.y, hexGame_1.layout.size, 0, Math.PI * 2);
            graphics_1.ctx.stroke();
            graphics_1.ctx.lineWidth = 1;
        }
        // UI
        const MARGIN = 0.1;
        let min_t_ui = Math.max(0, Math.ceil(ui_t_offset / BUTTON_W));
        let max_t_ui = Math.min(hexGame_1.MAX_T, Math.floor((ui_t_offset + graphics_1.canvas.width) / BUTTON_W));
        // ctx.strokeStyle = "black";
        // ctx.fillStyle = "red";
        graphics_1.ctx.fillStyle = "white";
        graphics_1.ctx.textAlign = "center";
        graphics_1.ctx.textBaseline = "middle";
        graphics_1.ctx.font = `${BUTTON_H * .7}px Arial`;
        for (let t = min_t_ui; t < max_t_ui; t++) {
            let x = t * BUTTON_W - ui_t_offset;
            for (let k = 0; k < hexGame_1.swappers.length; k++) {
                let y = graphics_1.canvas.height - (k + 1) * BUTTON_H;
                if (FREEHAND_INPUT)
                    y -= BUTTON_H;
                // fillstyle input etc
                let input_val = hexGame_1.swappers[k].inputReqs[t];
                let contradiction = hexGame_1.contradictions.some(x => x.time === t && x.cable === hexGame_1.swappers[k]);
                let text = contradiction ? "?" : input_val ? "✓" : "-";
                graphics_1.ctx.fillText(text, x + BUTTON_W / 2, y + BUTTON_H / 2);
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
            let extra_contradiction = hexGame_1.contradictions.some(x => x.time === t && hexGame_1.swappers.indexOf(x.cable) === -1);
            if (extra_contradiction) {
                let y = graphics_1.canvas.height - (FREEHAND_INPUT ? BUTTON_H : BUTTON_H * (hexGame_1.swappers.length + 1));
                graphics_1.ctx.fillText('?', x + BUTTON_W / 2, y + BUTTON_H / 2);
            }
        }
        graphics_1.ctx.strokeStyle = "black";
        graphics_1.ctx.beginPath();
        for (let t = min_t_ui; t <= max_t_ui; t++) {
            let x = t * BUTTON_W - ui_t_offset;
            graphics_1.ctx.moveTo(x, graphics_1.canvas.height - (hexGame_1.swappers.length + (FREEHAND_INPUT ? 1 : 0)) * BUTTON_H);
            graphics_1.ctx.lineTo(x, graphics_1.canvas.height);
        }
        for (let k = 0; k < hexGame_1.swappers.length + (FREEHAND_INPUT ? 1 : 0); k++) {
            let y = graphics_1.canvas.height - (k + 1) * BUTTON_H;
            graphics_1.ctx.moveTo(BUTTON_W, y);
            graphics_1.ctx.lineTo(BUTTON_W * (hexGame_1.MAX_T + 1), y);
        }
        graphics_1.ctx.stroke();
        const swapper_names = ['A', 'B', 'C'];
        const offsets = [
            new hexLib_1.Hex(.25, -.5, .25),
            new hexLib_1.Hex(.5, -.25, -.25),
            new hexLib_1.Hex(.25, .25, -.5),
        ];
        for (let k = 0; k < hexGame_1.swappers.length; k++) {
            let y = graphics_1.canvas.height - (k + (FREEHAND_INPUT ? 2 : 1)) * BUTTON_H;
            graphics_1.ctx.fillText(swapper_names[k], -ui_t_offset - BUTTON_W / 2, y + BUTTON_H / 2);
            let asdf = hexGame_1.layout.hexToPixel(hexGame_1.swappers[k].tile.coords.add(offsets[k]));
            graphics_1.ctx.fillText(swapper_names[k], asdf.x, asdf.y);
        }
        /*ctx.beginPath();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        let ui_cur_t_x = (time + anim_t) * BUTTON_W - ui_t_offset;
        ctx.moveTo(ui_cur_t_x, canvas.height - swappers.length * BUTTON_H);
        ctx.lineTo(ui_cur_t_x, canvas.height);
        ctx.stroke();
        ctx.lineWidth = 1;*/
        graphics_1.ctx.beginPath();
        graphics_1.ctx.fillStyle = "white";
        let x = (time + anim_t) * BUTTON_W - ui_t_offset;
        let y = graphics_1.canvas.height - hexGame_1.swappers.length * BUTTON_H;
        if (FREEHAND_INPUT)
            y -= BUTTON_H;
        graphics_1.ctx.moveTo(x, y);
        graphics_1.ctx.lineTo(x + BUTTON_W / 5, y - BUTTON_W / 3);
        graphics_1.ctx.lineTo(x - BUTTON_W / 5, y - BUTTON_W / 3);
        graphics_1.ctx.closePath();
        graphics_1.ctx.fill();
        (0, engine_1.engine_update)();
        window.requestAnimationFrame(update);
    }
    initOnce();
    function lerp(a, b, t) {
        return a * (1 - t) + b * t;
    }
    function mod(n, m) {
        return ((n % m) + m) % m;
    }
    exports.mod = mod;
    function moveToZero(value, speed) {
        if (value > 0) {
            return Math.max(0, value - speed);
        }
        else if (value < 0) {
            return Math.min(0, value + speed);
        }
        else {
            return value;
        }
    }
    function moveToTarget(value, speed, target) {
        if (value > target) {
            return Math.max(target, value - speed);
        }
        else if (value < target) {
            return Math.min(target, value + speed);
        }
        else {
            return value;
        }
    }
    function easeInOutCubic(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }
    function maybeReverseDir(direction, reverse) {
        if (reverse) {
            if (direction === "backward")
                return "forward";
            return "backward";
        }
        else {
            return direction;
        }
    }
});
