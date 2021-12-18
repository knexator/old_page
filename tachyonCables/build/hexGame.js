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
    exports.updateToPrev = exports.updateToNext = exports.board = exports.layout = exports.Tile = exports.Cable = void 0;
    const hexLib_1 = require("hexLib");
    const index_1 = require("./index");
    class Cable {
        constructor(tile, origin, target, type, state) {
            this.tile = tile;
            this.origin = origin;
            this.target = target;
            this.type = type;
            this.state = state;
            this.inputReqs = new Map();
            this.nextState = false;
        }
        cycleInput(time) {
            if (this.inputReqs.has(time)) {
                let val = this.inputReqs.get(time);
                if (val) {
                    this.inputReqs.set(time, false);
                }
                else {
                    this.inputReqs.delete(time);
                }
            }
            else {
                this.inputReqs.set(time, true);
            }
            applyInput(time);
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
        }
        deleteCable(dir) {
            if (this.cables[dir] !== null) {
                let toDelete = this.cables[dir];
                this.cables[toDelete.origin] = null;
                this.cables[toDelete.target] = null;
            }
        }
        swapCables(swapper, moving_dir) {
            let uniqueCables = new Set(this.cables.filter(x => x !== null));
            uniqueCables.delete(swapper);
            if (uniqueCables.size !== 2)
                return;
            let [cableA, cableB] = uniqueCables;
            let temp = cableA.target;
            cableA.target = cableB.target;
            cableB.target = temp;
            this.cables[cableA.target] = cableA;
            this.cables[cableB.target] = cableB;
            if (moving_dir === "backward") {
                let temp2 = cableA.state;
                cableA.state = cableB.state;
                cableB.state = temp2;
            }
        }
    }
    exports.Tile = Tile;
    exports.layout = new hexLib_1.Layout(hexLib_1.Layout.flat, 70, new hexLib_1.Point(0, 0));
    exports.board = new Map();
    function applyInput(time) {
        exports.board.forEach(tile => {
            tile.cables.forEach(cable => {
                if (cable !== null && cable.inputReqs.has(time)) {
                    cable.state = cable.inputReqs.get(time);
                }
            });
        });
    }
    function getStateFromPrev(cur_cable, ball_type) {
        let cur_tile = cur_cable.tile;
        let prev_tile = exports.board.get(cur_tile.coords.neighbor(cur_cable.origin).freeze());
        if (prev_tile !== undefined) {
            let prev_cable_target = (0, index_1.mod)(cur_cable.origin + 3, 6);
            let prev_cable = prev_tile.cables[prev_cable_target];
            if (prev_cable !== null && prev_cable.target === prev_cable_target) {
                if (ball_type === "forward") {
                    return prev_cable.state && (prev_cable.type === "standard" || prev_cable.type === "bridgeForward" || prev_cable.type === "swapper");
                }
                else if (ball_type === "backward") {
                    return prev_cable.state && (prev_cable.type === "tachyon" || prev_cable.type === "bridgeBackward");
                }
            }
        }
        // no valid previous cable
        return false;
    }
    function getStateFromNext(cur_cable, ball_type) {
        let cur_tile = cur_cable.tile;
        let next_tile = exports.board.get(cur_tile.coords.neighbor(cur_cable.target).freeze());
        if (next_tile !== undefined) {
            let next_cable_origin = (0, index_1.mod)(cur_cable.target + 3, 6);
            let next_cable = next_tile.cables[next_cable_origin];
            if (next_cable !== null && next_cable.origin === next_cable_origin) {
                if (ball_type === "forward") {
                    return next_cable.state && (next_cable.type === "standard" || next_cable.type === "bridgeBackward" || next_cable.type === "swapper");
                }
                else if (ball_type === "backward") {
                    return next_cable.state && (next_cable.type === "tachyon" || next_cable.type === "bridgeForward");
                }
            }
        }
        // no valid following cable
        return false;
    }
    function updateToNext(time) {
        //applyInput(time);
        exports.board.forEach(cur_tile => {
            for (let k = 0; k < 6; k++) {
                let cur_cable = cur_tile.cables[k];
                if (cur_cable !== null && cur_cable.origin === k) {
                    if (cur_cable.type === "standard" || cur_cable.type === "swapper") {
                        cur_cable.nextState = getStateFromPrev(cur_cable, "forward");
                    }
                    else if (cur_cable.type === "tachyon") {
                        cur_cable.nextState = getStateFromNext(cur_cable, "backward");
                    }
                    else if (cur_cable.type === "bridgeForward") {
                        cur_cable.nextState = false;
                    }
                    else if (cur_cable.type === "bridgeBackward") {
                        cur_cable.nextState = getStateFromNext(cur_cable, "backward") || getStateFromPrev(cur_cable, "forward");
                    }
                }
            }
        });
        exports.board.forEach(cur_tile => {
            for (let k = 0; k < 6; k++) {
                let cur_cable = cur_tile.cables[k];
                if (cur_cable !== null && cur_cable.origin === k) {
                    if (cur_cable.type === "swapper" && cur_cable.state !== cur_cable.nextState) {
                        cur_tile.swapCables(cur_cable, "forward");
                    }
                    cur_cable.state = cur_cable.nextState;
                }
            }
        });
        applyInput(time + 1);
    }
    exports.updateToNext = updateToNext;
    function updateToPrev(time) {
        //applyInput(time);
        exports.board.forEach(cur_tile => {
            for (let k = 0; k < 6; k++) {
                let cur_cable = cur_tile.cables[k];
                if (cur_cable !== null && cur_cable.target === k) {
                    if (cur_cable.type === "standard" || cur_cable.type === "swapper") {
                        cur_cable.nextState = getStateFromNext(cur_cable, "forward");
                    }
                    else if (cur_cable.type === "tachyon") {
                        cur_cable.nextState = getStateFromPrev(cur_cable, "backward");
                    }
                    else if (cur_cable.type === "bridgeBackward") {
                        cur_cable.nextState = false;
                    }
                    else if (cur_cable.type === "bridgeForward") {
                        cur_cable.nextState = getStateFromNext(cur_cable, "forward") || getStateFromPrev(cur_cable, "backward");
                    }
                }
            }
        });
        exports.board.forEach(cur_tile => {
            for (let k = 0; k < 6; k++) {
                let cur_cable = cur_tile.cables[k];
                if (cur_cable !== null && cur_cable.origin === k) {
                    if (cur_cable.type === "swapper" && cur_cable.state !== cur_cable.nextState) {
                        cur_tile.swapCables(cur_cable, "backward");
                    }
                    cur_cable.state = cur_cable.nextState;
                }
            }
        });
        applyInput(time - 1);
    }
    exports.updateToPrev = updateToPrev;
});
