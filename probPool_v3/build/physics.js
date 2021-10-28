(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "base", "board"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ballPosSTD = exports.advanceGame = void 0;
    const base_1 = require("base");
    const board_1 = require("board");
    function advanceGame(deltaTime) {
        let BORDER_R = base_1.CONFIG.BORDER_R;
        let BORDER_R_SQ = BORDER_R * BORDER_R;
        let BALL_R = base_1.CONFIG.BALL_R;
        let BALL_R_SQ = BALL_R * BALL_R;
        let N_BALLS = base_1.CONFIG.N_BALLS;
        let N_WORLDS = base_1.CONFIG.N_WORLDS;
        const right_border = 1 - (BORDER_R + BALL_R);
        const top_border = .5 - (BORDER_R + BALL_R);
        // Velocity, crash against borders
        for (let i = 0; i < N_BALLS; i++) {
            for (let j = 0; j < N_WORLDS; j++) {
                let k = (0, base_1.IJ2K)(i, j, true);
                let k_won = (0, base_1.IJ2K)(i, j, false);
                if (base_1.won_data[k_won] == 0) {
                    // Advance
                    base_1.pos_data[k] += deltaTime * base_1.vel_data[k];
                    base_1.vel_data[k] *= .99;
                    base_1.pos_data[k + 1] += deltaTime * base_1.vel_data[k + 1];
                    base_1.vel_data[k + 1] *= .99;
                    let x = Math.abs(base_1.pos_data[k]);
                    let y = Math.abs(base_1.pos_data[k + 1]);
                    // Check corner holes
                    if (x > 1 - (1 + Math.SQRT2) * BORDER_R && y > .5 - (1 + Math.SQRT2) * BORDER_R) { // quick corner check
                        let dx = (1 - Math.SQRT2 * BORDER_R) - x;
                        let dy = (.5 - Math.SQRT2 * BORDER_R) - y;
                        if (dx * dx + dy * dy < BORDER_R) {
                            let offset = (0, board_1.afterHolePos)(i, (0, board_1.XY2Hole)(base_1.pos_data[k], base_1.pos_data[k + 1], true));
                            base_1.pos_data[k] = offset[0];
                            base_1.pos_data[k + 1] = offset[1];
                            base_1.won_data[k_won] = 1;
                            continue;
                        }
                    }
                    if (x > right_border) {
                        // Check horizontal borders
                        x = 2 * right_border - x;
                        base_1.vel_data[k] *= -1;
                        base_1.pos_data[k] = x * Math.sign(base_1.pos_data[k]);
                        // continue;
                    }
                    else if (y > top_border) {
                        // Check vertical borders & middle holes
                        if (x < BORDER_R) { // fast check for middle hole
                            // let x = Math.abs(cur_ball_pos[k - 1])
                            // let y = top_border - cur_ball_pos[k]
                            let dy = top_border - y;
                            if (x * x + dy * dy < BORDER_R_SQ) { // inside the hole!
                                // let offset = ballOffset(n);
                                let hole = (0, board_1.XY2Hole)(base_1.pos_data[k], base_1.pos_data[k + 1], false);
                                let offset = (0, board_1.afterHolePos)(i, hole);
                                base_1.pos_data[k] = offset[0];
                                base_1.pos_data[k + 1] = offset[1];
                                //cur_ball_pos[k + 1] = (0.5 - BORDER_R) * Math.sign(cur_ball_pos[k + 1]) + offset[1]
                                // cur_ball_pos[k + 1] = 0.5 + EXTRA_MARGIN / 2
                                /*cur_ball_vel[k - 1] = 0.0
                                cur_ball_vel[k] = 0.0*/
                                base_1.won_data[k_won] = hole;
                                continue;
                            } /* else {
                              // TODO: proper rebound against corners
                              cur_ball_pos[k] = 2 * top_border - cur_ball_pos[k]
                              cur_ball_vel[k] *= -1
                            }*/
                        }
                        y = 2 * top_border - y;
                        base_1.vel_data[k + 1] *= -1;
                        base_1.pos_data[k + 1] = y * Math.sign(base_1.pos_data[k + 1]);
                        //cur_ball_pos[k] = 2 * top_border - cur_ball_pos[k]
                        //cur_ball_vel[k] *= -1
                    }
                }
            }
        }
        // Ball collisions
        for (let j = 0; j < N_WORLDS; j++) {
            for (let i1 = 0; i1 < N_BALLS; i1++) {
                let k1 = (0, base_1.IJ2K)(i1, j, true);
                if (base_1.won_data[(0, base_1.IJ2K)(i1, j, false)] !== 0)
                    continue;
                let b1px = base_1.pos_data[k1];
                let b1py = base_1.pos_data[k1 + 1];
                let b1vx = base_1.vel_data[k1];
                let b1vy = base_1.vel_data[k1 + 1];
                for (let i2 = i1 + 1; i2 < N_BALLS; i2++) {
                    if (base_1.won_data[(0, base_1.IJ2K)(i2, j, false)] !== 0)
                        continue;
                    let k2 = (0, base_1.IJ2K)(i2, j, true);
                    let b2px = base_1.pos_data[k2];
                    let b2py = base_1.pos_data[k2 + 1];
                    let b2vx = base_1.vel_data[k2];
                    let b2vy = base_1.vel_data[k2 + 1];
                    let dx = b1px - b2px;
                    let dy = b1py - b2py;
                    let distSq = dx * dx + dy * dy;
                    if (distSq < 4 * BALL_R_SQ && distSq > 0) {
                        let dist = Math.sqrt(distSq);
                        let nx = dy / dist;
                        let ny = -dx / dist;
                        let [dd1x, dd1y] = dotpart(b1vx, b1vy, nx, ny);
                        let [dd2x, dd2y] = dotpart(b2vx, b2vy, nx, ny);
                        if (2 * BALL_R - dist > 0) {
                            let push = (2 * BALL_R - dist) * 0.5 / dist;
                            // let push = Math.max(0, 2 * BALL_R - dist) * 0.5 / dist;
                            base_1.pos_data[k1] += dx * push;
                            base_1.pos_data[k1 + 1] += dy * push;
                            base_1.pos_data[k2] -= dx * push;
                            base_1.pos_data[k2 + 1] -= dy * push;
                            /*b1.vx = b1.vx - dd1x + dd2x;
                            b1.vy = b1.vy - dd1y + dd2y;
                            b2.vx = b2.vx - dd2x + dd1x;
                            b2.vy = b2.vy - dd2y + dd1y;*/
                            base_1.vel_data[k1] -= dd1x - dd2x;
                            base_1.vel_data[k1 + 1] -= dd1y - dd2y;
                            base_1.vel_data[k2] -= dd2x - dd1x;
                            base_1.vel_data[k2 + 1] -= dd2y - dd1y;
                        }
                    }
                }
            }
        }
    }
    exports.advanceGame = advanceGame;
    function dotpart(vx, vy, nx, ny) {
        var dot = vx * nx + vy * ny;
        return [vx - dot * nx, vy - dot * ny];
    }
    function ballPosSTD(ball_i) {
        let mean_px = 0;
        let mean_py = 0;
        let n_lost = 0;
        for (let j = 0; j < base_1.CONFIG.N_WORLDS; j++) {
            if (base_1.won_data[(0, base_1.IJ2K)(ball_i, j, false)] === 0) {
                let k = (0, base_1.IJ2K)(ball_i, j, true);
                mean_px += base_1.pos_data[k];
                mean_py += base_1.pos_data[k + 1];
                n_lost += 1;
            }
        }
        if (n_lost === 0)
            return 0;
        mean_px /= n_lost;
        mean_py /= n_lost;
        let std = 0.0;
        for (let j = 0; j < base_1.CONFIG.N_WORLDS; j++) {
            if (base_1.won_data[(0, base_1.IJ2K)(ball_i, j, false)] === 0) {
                let k = (0, base_1.IJ2K)(ball_i, j, true);
                let dx = mean_px - base_1.pos_data[k];
                let dy = mean_py - base_1.pos_data[k + 1];
                std += dx * dx + dy * dy;
            }
        }
        return Math.sqrt(std / n_lost);
    }
    exports.ballPosSTD = ballPosSTD;
});
