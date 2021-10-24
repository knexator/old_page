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
        define(["require", "exports", "dat.gui.min.js", "graphics", "base", "./board"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // ES6:
    const dat = __importStar(require("dat.gui.min.js"));
    const graphics_1 = require("graphics");
    const base_1 = require("base");
    const board_1 = require("./board");
    // window.addEventListener("resize", e => {
    //   canvas.width = innerWidth;
    //   canvas.height = innerHeight;
    // });
    // window.addEventListener("load", _e => {
    //   // window.dispatchEvent(new Event('resize'));
    //   window.requestAnimationFrame(update);
    // });
    let last_time = 0;
    function update(curTime) {
        let deltaTime = curTime - last_time;
        deltaTime = Math.min(deltaTime, 30.0);
        last_time = curTime;
        // ctx.clearRect(0,0,canvas.width,canvas.height);
        if (wasButtonPressed("left"))
            console.log("0 pressed");
        if (isButtonDown("left"))
            console.log("0 down");
        if (wasButtonReleased("left"))
            console.log("0 unpressed");
        if (wasKeyPressed('a'))
            console.log("a pressed");
        if (isKeyDown('a'))
            console.log("a down");
        if (wasKeyReleased('a'))
            console.log("a unpressed");
        base_1.pintar.startFrame();
        base_1.pintar._renderer._setBlendMode(PintarJS.BlendModes.AlphaBlend);
        // ball i, world j
        for (let i = 0; i < base_1.CONFIG.N_BALLS; i++) {
            for (let j = 0; j < base_1.CONFIG.N_WORLDS; j++) {
                let k = (0, board_1.IJ2K)(i, j, true);
                console.log(base_1.ball_colors[j]);
                (0, graphics_1.drawBallAt)(base_1.pos_data[k], base_1.pos_data[k + 1], base_1.ball_colors[i]);
            }
        }
        base_1.pintar.endFrame();
        mouse_prev = Object.assign({}, mouse);
        mouse.wheel = 0;
        keyboard_prev = Object.assign({}, keyboard);
        window.requestAnimationFrame(update);
    }
    window.addEventListener('mousemove', e => _mouseEvent(e));
    window.addEventListener('mousedown', e => _mouseEvent(e));
    window.addEventListener('mouseup', e => _mouseEvent(e));
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
    let CONFIG_asdf = { stuff: "smooth" };
    let cube = { x: 3, y: 3, z: 1 };
    const gui = new dat.GUI();
    const cubeFolder = gui.addFolder('Cube');
    cubeFolder.add(cube, 'x', 0, Math.PI * 2);
    cubeFolder.add(cube, 'y', 0, Math.PI * 2);
    cubeFolder.add(cube, 'z', 0, Math.PI * 2);
    cubeFolder.open();
    const cameraFolder = gui.addFolder('Camera');
    cameraFolder.open();
    gui.add(CONFIG_asdf, "stuff", ["wireframe", "flat", "smooth", "glossy", "textured", "reflective"]).name("Shading");
    window.requestAnimationFrame(update);
});
