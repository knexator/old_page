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
    exports.ball_colors = exports.won_data = exports.vel_data = exports.pos_data = exports.CONFIG = exports.pintar = void 0;
    exports.pintar = new PintarJS();
    exports.CONFIG = {
        N_BALLS: 3,
        N_WORLDS: 512,
        BALL_R: 0.03,
        EXTRA_MARGIN: 0.1,
        BORDER_R: 0.05,
        OPACITY: 0.10,
        /*export let BALL_R_SQ = BALL_R * BALL_R
        export let
        export let BORDER_R_SQ = BORDER_R * BORDER_R
        export let FORCE_SCALER = 2
        export let CHAOS_AMOUNT = 0.001
        export let PICK_TOLERANCE = 0.0005
        export let ALLOW_NO_PICK = true
        export let INITIAL_SPACING = 0.1
        export let OPAQUE_BALLS = false
        export let DEBUG_TRUE_OPACITY = false;*/
    };
    exports.pos_data = new Float32Array(exports.CONFIG.N_BALLS * exports.CONFIG.N_WORLDS * 2);
    exports.vel_data = new Float32Array(exports.CONFIG.N_BALLS * exports.CONFIG.N_WORLDS * 2);
    exports.won_data = new Int8Array(exports.CONFIG.N_BALLS * exports.CONFIG.N_WORLDS);
    exports.ball_colors = [
        "FFFFFF",
        "F7DE1B",
        "4C8AF0",
        "ED4A44",
        "D246EE",
        // "14110F",
        "2E8943",
        "DD7933",
        // "BB4B23",
        "04E762",
        "17BEBB", //64B6AC
    ].map(hex => {
        let r = parseInt(hex.slice(0, 2), 16) / 255;
        let g = parseInt(hex.slice(2, 4), 16) / 255;
        let b = parseInt(hex.slice(4, 6), 16) / 255;
        return [r, g, b];
    });
});
