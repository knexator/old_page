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
        define(["require", "exports", "dat.gui.min.js", "graphics", "base", "board", "physics", "engine", "collapses"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.wheel_offset = void 0;
    // ES6:
    const dat = __importStar(require("dat.gui.min.js"));
    const graphics_1 = require("graphics");
    const base_1 = require("base");
    const board_1 = require("board");
    const physics_1 = require("physics");
    const engine_1 = require("engine");
    const collapses_1 = require("collapses");
    exports.wheel_offset = 0;
    // let cur_taco_head = [0, 0]
    // let cur_taco_tail = [0, 0]
    let last_time = 0;
    let last_pressed = null;
    let std_sliders;
    function initOnce() {
        std_sliders = [];
        base_1.pintar.canvas.insertAdjacentHTML('afterend', `<input class="gameSlider" type="range" min="0" max="1" step="0.00001" \
   style="width: 80%; background-color: #000;">`);
        std_sliders.push(base_1.pintar.canvas.nextElementSibling);
        for (let i = 0; i < base_1.CONFIG.N_BALLS; i++) {
            let stuff = base_1.pintar.canvas.insertAdjacentHTML('afterend', `<input class="gameSlider" type="range" min="0" max="1" step="0.00001" \
     style="width: 80%; background-color: #${base_1.ball_hex_colors[i]};">`);
            std_sliders.push(base_1.pintar.canvas.nextElementSibling);
        }
        base_1.pintar._renderer._setBlendMode(PintarJS.BlendModes.AlphaBlend);
        init();
        window.requestAnimationFrame(update);
    }
    function init() {
        exports.wheel_offset = 0;
        // cur_taco_head = [0, 0]
        // cur_taco_tail = [0, 0]
        last_time = 0;
        last_pressed = null;
        // Reset initial positions & velocities
        for (let i = 0; i < base_1.CONFIG.N_BALLS; i++) {
            let cur_initial_pos = (0, board_1.initialPosition)(i);
            for (let j = 0; j < base_1.CONFIG.N_WORLDS; j++) {
                let k = (0, base_1.IJ2K)(i, j, true);
                base_1.pos_data[k] = cur_initial_pos[0];
                base_1.pos_data[k + 1] = cur_initial_pos[1];
                base_1.vel_data[k] = 0.0;
                base_1.vel_data[k + 1] = 0.0;
                base_1.won_data[(0, base_1.IJ2K)(i, j, false)] = 0;
            }
        }
        // Add noise to white ball
        (0, collapses_1.addChaos)();
    }
    function update(curTime) {
        let deltaTime = curTime - last_time;
        deltaTime = Math.min(deltaTime, 30.0);
        last_time = curTime;
        // ctx.clearRect(0,0,canvas.width,canvas.height);
        let anim_time = base_1.VARS.anim_time;
        if (anim_time > 0) {
            console.log(anim_time);
            anim_time = Math.max(anim_time - deltaTime * 0.001 / base_1.CONFIG.ANIM_DURATION, 0.0);
            base_1.VARS.anim_time = anim_time;
            anim_time = 1 - anim_time;
            anim_time *= anim_time;
            base_1.pintar.startFrame();
            // ball i, world j
            base_1.pintar._renderer.setShader(graphics_1.ball_shader);
            for (let i = 0; i < base_1.CONFIG.N_BALLS; i++) {
                for (let j = 0; j < base_1.CONFIG.N_WORLDS; j++) {
                    let k = (0, base_1.IJ2K)(i, j, true);
                    (0, graphics_1.drawBallAt)(lerp(base_1.original_pos_data[k], base_1.pos_data[k], anim_time), lerp(base_1.original_pos_data[k + 1], base_1.pos_data[k + 1], anim_time), base_1.ball_colors[i]);
                }
            }
            base_1.pintar.endFrame();
        }
        else {
            if ((0, engine_1.wasButtonPressed)("left")) {
                last_pressed = { x: engine_1.mouse.x, y: engine_1.mouse.y };
                // cur_taco_head = [
                //   last_pressed.x,
                //   last_pressed.y
                // ]
            }
            else if ((0, engine_1.wasButtonReleased)("left") && last_pressed) {
                for (let j = 0; j < base_1.CONFIG.N_WORLDS; j++) {
                    let k = (0, base_1.IJ2K)(0, j, true);
                    base_1.vel_data[k] -= (engine_1.mouse.x - last_pressed.x) * base_1.CONFIG.FORCE_SCALER;
                    base_1.vel_data[k + 1] -= (engine_1.mouse.y - last_pressed.y) * base_1.CONFIG.FORCE_SCALER;
                }
                last_pressed = null;
            }
            exports.wheel_offset += engine_1.mouse.wheel;
            (0, collapses_1.select)();
            if ((0, engine_1.wasButtonPressed)("right")) {
                (0, collapses_1.collapse)();
                exports.wheel_offset = 0;
            }
            (0, physics_1.advanceGame)(deltaTime * 0.001);
            // console.log(pos_data[0]);
            base_1.pintar.startFrame();
            base_1.pintar._renderer._setBlendMode(PintarJS.BlendModes.AlphaBlend);
            // ball i, world j
            base_1.pintar._renderer.setShader(graphics_1.ball_shader);
            for (let i = 0; i < base_1.CONFIG.N_BALLS; i++) {
                for (let j = 0; j < base_1.CONFIG.N_WORLDS; j++) {
                    let k = (0, base_1.IJ2K)(i, j, true);
                    (0, graphics_1.drawBallAt)(base_1.pos_data[k], base_1.pos_data[k + 1], base_1.ball_colors[i]);
                }
            }
            base_1.pintar._renderer.setShader(graphics_1.outline_ball_shader);
            (0, collapses_1.drawSelected)();
            if (last_pressed) {
                base_1.pintar._renderer.setShader(graphics_1.taco_shader);
                (0, graphics_1.drawTaco)(last_pressed, engine_1.mouse);
            }
            base_1.pintar.endFrame();
        }
        let mean_std = 0.0;
        for (let i = 0; i < base_1.CONFIG.N_BALLS; i++) {
            let cur_std = (0, physics_1.ballPosSTD)(i);
            mean_std += cur_std;
            std_sliders[i + 1].value = cur_std;
        }
        std_sliders[0].value = mean_std / base_1.CONFIG.N_BALLS;
        (0, engine_1.engine_update)();
        window.requestAnimationFrame(update);
    }
    // CONFIG.init = init
    const gui = new dat.GUI();
    // const initialFolder = gui.addFolder('Initial')
    // // initialFolder.add(CONFIG, 'N_BALLS', 1, 16, 1)
    // // initialFolder.add(CONFIG, 'N_WORLDS', 1, 512, 1)
    // initialFolder.add(CONFIG, 'BALL_R', 0.0, 0.5)
    // initialFolder.add(CONFIG, 'INITIAL_SPACING', 0.0, 0.5)
    // // initialFolder.add(CONFIG, 'init')
    // initialFolder.open()
    const collapseFolder = gui.addFolder('Collapse');
    collapseFolder.add(base_1.CONFIG, 'PERMANENT_HOLES');
    collapseFolder.add(base_1.CONFIG, 'COLLAPSE_EXTENT', ["ball", "world"]);
    collapseFolder.add(base_1.CONFIG, 'COLLAPSE_TARGET', ["mean", "selected"]);
    collapseFolder.add(base_1.CONFIG, 'AUTOCOLLAPSE_WHITE');
    collapseFolder.open();
    const gamefeelFolder = gui.addFolder('Gamefeel');
    gamefeelFolder.add(base_1.CONFIG, 'FORCE_SCALER', 0.01, 4);
    gamefeelFolder.add(base_1.CONFIG, 'CHAOS_AMOUNT', 0.0, .01);
    gamefeelFolder.add(base_1.CONFIG, 'ANIM_DURATION', 0.01, 1.00);
    gamefeelFolder.open();
    gui.remember(base_1.CONFIG);
    initOnce();
    function lerp(a, b, t) {
        return a * (1 - t) + b * t;
    }
});
