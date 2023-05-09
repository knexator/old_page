// 0 = white
// 1 = blue
// 2 = red
const n_colors = 3;
const size = { x: 5, y: 5 };
const walls_vertical = [
    [-1, 2, 1, -1],
    [1, 2, 2, 1],
    [0, 2, 0, 1],
    [0, 1, 0, 1],
    [-1, 1, 2, -1],
];
const walls_horizontal = [
    [-1, 0, 0, 0, -1],
    [2, 1, 1, 0, 2],
    [1, 1, 2, 2, 0],
    [-1, 2, 0, 0, -1],
];
export function nextStates(state) {
    let result = {
        left: nextState(state, { x: -1, y: 0 }),
        right: nextState(state, { x: 1, y: 0 }),
        up: nextState(state, { x: 0, y: -1 }),
        down: nextState(state, { x: 0, y: 1 })
    };
    for (let key in result) {
        if (result[key] === false) {
            delete result[key];
        }
    }
    return result;
}
function nextState(state, dir) {
    let new_player_pos = {
        x: state.player_pos.x + dir.x,
        y: state.player_pos.y + dir.y
    };
    if (new_player_pos.x < 0 || new_player_pos.x >= size.x || new_player_pos.y < 0 || new_player_pos.y >= size.y) {
        return false;
    }
    let wall_color = (dir.y === 0) ?
        walls_vertical[state.player_pos.y][Math.floor(state.player_pos.x - .5 + dir.x * .5)] :
        walls_horizontal[Math.floor(state.player_pos.y - .5 + dir.y * .5)][state.player_pos.x];
    if (wall_color == -1) {
        // no wall
        return {
            player_pos: new_player_pos,
            player_color: state.player_color,
        };
    }
    else if (state.player_color == wall_color) {
        return {
            player_pos: new_player_pos,
            player_color: (state.player_color + 1) % n_colors,
        };
    }
    else {
        return false;
    }
}
export function isWon(state) {
    return state.player_pos.x == 4 && state.player_pos.y == 2 && state.player_color == 1;
}
export const initialState = {
    player_color: 0,
    player_pos: {
        x: 0,
        y: 2,
    },
};
export function stateId(state) {
    return `(${state.player_pos.x},${state.player_pos.y})-${state.player_color}`;
}
const offx = [-.1, .2, .1];
const offy = [-.2, .2, -.1];
export function stateToPos(state) {
    return {
        x: (state.player_pos.x - 2 + offx[state.player_color] * .5) * 100,
        y: (2 - state.player_pos.y + offy[state.player_color] * .5) * 100,
        z: (state.player_color - 1) * 100,
    };
}
