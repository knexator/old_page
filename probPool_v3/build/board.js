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
    exports.initialPosition = exports.afterHolePos = exports.XY2Hole = void 0;
    const base_1 = require("base");
    function XY2Hole(x, y, corner) {
        if (corner) {
            if (x > 0) {
                if (y > 0) {
                    return 1;
                }
                else {
                    return 2;
                }
            }
            else {
                if (y > 0) {
                    return 3;
                }
                else {
                    return 4;
                }
            }
        }
        else {
            if (y > 0) {
                return 5;
            }
            else {
                return 6;
            }
        }
    }
    exports.XY2Hole = XY2Hole;
    /*export function Hole2XY(h: number) {
    
    }*/
    function afterHolePos(ball_n, hole_n) {
        let t = (ball_n + .5) / base_1.CONFIG.N_BALLS - .5;
        if (hole_n === 5 || hole_n === 6) {
            let x = t * base_1.CONFIG.N_BALLS * base_1.CONFIG.BALL_R * 2;
            let y = .5 + base_1.CONFIG.EXTRA_MARGIN / 2;
            if (hole_n === 5) {
                return [x, y];
            }
            else {
                return [-x, -y];
            }
        }
        else {
            let dA = t >= 0 ? 0.0 : base_1.CONFIG.N_BALLS * base_1.CONFIG.BALL_R * 2 * -t;
            let dB = t <= 0 ? 0.0 : base_1.CONFIG.N_BALLS * base_1.CONFIG.BALL_R * 2 * t;
            if (hole_n === 1) {
                return [1 + base_1.CONFIG.EXTRA_MARGIN / 2 - dA, 0.5 + base_1.CONFIG.EXTRA_MARGIN / 2 - dB];
            }
            else if (hole_n === 2) {
                return [1 + base_1.CONFIG.EXTRA_MARGIN / 2 - dB, -0.5 - base_1.CONFIG.EXTRA_MARGIN / 2 + dA];
            }
            else if (hole_n === 4) {
                return [-1 - base_1.CONFIG.EXTRA_MARGIN / 2 + dA, -0.5 - base_1.CONFIG.EXTRA_MARGIN / 2 + dB];
            }
            else if (hole_n === 3) {
                return [-1 - base_1.CONFIG.EXTRA_MARGIN / 2 + dB, 0.5 + base_1.CONFIG.EXTRA_MARGIN / 2 - dA];
            }
        }
        throw new Error("hole doesn't exists!");
    }
    exports.afterHolePos = afterHolePos;
    function initialPosition(ball_n) {
        if (ball_n === 0) {
            return [-.5, 0.0];
        }
        let n_i = ball_n;
        let n_k = 2;
        let i = 1;
        while (n_i > 0) {
            i += 1;
            n_i -= n_k;
            n_k += 1;
        }
        let j = n_i + i / 2 - .5;
        if (i == 4)
            j += 1;
        i -= 3;
        return [
            .5 + i * base_1.CONFIG.BALL_R * Math.sin(Math.PI / 3) * (2 + base_1.CONFIG.INITIAL_SPACING),
            j * base_1.CONFIG.BALL_R * (2 + base_1.CONFIG.INITIAL_SPACING)
        ];
    }
    exports.initialPosition = initialPosition;
});
