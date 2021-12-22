(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "hexLib", "./graphics", "./index"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.hacky_printAllLoops = exports.getAllLoopsFrom = exports.hacky_printAllPaths = exports.board2str_onlyVisible = exports.board2str = exports.updateToPrev = exports.updateToNext = exports.board = exports.layout = exports.Tile = exports.Cable = void 0;
    const hexLib_1 = require("hexLib");
    const graphics_1 = require("./graphics");
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
                temp2 = cableA.nextState;
                cableA.nextState = cableB.nextState;
                cableB.nextState = temp2;
            }
        }
        toSimpleObject() {
            let uniqueCables = new Set(this.cables.filter(x => x !== null));
            let simpleCables = [];
            uniqueCables.forEach(x => {
                simpleCables.push({
                    origin: x.origin,
                    target: x.target,
                    type: x.type
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
    // export let board = new Map<FrozenHex, Tile>();
    // export const board = str2board(localStorage.getItem("level") || "[]");
    exports.board = str2board(localStorage.getItem("level_small") || "[]");
    function applyInput(time) {
        exports.board.forEach(tile => {
            tile.cables.forEach(cable => {
                if (cable !== null && cable.inputReqs.has(time)) {
                    let new_state = cable.inputReqs.get(time);
                    if (cable.type === "swapper" && cable.state !== new_state) {
                        tile.swapCables(cable, "forward");
                    }
                    cable.state = new_state;
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
                let cur_cable = new Cable(cur_tile, x.origin, x.target, x.type, false);
                cur_tile.cables[x.origin] = cur_cable;
                cur_tile.cables[x.target] = cur_cable;
            });
            board_res.set(cur_hex.freeze(), cur_tile);
        });
        return board_res;
    }
    function board2str_onlyVisible() {
        let tiles = [];
        let offset = exports.layout.pixelToHex({ x: 0, y: 0 }).round();
        exports.board.forEach(tile => {
            let tile_hex = tile.coords;
            let center = exports.layout.hexToPixel(tile_hex);
            if (center.x < 0 || center.x >= graphics_1.canvas.width || center.y < 0 || center.y >= graphics_1.canvas.height) {
                return;
            }
            let simpleTile = tile.toSimpleObject();
            if (simpleTile.cables.length === 0) {
                return;
            }
            simpleTile.q -= offset.q;
            simpleTile.r -= offset.r;
            tiles.push(simpleTile);
        });
        return JSON.stringify(tiles);
    }
    exports.board2str_onlyVisible = board2str_onlyVisible;
    function copyPath(path) {
        let res = {
            start: path.start,
            finish: path.finish,
            time: path.time,
            effects: [],
            requires: []
        };
        path.effects.forEach(x => {
            res.effects.push({ cable: x.cable, time: x.time });
        });
        path.requires.forEach(x => {
            res.requires.push({ cable: x.cable, time: x.time, swapped: x.swapped });
        });
        return res;
    }
    function getAllPathsFrom(starting_cable, stopping_cables) {
        const deltas = {
            "standard": 1,
            "swapper": 1,
            "tachyon": -1,
            "bridgeForward": 0,
            "bridgeBackward": 0,
        };
        let finished_paths = [];
        let pending_paths = [
            { start: starting_cable, finish: starting_cable, time: 0, effects: [], requires: [] }
        ];
        while (pending_paths.length > 0 && finished_paths.length < 5) {
            let cur_path = pending_paths.shift();
            let cur_cable = cur_path.finish;
            let direct_next = nextCable(cur_cable);
            let other_next = otherNextCable(cur_cable);
            if (!direct_next)
                continue; // path ends abruptly
            if (!other_next) {
                // only one path forward
                cur_path.finish = direct_next;
                if (cur_cable.type === "swapper") {
                    cur_path.effects.push({ cable: cur_cable, time: cur_path.time });
                }
                cur_path.time += deltas[cur_cable.type];
                if (stopping_cables.indexOf(direct_next) !== -1) {
                    finished_paths.push(cur_path);
                }
                else {
                    pending_paths.push(cur_path);
                }
            }
            else {
                // two possible paths forward
                let cur_path_other = copyPath(cur_path);
                let cur_swapper = cur_cable.tile.cables.find(x => x.type === "swapper");
                // path 1
                cur_path.finish = direct_next;
                cur_path.requires.push({ cable: cur_swapper, time: cur_path.time, swapped: false });
                cur_path.time += deltas[cur_cable.type];
                if (stopping_cables.indexOf(direct_next) !== -1) {
                    finished_paths.push(cur_path);
                }
                else {
                    pending_paths.push(cur_path);
                }
                // path 2
                cur_path_other.finish = other_next;
                cur_path_other.requires.push({ cable: cur_swapper, time: cur_path_other.time, swapped: true });
                cur_path_other.time += deltas[cur_cable.type];
                if (stopping_cables.indexOf(other_next) !== -1) {
                    finished_paths.push(cur_path_other);
                }
                else {
                    pending_paths.push(cur_path_other);
                }
            }
        }
        return finished_paths;
    }
    function hacky_printAllPaths(time) {
        let interesting_cables = [];
        exports.board.forEach(cur_tile => {
            for (let k = 0; k < 6; k++) {
                let cur_cable = cur_tile.cables[k];
                if (cur_cable !== null && cur_cable.target === k && cur_cable.inputReqs.get(time)) {
                    interesting_cables.push(cur_cable);
                }
            }
        });
        interesting_cables.forEach(cur_cable => {
            let cur_paths = getAllPathsFrom(cur_cable, interesting_cables);
            cur_paths.forEach(cur_path => {
                let effects = cur_path.effects.map(x => `${hacky_cableName(x.cable)} ON at ${x.time}`);
                let requires = cur_path.requires.map(x => `${hacky_cableName(x.cable)} ${x.swapped ? 'ON' : 'OFF'} at ${x.time}`);
                console.log(`\
${hacky_cableName(cur_path.start)}-${hacky_cableName(cur_path.finish)}: ${cur_path.time}.
  Effects:\n\t${effects.join(';\n\t')}
  Requires:\n\t${requires.join(';\n\t')}`);
            });
        });
    }
    exports.hacky_printAllPaths = hacky_printAllPaths;
    function hacky_cableName(cable) {
        let hex = cable.tile.coords;
        if (cable.type === "swapper") {
            if (hex.q === 3 && hex.r === 1) {
                return 'X';
            }
            if (hex.q === 4 && hex.r === 2) {
                return 'Y';
            }
            if (hex.q === 2 && hex.r === 3) {
                return 'Z';
            }
        }
        else if (hex.q === 3 && hex.r === 2) {
            if (cable.target === 2) {
                return 'A';
            }
            if (cable.target === 0) {
                return 'B';
            }
            if (cable.target === 4) {
                return 'C';
            }
        }
        return cable.tile.coords.q.toString() + ',' + cable.tile.coords.r.toString();
    }
    function nextCable(cur_cable) {
        let cur_tile = cur_cable.tile;
        let next_tile = exports.board.get(cur_tile.coords.neighbor(cur_cable.target).freeze());
        if (next_tile !== undefined) {
            let next_cable_origin = (0, index_1.mod)(cur_cable.target + 3, 6);
            let next_cable = next_tile.cables[next_cable_origin];
            if (next_cable !== null && next_cable.origin === next_cable_origin) {
                return next_cable;
            }
        }
        return null;
    }
    function otherNextCable(cur_cable) {
        if (cur_cable.type === "swapper")
            return null;
        let swapper_on_tile = cur_cable.tile.cables.some(x => (x === null || x === void 0 ? void 0 : x.type) === "swapper");
        if (!swapper_on_tile)
            return null;
        let swapCables = new Set(cur_cable.tile.cables.filter(x => {
            return x !== null && x.type !== "swapper";
        }));
        if (swapCables.size !== 2)
            return null;
        swapCables.delete(cur_cable);
        let [otherCable] = swapCables;
        return nextCable(otherCable);
    }
    function getAllLoopsFrom(starting_cable) {
        const deltas = {
            "standard": 1,
            "swapper": 1,
            "tachyon": -1,
            "bridgeForward": 0,
            "bridgeBackward": 0,
        };
        let finished_paths = [];
        let pending_paths = [
            { start: starting_cable, finish: starting_cable, time: 0, effects: [], requires: [] }
        ];
        while (pending_paths.length > 0 && finished_paths.length < 10) {
            let cur_path = pending_paths.shift();
            let cur_cable = cur_path.finish;
            let direct_next = nextCable(cur_cable);
            let other_next = otherNextCable(cur_cable);
            if (!direct_next)
                continue; // path ends abruptly
            if (!other_next) {
                // only one path forward
                cur_path.finish = direct_next;
                if (cur_cable.type === "swapper") {
                    cur_path.effects.push({ cable: cur_cable, time: cur_path.time });
                }
                cur_path.time += deltas[cur_cable.type];
                if (cur_path.time === 0 && direct_next === starting_cable) {
                    finished_paths.push(cur_path);
                }
                else {
                    pending_paths.push(cur_path);
                }
            }
            else {
                // two possible paths forward
                let cur_path_other = copyPath(cur_path);
                let cur_swapper = cur_cable.tile.cables.find(x => x.type === "swapper");
                // path 1
                cur_path.finish = direct_next;
                cur_path.requires.push({ cable: cur_swapper, time: cur_path.time, swapped: false });
                cur_path.time += deltas[cur_cable.type];
                if (cur_path.time === 0 && direct_next === starting_cable) {
                    finished_paths.push(cur_path);
                }
                else {
                    pending_paths.push(cur_path);
                }
                // path 2
                cur_path_other.finish = other_next;
                cur_path_other.requires.push({ cable: cur_swapper, time: cur_path_other.time, swapped: true });
                cur_path_other.time += deltas[cur_cable.type];
                if (cur_path.time === 0 && other_next === starting_cable) {
                    finished_paths.push(cur_path_other);
                }
                else {
                    pending_paths.push(cur_path_other);
                }
            }
        }
        return finished_paths;
    }
    exports.getAllLoopsFrom = getAllLoopsFrom;
    function hacky_printAllLoops(time) {
        let interesting_cable = null;
        exports.board.forEach(cur_tile => {
            for (let k = 0; k < 6; k++) {
                let cur_cable = cur_tile.cables[k];
                if (cur_cable !== null && cur_cable.target === k && cur_cable.inputReqs.get(time)) {
                    interesting_cable = cur_cable;
                    break;
                }
            }
        });
        if (interesting_cable === null)
            return;
        let cur_paths = getAllLoopsFrom(interesting_cable);
        cur_paths.forEach(cur_path => {
            let effects = cur_path.effects.map(x => `${hacky_cableName(x.cable)} ON at ${x.time}`);
            let requires = cur_path.requires.map(x => `${hacky_cableName(x.cable)} ${x.swapped ? 'ON' : 'OFF'} at ${x.time}`);
            console.log(`\
${hacky_cableName(cur_path.start)}-${hacky_cableName(cur_path.finish)}: ${cur_path.time}.
Effects:\n\t${effects.join(';\n\t')}
Requires:\n\t${requires.join(';\n\t')}`);
        });
    }
    exports.hacky_printAllLoops = hacky_printAllLoops;
    function areLoopsCompatible(loops) {
        // loop.time = the second in which loop.start is started
    }
});
