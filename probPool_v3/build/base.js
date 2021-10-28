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
    exports.ball_colors = exports.ball_hex_colors = exports.IJ2K = exports.original_won_data = exports.original_vel_data = exports.original_pos_data = exports.won_data = exports.vel_data = exports.pos_data = exports.selected = exports.VARS = exports.CONFIG = exports.pintar = void 0;
    exports.pintar = new PintarJS();
    exports.CONFIG = {
        N_BALLS: 8,
        N_WORLDS: 512,
        BALL_R: 0.03,
        EXTRA_MARGIN: 0.1,
        BORDER_R: 0.05,
        OPACITY: 0.10,
        INITIAL_SPACING: 0.1,
        FORCE_SCALER: 1,
        CHAOS_AMOUNT: 0.001,
        ALWAYS_PICK: false,
        ANIM_DURATION: 0.3,
        PERMANENT_HOLES: true,
        COLLAPSE_EXTENT: "ball",
        COLLAPSE_TARGET: "mean",
        AUTOCOLLAPSE_WHITE: true,
        /*export let BALL_R_SQ = BALL_R * BALL_R
        export let BORDER_R_SQ = BORDER_R * BORDER_R
        export let CHAOS_AMOUNT = 0.001
        export let PICK_TOLERANCE = 0.0005
        export let ALLOW_NO_PICK = true
        export let INITIAL_SPACING = 0.1
        export let OPAQUE_BALLS = false
        export let DEBUG_TRUE_OPACITY = false;*/
    };
    exports.VARS = {
        anim_time: 0,
    };
    exports.selected = {
        ball: null,
        world: null
    };
    exports.pos_data = new Float32Array(exports.CONFIG.N_BALLS * exports.CONFIG.N_WORLDS * 2);
    exports.vel_data = new Float32Array(exports.CONFIG.N_BALLS * exports.CONFIG.N_WORLDS * 2);
    exports.won_data = new Int8Array(exports.CONFIG.N_BALLS * exports.CONFIG.N_WORLDS);
    exports.original_pos_data = new Float32Array(exports.CONFIG.N_BALLS * exports.CONFIG.N_WORLDS * 2);
    exports.original_vel_data = new Float32Array(exports.CONFIG.N_BALLS * exports.CONFIG.N_WORLDS * 2);
    exports.original_won_data = new Int8Array(exports.CONFIG.N_BALLS * exports.CONFIG.N_WORLDS);
    // ball i, world j corresponds to won_data[ball_i, world_j]
    function IJ2K(ball_i, world_j, xy_data) {
        // Chunk by color, that is, ball_j
        // p_11, p_21, p_31 ... p_12, p_22, ...
        // For x/y, multiply by 2:
        // p_11x, p_11y, p_21x, p_21y ... p_12x, p_12y ...
        let res = world_j + ball_i * exports.CONFIG.N_WORLDS;
        if (xy_data)
            return res * 2;
        return res;
    }
    exports.IJ2K = IJ2K;
    exports.ball_hex_colors = [
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
    ];
    exports.ball_colors = exports.ball_hex_colors.map(hex => {
        let r = parseInt(hex.slice(0, 2), 16) / 255;
        let g = parseInt(hex.slice(2, 4), 16) / 255;
        let b = parseInt(hex.slice(4, 6), 16) / 255;
        return [r, g, b];
    });
});
