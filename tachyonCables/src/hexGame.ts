import { Hex, FrozenHex, Layout, Point } from 'hexLib';
import { canvas, ctx } from './graphics';
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

      temp2 = cableA!.nextState;
      cableA!.nextState = cableB!.nextState;
      cableB!.nextState = temp2;
    }
  }

  toSimpleObject() {
    let uniqueCables = new Set(this.cables.filter(x => x !== null));
    let simpleCables: { origin: number, target: number, type: CableType }[] = [];
    uniqueCables.forEach(x => {
      simpleCables.push({
        origin: x!.origin,
        target: x!.target,
        type: x!.type
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

// export let board = new Map<FrozenHex, Tile>();
// export const board = str2board(localStorage.getItem("level") || "[]");
export const board = str2board(localStorage.getItem("level_small") || "[]");

function applyInput(time: number) {
  board.forEach(tile => {
    tile.cables.forEach(cable => {
      if (cable !== null && cable.inputReqs.has(time)) {
        let new_state = cable.inputReqs.get(time)!;
        if (cable.type === "swapper" && cable.state !== new_state) {
          tile.swapCables(cable, "forward");
        }
        cable.state = new_state;
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

export function board2str() {
  let tiles: { q: number; r: number; cables: { origin: number; target: number; type: CableType; }[]; }[] = [];
  board.forEach(tile => {
    tiles.push(tile.toSimpleObject());
  })
  return JSON.stringify(tiles);
}

function str2board(str: string) {
  let board_res = new Map<FrozenHex, Tile>();
  let simpleObject: { q: number; r: number; cables: { origin: number; target: number; type: CableType; }[]; }[] = JSON.parse(str);
  simpleObject.forEach(simpleTile => {
    let cur_hex = new Hex(simpleTile.q, simpleTile.r, -simpleTile.r - simpleTile.q);
    let cur_tile = new Tile(cur_hex);
    simpleTile.cables.forEach(x => {
      let cur_cable = new Cable(cur_tile, x.origin, x.target, x.type, false);
      cur_tile.cables[x.origin] = cur_cable;
      cur_tile.cables[x.target] = cur_cable;
    });
    board_res.set(cur_hex.freeze(), cur_tile);
  })
  return board_res;
}

export function board2str_onlyVisible() {
  let tiles: { q: number; r: number; cables: { origin: number; target: number; type: CableType; }[]; }[] = [];
  let offset = layout.pixelToHex({ x: 0, y: 0 }).round();
  board.forEach(tile => {
    let tile_hex = tile.coords;
    let center = layout.hexToPixel(tile_hex);
    if (center.x < 0 || center.x >= canvas.width || center.y < 0 || center.y >= canvas.height) {
      return;
    }
    let simpleTile = tile.toSimpleObject();
    if (simpleTile.cables.length === 0) {
      return;
    }
    simpleTile.q -= offset.q;
    simpleTile.r -= offset.r;
    tiles.push(simpleTile);
  })
  return JSON.stringify(tiles);
}

type Path = {
  start: Cable,
  finish: Cable, // ends before visiting this
  time: number,
  effects: { cable: Cable, time: number }[], // time n -> happens between n and n + 1
  requires: { cable: Cable, time: number, swapped: boolean }[],
}

function copyPath(path: Path): Path {
  let res: Path = {
    start: path.start,
    finish: path.finish,
    time: path.time,
    effects: [],
    requires: []
  };
  path.effects.forEach(x => {
    res.effects.push({ cable: x.cable, time: x.time })
  });
  path.requires.forEach(x => {
    res.requires.push({ cable: x.cable, time: x.time, swapped: x.swapped })
  });
  return res;
}

function getAllPathsFrom(starting_cable: Cable, stopping_cables: Cable[]) {
  const deltas = {
    "standard": 1,
    "swapper": 1,
    "tachyon": -1,
    "bridgeForward": 0,
    "bridgeBackward": 0,
  }

  let finished_paths: Path[] = [];

  let pending_paths: Path[] = [
    { start: starting_cable, finish: starting_cable, time: 0, effects: [], requires: [] }
  ];
  while (pending_paths.length > 0 && finished_paths.length < 5) {
    let cur_path = pending_paths.shift() as Path;
    let cur_cable = cur_path.finish;
    let direct_next = nextCable(cur_cable);
    let other_next = otherNextCable(cur_cable);
    if (!direct_next) continue; // path ends abruptly
    if (!other_next) {
      // only one path forward
      cur_path.finish = direct_next;
      if (cur_cable.type === "swapper") {
        cur_path.effects.push({ cable: cur_cable, time: cur_path.time });
      }
      cur_path.time += deltas[cur_cable.type];
      if (stopping_cables.indexOf(direct_next) !== -1) {
        finished_paths.push(cur_path);
      } else {
        pending_paths.push(cur_path);
      }
    } else {
      // two possible paths forward
      let cur_path_other = copyPath(cur_path);
      let cur_swapper = cur_cable.tile.cables.find(x => x!.type === "swapper")!;

      // path 1
      cur_path.finish = direct_next;
      cur_path.requires.push({ cable: cur_swapper, time: cur_path.time, swapped: false });
      cur_path.time += deltas[cur_cable.type];
      if (stopping_cables.indexOf(direct_next) !== -1) {
        finished_paths.push(cur_path);
      } else {
        pending_paths.push(cur_path);
      }

      // path 2
      cur_path_other.finish = other_next;
      cur_path_other.requires.push({ cable: cur_swapper, time: cur_path_other.time, swapped: true });
      cur_path_other.time += deltas[cur_cable.type];
      if (stopping_cables.indexOf(other_next) !== -1) {
        finished_paths.push(cur_path_other);
      } else {
        pending_paths.push(cur_path_other);
      }
    }
  }

  return finished_paths;
}

export function hacky_printAllPaths(time: number) {
  let interesting_cables: Cable[] = [];
  board.forEach(cur_tile => {
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
    })
  })
}

function hacky_cableName(cable: Cable) {
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
  } else if (hex.q === 3 && hex.r === 2) {
    if (cable.target === 2) {
      return 'A'
    }
    if (cable.target === 0) {
      return 'B'
    }
    if (cable.target === 4) {
      return 'C'
    }
  }
  return cable.tile.coords.q.toString() + ',' + cable.tile.coords.r.toString();
}

function nextCable(cur_cable: Cable) {
  let cur_tile = cur_cable.tile;
  let next_tile = board.get(cur_tile.coords.neighbor(cur_cable.target).freeze());
  if (next_tile !== undefined) {
    let next_cable_origin = mod(cur_cable.target + 3, 6);
    let next_cable = next_tile.cables[next_cable_origin];
    if (next_cable !== null && next_cable.origin === next_cable_origin) {
      return next_cable;
    }
  }
  return null;
}

function otherNextCable(cur_cable: Cable) {
  if (cur_cable.type === "swapper") return null;
  let swapper_on_tile = cur_cable.tile.cables.some(x => x?.type === "swapper");
  if (!swapper_on_tile) return null;

  let swapCables = new Set(cur_cable.tile.cables.filter(x => {
    return x !== null && x.type !== "swapper";
  }));
  if (swapCables.size !== 2) return null;
  swapCables.delete(cur_cable);
  let [otherCable] = swapCables;
  return nextCable(otherCable!);
}

export function getAllLoopsFrom(starting_cable: Cable) {
  const deltas = {
    "standard": 1,
    "swapper": 1,
    "tachyon": -1,
    "bridgeForward": 0,
    "bridgeBackward": 0,
  }

  let finished_paths: Path[] = [];

  let pending_paths: Path[] = [
    { start: starting_cable, finish: starting_cable, time: 0, effects: [], requires: [] }
  ];
  let k = 0;
  while (pending_paths.length > 0 && finished_paths.length < 10 && k < 10000) {
    k++;
    let cur_path = pending_paths.shift() as Path;
    let cur_cable = cur_path.finish;
    let direct_next = nextCable(cur_cable);
    let other_next = otherNextCable(cur_cable);
    if (!direct_next) continue; // path ends abruptly
    if (!other_next) {
      // only one path forward
      cur_path.finish = direct_next;
      if (cur_cable.type === "swapper") {
        cur_path.effects.push({ cable: cur_cable, time: cur_path.time });
      }
      cur_path.time += deltas[cur_cable.type];
      if (cur_path.time === 0 && direct_next === starting_cable) {
        finished_paths.push(cur_path);
      } else {
        pending_paths.push(cur_path);
      }
    } else {
      // two possible paths forward
      let cur_path_other = copyPath(cur_path);
      let cur_swapper = cur_cable.tile.cables.find(x => x!.type === "swapper")!;

      // path 1
      cur_path.finish = direct_next;
      cur_path.requires.push({ cable: cur_swapper, time: cur_path.time, swapped: false });
      cur_path.time += deltas[cur_cable.type];
      if (cur_path.time === 0 && direct_next === starting_cable) {
        finished_paths.push(cur_path);
      } else {
        pending_paths.push(cur_path);
      }

      // path 2
      cur_path_other.finish = other_next;
      cur_path_other.requires.push({ cable: cur_swapper, time: cur_path_other.time, swapped: true });
      cur_path_other.time += deltas[cur_cable.type];
      if (cur_path.time === 0 && other_next === starting_cable) {
        finished_paths.push(cur_path_other);
      } else {
        pending_paths.push(cur_path_other);
      }
    }
  }

  return finished_paths;
}

let hacky_loopsToDraw: Path[] = [];

export function hacky_printAllLoops(time: number) {
  let interesting_cable: Cable | null = null;
  board.forEach(cur_tile => {
    for (let k = 0; k < 6; k++) {
      let cur_cable = cur_tile.cables[k];
      if (cur_cable !== null && cur_cable.target === k && cur_cable.inputReqs.get(time)) {
        interesting_cable = cur_cable;
        break;
      }
    }
  });
  if (interesting_cable === null) return;

  let cur_paths = getAllLoopsFrom(interesting_cable);
  cur_paths.forEach(cur_path => {
    let effects = cur_path.effects.map(x => `${hacky_cableName(x.cable)} ON at ${x.time}`);
    let requires = cur_path.requires.map(x => `${hacky_cableName(x.cable)} ${x.swapped ? 'ON' : 'OFF'} at ${x.time}`);
    console.log(`\
${hacky_cableName(cur_path.start)}-${hacky_cableName(cur_path.finish)}: ${cur_path.time}.
Effects:\n\t${effects.join(';\n\t')}
Requires:\n\t${requires.join(';\n\t')}`);
    hacky_loopsToDraw.push(cur_path);
  });
}

function hacky_drawLoop(loop: Path, x: number, y: number) {
  let SIDE = 20;
  let min_t = Math.min(...loop.effects.map(x => x.time), ...loop.requires.map(x => x.time));
  let max_t = 1 + Math.max(...loop.effects.map(x => x.time), ...loop.requires.map(x => x.time));
  ctx.strokeStyle = "black";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + min_t * SIDE, y);
  ctx.lineTo(x + max_t * SIDE, y);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = min_t; k <= max_t; k++) {
    ctx.moveTo(x + k * SIDE, y - SIDE / 4);
    ctx.lineTo(x + k * SIDE, y + SIDE / 4);
  }
  ctx.stroke();
  ctx.fillStyle = "#a461ba";
  ctx.font = "20px Georgia";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  let numbers: number[] = [];
  loop.effects.forEach(effect => {
    let count = numbers.filter(x => x===effect.time).length
    ctx.fillText(hacky_cableName(effect.cable), x + (effect.time + 0.5) * SIDE, y - SIDE * (count + .5));
    numbers.push(effect.time);
  });
  numbers = [];
  loop.requires.forEach(req => {
    let count = numbers.filter(x => x===req.time).length
    ctx.fillStyle = req.swapped ? "white" : "black";
    ctx.fillText(hacky_cableName(req.cable), x + (req.time + 0.5) * SIDE, y + SIDE * (count + .5));
    numbers.push(req.time);
  });
}

export function hacky_drawStuff() {
  for (let k=0; k<hacky_loopsToDraw.length; k++) {
    let y = 50 + k * 100;
    let x = 100;
    while (y > canvas.height * 0.9) {
      y -= canvas.height * 0.8;
      x += 500;
    }
    hacky_drawLoop(hacky_loopsToDraw[k], x, y);
  }
}

type LoopCollection = {
  effects: Path["effects"],
  requires: Path["requires"],
  unmet: Path["requires"]
}

function copyCollection(collection: LoopCollection): LoopCollection {
  let res: LoopCollection = {
    effects: [],
    requires: [],
    unmet: []
  };
  collection.effects.forEach(x => {
    res.effects.push({ cable: x.cable, time: x.time })
  });
  collection.requires.forEach(x => {
    res.requires.push({ cable: x.cable, time: x.time, swapped: x.swapped })
  });
  collection.unmet.forEach(x => {
    res.unmet.push({ cable: x.cable, time: x.time, swapped: x.swapped })
  });
  return res;
}

function randomSolver(raw_loops: Path[]) {
  let tentative_solution = makeLoopCollection([raw_loops[Math.floor(Math.random() * raw_loops.length)]]);
  if (!tentative_solution) return null;
  let k = 0;
  while (tentative_solution.unmet.length > 0 && k < 20) {
    // find a suitable loop, and add it to the tentative_solution
    // TODO
  }
}

function addToCollection(collection: LoopCollection, new_loop: Path, offset: number) {
  let new_col = copyCollection(collection);
  // TODO: this
}

function makeLoopCollection(loops: Path[]): LoopCollection | null {
  // loop.time = the second in which loop.start is started
  let total_effects: LoopCollection["effects"] = [];
  let total_requirements: LoopCollection["requires"] = [];
  let total_unmet: LoopCollection["unmet"] = [];
  let valid = true;

  // Check for conflicting requirements
  loops.forEach(cur_loop => {
    if (!valid) return;
    cur_loop.requires.forEach(req => {
      if (!valid) return;
      let req_time = req.time + cur_loop.time;
      total_requirements.forEach(req2 => {
        if (!valid) return;
        if (req2.time === req_time && req2.cable === req.cable && req2.swapped !== req.swapped) {
          // incompatible
          valid = false;
        }
      })
      total_requirements.push({ time: req_time, cable: req.cable, swapped: req.swapped });
    })
  });
  if (!valid) return null;

  // Check for conflicting requirements & effects
  loops.forEach(cur_loop => {
    if (!valid) return;
    cur_loop.effects.forEach(effect => {
      if (!valid) return;
      let effect_time = effect.time + cur_loop.time;
      total_effects.forEach(effect2 => {
        if (!valid) return;
        if (effect2.time === effect_time && effect2.cable === effect.cable) {
          // collision
          valid = false;
        }
      });
      total_requirements.forEach(req => {
        if (!valid) return;
        if (!req.swapped && req.time === effect_time && req.cable === effect.cable) {
          // incompatible
          valid = false;
        }
      })
      total_effects.push({ time: effect_time, cable: effect.cable });
    });
  });
  if (!valid) return null;

  // Check which requirements are still unmet
  total_requirements.forEach(req => {
    if (req.swapped) {
      let done = false;
      total_effects.forEach(effect => {
        if (done) return;
        if (effect.cable === req.cable && effect.time === req.time) {
          done = true;
        }
      });
      if (!done) {
        total_unmet.push({ cable: req.cable, time: req.time, swapped: req.swapped });
      }
    }
  });

  return { effects: total_effects, requires: total_requirements, unmet: total_unmet };
}
