import { Hex, FrozenHex, Layout, Point } from 'hexLib';
import { mod } from './index';

type CableType = "standard" | "tachyon" | "bridgeBackward" | "bridgeForward" | "swapper";
type BallType = "forward" | "backward";

export class Cable {
  inputReqs: Map<number, boolean>;
  nextState: boolean;
  constructor(public tile: Tile, public origin: number, public target: number, public type: CableType, public state: boolean) {
    this.inputReqs = new Map<number, boolean>();
    this.nextState = false;
  }

  cycleInput(time: number) {
    if (this.inputReqs.has(time)) {
      let val = this.inputReqs.get(time);
      if (val) {
        this.inputReqs.set(time, false);
      } else {
        this.inputReqs.delete(time);
      }
    } else {
      this.inputReqs.set(time, true);
    }
    applyInput(time);
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
  }
  deleteCable(dir: number) {
    if (this.cables[dir] !== null) {
      let toDelete = this.cables[dir]!;
      this.cables[toDelete.origin] = null;
      this.cables[toDelete.target] = null;
    }
  }
  swapCables(swapper: Cable, moving_dir: BallType) {
    let uniqueCables = new Set(this.cables.filter(x => x !== null));
    uniqueCables.delete(swapper);
    if (uniqueCables.size !== 2) return;
    let [cableA, cableB] = uniqueCables;
    let temp = cableA!.target;
    cableA!.target = cableB!.target;
    cableB!.target = temp;
    this.cables[cableA!.target] = cableA;
    this.cables[cableB!.target] = cableB;
    if (moving_dir === "backward") {
      let temp2 = cableA!.state;
      cableA!.state = cableB!.state;
      cableB!.state = temp2;
    }
  }
}

export const layout = new Layout(Layout.flat, 70, new Point(0, 0));

export const board = new Map<FrozenHex, Tile>();

function applyInput(time: number) {
  board.forEach(tile => {
    tile.cables.forEach(cable => {
      if (cable !== null && cable.inputReqs.has(time)) {
        cable.state = cable.inputReqs.get(time)!;
      }
    });
  });
}

function getStateFromPrev(cur_cable: Cable, ball_type: BallType) {
  let cur_tile = cur_cable.tile;
  let prev_tile = board.get(cur_tile.coords.neighbor(cur_cable.origin).freeze());
  if (prev_tile !== undefined) {
    let prev_cable_target = mod(cur_cable.origin + 3, 6);
    let prev_cable = prev_tile.cables[prev_cable_target];
    if (prev_cable !== null && prev_cable.target === prev_cable_target) {
      if (ball_type === "forward") {
        return prev_cable.state && (prev_cable.type === "standard" || prev_cable.type === "bridgeForward" || prev_cable.type === "swapper");
      } else if (ball_type === "backward") {
        return prev_cable.state && (prev_cable.type === "tachyon" || prev_cable.type === "bridgeBackward");
      }
    }
  }

  // no valid previous cable
  return false;
}

function getStateFromNext(cur_cable: Cable, ball_type: BallType) {
  let cur_tile = cur_cable.tile;
  let next_tile = board.get(cur_tile.coords.neighbor(cur_cable.target).freeze());
  if (next_tile !== undefined) {
    let next_cable_origin = mod(cur_cable.target + 3, 6);
    let next_cable = next_tile.cables[next_cable_origin];
    if (next_cable !== null && next_cable.origin === next_cable_origin) {
      if (ball_type === "forward") {
        return next_cable.state && (next_cable.type === "standard" || next_cable.type === "bridgeBackward" || next_cable.type === "swapper");
      } else if (ball_type === "backward") {
        return next_cable.state && (next_cable.type === "tachyon" || next_cable.type === "bridgeForward");
      }
    }
  }

  // no valid following cable
  return false;
}

export function updateToNext(time: number) {
  //applyInput(time);

  board.forEach(cur_tile => {
    for (let k = 0; k < 6; k++) {
      let cur_cable = cur_tile.cables[k];
      if (cur_cable !== null && cur_cable.origin === k) {
        if (cur_cable.type === "standard" || cur_cable.type === "swapper") {
          cur_cable.nextState = getStateFromPrev(cur_cable, "forward");
        } else if (cur_cable.type === "tachyon") {
          cur_cable.nextState = getStateFromNext(cur_cable, "backward");
        } else if (cur_cable.type === "bridgeForward") {
          cur_cable.nextState = false;
        } else if (cur_cable.type === "bridgeBackward") {
          cur_cable.nextState = getStateFromNext(cur_cable, "backward") || getStateFromPrev(cur_cable, "forward");
        }
      }
    }
  });

  board.forEach(cur_tile => {
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

export function updateToPrev(time: number) {
  //applyInput(time);

  board.forEach(cur_tile => {
    for (let k = 0; k < 6; k++) {
      let cur_cable = cur_tile.cables[k];
      if (cur_cable !== null && cur_cable.target === k) {
        if (cur_cable.type === "standard" || cur_cable.type === "swapper") {
          cur_cable.nextState = getStateFromNext(cur_cable, "forward");
        } else if (cur_cable.type === "tachyon") {
          cur_cable.nextState = getStateFromPrev(cur_cable, "backward");
        } else if (cur_cable.type === "bridgeBackward") {
          cur_cable.nextState = false;
        } else if (cur_cable.type === "bridgeForward") {
          cur_cable.nextState = getStateFromNext(cur_cable, "forward") || getStateFromPrev(cur_cable, "backward");
        }
      }
    }
  });

  board.forEach(cur_tile => {
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
