const DIRS = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
];
let forbidden_places = null;
function parseLevel(ascii) {
    let rows = ascii.trim().split("\n").map(x => x.trim());
    console.log(rows);
    let height = rows.length;
    let width = rows[0].length;
    let targets = [];
    let crates = [];
    let player;
    let walls = [];
    for (let j = 0; j < height; j++) {
        let wall_row = [];
        for (let i = 0; i < width; i++) {
            let val = rows[j][i];
            if (val === "#") {
                wall_row.push(true);
                continue;
            }
            else {
                wall_row.push(false);
            }
            switch (val) {
                case ".":
                    break;
                case "#":
                    break;
                case "*":
                    crates.push({ x: i, y: j });
                    break;
                case "O":
                    targets.push({ x: i, y: j });
                    break;
                case "@":
                    crates.push({ x: i, y: j });
                    targets.push({ x: i, y: j });
                    break;
                case "P":
                    player = { x: i, y: j };
                    break;
                default:
                    break;
            }
        }
        walls.push(wall_row);
    }
    let state = {
        w: width,
        h: height,
        walls: walls,
        targets: targets,
        crates: crates,
        player: player,
    };
    forbidden_places = generateForbiddenMap(state);
    movePlayerToStandardPosition(state);
    return state;
}
// let initialState = parseLevel(`
// ####..
// #.O#..
// #..###
// #@P..#
// #..*.#
// #..###
// ####..
// `)
let initialState = parseLevel(`
..#####..
.##...###
.#......#
.#@#@#@.#
.#.#P*.##
##.#.#O#.
#......#.
#...#..#.
########.
`);
// let initialState = parseLevel(`
// .....####
// ...###..#
// .###.OO.#
// .#.**#..#
// ##.#.#.##
// #..@.P..#
// #...#...#
// ######..#
// .....####
// `)
// let initialState = parseLevel(`
// ###########..
// #...P.#...###
// #.*.*.#.O..O#
// #.##.###.##.#
// #.#.......#.#
// #.#...#...#.#
// #.#########.#
// #...........#
// #############
// `)
function crateAt(state, pos) {
    return state.crates.some(c => c.x == pos.x && c.y == pos.y);
}
function targetAt(state, pos) {
    return state.targets.some(c => c.x == pos.x && c.y == pos.y);
}
function isWon(state) {
    return state.targets.every(t => {
        return crateAt(state, t);
    });
}
function movePlayerToStandardPosition(state) {
    let explored = rectGrid(false, state.w, state.h);
    let pending = [state.player];
    while (pending.length > 0) {
        let curPos = pending.pop();
        if (explored[curPos.y][curPos.x])
            continue;
        explored[curPos.y][curPos.x] = true;
        for (let k = 0; k < 4; k++) {
            const dir = DIRS[k];
            let newPos = addVec(curPos, dir);
            if (!validPos(state, newPos) || explored[newPos.y][newPos.x] || crateAt(state, newPos)) {
                continue;
            }
            pending.push(newPos);
        }
    }
    for (let row = 0; row < state.h; row++) {
        for (let col = 0; col < state.w; col++) {
            if (explored[row][col]) {
                state.player = { x: col, y: row };
                return;
            }
        }
    }
}
function nextStates(state) {
    let result = {};
    let explored = rectGrid(false, state.w, state.h);
    let pending = [state.player];
    while (pending.length > 0) {
        let curPos = pending.pop();
        if (explored[curPos.y][curPos.x])
            continue;
        explored[curPos.y][curPos.x] = true;
        for (let k = 0; k < 4; k++) {
            const dir = DIRS[k];
            let newPos = addVec(curPos, dir);
            if (!validPos(state, newPos) || explored[newPos.y][newPos.x]) {
                continue;
            }
            if (crateAt(state, newPos)) {
                let new_crate_pos = addVec(newPos, dir);
                if (validPos(state, new_crate_pos) && !crateAt(state, new_crate_pos)) {
                    let new_crates = state.crates.map(c => {
                        if (c.x == newPos.x && c.y == newPos.y) {
                            return { x: new_crate_pos.x, y: new_crate_pos.y };
                        }
                        else {
                            return { x: c.x, y: c.y };
                        }
                    }).sort((a, b) => {
                        if (a.x === b.x)
                            return a.y - b.y;
                        return a.x - b.x;
                    });
                    let new_state = {
                        w: state.w,
                        h: state.h,
                        walls: state.walls,
                        targets: state.targets,
                        crates: new_crates,
                        player: newPos,
                    };
                    if (isClearlyLost(new_state)) {
                        continue;
                    }
                    movePlayerToStandardPosition(new_state);
                    result[`${newPos.x},${newPos.y}->${new_crate_pos.x},${new_crate_pos.y}`] = new_state;
                }
            }
            else {
                pending.push(newPos);
            }
        }
    }
    return result;
}
// function nextStates(state: SokobanState): Record<string, SokobanState> {
//     let result = {
//         left: nextState(state, { x: -1, y: 0 }),
//         right: nextState(state, { x: 1, y: 0 }),
//         up: nextState(state, { x: 0, y: -1 }),
//         down: nextState(state, { x: 0, y: 1 })
//     }
//     for (let key in result) {
//         if (result[key] === false || isClearlyLost(result[key])) {
//             delete result[key]
//         }
//     }
//     return result as Record<string, SokobanState>;
// }
// function nextState(state: SokobanState, dir: Vec): SokobanState | false {
//     let new_p = {
//         x: state.player.x + dir.x,
//         y: state.player.y + dir.y
//     }
//     if (!validPos(state, new_p)) return false
//     if (!crateAt(state, new_p)) {
//         return {
//             w: state.w,
//             h: state.h,
//             walls: state.walls,
//             targets: state.targets,
//             crates: state.crates,
//             player: new_p,
//         }
//     }
//     let new_crate_pos = {
//         x: new_p.x + dir.x,
//         y: new_p.y + dir.y
//     }
//     if (!validPos(state, new_crate_pos) || crateAt(state, new_crate_pos)) {
//         return false
//     }
//     let new_crates = state.crates.map(c => {
//         if (c.x == new_p.x && c.y == new_p.y) {
//             return { x: new_crate_pos.x, y: new_crate_pos.y }
//         } else {
//             return { x: c.x, y: c.y }
//         }
//     }).sort((a, b) => {
//         if (a.x === b.x) return a.y - b.y
//         return a.x - b.x;
//     })
//     return {
//         w: state.w,
//         h: state.h,
//         walls: state.walls,
//         targets: state.targets,
//         crates: new_crates,
//         player: new_p,
//     }
// }
// false if oob or wall
function validPos(state, pos) {
    if (pos.x < 0 || pos.x >= state.w || pos.y < 0 || pos.y >= state.h) {
        return false;
    }
    return !state.walls[pos.y][pos.x];
}
function id(state) {
    let result = `${state.player.x}:${state.player.y}`;
    result += '[' + state.crates.map(c => `${c.x - 1}:${c.y - 1}`).join(',') + ']';
    return result;
}
let spritesheet = new Image();
spritesheet.src = './sokoban_spritesheet.png';
function drawState(state, ctx, pos) {
    let TILE_S = 50;
    ctx.imageSmoothingEnabled = false;
    let OFF_X = Math.round(pos.x - state.w * TILE_S / 2);
    let OFF_Y = Math.round(pos.y + TILE_S);
    for (let j = 0; j < state.h; j++) {
        for (let i = 0; i < state.w; i++) {
            if (state.walls[j][i]) {
                // wall
                ctx.drawImage(spritesheet, 0, 0, 5, 5, OFF_X + i * TILE_S, OFF_Y + j * TILE_S, TILE_S, TILE_S);
            }
            else {
                // background
                ctx.drawImage(spritesheet, 5, 0, 5, 5, OFF_X + i * TILE_S, OFF_Y + j * TILE_S, TILE_S, TILE_S);
            }
        }
    }
    state.targets.forEach(target => {
        ctx.drawImage(spritesheet, 10, 0, 5, 5, OFF_X + target.x * TILE_S, OFF_Y + target.y * TILE_S, TILE_S, TILE_S);
    });
    state.crates.forEach(target => {
        ctx.drawImage(spritesheet, 15, 0, 5, 5, OFF_X + target.x * TILE_S, OFF_Y + target.y * TILE_S, TILE_S, TILE_S);
    });
    ctx.drawImage(spritesheet, 20, 0, 5, 5, OFF_X + state.player.x * TILE_S, OFF_Y + state.player.y * TILE_S, TILE_S, TILE_S);
}
function isClearlyLost(state) {
    // is some crate is stuck in some corner?
    if (state.crates.some(crate => {
        return forbidden_places[crate.y][crate.x];
    })) {
        return true;
    }
    // hardcoded list of forbidden patterns: 2 crates together that can't move
    if (state.crates.some(crate_1 => {
        let crate_2 = state.crates.find(c => {
            return (c.x === crate_1.x + 1 && c.y === crate_1.y) ||
                (c.y === crate_1.y + 1 && c.x === crate_1.x);
        });
        if (crate_2 === undefined)
            return false;
        // crate_2 is directly below or to the right of crate_1
        if (crate_1.x === crate_2.x) {
            // vertical case:
            // if there's at least one X and one Y, it's clearly lost
            // X1X
            // Y1Y
            if ((!validPos(state, addVec(crate_1, DIRS[0])) || !validPos(state, addVec(crate_1, DIRS[2])))
                && (!validPos(state, addVec(crate_2, DIRS[0])) || !validPos(state, addVec(crate_2, DIRS[2])))) {
                return true;
            }
        }
        else {
            // horizontal case:
            // if there's at least one X and one Y, it's clearly lost
            // XX
            // 12
            // YY
            if ((!validPos(state, addVec(crate_1, DIRS[1])) || !validPos(state, addVec(crate_1, DIRS[3])))
                && (!validPos(state, addVec(crate_2, DIRS[1])) || !validPos(state, addVec(crate_2, DIRS[3])))) {
                return true;
            }
        }
        return false;
    })) {
        return true;
    }
    // Subtler: can we find a mapping from crates to targets?
    for (let crate_indices of permute(zeroToN(state.crates.length))) {
        let valid_permutation = true;
        for (let k = 0; k < state.crates.length; k++) {
            if (!couldMaybeBePushedFromAtoB(state, state.crates[crate_indices[k]], state.targets[k])) {
                valid_permutation = false;
                break;
            }
        }
        if (valid_permutation) {
            return false;
        }
    }
    return true;
}
function zeroToN(N) {
    let res = Array(N);
    for (let i = 0; i < N; i++) {
        res[i] = i;
    }
    return res;
}
function* permute(permutation) {
    var length = permutation.length, c = Array(length).fill(0), i = 1, k, p;
    yield permutation.slice();
    while (i < length) {
        if (c[i] < i) {
            k = i % 2 && c[i];
            p = permutation[i];
            permutation[i] = permutation[k];
            permutation[k] = p;
            ++c[i];
            i = 1;
            yield permutation.slice();
        }
        else {
            c[i] = 0;
            ++i;
        }
    }
    // Memory efficient iteration through permutations:
    // for (var permutation of permute([1, 2, 3])) console.log(permutation);
}
/*
function generateTargetMap(state: SokobanState) {
 
}
*/
function generateForbiddenMap(state) {
    let result = [];
    for (let row = 0; row < state.h; row++) {
        let cur_row = [];
        for (let col = 0; col < state.w; col++) {
            cur_row.push(!state.targets.some(target => {
                return couldMaybeBePushedFromAtoB(state, { x: col, y: row }, target);
            }));
            // cur_row.push(couldMaybeBePushedFromAtoB(state, { x: col, y: row }, { x: 2, y: 4 }));
        }
        result.push(cur_row);
    }
    return result;
}
function couldMaybeBePushedFromAtoB(state, posA, posB) {
    if (!validPos(state, posA))
        return false;
    let explored = rectGrid(false, state.w, state.h);
    let pending = [posA];
    while (pending.length > 0) {
        let curPos = pending.pop();
        if (eqVec(posB, curPos))
            return true;
        if (explored[curPos.y][curPos.x])
            continue;
        explored[curPos.y][curPos.x] = true;
        for (let k = 0; k < 4; k++) {
            const dir = DIRS[k];
            let newPos = addVec(curPos, dir);
            if (!validPos(state, newPos) || explored[newPos.y][newPos.x]) {
                continue;
            }
            let pushingFromPos = subVec(curPos, dir);
            if (validPos(state, pushingFromPos)) {
                pending.push(newPos);
            }
        }
    }
    return false;
}
function eqVec(a, b) {
    return a.x === b.x && a.y === b.y;
}
function addVec(a, b) {
    return { x: a.x + b.x, y: a.y + b.y };
}
function subVec(a, b) {
    return { x: a.x - b.x, y: a.y - b.y };
}
function rectGrid(fillValue, width, height) {
    let result = [];
    for (let row = 0; row < height; row++) {
        let cur_row = [];
        for (let col = 0; col < width; col++) {
            cur_row.push(fillValue);
        }
        result.push(cur_row);
    }
    return result;
}
export let State = { initialState, nextStates, isWon, id, isClearlyLost, drawState };
