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
    let last_time = 0;
    function initOnce() {
        window.requestAnimationFrame(update);
    }
    function update(curTime) {
        let deltaTime = curTime - last_time;
        deltaTime = Math.min(deltaTime, 30.0);
        last_time = curTime;
        ctx.fillStyle = "black";
        ctx.fillRect(engine_1.mouse.x, engine_1.mouse.y, 100, 100);
        (0, engine_1.engine_update)();
        window.requestAnimationFrame(update);
    }
    initOnce();
    function lerp(a, b, t) {
        return a * (1 - t) + b * t;
    }
});
