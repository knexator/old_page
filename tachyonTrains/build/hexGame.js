(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "hexLib", "./index"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.board2str = exports.contradictions = exports.swappers = exports.board = exports.layout = exports.Tile = exports.Cable = exports.MAX_T = void 0;
    const hexLib_1 = require("hexLib");
    const index_1 = require("./index");
    exports.MAX_T = 18;
    class Cable {
        constructor(tile, origin, target, direction, swapper) {
            this.tile = tile;
            this.origin = origin;
            this.target = target;
            this.direction = direction;
            this.swapper = swapper;
            this.inputReqs = Array(exports.MAX_T).fill(null);
            this.globalState = Array(exports.MAX_T).fill(false);
            this.otherCable = null;
            this.masterSwapper = null;
            this.inputReqs[0] = false;
            this.inputReqs[exports.MAX_T - 1] = false;
        }
        cycleInput(time) {
            if (time <= 0 || time + 1 >= exports.MAX_T)
                return;
            if (this.inputReqs[time] === null) {
                this.inputReqs[time] = true;
            }
            else if (this.inputReqs[time]) {
                this.inputReqs[time] = false;
            }
            else {
                this.inputReqs[time] = null;
            }
            updateGlobalState();
            /*  let val = this.inputReqs.get(time);
              if (val) {
                this.inputReqs.set(time, false);
              } else {
                this.inputReqs.delete(time);
              }
            } else {
              this.inputReqs.set(time, true);
            }
            applyInput(time);*/
        }
        getOrigin(time) {
            if (!this.masterSwapper || this.direction === "forward")
                return this.origin;
            if (this.otherCable === null) {
                throw new Error("otherCable is null but masterSwapper isn't!!");
            }
            return this.masterSwapper.currentlySwapped(time) ? this.otherCable.origin : this.origin;
        }
        getTarget(time) {
            if (!this.masterSwapper || this.direction === "backward")
                return this.target;
            if (this.otherCable === null) {
                throw new Error("otherCable is null but masterSwapper isn't!!");
            }
            return this.masterSwapper.currentlySwapped(time) ? this.otherCable.target : this.target;
        }
        currentlySwapped(time) {
            if (!this.swapper) {
                throw new Error("calling currentlySwapped on something that isn't a swapper!!");
            }
            return this.inputReqs[Math.floor(time)] === true;
        }
    }
    exports.Cable = Cable;
    class Tile {
        constructor(coords) {
            this.coords = coords;
            this.cables = [null, null, null, null, null, null];
        }
        addCable(cable) {
            this.deleteCable(cable.origin);
            this.deleteCable(cable.target);
            this.cables[cable.origin] = cable;
            this.cables[cable.target] = cable;
            updateGlobalState();
        }
        deleteCable(dir) {
            if (this.cables[dir] !== null) {
                let toDelete = this.cables[dir];
                this.cables[toDelete.origin] = null;
                this.cables[toDelete.target] = null;
                updateGlobalState();
            }
        }
        getCable(dir, time) {
            let cable = this.cables[dir];
            if (!cable)
                return null;
            if (!cable.masterSwapper)
                return cable;
            if (cable.getOrigin(time) === dir || cable.getTarget(time) === dir)
                return cable;
            return cable.otherCable;
        }
        toSimpleObject() {
            let uniqueCables = new Set(this.cables.filter(x => x !== null));
            let simpleCables = [];
            uniqueCables.forEach(x => {
                simpleCables.push({
                    origin: x.origin,
                    target: x.target,
                    direction: x.direction,
                    swapper: x.swapper
                });
            });
            return {
                q: this.coords.q,
                r: this.coords.r,
                cables: simpleCables
            };
        }
    }
    exports.Tile = Tile;
    exports.layout = new hexLib_1.Layout(hexLib_1.Layout.flat, 70, new hexLib_1.Point(0, 0));
    // export const board = new Map<FrozenHex, Tile>();
    exports.board = str2board(localStorage.getItem("level") || "[]");
    exports.swappers = [];
    exports.contradictions = [];
    fixBoard();
    function fixBoard() {
        exports.swappers = [];
        exports.board.forEach(cur_tile => {
            let cur_swapper = cur_tile.cables.find(x => x === null || x === void 0 ? void 0 : x.swapper);
            let used = false;
            for (let k = 0; k < 6; k++) {
                let cur_cable = cur_tile.cables[k];
                if (cur_cable && cur_cable.origin === k) {
                    let swappable = !cur_cable.swapper && cur_swapper;
                    if (!swappable) {
                        cur_cable.masterSwapper = null;
                        cur_cable.otherCable = null;
                    }
                    else {
                        let swapCables = new Set(cur_tile.cables.filter(x => {
                            return x !== null && !x.swapper;
                        }));
                        if (swapCables.size !== 2) {
                            // not actually swappable
                            cur_cable.masterSwapper = null;
                            cur_cable.otherCable = null;
                        }
                        else {
                            swapCables.delete(cur_cable);
                            let [otherCable] = swapCables;
                            cur_cable.masterSwapper = cur_swapper;
                            cur_cable.otherCable = otherCable;
                            used = true;
                        }
                    }
                }
            }
            if (used)
                exports.swappers.push(cur_swapper);
        });
    }
    function updateGlobalState() {
        // reset everything
        fixBoard();
        exports.contradictions = [];
        exports.board.forEach(cur_tile => {
            for (let k = 0; k < 6; k++) {
                let cur_cable = cur_tile.cables[k];
                if (cur_cable && cur_cable.origin === k) {
                    for (let t = 0; t < exports.MAX_T; t++) {
                        cur_cable.globalState[t] = false;
                    }
                }
            }
        });
        // follow inputs!
        exports.board.forEach(cur_tile => {
            for (let k = 0; k < 6; k++) {
                let cur_cable = cur_tile.cables[k];
                if (cur_cable && cur_cable.origin === k) {
                    for (let t = 0; t < exports.MAX_T; t++) {
                        if (cur_cable.inputReqs[t] && !cur_cable.globalState[t]) {
                            cur_cable.globalState[t] = true;
                            propagate(cur_cable, t, "forward", true);
                            propagate(cur_cable, t, "backward", true);
                        }
                    }
                }
            }
        });
    }
    function propagate(source_cable, source_t, direction, exception) {
        if (source_t < 0 || source_t >= exports.MAX_T)
            return;
        // contradiction!
        if (source_cable.inputReqs[source_t] === false) {
            exports.contradictions.push({ time: source_t, cable: source_cable });
            return;
        }
        // don't propagate if it has already been propagated
        if (!exception && source_cable.globalState[source_t])
            return;
        // swapper cables require explicit input
        if (source_cable.swapper && source_cable.inputReqs[source_t] !== true) {
            exports.contradictions.push({ time: source_t, cable: source_cable });
            return;
        }
        source_cable.globalState[source_t] = true;
        // ASSUME that both swapped cables will have the same direction
        let next_cable_temp = direction === "forward" ? nextCable(source_cable, source_t) : prevCable(source_cable, source_t);
        let next_cable_dt = 0;
        if (next_cable_temp) {
            if (direction === "forward") {
                if (source_cable.direction === "forward") {
                    if (next_cable_temp.direction === "forward") {
                        //next_cable_dt = 1
                    }
                    else {
                        next_cable_dt = 0;
                    }
                }
                else {
                    if (next_cable_temp.direction === "forward") {
                        //next_cable_dt = 1
                    }
                    else {
                        next_cable_dt = -1;
                    }
                }
            }
            else {
                if (source_cable.direction === "forward") {
                    if (next_cable_temp.direction === "forward") {
                        next_cable_dt = -1;
                    }
                    else {
                        //next_cable_dt = 0
                    }
                }
                else {
                    next_cable_dt = 0;
                }
            }
        }
        let next_cable = direction === "forward" ? nextCable(source_cable, source_t + next_cable_dt) : prevCable(source_cable, source_t + next_cable_dt);
        if (!next_cable)
            return;
        let dt = source_cable.direction === direction ? 1 : -1;
        if (source_cable.direction !== next_cable.direction)
            dt = 0;
        propagate(next_cable, source_t + dt, direction, false);
    }
    function nextCable(cur_cable, cur_time) {
        let cur_tile = cur_cable.tile;
        let cur_target = cur_cable.getTarget(cur_time);
        let next_tile = exports.board.get(cur_tile.coords.neighbor(cur_target).freeze());
        if (next_tile !== undefined) {
            let next_cable_origin = (0, index_1.mod)(cur_target + 3, 6);
            let next_cable = next_tile.getCable(next_cable_origin, cur_time);
            if (next_cable !== null && next_cable.getOrigin(cur_time) === next_cable_origin) {
                return next_cable;
            }
        }
        return null;
    }
    function prevCable(cur_cable, cur_time) {
        let cur_tile = cur_cable.tile;
        let cur_origin = cur_cable.getOrigin(cur_time);
        let prev_tile = exports.board.get(cur_tile.coords.neighbor(cur_origin).freeze());
        if (prev_tile !== undefined) {
            let prev_cable_target = (0, index_1.mod)(cur_origin + 3, 6);
            let prev_cable = prev_tile.getCable(prev_cable_target, cur_time);
            if (prev_cable !== null && prev_cable.getTarget(cur_time) === prev_cable_target) {
                return prev_cable;
            }
        }
        return null;
    }
    function board2str() {
        let tiles = [];
        exports.board.forEach(tile => {
            tiles.push(tile.toSimpleObject());
        });
        return JSON.stringify(tiles);
    }
    exports.board2str = board2str;
    function str2board(str) {
        let board_res = new Map();
        let simpleObject = JSON.parse(str);
        simpleObject.forEach(simpleTile => {
            let cur_hex = new hexLib_1.Hex(simpleTile.q, simpleTile.r, -simpleTile.r - simpleTile.q);
            let cur_tile = new Tile(cur_hex);
            simpleTile.cables.forEach(x => {
                let cur_cable = new Cable(cur_tile, x.origin, x.target, x.direction, x.swapper);
                cur_tile.cables[x.origin] = cur_cable;
                cur_tile.cables[x.target] = cur_cable;
            });
            board_res.set(cur_hex.freeze(), cur_tile);
        });
        return board_res;
    }
});
