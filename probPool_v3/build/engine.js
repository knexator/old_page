(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "base"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.wasKeyReleased = exports.wasKeyPressed = exports.isKeyDown = exports.keyMap = exports.keyboard_prev = exports.keyboard = exports.wasButtonReleased = exports.wasButtonPressed = exports.isButtonDown = exports.mouse_prev = exports.mouse = exports.engine_update = void 0;
    const base_1 = require("base");
    // window.addEventListener("resize", e => {
    //   canvas.width = innerWidth;
    //   canvas.height = innerHeight;
    // });
    // window.addEventListener("load", _e => {
    //   // window.dispatchEvent(new Event('resize'));
    //   window.requestAnimationFrame(update);
    // });
    function engine_update() {
        exports.mouse_prev = Object.assign({}, exports.mouse);
        exports.mouse.wheel = 0;
        exports.keyboard_prev = Object.assign({}, exports.keyboard);
    }
    exports.engine_update = engine_update;
    window.addEventListener('mousemove', e => _mouseEvent(e));
    window.addEventListener('mousedown', e => _mouseEvent(e));
    window.addEventListener('mouseup', e => _mouseEvent(e));
    function _mouseEvent(e) {
        let rect = base_1.pintar.canvas.getBoundingClientRect();
        let x = e.clientX - rect.x;
        let y = e.clientY - rect.y;
        exports.mouse.x = (x / base_1.pintar.canvas.clientWidth - .5) * (2 + base_1.CONFIG.EXTRA_MARGIN * 2);
        exports.mouse.y = -(y / base_1.pintar.canvas.clientHeight - .5) * (1 + base_1.CONFIG.EXTRA_MARGIN * 2);
        exports.mouse.buttons = e.buttons;
        return false;
    }
    window.addEventListener('wheel', e => {
        let d = e.deltaY > 0 ? 1 : -1;
        return exports.mouse.wheel = d;
    });
    exports.mouse = { x: 0, y: 0, buttons: 0, wheel: 0 };
    exports.mouse_prev = Object.assign({}, exports.mouse);
    function isButtonDown(b) {
        let i = b == "left" ? 0 : b == "right" ? 1 : 2;
        return (exports.mouse.buttons & (1 << i)) != 0;
    }
    exports.isButtonDown = isButtonDown;
    function wasButtonPressed(b) {
        let i = b == "left" ? 0 : b == "right" ? 1 : 2;
        return ((exports.mouse.buttons & (1 << i)) !== 0) && ((exports.mouse_prev.buttons & (1 << i)) === 0);
    }
    exports.wasButtonPressed = wasButtonPressed;
    function wasButtonReleased(b) {
        let i = b == "left" ? 0 : b == "right" ? 1 : 2;
        return ((exports.mouse.buttons & (1 << i)) === 0) && ((exports.mouse_prev.buttons & (1 << i)) !== 0);
    }
    exports.wasButtonReleased = wasButtonReleased;
    exports.keyboard = {};
    exports.keyboard_prev = {};
    function keyMap(e) {
        // use key.code if key location is important
        return e.key.toLowerCase();
    }
    exports.keyMap = keyMap;
    window.addEventListener('keydown', e => {
        let k = keyMap(e);
        exports.keyboard[k] = true;
    });
    window.addEventListener('keyup', e => {
        let k = keyMap(e);
        exports.keyboard[k] = false;
    });
    function isKeyDown(k) {
        return exports.keyboard[k] || false;
    }
    exports.isKeyDown = isKeyDown;
    function wasKeyPressed(k) {
        return (exports.keyboard[k] || false) && (!exports.keyboard_prev[k] || false);
    }
    exports.wasKeyPressed = wasKeyPressed;
    function wasKeyReleased(k) {
        return (!exports.keyboard[k] || false) && (exports.keyboard_prev[k] || false);
    }
    exports.wasKeyReleased = wasKeyReleased;
});
