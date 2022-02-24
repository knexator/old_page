import { Hex, FrozenHex, Layout, Point } from 'hexLib';
import { canvas, ctx } from './graphics';
import { contains, mod } from './index';
import { level_simple_raw, level_cool_raw } from './level_data';

export type TimeDirection = "forward" | "backward";

export const MAX_T = 50;

export class Cable {
  // inputReqs: Map<number, boolean>;
  globalState: boolean[];
  inputReqs: (boolean | null)[];
  otherCable: Cable | null;
  masterSwapper: Cable | null;
  constructor(public tile: Tile, public origin: number, public target: number, public direction: TimeDirection, public swapper: boolean) {
    /*if (swapper) {
      this.inputReqs = Array(MAX_T).fill(false);
    } else {
      this.inputReqs = Array(MAX_T).fill(null);
    }*/
    this.inputReqs = Array(MAX_T).fill(null);
    this.globalState = Array(MAX_T).fill(false);
    this.otherCable = null;
    this.masterSwapper = null;
    // this.inputReqs[0] = false;
    // this.inputReqs[MAX_T - 1] = false;
  }

  cycleInput(time: number) {
    // if (time <= 0 || time + 1 >= MAX_T) return;
    if (this.inputReqs[time] === null) {
      this.inputReqs[time] = true;
    } else {
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

  getOrigin(time: number) {
    if (!this.masterSwapper || this.direction === "forward") return this.origin;
    if (this.otherCable === null) {
      throw new Error("otherCable is null but masterSwapper isn't!!");
    }
    return this.masterSwapper.currentlySwapped(time) ? this.otherCable.origin : this.origin;
  }

  getTarget(time: number) {
    if (!this.masterSwapper || this.direction === "backward") return this.target;
    if (this.otherCable === null) {
      throw new Error("otherCable is null but masterSwapper isn't!!");
    }
    return this.masterSwapper.currentlySwapped(time) ? this.otherCable.target : this.target;
  }

  currentlySwapped(time: number) {
    if (!this.swapper) {
      throw new Error("calling currentlySwapped on something that isn't a swapper!!");
    }
    return BlockedAt(Math.floor(time), this.direction === "backward");
    // return this.inputReqs[Math.floor(time)] === true;
  }
}

export class Tile {
  cables: (Cable | null)[];
  masterSwapper: Cable | null;
  swapCable1: Cable | null;
  swapCable2: Cable | null;
  constructor(public coords: Hex) {
    this.cables = [null, null, null, null, null, null];
    this.masterSwapper = null;
    this.swapCable1 = null;
    this.swapCable2 = null;
  }
  addCable(cable: Cable) {
    this.deleteCable(cable.origin);
    this.deleteCable(cable.target);
    this.cables[cable.origin] = cable;
    this.cables[cable.target] = cable;
    updateGlobalState();
  }
  deleteCable(dir: number) {
    if (this.cables[dir] !== null) {
      let toDelete = this.cables[dir]!;
      this.cables[toDelete.origin] = null;
      this.cables[toDelete.target] = null;
      updateGlobalState();
    }
  }
  getCable(dir: number, time: number): Cable | null {
    let cable = this.cables[dir];
    if (!cable) return null;
    if (!cable.masterSwapper) return cable;
    if (cable.getOrigin(time) === dir || cable.getTarget(time) === dir) return cable;
    return cable.otherCable;
  }

  toSimpleObject() {
    let uniqueCables = new Set(this.cables.filter(x => x !== null));
    let simpleCables: { origin: number, target: number, direction: TimeDirection, swapper: boolean }[] = [];
    uniqueCables.forEach(x => {
      simpleCables.push({
        origin: x!.origin,
        target: x!.target,
        direction: x!.direction,
        swapper: x!.swapper
      })
    });
    return {
      q: this.coords.q,
      r: this.coords.r,
      cables: simpleCables
    };
  }
}

export const layout = new Layout(Layout.flat, 85, new Point(-20, 100));

// export const board = new Map<FrozenHex, Tile>();
// export const board = str2board(localStorage.getItem("cool") || "[]");
export const board = str2board(level_cool_raw);

export type Contradiction = {time: number, cable: Cable, source_t: number, source_cable: Cable, direction: TimeDirection};
export let swappers: Cable[] = [];
export let contradictions: Contradiction[] = [];
export let control_tracks: Cable[] = [];

fixBoard();

function fixBoard() {
  swappers = [];
  board.forEach(cur_tile => {
    let cur_swapper = cur_tile.cables.find(x => x?.swapper);
    let used = false;
    for (let k = 0; k < 6; k++) {
      let cur_cable = cur_tile.cables[k];
      if (cur_cable && cur_cable.origin === k) {
        let swappable = !cur_cable.swapper && cur_swapper;
        if (!swappable) {
          cur_cable.masterSwapper = null;
          cur_cable.otherCable = null;
        } else {
          let swapCables = new Set(cur_tile.cables.filter(x => {
            return x !== null && !x.swapper;
          }));
          if (swapCables.size !== 2) {
            // not actually swappable
            cur_cable.masterSwapper = null;
            cur_cable.otherCable = null;
          } else {
            swapCables.delete(cur_cable);
            let [otherCable] = swapCables;
            cur_cable.masterSwapper = cur_swapper!;
            cur_cable.otherCable = otherCable!;
            cur_tile.masterSwapper = cur_swapper!;
            cur_tile.swapCable1 = cur_cable;
            cur_tile.swapCable2 = otherCable!;
            used = true;
          }
        }
      }
    }
    if (used) {
      swappers.push(cur_swapper!);
      // control_tracks.push(nextCable(cur_swapper!.tile!.swapCable1!, 0)!);
      // control_tracks.push(nextCable(cur_swapper!.tile!.swapCable2!, 0)!);
      // control_tracks.push(cur_swapper!.tile!.swapCable1!);
      // control_tracks.push(cur_swapper!.tile!.swapCable2!);
    }
  });

  control_tracks = [
    board.get(new Hex(7, 0,-7).freeze())!.getCable(2, 0)!,
    board.get(new Hex(5, 0,-5).freeze())!.getCable(5, 0)!,
    board.get(new Hex(7,-2,-5).freeze())!.getCable(5, 0)!,
    board.get(new Hex(5, 2,-7).freeze())!.getCable(2, 0)!,
  ];
}

function updateGlobalState() {
  // reset everything
  fixBoard();
  contradictions = [];
  board.forEach(cur_tile => {
    for (let k = 0; k < 6; k++) {
      let cur_cable = cur_tile.cables[k];
      if (cur_cable && cur_cable.origin === k) {
        for (let t = 0; t < MAX_T; t++) {
          cur_cable.globalState[t] = false;
        }
      }
    }
  });

  // follow inputs!
  board.forEach(cur_tile => {
    for (let k = 0; k < 6; k++) {
      let cur_cable = cur_tile.cables[k];
      if (cur_cable && cur_cable.origin === k) {
        for (let t = 0; t < MAX_T; t++) {
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

function isValidBridge(original_cable: Cable, original_t: number, direction: TimeDirection) {
  let col = control_tracks.indexOf(original_cable);
  if (col == -1) {
    throw new Error("idk");
  }
  col = 3 - col;
  if (direction === "forward") {
    return ValidAfter(col, original_t);
  } else {
    return ValidBefore(col, original_t);
  }
}

function propagate(source_cable: Cable, source_t: number, direction: TimeDirection, exception: boolean, original_cable: Cable, original_t: number) {
  if (source_t < 0 || source_t >= MAX_T) return;
  // contradiction!
  if (source_cable.inputReqs[source_t] === false) {
    contradictions.push({time: source_t, cable: source_cable, source_cable: original_cable, source_t: original_t, direction: direction});
    return;
  }
  // don't propagate if it has already been propagated
  if (!exception && source_cable.globalState[source_t]) return;
  // control cables require explicit input
  // if (contains(control_tracks, source_cable) && source_cable.inputReqs[source_t] !== true) {
  if ((source_cable.masterSwapper) && !isValidBridge(original_cable, original_t, direction)) {
    contradictions.push({time: source_t, cable: source_cable, source_cable: original_cable, source_t: original_t, direction: direction});
    return;
  }

  source_cable.globalState[source_t] = true;

  let next_cable = magicAdjacentCable(source_cable, source_t, direction);
  if (!next_cable) return;

  let dt = source_cable.direction === direction ? 1 : -1;
  if (source_cable.direction !== next_cable.direction) dt = 0;
  propagate(next_cable, source_t + dt, direction, false, original_cable, original_t);
}

export function magicAdjacentCable(source_cable: Cable, source_t: number, direction: TimeDirection) {
  // ASSUME that both swapped cables will have the same direction
  let next_cable_temp = direction === "forward" ? nextCable(source_cable, source_t) : prevCable(source_cable, source_t);
  let next_cable_dt = 0;

  if (next_cable_temp) {
    if (direction === "forward") {
      if (source_cable.direction === "forward") {
        if (next_cable_temp.direction === "forward") {
          //next_cable_dt = 1
        } else {
          next_cable_dt = 0
        }
      } else {
        if (next_cable_temp.direction === "forward") {
          //next_cable_dt = 1
        } else {
          next_cable_dt = -1
        }
      }
    } else {
      if (source_cable.direction === "forward") {
        if (next_cable_temp.direction === "forward") {
          next_cable_dt = -1
        } else {
          //next_cable_dt = 0
        }
      } else {
        next_cable_dt = 0
      }
    }
  }

  return adjacentCable(source_cable, source_t + next_cable_dt, direction);
}

function adjacentCable(cur_cable: Cable, cur_time: number, direction: TimeDirection) {
  return direction === "forward" ? nextCable(cur_cable, cur_time) : prevCable(cur_cable, cur_time)
}

function nextCable(cur_cable: Cable, cur_time: number) {
  let cur_tile = cur_cable.tile;
  let cur_target = cur_cable.getTarget(cur_time)
  let next_tile = board.get(cur_tile.coords.neighbor(cur_target).freeze());
  if (next_tile !== undefined) {
    let next_cable_origin = mod(cur_target + 3, 6);
    let next_cable = next_tile.getCable(next_cable_origin, cur_time);
    if (next_cable !== null && next_cable.getOrigin(cur_time) === next_cable_origin) {
      return next_cable;
    }
  }
  return null;
}

function prevCable(cur_cable: Cable, cur_time: number) {
  let cur_tile = cur_cable.tile;
  let cur_origin = cur_cable.getOrigin(cur_time)
  let prev_tile = board.get(cur_tile.coords.neighbor(cur_origin).freeze());
  if (prev_tile !== undefined) {
    let prev_cable_target = mod(cur_origin + 3, 6);
    let prev_cable = prev_tile.getCable(prev_cable_target, cur_time);
    if (prev_cable !== null && prev_cable.getTarget(cur_time) === prev_cable_target) {
      return prev_cable;
    }
  }
  return null;
}

export function board2str() {
  let tiles: { q: number; r: number; cables: { origin: number; target: number; direction: TimeDirection; swapper: boolean; }[]; }[] = [];
  board.forEach(tile => {
    if (tile.cables.some(x => x)) {
      tiles.push(tile.toSimpleObject());
    }
  })
  return JSON.stringify(tiles);
}

function str2board(str: string) {
  let board_res = new Map<FrozenHex, Tile>();
  let simpleObject: { q: number; r: number; cables: { origin: number; target: number; direction: TimeDirection; swapper: boolean; }[]; }[] = JSON.parse(str);
  simpleObject.forEach(simpleTile => {
    let cur_hex = new Hex(simpleTile.q, simpleTile.r, -simpleTile.r - simpleTile.q);
    let cur_tile = new Tile(cur_hex);
    simpleTile.cables.forEach(x => {
      let cur_cable = new Cable(cur_tile, x.origin, x.target, x.direction, x.swapper);
      cur_tile.cables[x.origin] = cur_cable;
      cur_tile.cables[x.target] = cur_cable;
    });
    board_res.set(cur_hex.freeze(), cur_tile);
  })
  return board_res;
}


export function BlockedAt(time: number, which: boolean) { // true: 0,2; false: 1,3;
    if (which) {
        return getPost(3, time + 2);
    } else {
        return getPost(2, time - 4);
    }
}

function BlockedBefore(post: number, postTime: number) {
    switch (post) {
        case 0:
        case 2:
            return BlockedAt(postTime - 1, true);
        case 1:
        case 3:
            return BlockedAt(postTime + 1, false);
    };
    throw new Error("EXTREME ERROR");
}

function BlockedAfter(post: number, postTime: number) {
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

export function ValidBefore(post: number, postTime: number) {
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

export function ValidAfter(post: number, postTime: number) {
    let offsets = [ -8, 7, 9, -5];
    let posts = [ [2, 0], [1, 3], [0, 2], [3, 1] ];
    return BlockedAfter(post, postTime) ? getPost(posts[post][1], postTime + offsets[post]) : getPost(posts[post][0], postTime + offsets[post]);
}

function getPost(post: number, postTime: number) {
    /*if (post % 2 == 0) {
        postTime -= 1; // TODO: extreme bug, lol
    }*/
    if (postTime <= 0 || postTime >= MAX_T) return false;
    return control_tracks[3 - post].inputReqs[postTime] === true;
}
