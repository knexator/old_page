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
    let time = 0;
    let anim_t = 0;
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
        let cur_raw = hexGame_1.layout.pixelToHex(engine_1.mouse);
        let cur_hex = cur_raw.round();
        let cur_frac = cur_raw.subtract(cur_hex);
        let cur_frozen = cur_hex.freeze();
        let exists = hexGame_1.board.has(cur_frozen);
        if (exists) {
            let cur_tile = hexGame_1.board.get(cur_frozen);
            let cur_dir = cur_frac.mainDir();
            if (cur_tile.cables[cur_dir] === null) {
                // no cable
                let cur_target_dir = mod(cur_dir + mod(wheel_off + 2, 5) + 1, 6);
                (0, graphics_1.drawGhostCable)(cur_hex, cur_dir, cur_target_dir);
                if ((0, engine_1.wasKeyPressed)('1')) {
                    let cur_cable = new hexGame_1.Cable(cur_tile, cur_dir, cur_target_dir, "standard", false);
                    cur_tile.addCable(cur_cable);
                }
                else if ((0, engine_1.wasKeyPressed)('2')) {
                    let cur_cable = new hexGame_1.Cable(cur_tile, cur_dir, cur_target_dir, "tachyon", false);
                    cur_tile.addCable(cur_cable);
                }
                else if ((0, engine_1.wasKeyPressed)('3')) {
                    let cur_cable = new hexGame_1.Cable(cur_tile, cur_dir, cur_target_dir, "bridgeBackward", false);
                    cur_tile.addCable(cur_cable);
                }
                else if ((0, engine_1.wasKeyPressed)('4')) {
                    let cur_cable = new hexGame_1.Cable(cur_tile, cur_dir, cur_target_dir, "bridgeForward", false);
                    cur_tile.addCable(cur_cable);
                }
                else if ((0, engine_1.wasKeyPressed)('5')) {
                    let cur_cable = new hexGame_1.Cable(cur_tile, cur_dir, cur_target_dir, "swapper", false);
                    cur_tile.addCable(cur_cable);
                }
                else if ((0, engine_1.wasKeyPressed)('6')) {
                    let cur_cable = new hexGame_1.Cable(cur_tile, cur_dir, cur_target_dir, "swapperBackward", false);
                    cur_tile.addCable(cur_cable);
                }
            }
            else {
                // yes cable
                graphics_1.ctx.strokeStyle = "white";
                graphics_1.ctx.lineWidth = 3;
                (0, graphics_1.drawGhostCable)(cur_hex, cur_tile.cables[cur_dir].origin, cur_tile.cables[cur_dir].target);
                graphics_1.ctx.strokeStyle = "black";
                graphics_1.ctx.lineWidth = 1;
                if ((0, engine_1.wasButtonPressed)("left")) {
                    cur_tile.cables[cur_dir].cycleInput(Math.floor(time));
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
        if (anim_t === 0) {
            if ((0, engine_1.wasKeyPressed)('d')) {
                time += 1;
                anim_t -= .99;
            }
            else if ((0, engine_1.wasKeyPressed)('a')) {
                (0, hexGame_1.updateToPrev)(time);
                time -= 1;
                anim_t += .99;
            }
        }
        else {
            let new_anim_t = moveToZero(anim_t, 0.005 * deltaTime);
            if (new_anim_t === 0 && anim_t < 0) {
                (0, hexGame_1.updateToNext)(time - 1);
            }
            anim_t = new_anim_t;
        }
        /*if (wasKeyPressed('s')) {
          localStorage.setItem("level", board2str());
        }
        if (wasKeyPressed('m')) {
          board.clear();
        }*/
        if ((0, engine_1.wasKeyPressed)('w')) {
            localStorage.setItem("sentient", (0, hexGame_1.board2str_onlyVisible)());
            // localStorage.setItem("yay", board2str_onlyVisible());
        }
        if ((0, engine_1.wasKeyPressed)('q')) {
            (0, hexGame_1.hacky_printAllPaths)(time);
        }
        if ((0, engine_1.wasKeyPressed)('e')) {
            (0, hexGame_1.hacky_printAllLoops)(time);
        }
        if ((0, engine_1.wasKeyPressed)('y')) {
            hacky_dontDrawMain = true;
        }
        if ((0, engine_1.isKeyDown)('k'))
            hexGame_1.layout.origin.y -= deltaTime * 0.4;
        if ((0, engine_1.isKeyDown)('i'))
            hexGame_1.layout.origin.y += deltaTime * 0.4;
        if ((0, engine_1.isKeyDown)('l'))
            hexGame_1.layout.origin.x -= deltaTime * 0.4;
        if ((0, engine_1.isKeyDown)('j'))
            hexGame_1.layout.origin.x += deltaTime * 0.4;
        if (!hacky_dontDrawMain)
            (0, graphics_1.drawBoard)(time + anim_t);
        (0, hexGame_1.hacky_drawStuff)();
        (0, engine_1.engine_update)();
        window.requestAnimationFrame(update);
    }
    let hacky_dontDrawMain = false;
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
});
