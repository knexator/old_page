// window.addEventListener("resize", e => {
//   canvas.width = innerWidth;
//   canvas.height = innerHeight;
// });
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.wasKeyReleased = exports.wasKeyPressed = exports.isKeyDown = exports.keyMap = exports.keyboard_prev = exports.keyboard = exports.wasButtonReleased = exports.wasButtonPressed = exports.isButtonDown = exports.mouse_prev = exports.mouse = exports.engine_post_update = exports.engine_pre_update = exports.delta_time = exports.game_time = void 0;
    // window.addEventListener("load", _e => {
    //   // window.dispatchEvent(new Event('resize'));
    //   window.requestAnimationFrame(update);
    // });
    exports.game_time = 0;
    exports.delta_time = 0;
    let last_timestamp = 0;
    function engine_pre_update(cur_timestamp) {
        exports.delta_time = cur_timestamp - last_timestamp;
        exports.delta_time = Math.min(exports.delta_time, 30.0);
        last_timestamp = cur_timestamp;
        exports.game_time += exports.delta_time;
    }
    exports.engine_pre_update = engine_pre_update;
    function engine_post_update() {
        exports.mouse_prev = Object.assign({}, exports.mouse);
        exports.mouse.wheel = 0;
        exports.keyboard_prev = Object.assign({}, exports.keyboard);
    }
    exports.engine_post_update = engine_post_update;
    window.addEventListener('mousemove', e => _mouseEvent(e));
    window.addEventListener('mousedown', e => _mouseEvent(e));
    window.addEventListener('mouseup', e => _mouseEvent(e));
    function _mouseEvent(e) {
        let x = e.clientX;
        let y = e.clientY;
        exports.mouse.x = x;
        exports.mouse.y = y;
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
