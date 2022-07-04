// Example: Sokoban - Microban 1

class State {
  static w = 4
  static h = 5
  // notation: [x][y]
  static walls = [
    [false, false, false, false, false],
    [false, false, false, false, false],
    [true, true, false, false, true],
    [true, true, false, false, true]
  ]

  constructor (player, crates) {
    this.player = player
    this.crates = crates
  }

  isWon () {
    return this.crateAt({ x: 0, y: 2 }) && this.crateAt({ x: 1, y: 0 })
  }

  nextStates () {
    let result = {
      left: this.nextState({ x: -1, y: 0 }),
      right: this.nextState({ x: 1, y: 0 }),
      up: this.nextState({ x: 0, y: -1 }),
      down: this.nextState({ x: 0, y: 1 })
    }
    for (let key in result) {
      if (result[key] === false) {
        delete result[key]
      }
    }
    return result
  }

  id () {
    let result = `${this.player.x}:${this.player.y}`
    result += '[' + this.crates.map(c => `${c.x}:${c.y}`).join(',') + ']'
    return result
  }

  nextState (dir) {
    let new_p = {
      x: this.player.x + dir.x,
      y: this.player.y + dir.y
    }
    if (!State.validPos(new_p)) return false
    if (!this.crateAt(new_p)) {
      return new State(new_p, this.crates)
    }
    let new_crate_pos = {
      x: new_p.x + dir.x,
      y: new_p.y + dir.y
    }
    if (!State.validPos(new_crate_pos) || this.crateAt(new_crate_pos))
      return false
    let new_crates = this.crates.map(c => {
      if (c.x == new_p.x && c.y == new_p.y) {
        return { x: new_crate_pos.x, y: new_crate_pos.y }
      } else {
        return { x: c.x, y: c.y }
      }
    })
    return new State(new_p, new_crates)
  }

  crateAt (pos) {
    return this.crates.some(c => c.x == pos.x && c.y == pos.y)
  }

  // false if oob or wall
  static validPos (pos) {
    if (pos.x < 0 || pos.x >= State.w || pos.y < 0 || pos.y >= State.h) {
      return false
    }
    return !State.walls[pos.x][pos.y]
  }
}

var initialState = new State({ x: 1, y: 2 }, [
  { x: 0, y: 2 },
  { x: 2, y: 3 }
])
