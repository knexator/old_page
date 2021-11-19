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
    // ES6:
    const engine_1 = require("engine");
    let pintar = new PintarJS();
    class Piece {
        constructor(i, j, k, id) {
            this.i = i;
            this.j = j;
            this.k = k;
            this.id = id;
        }
    }
    // Called when loading the page
    function initOnce() {
        init();
        window.requestAnimationFrame(update);
    }
    let board_0 = [];
    let board_1 = [];
    // Called when game is reset
    function init() {
        board_0 = [];
        for (let n = 0; n < 8; n++) {
            board_0.push(new Piece(n % 3, Math.floor(n / 3), 0, n));
        }
        board_1 = [];
        board_1.push(new Piece(2, 1, 1, 10));
        board_1.push(new Piece(1, 2, 1, 11));
    }
    // Called every frame
    function update(curTime) {
        (0, engine_1.engine_pre_update)(curTime);
        // ctx.clearRect(0,0,canvas.width,canvas.height);
        let di = 0;
        let dj = 0;
        if ((0, engine_1.wasKeyPressed)('d'))
            di += 1;
        if ((0, engine_1.wasKeyPressed)('a'))
            di -= 1;
        if ((0, engine_1.wasKeyPressed)('s'))
            dj += 1;
        if ((0, engine_1.wasKeyPressed)('w'))
            dj -= 1;
        if (di !== 0 || dj !== 0) {
        }
        pintar.drawRectangle(new PintarJS.ColoredRectangle(new PintarJS.Point(x_start, y_start), new PintarJS.Point(x_end - x_start, y_end - y_start), PintarJS.Color.fromHex(COLORS.transition), null, true));
        (0, engine_1.engine_post_update)();
        window.requestAnimationFrame(update);
    }
    initOnce();
    function lerp(a, b, t) {
        return a * (1 - t) + b * t;
    }
});
