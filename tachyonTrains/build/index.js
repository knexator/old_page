(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "engine", "hexGame", "./graphics"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mod = void 0;
    const engine_1 = require("engine");
    const hexGame_1 = require("hexGame");
    const graphics_1 = require("./graphics");
    let last_time = 0;
    let wheel_off = 0;
    let time = Math.floor(hexGame_1.MAX_T / 2) + .5;
    let anim_t = 0;
    let contra_anim = null;
    const BUTTON = 100;
    const MARGIN = 0.05;
    let ui_t_offset = Math.floor(hexGame_1.MAX_T / 2) * BUTTON - graphics_1.canvas.width * 3;
    function initOnce() {
        window.dispatchEvent(new Event('resize'));
        window.requestAnimationFrame(update);
    }
    function update(curTime) {
        let deltaTime = curTime - last_time;
        deltaTime = Math.min(deltaTime, 30.0);
        last_time = curTime;
        wheel_off += engine_1.mouse.wheel;
        (0, graphics_1.beginFrame)();
        if (contra_anim) {
            const SPEED = 0.001; // 0.005
            if (contra_anim.cur_cable) {
                let cur_cable = contra_anim.cur_cable;
                if (cur_cable === contra_anim.contradiction.cable) {
                    // done!
                    contra_anim = null;
                }
                else {
                    graphics_1.ctx.beginPath();
                    graphics_1.ctx.strokeStyle = "red";
                    graphics_1.ctx.lineWidth = 5;
                    (0, graphics_1.drawGhostCable)(cur_cable.tile.coords, cur_cable.getOrigin(time), cur_cable.getTarget(time));
                    graphics_1.ctx.lineWidth = 1;
                    let target_anim_t = contra_anim.contradiction.direction === "forward" ? 0.5 : -.5;
                    anim_t = moveToTarget(anim_t, SPEED * deltaTime, target_anim_t);
                    if (anim_t === target_anim_t) {
                        let next_cable = (0, hexGame_1.magicAdjacentCable)(cur_cable, time, contra_anim.contradiction.direction);
                        if (next_cable.direction === contra_anim.contradiction.direction) {
                            time += 1;
                            anim_t -= 1;
                        }
                        else {
                            time -= 1;
                            anim_t += 1;
                        }
                        contra_anim.cur_cable = next_cable;
                    }
                }
            }
            else {
                // haven't yet started
                time = moveToTarget(time, 0.005 * deltaTime, contra_anim.contradiction.source_t + .5);
                if (time === contra_anim.contradiction.source_t + .5) {
                    contra_anim.cur_cable = contra_anim.contradiction.source_cable;
                }
            }
            // let new_anim_t = moveToZero(anim_t, 0.005 * deltaTime);
            // anim_t = new_anim_t;
        }
        else {
            let cur_raw = hexGame_1.layout.pixelToHex(engine_1.mouse);
            let cur_hex = cur_raw.round();
            let cur_frac = cur_raw.subtract(cur_hex);
            let cur_frozen = cur_hex.freeze();
            let exists = hexGame_1.board.has(cur_frozen);
            let mi = Math.floor((engine_1.mouse.x + ui_t_offset) / BUTTON);
            let mj = Math.floor((graphics_1.canvas.height - engine_1.mouse.y) / BUTTON);
            if (hexGame_1.swappers.length > mj) {
                if ((0, engine_1.wasButtonPressed)("left")) {
                    hexGame_1.swappers[mj].cycleInput(mi);
                }
                if ((0, engine_1.wasButtonPressed)("right")) {
                    let contra = hexGame_1.contradictions.find(x => x.time === mi && x.cable === hexGame_1.swappers[mj]);
                    if (contra) {
                        contra_anim = {
                            contradiction: contra,
                            cur_cable: null,
                        };
                        time += anim_t;
                        anim_t = 0;
                    }
                }
            }
            else {
                if (exists) {
                    let cur_tile = hexGame_1.board.get(cur_frozen);
                    let cur_dir = cur_frac.mainDir();
                    let cur_cable = cur_tile.getCable(cur_dir, time);
                    if (cur_cable === null) {
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
                    else {
                        // yes cable
                        graphics_1.ctx.strokeStyle = "white";
                        graphics_1.ctx.lineWidth = 3;
                        (0, graphics_1.drawGhostCable)(cur_hex, cur_cable.getOrigin(time), cur_cable.getTarget(time));
                        graphics_1.ctx.strokeStyle = "black";
                        graphics_1.ctx.lineWidth = 1;
                        if ((0, engine_1.wasButtonPressed)("left")) {
                            cur_cable.cycleInput(Math.floor(time));
                        }
                        else if ((0, engine_1.wasButtonPressed)("right")) {
                            cur_tile.deleteCable(cur_dir);
                        }
                    }
                }
                else {
                    (0, graphics_1.drawGhostHex)(cur_hex);
                    if ((0, engine_1.wasButtonPressed)("left")) {
                        hexGame_1.board.set(cur_hex.freeze(), new hexGame_1.Tile(cur_hex));
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
                let new_anim_t = moveToZero(anim_t, 0.005 * deltaTime);
                anim_t = new_anim_t;
            }
        }
        if ((0, engine_1.wasKeyPressed)('s')) {
            localStorage.setItem("level", (0, hexGame_1.board2str)());
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
        // UI
        let min_t_ui = Math.max(0, Math.ceil(ui_t_offset / BUTTON));
        let max_t_ui = Math.min(hexGame_1.MAX_T, Math.floor((ui_t_offset + graphics_1.canvas.width) / BUTTON));
        graphics_1.ctx.strokeStyle = "black";
        for (let t = min_t_ui; t < max_t_ui; t++) {
            let x = t * BUTTON - ui_t_offset;
            for (let k = 0; k < hexGame_1.swappers.length; k++) {
                let y = graphics_1.canvas.height - (k + 1) * BUTTON;
                // fillstyle input etc
                let input_val = hexGame_1.swappers[k].inputReqs[t];
                if (input_val !== null) {
                    graphics_1.ctx.fillStyle = input_val ? "white" : "black";
                    graphics_1.ctx.fillRect(x + MARGIN * BUTTON, y + MARGIN * BUTTON, BUTTON * (1 - 2 * MARGIN), BUTTON * (1 - 2 * MARGIN));
                }
                let contradiction = hexGame_1.contradictions.some(x => x.time === t && x.cable === hexGame_1.swappers[k]);
                graphics_1.ctx.strokeStyle = contradiction ? "red" : "black";
                graphics_1.ctx.strokeRect(x + MARGIN * BUTTON, y + MARGIN * BUTTON, BUTTON * (1 - 2 * MARGIN), BUTTON * (1 - 2 * MARGIN));
            }
            let extra_contradiction = hexGame_1.contradictions.some(x => x.time === t && hexGame_1.swappers.indexOf(x.cable) === -1);
            if (extra_contradiction) {
                graphics_1.ctx.strokeStyle = "red";
                let y = graphics_1.canvas.height - (hexGame_1.swappers.length + 1) * BUTTON;
                graphics_1.ctx.strokeRect(x + MARGIN * BUTTON, y + MARGIN * BUTTON, BUTTON * (1 - 2 * MARGIN), BUTTON * (1 - 2 * MARGIN));
            }
        }
        graphics_1.ctx.beginPath();
        graphics_1.ctx.strokeStyle = "white";
        let ui_cur_t_x = (time + anim_t) * BUTTON - ui_t_offset;
        graphics_1.ctx.moveTo(ui_cur_t_x, graphics_1.canvas.height - hexGame_1.swappers.length * BUTTON);
        graphics_1.ctx.lineTo(ui_cur_t_x, graphics_1.canvas.height);
        graphics_1.ctx.stroke();
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
});
