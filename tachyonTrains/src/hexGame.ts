import { Hex, FrozenHex, Layout, Point } from 'hexLib';
import { canvas, ctx } from './graphics';
import { mod } from './index';

type TimeDirection = "forward" | "backward";

export const MAX_T = 18;

export class Cable {
  // inputReqs: Map<number, boolean>;
  globalState: boolean[];
  inputReqs: (boolean | null)[];
  otherCable: Cable | null;
  masterSwapper: Cable | null;
  constructor(public tile: Tile, public origin: number, public target: number, public direction: TimeDirection, public swapper: boolean) {
    this.inputReqs = Array(MAX_T).fill(null);
    this.globalState = Array(MAX_T).fill(false);
    this.otherCable = null;
    this.masterSwapper = null;
    this.inputReqs[0] = false;
    this.inputReqs[MAX_T - 1] = false;
  }

  cycleInput(time: number) {
    if (time <= 0 || time + 1 >= MAX_T) return;
    if (this.inputReqs[time] === null) {
      this.inputReqs[time] = true;
    } else if (this.inputReqs[time]) {
      this.inputReqs[time] = false;
    } else {
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
    return this.inputReqs[Math.floor(time)] === true;
  }
}

export class Tile {
  cables: (Cable | null)[];
  constructor(public coords: Hex) {
    this.cables = [null, null, null, null, null, null];
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

export const layout = new Layout(Layout.flat, 70, new Point(0, 0));

// export const board = new Map<FrozenHex, Tile>();
export const board = str2board(localStorage.getItem("debug") || "[]");

export let swappers: Cable[] = [];
export let contradictions: {time: number, cable: Cable}[] = [];

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
            used = true;
          }
        }
      }
    }
    if (used) swappers.push(cur_swapper!);
  });
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
            propagate(cur_cable, t, "forward", true);
            propagate(cur_cable, t, "backward", true);
          }
        }
      }
    }
  });
}

function propagate(source_cable: Cable, source_t: number, direction: TimeDirection, exception: boolean) {
  if (source_t < 0 || source_t >= MAX_T) return;
  // contradiction!
  if (source_cable.inputReqs[source_t] === false) {
    contradictions.push({time: source_t, cable: source_cable});
    return;
  }
  // don't propagate if it has already been propagated
  if (!exception && source_cable.globalState[source_t]) return;
  // swapper cables require explicit input
  if (source_cable.swapper && source_cable.inputReqs[source_t] !== true) {
    contradictions.push({time: source_t, cable: source_cable});
    return;
  }

  source_cable.globalState[source_t] = true;

  let next_cable = direction === "forward" ? nextCable(source_cable, source_t) : prevCable(source_cable, source_t);
  if (!next_cable) return;

  let dt = source_cable.direction === direction ? 1 : -1;
  if (source_cable.direction !== next_cable.direction) dt = 0;
  propagate(next_cable, source_t + dt, direction, false);
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
    tiles.push(tile.toSimpleObject());
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
