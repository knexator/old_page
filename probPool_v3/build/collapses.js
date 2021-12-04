(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "base", "./engine", "./graphics", "./main", "./physics"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.addChaos = exports.drawSelected = exports.collapseBallAt = exports.collapse = exports.select = void 0;
    const base_1 = require("base");
    const engine_1 = require("./engine");
    const graphics_1 = require("./graphics");
    const main_1 = require("./main");
    const physics_1 = require("./physics");
    function backupCurrent() {
        base_1.original_pos_data.set(base_1.pos_data);
        base_1.original_vel_data.set(base_1.vel_data);
        base_1.original_won_data.set(base_1.won_data);
    }
    function select() {
        let [selected_ball, selected_world] = selectClosestToMouse_anyColor();
        base_1.selected.ball = selected_ball;
        base_1.selected.world = selected_world;
    }
    exports.select = select;
    function selectClosestToMouse_anyColor() {
        let PICK_TOLERANCE = 0.0;
        let mx = engine_1.mouse.x;
        let my = engine_1.mouse.y;
        let best_ks = [];
        let best_distSq = Infinity;
        for (let i = 0; i < base_1.CONFIG.N_BALLS; i++) {
            for (let j = 0; j < base_1.CONFIG.N_WORLDS; j++) {
                let k = (0, base_1.IJ2K)(i, j, true);
                let dx = mx - base_1.pos_data[k];
                let dy = my - base_1.pos_data[k + 1];
                let distSq = dx * dx + dy * dy;
                if (distSq < best_distSq + PICK_TOLERANCE) {
                    if (distSq < best_distSq) {
                        best_distSq = distSq;
                        // Cleanup the list
                        best_ks = best_ks.filter(([_k, d]) => {
                            return d < best_distSq + PICK_TOLERANCE;
                        });
                    }
                    best_ks.push([j, distSq, i]);
                }
            }
        }
        let offset = indexOfSmallest(best_ks.map(a => a[1]));
        // best_ks = best_ks.sort((a, b) => a[1] - b[1]) // loses the nice continuum
        let result = best_ks[mod(offset + main_1.wheel_offset, best_ks.length)]; //[0]
        if (result[1] < base_1.CONFIG.BALL_R * base_1.CONFIG.BALL_R || base_1.CONFIG.ALWAYS_PICK) {
            return [result[2], result[0]];
        }
        else {
            return [null, null];
        }
    }
    function collapse() {
        // console.log("collapse()")
        // collapseIndividualMean(0)
        // addChaos()
        // console.log(selected)
        if (base_1.selected.ball === null || base_1.selected.world === null) {
            return;
            // throw new Error("selected_ball is not defined")
        }
        backupCurrent();
        base_1.VARS.anim_time = 1.0;
        // TODO: take into account the "USE_BRANCHES" config
        if (base_1.CONFIG.COLLAPSE_EXTENT === "ball") {
            collapseBall(base_1.selected.ball);
        }
        else if (base_1.CONFIG.COLLAPSE_EXTENT === "world") {
            for (let i = 0; i < base_1.CONFIG.N_BALLS; i++) {
                collapseBall(i);
            }
        }
        else {
            throw new Error("unknown CONFIG.COLLAPSE_EXTENT");
        }
        /*collapseIndividualMean(selected.ball)
        collapseIndividualMean(0)*/
        if (base_1.CONFIG.AUTOCOLLAPSE_WHITE) {
            collapseBall(0);
        }
        addChaos();
    }
    exports.collapse = collapse;
    function collapseBall(ball_i) {
        if (base_1.CONFIG.COLLAPSE_TARGET === "mean") {
            collapseIndividualMean(ball_i);
        }
        else if (base_1.CONFIG.COLLAPSE_TARGET === "selected") {
            collapseIndividualToSelected(ball_i);
        }
        else {
            throw new Error("unknown CONFIG.COLLAPSE_TARGET");
        }
    }
    function collapseIndividualToSelected(ball_i) {
        if (!base_1.selected.world)
            throw new Error("no world selected");
        let target_k = (0, base_1.IJ2K)(ball_i, base_1.selected.world, true);
        let px = base_1.pos_data[target_k];
        let py = base_1.pos_data[target_k + 1];
        let vx = base_1.vel_data[target_k];
        let vy = base_1.vel_data[target_k + 1];
        let ww = base_1.won_data[(0, base_1.IJ2K)(ball_i, base_1.selected.world, false)];
        for (let j = 0; j < base_1.CONFIG.N_WORLDS; j++) {
            if (base_1.CONFIG.PERMANENT_HOLES) {
                if (base_1.won_data[(0, base_1.IJ2K)(ball_i, j, false)] === 0) {
                    let k = (0, base_1.IJ2K)(ball_i, j, true);
                    base_1.pos_data[k] = px;
                    base_1.pos_data[k + 1] = py;
                    base_1.vel_data[k] = vx;
                    base_1.vel_data[k + 1] = vy;
                    base_1.won_data[(0, base_1.IJ2K)(ball_i, j, false)] = ww;
                }
            }
            else {
                let k = (0, base_1.IJ2K)(ball_i, j, true);
                base_1.pos_data[k] = px;
                base_1.pos_data[k + 1] = py;
                base_1.vel_data[k] = vx;
                base_1.vel_data[k + 1] = vy;
                base_1.won_data[(0, base_1.IJ2K)(ball_i, j, false)] = ww;
            }
        }
    }
    function collapseBallAt(ball_i, x, y) {
        if (base_1.CONFIG.PERMANENT_HOLES) {
            for (let j = 0; j < base_1.CONFIG.N_WORLDS; j++) {
                if (base_1.won_data[(0, base_1.IJ2K)(ball_i, j, false)] === 0) {
                    let k = (0, base_1.IJ2K)(ball_i, j, true);
                    base_1.pos_data[k] = x;
                    base_1.pos_data[k + 1] = y;
                    base_1.vel_data[k] = 0;
                    base_1.vel_data[k + 1] = 0;
                }
            }
        }
        else {
            for (let j = 0; j < base_1.CONFIG.N_WORLDS; j++) {
                let k = (0, base_1.IJ2K)(ball_i, j, true);
                let k_won = base_1.pos_data[k] = x;
                base_1.pos_data[k + 1] = y;
                base_1.vel_data[k] = 0;
                base_1.vel_data[k + 1] = 0;
                base_1.won_data[(0, base_1.IJ2K)(ball_i, j, false)] = 0;
            }
        }
        if (ball_i === 0)
            addChaos();
    }
    exports.collapseBallAt = collapseBallAt;
    function collapseIndividualMean(ball_i) {
        let mean_px = 0;
        let mean_py = 0;
        let mean_vx = 0;
        let mean_vy = 0;
        let n_won = 0;
        let n_lost = 0;
        // let example_won = null;
        for (let j = 0; j < base_1.CONFIG.N_WORLDS; j++) {
            if (base_1.won_data[(0, base_1.IJ2K)(ball_i, j, false)] === 0) {
                let k = (0, base_1.IJ2K)(ball_i, j, true);
                mean_px += base_1.pos_data[k];
                mean_py += base_1.pos_data[k + 1];
                mean_vx += base_1.vel_data[k];
                mean_vy += base_1.vel_data[k + 1];
                n_lost += 1;
            }
            else {
                /*if (!example_won) {
                  let k = IJ2K(ball_i, j, true)
                  example_won = [pos_data[k], pos_data[k + 1]]
                }*/
                n_won += 1;
            }
        }
        mean_px /= n_lost;
        mean_py /= n_lost;
        mean_vx /= n_lost;
        mean_vy /= n_lost;
        if (base_1.CONFIG.PERMANENT_HOLES) {
            for (let j = 0; j < base_1.CONFIG.N_WORLDS; j++) {
                if (base_1.won_data[(0, base_1.IJ2K)(ball_i, j, false)] === 0) {
                    let k = (0, base_1.IJ2K)(ball_i, j, true);
                    base_1.pos_data[k] = mean_px;
                    base_1.pos_data[k + 1] = mean_py;
                    base_1.vel_data[k] = mean_vx;
                    base_1.vel_data[k + 1] = mean_vy;
                }
            }
        }
        else {
            throw new Error("unimplemented!");
            /*if (n_lost > n_won) {
              let cur_ball_pos = balls_pos[n_b]
              let cur_ball_vel = balls_vel[n_b]
              for (let k = 0; k < N_WORLDS * 2; k += 2) {
                cur_ball_pos[k] = mean_px
                cur_ball_pos[k + 1] = mean_py
                cur_ball_vel[k] = mean_vx
                cur_ball_vel[k + 1] = mean_vy
                balls_won[n_b][k / 2] = 0
              }
            } else {
              let cur_ball_pos = balls_pos[n_b]
              let cur_ball_vel = balls_vel[n_b]
              for (let k = 0; k < N_WORLDS * 2; k += 2) {
                cur_ball_pos[k] = example_won![0]
                cur_ball_pos[k + 1] = example_won![1]
                cur_ball_vel[k] = 0
                cur_ball_vel[k + 1] = 0
                balls_won[n_b][k / 2] = 1
              }
            }*/
        }
    }
    function drawSelected() {
        if (base_1.selected.ball === null || base_1.selected.world === null)
            return;
        base_1.pintar._renderer.setShader(graphics_1.outline_ball_shader);
        if (base_1.CONFIG.COLLAPSE_EXTENT === "world") {
            if (base_1.CONFIG.USE_BRANCHES) {
                let canonTree = base_1.tree_data[base_1.selected.world];
                for (let j = 0; j < base_1.CONFIG.N_WORLDS; j++) {
                    if (!(0, physics_1.areTreesEqual)(canonTree, base_1.tree_data[j]))
                        continue;
                    for (let i = 0; i < base_1.CONFIG.N_BALLS; i++) {
                        let k = (0, base_1.IJ2K)(i, j, true);
                        (0, graphics_1.drawBallOutlineAt)(base_1.pos_data[k], base_1.pos_data[k + 1], base_1.ball_colors[i]);
                    }
                }
            }
            else {
                for (let i = 0; i < base_1.CONFIG.N_BALLS; i++) {
                    let k = (0, base_1.IJ2K)(i, base_1.selected.world, true);
                    (0, graphics_1.drawBallOutlineAt)(base_1.pos_data[k], base_1.pos_data[k + 1], base_1.ball_colors[i]);
                }
            }
        }
        else {
            if (base_1.CONFIG.USE_BRANCHES) {
                let canonCollisions = base_1.ball_collisions_data[base_1.selected.world][base_1.selected.ball];
                for (let j = 0; j < base_1.CONFIG.N_WORLDS; j++) {
                    if ((0, physics_1.areTreesEqual)(canonCollisions, base_1.ball_collisions_data[j][base_1.selected.ball])) {
                        let k = (0, base_1.IJ2K)(base_1.selected.ball, j, true);
                        (0, graphics_1.drawBallOutlineAt)(base_1.pos_data[k], base_1.pos_data[k + 1], base_1.ball_colors[base_1.selected.ball]);
                    }
                }
            }
            else {
                let k = (0, base_1.IJ2K)(base_1.selected.ball, base_1.selected.world, true);
                (0, graphics_1.drawBallOutlineAt)(base_1.pos_data[k], base_1.pos_data[k + 1], base_1.ball_colors[base_1.selected.ball]);
            }
        }
    }
    exports.drawSelected = drawSelected;
    function addChaos() {
        for (let j = 0; j < base_1.CONFIG.N_WORLDS; j++) {
            if (base_1.won_data[(0, base_1.IJ2K)(0, j, false)] === 0) {
                let k = (0, base_1.IJ2K)(0, j, true);
                base_1.pos_data[k] += Math.cos(Math.PI * 2 * j / base_1.CONFIG.N_WORLDS) * base_1.CONFIG.CHAOS_AMOUNT;
                base_1.pos_data[k + 1] += Math.sin(Math.PI * 2 * j / base_1.CONFIG.N_WORLDS) * base_1.CONFIG.CHAOS_AMOUNT;
            }
        }
    }
    exports.addChaos = addChaos;
    function mod(n, m) {
        return ((n % m) + m) % m;
    }
    function indexOfSmallest(a) {
        var lowest = -1;
        for (var i = 1; i < a.length; i++) {
            if (a[i] < a[lowest])
                lowest = i;
        }
        return lowest;
    }
});
