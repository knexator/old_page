(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "hexLib", "./index", "./level_data"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ValidAfter = exports.ValidBefore = exports.BlockedAt = exports.board2str = exports.magicAdjacentCable = exports.control_tracks = exports.contradictions = exports.swappers = exports.board = exports.layout = exports.Tile = exports.Cable = exports.MAX_T = void 0;
    const hexLib_1 = require("hexLib");
    const index_1 = require("./index");
    const level_data_1 = require("./level_data");
    exports.MAX_T = 50;
    class Cable {
        constructor(tile, origin, target, direction, swapper) {
            this.tile = tile;
            this.origin = origin;
            this.target = target;
            this.direction = direction;
            this.swapper = swapper;
            /*if (swapper) {
              this.inputReqs = Array(MAX_T).fill(false);
            } else {
              this.inputReqs = Array(MAX_T).fill(null);
            }*/
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
            else {
                this.inputReqs[time] = null;
            }
            /*if (this.swapper) {
              this.inputReqs[time] = !this.inputReqs[time];
            } else {
              if (this.inputReqs[time] === null) {
                this.inputReqs[time] = true;
              } else if (this.inputReqs[time]) {
                this.inputReqs[time] = false;
              } else {
                this.inputReqs[time] = null;
              }
            }*/
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
            return BlockedAt(Math.floor(time), this.direction === "backward");
            // return this.inputReqs[Math.floor(time)] === true;
        }
    }
    exports.Cable = Cable;
    class Tile {
        constructor(coords) {
            this.coords = coords;
            this.cables = [null, null, null, null, null, null];
            this.masterSwapper = null;
            this.swapCable1 = null;
            this.swapCable2 = null;
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
    exports.layout = new hexLib_1.Layout(hexLib_1.Layout.flat, 85, new hexLib_1.Point(-20, 100));
    // export const board = new Map<FrozenHex, Tile>();
    // export const board = str2board(localStorage.getItem("cool") || "[]");
    exports.board = str2board(level_data_1.level_cool_raw);
    exports.swappers = [];
    exports.contradictions = [];
    exports.control_tracks = [];
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
                            cur_tile.masterSwapper = cur_swapper;
                            cur_tile.swapCable1 = cur_cable;
                            cur_tile.swapCable2 = otherCable;
                            used = true;
                        }
                    }
                }
            }
            if (used) {
                exports.swappers.push(cur_swapper);
                // control_tracks.push(nextCable(cur_swapper!.tile!.swapCable1!, 0)!);
                // control_tracks.push(nextCable(cur_swapper!.tile!.swapCable2!, 0)!);
                // control_tracks.push(cur_swapper!.tile!.swapCable1!);
                // control_tracks.push(cur_swapper!.tile!.swapCable2!);
            }
        });
        exports.control_tracks = [
            exports.board.get(new hexLib_1.Hex(7, 0, -7).freeze()).getCable(2, 0),
            exports.board.get(new hexLib_1.Hex(5, 0, -5).freeze()).getCable(5, 0),
            exports.board.get(new hexLib_1.Hex(7, -2, -5).freeze()).getCable(5, 0),
            exports.board.get(new hexLib_1.Hex(5, 2, -7).freeze()).getCable(2, 0),
        ];
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
                            propagate(cur_cable, t, "forward", true, cur_cable, t);
                            propagate(cur_cable, t, "backward", true, cur_cable, t);
                        }
                    }
                }
            }
        });
    }
    function isValidBridge(original_cable, original_t, direction) {
        let col = exports.control_tracks.indexOf(original_cable);
        if (col == -1) {
            throw new Error("idk");
        }
        col = 3 - col;
        if (direction === "forward") {
            return ValidAfter(col, original_t);
        }
        else {
            return ValidBefore(col, original_t);
        }
    }
    function propagate(source_cable, source_t, direction, exception, original_cable, original_t) {
        if (source_t < 0 || source_t >= exports.MAX_T)
            return;
        // contradiction!
        if (source_cable.inputReqs[source_t] === false) {
            exports.contradictions.push({ time: source_t, cable: source_cable, source_cable: original_cable, source_t: original_t, direction: direction });
            return;
        }
        // don't propagate if it has already been propagated
        if (!exception && source_cable.globalState[source_t])
            return;
        // control cables require explicit input
        // if (contains(control_tracks, source_cable) && source_cable.inputReqs[source_t] !== true) {
        if ((source_cable.masterSwapper) && !isValidBridge(original_cable, original_t, direction)) {
            exports.contradictions.push({ time: source_t, cable: source_cable, source_cable: original_cable, source_t: original_t, direction: direction });
            return;
        }
        source_cable.globalState[source_t] = true;
        let next_cable = magicAdjacentCable(source_cable, source_t, direction);
        if (!next_cable)
            return;
        let dt = source_cable.direction === direction ? 1 : -1;
        if (source_cable.direction !== next_cable.direction)
            dt = 0;
        propagate(next_cable, source_t + dt, direction, false, original_cable, original_t);
    }
    function magicAdjacentCable(source_cable, source_t, direction) {
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
        return adjacentCable(source_cable, source_t + next_cable_dt, direction);
    }
    exports.magicAdjacentCable = magicAdjacentCable;
    function adjacentCable(cur_cable, cur_time, direction) {
        return direction === "forward" ? nextCable(cur_cable, cur_time) : prevCable(cur_cable, cur_time);
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
            if (tile.cables.some(x => x)) {
                tiles.push(tile.toSimpleObject());
            }
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
    function BlockedAt(time, which) {
        if (which) {
            return getPost(3, time + 2);
        }
        else {
            return getPost(2, time - 4);
        }
    }
    exports.BlockedAt = BlockedAt;
    function BlockedBefore(post, postTime) {
        switch (post) {
            case 0:
            case 2:
                return BlockedAt(postTime - 1, true);
            case 1:
            case 3:
                return BlockedAt(postTime + 1, false);
        }
        ;
        throw new Error("EXTREME ERROR");
    }
    function BlockedAfter(post, postTime) {
        switch (post) {
            case 0:
                return BlockedAt(postTime - 9, true); // getPost(3, postTime - 6);
            case 1:
                return BlockedAt(postTime + 8, false); // getPost(2, postTime + 3);
            case 2:
                return BlockedAt(postTime + 8, true); // getPost(3, postTime + 11);
            case 3:
                return BlockedAt(postTime - 4, false); // getPost(2, postTime - 9);
        }
        throw new Error("EXTREME ERROR");
    }
    function ValidBefore(post, postTime) {
        switch (post) {
            case 0:
                return BlockedBefore(post, postTime) ? getPost(0, postTime + 8) : getPost(2, postTime - 9);
            case 1:
                return BlockedBefore(post, postTime) ? getPost(3, postTime + 5) : getPost(1, postTime - 7);
            case 2:
                return BlockedBefore(post, postTime) ? getPost(2, postTime - 9) : getPost(0, postTime + 8);
            case 3:
                return BlockedBefore(post, postTime) ? getPost(1, postTime - 7) : getPost(3, postTime + 5);
        }
        throw new Error("EXTREME ERROR");
    }
    exports.ValidBefore = ValidBefore;
    function ValidAfter(post, postTime) {
        let offsets = [-8, 7, 9, -5];
        let posts = [[2, 0], [1, 3], [0, 2], [3, 1]];
        return BlockedAfter(post, postTime) ? getPost(posts[post][1], postTime + offsets[post]) : getPost(posts[post][0], postTime + offsets[post]);
    }
    exports.ValidAfter = ValidAfter;
    function getPost(post, postTime) {
        /*if (post % 2 == 0) {
            postTime -= 1; // TODO: extreme bug, lol
        }*/
        if (postTime <= 0 || postTime >= exports.MAX_T)
            return false;
        return exports.control_tracks[3 - post].inputReqs[postTime] === true;
    }
});
