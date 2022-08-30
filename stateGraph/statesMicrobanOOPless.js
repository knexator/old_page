// Example: Sokoban - Microban 1

export let State = {
  w: 4,
  h: 5,
  walls: [
    [false, false, false, false, false],
    [false, false, false, false, false],
    [true, true, false, false, true],
    [true, true, false, false, true]
  ],
  initialState: {
    player: { x: 1, y: 2 },
    crates: [
      { x: 0, y: 2 },
      { x: 2, y: 3 }
    ]
  }
}

State.isWon = function (state) {
  return (
    State.crateAt(state, { x: 0, y: 2 }) && State.crateAt(state, { x: 1, y: 0 })
  )
}

State.nextStates = function (state) {
  let result = {
    left: State.nextState(state, { x: -1, y: 0 }),
    right: State.nextState(state, { x: 1, y: 0 }),
    up: State.nextState(state, { x: 0, y: -1 }),
    down: State.nextState(state, { x: 0, y: 1 })
  }
  for (let key in result) {
    if (result[key] === false) {
      delete result[key]
    }
  }
  return result
}

State.id = function (state) {
  let result = `${state.player.x}:${state.player.y}`
  result += '[' + state.crates.map(c => `${c.x}:${c.y}`).join(',') + ']'
  return result
}

State.nextState = function (state, dir) {
  let new_p = {
    x: state.player.x + dir.x,
    y: state.player.y + dir.y
  }
  if (!State.validPos(new_p)) return false
  if (!State.crateAt(state, new_p)) {
    return { player: new_p, crates: state.crates }
  }
  let new_crate_pos = {
    x: new_p.x + dir.x,
    y: new_p.y + dir.y
  }
  if (!State.validPos(new_crate_pos) || State.crateAt(state, new_crate_pos))
    return false
  let new_crates = state.crates.map(c => {
    if (c.x == new_p.x && c.y == new_p.y) {
      return { x: new_crate_pos.x, y: new_crate_pos.y }
    } else {
      return { x: c.x, y: c.y }
    }
  })
  return { player: new_p, crates: new_crates }
}

State.crateAt = function (state, pos) {
  return state.crates.some(c => c.x == pos.x && c.y == pos.y)
}

// false if oob or wall
State.validPos = function (pos) {
  if (pos.x < 0 || pos.x >= State.w || pos.y < 0 || pos.y >= State.h) {
    return false
  }
  return !State.walls[pos.x][pos.y]
}

State.isClearlyLost = function (state) {
  return (
    state.crates[0].y === 0 ||
    state.crates[0].y === 4 ||
    state.crates[1].x === 0 ||
    state.crates[1].x === 3 ||
    state.crates[1].y === 4
  )
}
