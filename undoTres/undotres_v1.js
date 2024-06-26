// @ts-nocheck

let canvas = document.getElementById('canvas')
let ctx = canvas.getContext('2d')

let TILE = 40
let OFFX = TILE
let OFFY = TILE

let input_queue = []
let turn_time = 0

let DEFAULT_PLAYER_INMUNE_LEVEL = 0
let TURN_SPEED = 0.3
let ALLOW_CHANGE_PLAYER = false
let ALLOW_CHANGE_CRATES = false
let ALLOW_EDITOR = false
let ALLOW_MACHINES = true
let ALLOW_CRATE_ON_TOP_OF_MACHINE = true
let ALLOW_MAGIC_INPUT = false
let KEEP_UNDOING_UNTIL_CRATE_MOVE = false
let DEFAULT_FORBID_OVERLAP = false
let KEY_RETRIGGER_TIME = 200

let goalSound = new Howl({
  src: ['sounds/goal.wav']
})
let wallSound = new Howl({
  src: ['sounds/wall.wav']
})
let stepSound = new Howl({
  src: ['sounds/step.wav']
})
let pushSound = new Howl({
  src: ['sounds/push.wav']
})
let winSound = new Howl({
  src: ['sounds/win.wav']
})
let holeSound = new Howl({
  src: ['sounds/hole.wav']
})
let undoSounds = [
  new Howl({
    src: ['sounds/undo1.wav']
  }),
  new Howl({
    src: ['sounds/undo2.wav']
  }),
  new Howl({
    src: ['sounds/undo3.wav']
  }),
  new Howl({
    src: ['sounds/undo4.wav']
  })
]
undoSounds[8] = undoSounds[0]
let restartSound = new Howl({
  src: ['sounds/restart.wav'],
  volume: 0.4
})

// let using_machine_n_turns = 0;
let using_machine_type = null

let COLORS = {
  'wall': '#909C6E', // '#006a9c #007ca8'
  'floor': '#696E4F', // '#803D7D #75366D'
  'floorWin': '#507f3d', // '#507f3d #437737'  // 437737
  'player': '#6EE745', // F07167 '#947BD3', // '#ffd080 #fe546f'
  'target': '#83765D', // #ff9e7d
  /* 'crate1': '#24d3f2', // 24d3f2
  'crate2': '#abff4f', // aaff54
  'crate3': '#ff3366' // ff245b */
  'crate1': '#F8CB58',
  'crate2': '#F8984E',
  'crate3': '#F8643F',
  'machine1': '#F5B512',  // E9C46A D2BA7F E9A90A
  'machine2': '#F46F0A', // E89A5E D09D76 E26709
  'machine3': '#EC3609' // E76F51 CD7E6A D83208
}
COLORS.background = COLORS.floor // #75366D

const wallSpr = str2spr(COLORS.wall, `\
00010
11111
01000
11111
00010`)
const playerSpr = str2spr(COLORS.player, `\
.000.
.010.
00000
.000.
.0.0.`)

const crateSpr1 = str2spr(COLORS.crate1, `\
.000.
00000
00000
00000
.000.`)
const crateSpr2 = str2spr(COLORS.crate2, `\
.000.
00000
00000
00000
.000.`)
const crateSpr1_a = str2spr(COLORS.crate1, `\
.0.0.
0.0.0
.0.0.
0.0.0
.0.0.`)
const crateSpr1_b = str2spr(COLORS.crate1, `\
..0..
.0.0.
0.0.0
.0.0.
..0..`)
const crateSpr2_a = str2spr(COLORS.crate2, `\
..0..
.0.0.
0.0.0
.0.0.
..0..`)
const crateSpr2_b = str2spr(COLORS.crate2, `\
.0.0.
0.0.0
.0.0.
0.0.0
.0.0.`)
/* const crateSpr3 = str2spr('#ff245b', `\
00000
0...0
0...0
0...0
00000`) */
const crateSpr3 = str2spr(COLORS.crate3, `\
.000.
00000
00000
00000
.000.`)
const crateSpr3_a = str2spr(COLORS.crate3, `\
...0.
.00..
0..00
.00..
...0.`)
const crateSpr3_b = str2spr(COLORS.crate3, `\
.00..
0..00
.00..
0..00
.00..`)
const crateSprs = [crateSpr1, crateSpr2, crateSpr3]

const targetSpr = str2spr(COLORS.target, `\
00.00
0...0
.....
0...0
00.00`)
const floorSpr = str2spr(COLORS.floor, `\
11111
10101
11011
10101
11111`)
const floorWinSpr = str2spr(COLORS.floorWin, `\
11111
10101
11011
10101
11111`)
const holeSpr = str2spr('#52174f', `\
00000
00000
00000
00000
00000`)
const sprMap = [floorSpr, wallSpr]
const machineSprs = [
  str2spr(COLORS.machine1, `\
00.00
0...0
.....
0...0
00.00`),
  str2spr(COLORS.machine2, `\
00.00
0...0
.....
0...0
00.00`),
  str2spr(COLORS.machine3, `\
00.00
0...0
.....
0...0
00.00`)
]

function str2spr (cols, str) {
  str = str.split('\n')
  let res = []
  for (let i = 0; i < 5; i++) {
    let row = []
    for (let j = 0; j < 5; j++) {
      row.push(Number(str[j][i]))
    }
    res.push(row)
  }
  return {colors: cols.split(' '), data: res}
}

function drawSpr (spr, i, j) {
  if (!spr) return
  ctx.fillStyle = spr.colors[0]
  let s = 0.22
  for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 5; y++) {
      if (!isNaN(spr.data[x][y])) {
        // ctx.fillStyle = spr.colors[spr.data[x][y]];
        s1 = x == 4 ? 0.2 : 0.22
        s2 = y == 4 ? 0.2 : 0.22
        ctx.fillRect((i + x * 0.2) * TILE + OFFX, (j + y * 0.2) * TILE + OFFY, TILE * s1, TILE * s2)
      }
    }
  }
}

function drawSprScaled (spr, i, j, scale_x = 1, scale_y = 1) {
  if (!spr) return
  ctx.fillStyle = spr.colors[0]
  let s = 0.22
  for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 5; y++) {
      if (!isNaN(spr.data[x][y])) {
        // ctx.fillStyle = spr.colors[spr.data[x][y]];
        s1 = x == 4 ? 0.2 : 0.22
        s2 = y == 4 ? 0.2 : 0.22
        ctx.fillRect((i + (1 - scale_x) / 2 + x * 0.2 * scale_x) * TILE + OFFX, (j + y * 0.2) * TILE + OFFY, TILE * s1 * scale_x, TILE * s2)
      }
    }
  }
}

function drawLevel (level) {
  let is_won = isWon(level)
  let geo = level.geo
  ctx.fillStyle = COLORS.wall
  if (ALLOW_EDITOR) {
    ctx.strokeRect(OFFX - 0.1 * TILE, OFFY - 0.1 * TILE, (level.w + 0.2) * TILE, (level.h + 0.2) * TILE)
  }
  for (let j = 0; j < geo.length; j++) {
    for (let i = 0; i < geo[0].length; i++) {
      if (geo[j][i]) {
        // drawSpr(wallSpr, i, j)
        ctx.fillRect(i * TILE + OFFX, j * TILE + OFFY, TILE, TILE)
      } else {
        // drawSpr(is_won ? floorWinSpr : floorSpr, i, j)
      }
    }
  }

  let sortedCrates = _.orderBy(
    level.crates,
    function (crate) {
      return -crate.inmune_history.at(-1)
    }
  )
  let crateSprsA = [crateSpr1_a, crateSpr2_a, crateSpr3_b]
  let crateSprsB = [crateSpr1_b, crateSpr2_b, crateSpr3_a]

  let forwardsT = Math.pow(1 - turn_time, 1 / 3)
  let backwardsT = Math.pow(1 - turn_time, 3)

  // only draw crates in holes
  sortedCrates.forEach(crate => {
    if (!crate.inHole.get()) return
    let state = crate.history[true_timeline_undos.length]
    let prevState = crate.history[true_timeline_undos.length - 1]
    if (prevState === undefined) prevState = state
    let inmune = crate.inmune_history[crate.inmune_history.length - 1]
    let crate_forward = get_times_directions(true_timeline_undos.length - 1)[inmune] == 1
    let ci = lerp(prevState[0], state[0], crate_forward ? forwardsT : backwardsT)
    let cj = lerp(prevState[1], state[1], crate_forward ? forwardsT : backwardsT)
    drawSpr(crateSprs[inmune], ci, cj)
  })
  sortedCrates.reverse()
  sortedCrates.forEach(crate => {
    if (!crate.inHole.get()) return
    let state = crate.history[true_timeline_undos.length]
    let prevState = crate.history[true_timeline_undos.length - 1]
    if (prevState === undefined) prevState = state
    let inmune = crate.inmune_history[crate.inmune_history.length - 1]
    let crate_forward = get_times_directions(true_timeline_undos.length - 1)[inmune] == 1
    let ci = lerp(prevState[0], state[0], crate_forward ? forwardsT : backwardsT)
    let cj = lerp(prevState[1], state[1], crate_forward ? forwardsT : backwardsT)
    drawSpr(crateSprsB[inmune], ci, cj)
  })
  sortedCrates.reverse()

  ctx.globalAlpha = 0.2
  ctx.fillStyle = 'black'
  level.holes.forEach(([i, j]) => {
    ctx.fillRect(i * TILE + OFFX, j * TILE + OFFY, TILE, TILE)
    // drawSpr(holeSpr, i, j);
  })
  ctx.globalAlpha = 1

  level.targets.forEach(([i, j]) => {
    drawSpr(targetSpr, i, j)
  })
  level.machines.forEach(([i, j, t]) => {
    drawSpr(machineSprs[t - 1], i, j)
  })

  let playerState = level.player.history[true_timeline_undos.length]
  let prevPlayerState = level.player.history[true_timeline_undos.length - 1]
  if (prevPlayerState === undefined) prevPlayerState = playerState
  let player_forward = get_times_directions(true_timeline_undos.length - 1)[0] == 1

  let pi = lerp(prevPlayerState[0], playerState[0], player_forward ? forwardsT : backwardsT)
  let pj = lerp(prevPlayerState[1], playerState[1], player_forward ? forwardsT : backwardsT)
  // drawSpr(playerSpr, pi, pj);

  // drawSpr(playerSpr, playerState[0], playerState[1]);
  // ctx.fillText("@", playerState[0]*TILE+OFFX, playerState[1]*TILE+OFFY);
  // result[playerState[1]][playerState[0]] = '@' + level.player.inmune_history.at(-1);
  // level.crates.forEach(crate => {
  sortedCrates.forEach(crate => {
    if (crate.inHole.get()) return
    let state = crate.history[true_timeline_undos.length]
    let prevState = crate.history[true_timeline_undos.length - 1]
    if (prevState === undefined) prevState = state
    let inmune = crate.inmune_history[crate.inmune_history.length - 1]
    let crate_forward = get_times_directions(true_timeline_undos.length - 1)[inmune] == 1
    let ci = lerp(prevState[0], state[0], crate_forward ? forwardsT : backwardsT)
    let cj = lerp(prevState[1], state[1], crate_forward ? forwardsT : backwardsT)
    drawSpr(crateSprs[inmune], ci, cj)
    // drawSpr(crateSprsA[inmune], ci, cj);
    // drawSpr(crateSpr, state[0], state[1]);
    // ctx.fillText((inmune+1).toString(), state[0]*TILE+OFFX, state[1]*TILE+OFFY);
    // result[state[1]][state[0]] += (inmune + 1).toString();
  })

  // let player_scale_x = player_forward ? (1 - turn_time) * .7 + .35 : (turn_time) * .7 + .35;
  // if (turn_time == 0) player_scale_x = 1;
  // player_scale_x = 1 - 6.66*player_scale_x + 15*player_scale_x*player_scale_x - 8.3*player_scale_x*player_scale_x*player_scale_x
  // drawSprScaled(playerSpr, pi, pj, player_scale_x, 1);
  drawSpr(playerSpr, pi, pj)
  sortedCrates.reverse()

  sortedCrates.forEach(crate => {
    if (crate.inHole.get()) return
    let state = crate.history[true_timeline_undos.length]
    let prevState = crate.history[true_timeline_undos.length - 1]
    if (prevState === undefined) prevState = state
    let inmune = crate.inmune_history[crate.inmune_history.length - 1]
    let crate_forward = get_times_directions(true_timeline_undos.length - 1)[inmune] == 1
    let ci = lerp(prevState[0], state[0], crate_forward ? forwardsT : backwardsT)
    let cj = lerp(prevState[1], state[1], crate_forward ? forwardsT : backwardsT)
    drawSpr(crateSprsB[inmune], ci, cj)
    // drawSpr(crateSpr, state[0], state[1]);
    // ctx.fillText((inmune+1).toString(), state[0]*TILE+OFFX, state[1]*TILE+OFFY);
    // result[state[1]][state[0]] += (inmune + 1).toString();
  })
}

function drawLevel2 (level) {
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = (TILE).toString() + 'px Courier New'
  let result = []
  let geo = level.geo
  for (let j = 0; j < geo.length; j++) {
    let row = []
    for (let i = 0; i < geo[0].length; i++) {
      /* let curSpr = geo[j][i] ? 1 : 0;
      drawSpr(sprMap[curSpr], i, j); */
      if (geo[j][i]) {
        // ctx.fillText("#", i*TILE+OFFX, j*TILE+OFFY);
        row.push('#')
      } else {
        // ctx.fillText(".", i*TILE+OFFX, j*TILE+OFFY);
        row.push('.')
      }
    }
    result.push(row)
  }
  level.targets.forEach(([i, j]) => {
    // drawSpr(targetSpr, i, j);
    // ctx.fillText("•", i*TILE+OFFX, j*TILE+OFFY);
    result[j][i] = '•'
  })
  level.doors.forEach(([i, j, c]) => {
    result[j][i] = c
  })
  level.buttons.forEach(([i, j, c]) => {
    result[j][i] = c
  })
  if (level.player_target !== null) {
    result[level.player_target[1]][level.player_target[0]] = '!'
  }
  level.machines.forEach(([i, j, c]) => {
    result[j][i] = 'JKLMN'[c - 1]
  })

  let playerState = level.player.history[level.player.history.length - 1]
  // drawSpr(playerSpr, playerState[0], playerState[1]);
  // ctx.fillText("@", playerState[0]*TILE+OFFX, playerState[1]*TILE+OFFY);
  result[playerState[1]][playerState[0]] = '@' + level.player.inmune_history.at(-1)

  level.crates.forEach(crate => {
    let state = crate.history[crate.history.length - 1]
    let inmune = crate.inmune_history[crate.inmune_history.length - 1]
    // drawSpr(crateSpr, state[0], state[1]);
    // ctx.fillText((crate.inmune+1).toString(), state[0]*TILE+OFFX, state[1]*TILE+OFFY);
    result[state[1]][state[0]] += (inmune + 1).toString()
  })

  for (let j = 0; j < result.length; j++) {
    for (let i = 0; i < result[0].length; i++) {
      let str = result[j][i]
      if (str.length > 1) {
        str = str.replace('.', '')
      }
      /* if (str.length > 1) {
        str = str.slice(1);
        ctx.fillText(str[Math.floor(Math.random() * str.length)], i*TILE+OFFX, j*TILE+OFFY);
      } else ctx.fillText(result[j][i], i*TILE+OFFX, j*TILE+OFFY); */
      for (let k = 0; k < str.length; k++) {
        let chr = str[k]
        if (chr >= 'P' && chr <= 'Z' && isDoorOpen(level, chr)) {
          ctx.fillStyle = 'red'
          ctx.fillText(str[k], (i + 0.5) * TILE + OFFX, (j + 0.5) * TILE + OFFY)
          ctx.fillStyle = 'black'
        } else {
          ctx.fillText(str[k], (i + 0.5) * TILE + OFFX, (j + 0.5) * TILE + OFFY)
        }
      }
    }
  }

  // ctx.fillText('Level ' + (cur_level_n + 1), canvas.width/2, (level.h+1)*TILE+OFFY);
  ctx.fillText(get_timeline_length(true_timeline_undos.length, 0).toString(), canvas.width / 2, (level.h + 1) * TILE + OFFY)
  ctx.fillText(get_timeline_length(true_timeline_undos.length, 1).toString(), canvas.width / 2, (level.h + 2) * TILE + OFFY)
  ctx.fillText(get_timeline_length(true_timeline_undos.length, 2).toString(), canvas.width / 2, (level.h + 3) * TILE + OFFY)
  ctx.fillText(get_timeline_length(true_timeline_undos.length, 3).toString(), canvas.width / 2, (level.h + 4) * TILE + OFFY)
}

function isDoorOpen (level, chr) {
  let playerState = level.player.history[level.player.history.length - 1]
  let pi = playerState[0]
  let pj = playerState[1]
  return level.buttons.some(([bi, bj, c]) => {
    return c == chr.toLowerCase() && ((pi == bi && pj == bj) || level.crates.some(crate => {
      let state = crate.history[crate.history.length - 1]
      return state[0] == bi && state[1] == bj
    }))
  })
}

function closedDoorAt (level, i, j) {
  let doors = level.doors.filter(([di, dj, c]) => {
    return i == di && j == dj
  })
  return !doors.every(([di, dj, c]) => isDoorOpen(level, c))
}

function openHoleAt (level, i, j) {
  return level.holes.some(([hi, hj]) => {
    return hi == i && hj == j
  }) && !level.crates.some(crate => {
    [ci, cj] = crate.history.at(-1)
    return ci == i && cj == j && crate.inHole.get()
  })
}

function machineAt (level, i, j) {
  return level.machines.find(([mi, mj, c]) => {
    return i == mi && j == mj
  })
}

function neutralTurn (level) {
  [pi, pj] = level.player.history.at(-1)
  level.player.history.push([pi, pj])
  level.player.inmune_history.push(level.player.inmune_history.at(-1))
  level.crates.forEach(crate => {
    [ci, cj] = crate.history.at(-1)
    crate.history.push([ci, cj])
    crate.inmune_history.push(crate.inmune_history.at(-1)) // unchecked
    crate.inHole.add()
  });

  fallFlying(level);
}

function isWon (level) {
  /* level.crates.forEach(crate => {

    //drawSpr(crateSpr, state[0], state[1]);
    //ctx.fillText((crate.inmune+1).toString(), state[0]*TILE+OFFX, state[1]*TILE+OFFY);
    result[state[1]][state[0]] += (crate.inmune+1).toString();
    }); */
  let crate_positions = level.crates.map(crate => {
    return crate.history[crate.history.length - 1]
  })
  let target_positions = level.targets

  return target_positions.every(([ti, tj]) => {
    return crate_positions.some(([ci, cj]) => {
      return ti == ci && tj == cj
    })
  }) && crate_positions.every(([ci, cj]) => {
    return target_positions.some(([ti, tj]) => {
      return ti == ci && tj == cj
    })
  })
}

function getCoveredGoals (level) {
  let crate_positions = level.crates.map(crate => {
    return crate.history[crate.history.length - 1]
  })
  let target_positions = level.targets

  return target_positions.filter(([ti, tj]) => {
    return crate_positions.some(([ci, cj]) => {
      return ti == ci && tj == cj
    })
  })
}

levels = hole_levels_raw.map(str => str2level(str))

let cur_level_n = 0
let solved_levels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]

function PropertyHistory (initial_value, inmune, extra = 0) {
  this.value = [initial_value]
  if (typeof inmune === 'number') inmune = [inmune]
  this.inmune = inmune
  for (let k = 0; k < extra; k++) {
    this.value.push(initial_value)
  }
}

PropertyHistory.prototype.get = function (tick = undefined) {
  if (tick === undefined) return this.value.at(-1)
  return this.value[get_original_tick_2(tick, this.inmune)]
}

PropertyHistory.prototype.add = function (value = undefined) {
  if (value === undefined) {
    this.value.push(this.value.at(-1))
  } else {
    this.value.push(value)
  }
}

function Movable (i, j, inmune, extra = 0, superSolid = DEFAULT_FORBID_OVERLAP) {
  this.history = [[i, j]]
  this.inmune_history = [inmune]
  this.superSolid = superSolid
  for (let k = 0; k < extra; k++) {
    this.history.push([i, j])
    this.inmune_history.push(inmune)
  }
  this.inHole = new PropertyHistory(false, this.inmune_history, extra)
  // this.inmune = inmune;
}

function str2level (str) {
  str = str.split('\n')
  let w = str[0].length
  let h = str.length
  let geo = []
  let player
  let crates = []
  let targets = []
  let buttons = []
  let doors = []
  let player_target = null
  let machines = []
  let holes = []
  for (let j = 0; j < h; j++) {
    let row = []
    for (let i = 0; i < w; i++) {
      let chr = str[j][i] // .toUpperCase();
      row.push(chr == '#')
      if (chr == '.' || chr == '#') continue

      if (chr == 'O' || chr == '@') {
        player = new Movable(i, j, DEFAULT_PLAYER_INMUNE_LEVEL)
        if (chr == '@') targets.push([i, j])
      } else if (chr == '*') {
        targets.push([i, j])
      } else if (chr >= '1' && chr <= '9') {
        crates.push(new Movable(i, j, chr - '1'))
      } else if (chr >= 'A' && chr <= 'I') {
        crates.push(new Movable(i, j, chr.charCodeAt(0) - 'A'.charCodeAt(0)))
        targets.push([i, j])
      } else if (chr >= 'p' && chr <= 'z') {
        buttons.push([i, j, chr])
      } else if (chr >= 'P' && chr <= 'Z') {
        doors.push([i, j, chr])
      } else if (chr == '!') {
        player_target = [i, j]
      } else if ('JKLMN'.indexOf(chr) != -1) {
        machines.push([i, j, 'JKLMN'.indexOf(chr) + 1])
      } else if (chr == '_') {
        holes.push([i, j])
      }
    }
    geo.push(row)
  }
  return { geo: geo, player: player, crates: crates, targets: targets, buttons: buttons, doors: doors, player_target: player_target, machines: machines, holes: holes, w: w, h: h }
}

let true_timeline_undos = []

let HALT = false

window.addEventListener('resize', e => {
  canvas.width = innerWidth
  canvas.height = innerHeight
  recalcTileSize()
})

window.addEventListener('load', e => {
  let undoButtons = document.getElementById('footer').children
  for (let k = 1; k < undoButtons.length; k++) {
    undoButtons[k].style.display = 'none'
  }
  loadLevel(0)
  window.dispatchEvent(new Event('resize'))
  window.requestAnimationFrame(draw)
})

function get_times_directions (tick) {
  tick += 1
  // console.log("trying to get tick: ", tick)
  let res = [1, 1, 1, 1, 1]
  if (tick <= 0) {
    // console.log("that's before time!");
    // return res;
  } else if (tick > true_timeline_undos.length) {
    // console.log("that's the far future!")
    // return res;
  } else if (true_timeline_undos[tick - 1] == 0) {
    // console.log("that's a good-ol-regular tick.")
    // return res;
  } else {
    let cur_depth = true_timeline_undos[tick - 1]
    for (let k = 0; k < cur_depth; k++) {
      res[k] = -1
    }
    let destination = do_local_travel(tick)
    let destination_directions = get_times_directions(destination)
    for (let k = 0; k < 5; k++) {
      res[k] *= destination_directions[k]
    }
  } return res
}

function get_timeline_length (tick, max_inmune_to) {
  // extremely wrong, lol
  let res = 1
  for (let i = 0; i < tick; i++) {
    // console.log("iteration i: ", i);
    let dirs = get_times_directions(i)
    res += dirs[max_inmune_to]
    /* if (true_timeline_undos[i] > max_inmune_to) {
      res -= 1;
    } else {
      res += 1;
    } */
  }
  return res
}

function do_local_travel (tick) {
  let travel_depth = true_timeline_undos[tick - 1]
  if (travel_depth === 0 || travel_depth === undefined) {
    return tick
  }
  let counter = 1
  let res = tick - 1
  while (counter > 0) {
    let cur_depth = true_timeline_undos[res - 1]
    if (cur_depth == travel_depth) {
      counter += 1
      res -= 1
    } else if (cur_depth < travel_depth || cur_depth === undefined) {
      counter -= 1
      res -= 1
    } else {
      // higher level travel over here!
      res = do_local_travel(res)
    }
  }
  return res
}

function get_original_tick (tick, max_inmune_to) {
  // for an object inmune to max_inmune levels of time travel,
  // when the real time is "tick", get the last real tick where
  // their free will was executed. Without time travel, it would
  // always be cur_tick itself; in Braid, for green objects, which
  // have max_inmune = 1, it will always be cur_tick (if there hasn't
  // been a "real undo") (or level 2, at least)

  if (tick <= 0) {
    // console.log("that's before time!");
    return tick
  } else if (tick > true_timeline_undos.length) {
    // console.log("that's the far future!")
    return tick
  } else if (true_timeline_undos[tick - 1] <= max_inmune_to) {
    // console.log("that's a good-ol-regular tick.")
    return tick
  } else {
    let travel_depth = true_timeline_undos[tick - 1]
    let counter = 1
    let res = tick - 1
    while (counter > 0 && res > 0) {
      let cur_depth = true_timeline_undos[res - 1]
      if (cur_depth == travel_depth) {
        counter += 1
        res -= 1
      } else if (cur_depth < travel_depth) {
        counter -= 1
        res -= 1
      } else {
        // higher level travel over here!
        res = get_original_tick(res, max_inmune_to)
      }
    }
    // console.log("time traveling to: ", res)
    return res
  }
}

function get_original_tick_2 (tick, inmune_history) {
  return get_original_tick(tick, inmune_history.at(-1))
}

function level2str (level) {
  let res = []
  let [pi, pj] = level.player.history.at(-1)
  for (let j = 0; j < level.h; j++) {
    let row = []
    for (let i = 0; i < level.w; i++) {
      if (level.geo[j][i]) {
        row.push('#')
      } else if (openHoleAt(level, i, j)) {
        row.push('_')
      } else {
        let isPlayer = i == pi && j == pj
        let isTarget = level.targets.some(([ti, tj]) => {
          return ti == i && tj == j
        })
        let cur = isPlayer ? (isTarget ? '@' : 'O') : (isTarget ? '*' : '.')
        row.push(cur)
      }
    }
    res.push(row)
  }
  level.machines.forEach(([i, j, l]) => {
    res[j][i] = 'JKLMN'[l - 1]
  })

  level.crates.forEach(crate => {
    let [ci, cj] = crate.history.at(-1)
    let n = crate.inmune_history.at(-1)
    let cur = res[cj][ci]
    res[cj][ci] = cur == '.' ? '123456789'[n] : 'ABCDEFGHI'[n]
  })
  return res.map(x => x.join('')).join('\n')
}

function loadFromText () {
  levels[cur_level_n] = str2level(document.getElementById('inText').value)
  loadLevel(cur_level_n)
}
function exportToText () {
  document.getElementById('inText').value = level2str(levels[cur_level_n])
}

function resizeLevel (a, b, c, d) {
  exportToText()
  let w = levels[cur_level_n].w
  let h = levels[cur_level_n].h
  let text = document.getElementById('inText').value
  let rows = text.split('\n')
  if (a > 0) {
    rows.unshift('.'.repeat(w))
  } else if (a < 0) {
    rows.shift()
  }
  if (b > 0) {
    rows = rows.map(row => '.' + row)
  } else if (b < 0) {
    rows = rows.map(row => row.slice(1))
  }
  if (c > 0) {
    rows.push('.'.repeat(w))
  } else if (c < 0) {
    rows.pop()
  }
  if (d > 0) {
    rows = rows.map(row => row + '.')
  } else if (d < 0) {
    rows = rows.map(row => row.slice(0, -1))
  }
  text = rows.join('\n')
  document.getElementById('inText').value = text
  loadFromText()
}

function resetLevel () {
  restartSound.play()
  loadLevel(cur_level_n)
}

function prevLevel () {
  if (cur_level_n > 0) {
    cur_level_n -= 1
    loadLevel(cur_level_n)
  }
}

function nextLevel () {
  if (cur_level_n < levels.length - 1) {
    cur_level_n += 1
    loadLevel(cur_level_n)
  }
}

function loadLevel (n) {
  cur_level_n = n
  true_timeline_undos = []
  let cur_level = levels[cur_level_n]
  cur_level.crates.forEach(crate => {
    crate.history.splice(1)
    crate.inmune_history.splice(1)
    crate.inHole.value.splice(1)
  })
  cur_level.player.history.splice(1)
  cur_level.player.inmune_history.splice(1)
  recalcTileSize()

  document.getElementById('prevLevelButton').disabled = (n == 0)
  document.getElementById('nextLevelButton').disabled = (cur_level_n >= levels.length - 1) || (solved_levels.indexOf(cur_level_n) == -1)
  document.getElementById('curLevelButton').innerHTML = 'Level ' + (n + 1)

  /* let undoButtons = document.getElementById("footer").children;
  if (n == 1) {
    undoButtons[1].style.display = '';
  } else if (n == 4) {
    undoButtons[2].style.display = '';
  } */
  let undoButtons = document.getElementById('footer').children
  if (n == 5) {
    undoButtons[1].style.display = ''
  }
}

function recalcTileSize () {
  let cur_level = levels[cur_level_n]
  let tile_w = Math.min(canvas.width / cur_level.w, 60)
  let tile_h = Math.min((canvas.height * 0.8) / cur_level.h, 60)
  TILE = Math.floor(Math.min(tile_h, tile_w))
  OFFX = Math.floor((canvas.width - (TILE * cur_level.w)) / 2)
  OFFY = Math.floor((canvas.height - (TILE * cur_level.h)) / 2)
}

function doUndo (n) {
  input_queue.push(n.toString())
}

function getKeyRetriggerTime (key) {
  if ('123456789'.indexOf(key) != -1) return KEY_RETRIGGER_TIME / 2
  // if ('wasd'.indexOf(key) != -1) return TURN_SPEED * 1000;
  if (key == 'z' || key == 'x') return KEY_RETRIGGER_TIME / 2
  return Infinity
}

function fallFlying(level) {
  // drop crates over holes
  let flying_crates = level.crates.filter(crate => {
    let [ci, cj] = crate.history.at(-1)
    return openHoleAt(level, ci, cj)
    // return !crate.inHole.get() &&
  })
  // console.log('flying crates: ', flying_crates);
  flying_crates.forEach(crate => {
    crate.inHole.value[crate.inHole.value.length - 1] = true
  })
  if (flying_crates.length > 0) holeSound.play();
}

function draw () {
  // ctx.clearRect(0, 0, canvas.width, canvas.height);
  // ctx.fillStyle = ALLOW_EDITOR ? COLORS.floorWin : COLORS.background // #75366D
  ctx.fillStyle = COLORS.background // #75366D
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  let now = Date.now()
  Object.keys(keyboard_last_pressed).forEach(key => {
    if (keyboard_last_pressed[key] === null) return
    // if (now - keyboard_last_pressed[key] > KEY_RETRIGGER_TIME) {
    if (now - keyboard_last_pressed[key] > getKeyRetriggerTime(key)) {
      input_queue.push(key)
      keyboard_last_pressed[key] = now
    }
  })

  let cur_level = levels[cur_level_n]

  let starts_won = isWon(cur_level)
  // console.log(turn_time);
  if (turn_time > 0) {
    turn_time -= TURN_SPEED
    turn_time = Math.max(turn_time, 0)
  } else {
    /* let cur_undo = 0;
    for (let i = 1; i < 10; i++) {
      if (isKeyDown(i.toString())) cur_undo = i;
    } */

    // if (input_queue.length == 0 && cur_undo == 0) {
    if (input_queue.length == 0) {
    // if (cur_undo == 0 && cur_di == 0 && cur_dj == 0 && !magic_stuff_input && !machine_input) {
      // nothing happened
    } else {
      let pressed_key = input_queue.shift()
      let cur_undo = 0
      for (let i = 1; i < 10; i++) {
        if (pressed_key == i.toString()) cur_undo = i
      }
      let cur_di = 0
      let cur_dj = 0
      if (pressed_key == ('a')) cur_di -= 1
      if (pressed_key == ('d')) cur_di += 1
      if (pressed_key == ('w')) cur_dj -= 1
      if (pressed_key == ('s')) cur_dj += 1

      let magic_stuff_input = pressed_key == 'e' && ALLOW_MAGIC_INPUT
      let machine_input_back = pressed_key == 'z' && ALLOW_MACHINES
      let machine_input_front = pressed_key == 'x' && ALLOW_MACHINES
      let machine_input = machine_input_back || machine_input_front

      let SKIP_TURN = false
      let SKIPPED_TURN = false

      let covered_goals = getCoveredGoals(cur_level)

      if (machine_input) {
        console.log('machine input')
        if (using_machine_type === null) {
          [pi, pj] = cur_level.player.history.at(-1)
          let machine = machineAt(cur_level, pi, pj)
          if (machine === undefined || machine_input_front) {
            // ignore this turn
            SKIP_TURN = true
          } else {
            console.log('using a machine')
            using_machine_type = machine[2]
            cur_undo = machine_input_back ? using_machine_type : 9
          }
        } else {
          cur_undo = machine_input_back ? using_machine_type : 9
        }
      } else {
        using_machine_type = null
      }

      true_timeline_undos.push(cur_undo)
      turn_time = 1

      let real_tick = true_timeline_undos.length

      let stuff = get_timeline_length(real_tick, 0)
      // console.log("stuff is ", stuff)
      if (stuff < 1 || SKIP_TURN) {
        true_timeline_undos.pop() // undo this turn
        turn_time = 0
        SKIPPED_TURN = true
      } else {
        // console.log("doing a turn");
        // travels = generate_travels(true_timeline_undos);

        player_tick = get_original_tick_2(real_tick, cur_level.player.inmune_history) // player isn't inmune to any undo level
        // console.log(player_tick);
        if (player_tick < 0) {
          console.log('NEVER HAPPENS')
          true_timeline_undos.pop() // undo this turn
          turn_time = 0
          SKIPPED_TURN = true
        } else {
          // if (cur_level.player.history[player_tick] !== undefined) { // player is undoing
          if (cur_undo > 0) {
            if (undoSounds[cur_undo - 1]) undoSounds[cur_undo - 1].play()
            if (cur_level.player.history[player_tick] !== undefined) { // player is being undoed
              [i, j] = cur_level.player.history[player_tick]
              cur_level.player.history[real_tick] = [i, j]
              cur_level.player.inmune_history[real_tick] = cur_level.player.inmune_history[player_tick]
            } else { // player is inmune to this undo level
              [i, j] = cur_level.player.history[real_tick - 1]
              cur_level.player.history[real_tick] = [i, j]
              cur_level.player.inmune_history[real_tick] = cur_level.player.inmune_history[real_tick - 1]
            }
            cur_level.crates.forEach(crate => {
              let crate_tick = get_original_tick_2(real_tick, crate.inmune_history)
              if (crate.history[crate_tick] !== undefined) {
                [i, j] = crate.history[crate_tick]
                crate.history[real_tick] = [i, j]
                crate.inmune_history[real_tick] = crate.inmune_history[crate_tick] // unchecked
                crate.inHole.value[real_tick] = crate.inHole.value[crate_tick] // unchecked
              } else {
                [i, j] = crate.history[real_tick - 1]
                crate.history[real_tick] = [i, j]
                crate.inmune_history[real_tick] = crate.inmune_history[real_tick - 1] // unchecked
                crate.inHole.value[real_tick] = crate.inHole.value[real_tick - 1]
              }
            })
            if (KEEP_UNDOING_UNTIL_CRATE_MOVE) {
              let boxes_moved = cur_level.crates.some(crate => {
                let [ci1, cj1] = crate.history.at(-1)
                let [ci2, cj2] = crate.history.at(-2)
                return ci1 != ci2 || cj1 != cj2
              })
              if (!boxes_moved) input_queue.push(cur_undo.toString())
            }
          } else if (magic_stuff_input) {
            neutralTurn(cur_level)
            cur_level.player.inmune_history[real_tick] = 2 // magic!
          } else { // player did an original move
            [pi, pj] = cur_level.player.history[real_tick - 1]
            let bad_move = cur_level.geo[pj + cur_dj][pi + cur_di] || closedDoorAt(cur_level, pi + cur_di, pj + cur_dj) || openHoleAt(cur_level, pi + cur_di, pj + cur_dj)
            // console.log(bad_move);
            if (bad_move) { // ignore this move
              wallSound.play()
              true_timeline_undos.pop()
              turn_time = 0
              SKIPPED_TURN = true
            } else {
              /* let pushing_crate = cur_level.crates.findIndex(crate => {
                [ci, cj] = crate.history[crate.history.length - 1];
                return ci == pi + cur_di && cj == pj + cur_dj && !crate.inHole.get();
              }); */
      			  let pushing_crates = cur_level.crates.reduce((acc, crate, index) => {
                [ci, cj] = crate.history[crate.history.length - 1]
                if (ci == pi + cur_di && cj == pj + cur_dj && !crate.inHole.get()) acc.push(index)
            				return acc
              }, [])
			  // console.log(pushing_crates);
              if (pushing_crates.length > 0) { // trying to push a crate
                let next_space_i = pi + cur_di * 2
                let next_space_j = pj + cur_dj * 2
                let occupied_by_wall = cur_level.geo[next_space_j][next_space_i] || closedDoorAt(cur_level, next_space_i, next_space_j)
                if (!ALLOW_CRATE_ON_TOP_OF_MACHINE) {
                  occupied_by_wall = occupied_by_wall || machineAt(cur_level, next_space_i, next_space_j)
                }
                if (occupied_by_wall) { // ignore this move
                  if (ALLOW_CHANGE_PLAYER) {
                    // Change inmunity of player!!
					          // arbitrary choice when pushing several crates, oops.
                    let pushing_inmune = cur_level.crates[pushing_crates[0]].inmune_history[real_tick - 1]
                    let player_inmune = cur_level.player.inmune_history[real_tick - 1]
                    if (player_inmune != pushing_inmune) {
                      neutralTurn(cur_level)
                      cur_level.player.inmune_history[real_tick] = pushing_inmune
                    } else { // ignore this move
                      true_timeline_undos.pop()
                      turn_time = 0
                      SKIPPED_TURN = true
                    }
                  } else {
                    wallSound.play()
                    true_timeline_undos.pop()
                    turn_time = 0
                    SKIPPED_TURN = true
                  }
                } else {
                  let occupied_by_hole = openHoleAt(cur_level, next_space_i, next_space_j)

                  if (occupied_by_hole) {
                    holeSound.play()
                    neutralTurn(cur_level)
                    cur_level.player.history[real_tick] = [pi + cur_di, pj + cur_dj]
                    pushing_crates.forEach(pushing_crate => {
          						cur_level.crates[pushing_crate].history[real_tick] = [next_space_i, next_space_j]
          						cur_level.crates[pushing_crate].inHole.value[real_tick] = true
          					})
                  } else {
                    let occupied_by_crate = cur_level.crates.findIndex(crate => {
                      [ci, cj] = crate.history[crate.history.length - 1]
                      return ci == next_space_i && cj == next_space_j && !crate.inHole.get()
                    })
                    if (occupied_by_crate != -1) {
                      if (ALLOW_CHANGE_CRATES) {
                        // Change inmunity of pushed crate!!
                        // arbitrary choice when pushing several crates, oops.
                        let pushing_inmune = cur_level.crates[pushing_crates[0]].inmune_history[real_tick - 1]
                        let pushed_inmune = cur_level.crates[occupied_by_crate].inmune_history[real_tick - 1]
                        if (pushing_inmune != pushed_inmune) {
                          // but first, the neutral turn stuff
                          neutralTurn(cur_level)
                          cur_level.crates[occupied_by_crate].inmune_history[real_tick] = pushing_inmune
                        } else { // ignore this move
                          true_timeline_undos.pop()
                          turn_time = 0
                          SKIPPED_TURN = true
                        }
                      } else {
                        wallSound.play()
                        true_timeline_undos.pop() // ignore this move
                        turn_time = 0
                        SKIPPED_TURN = true
                      }
                    } else {
                      pushSound.play()
                      neutralTurn(cur_level)
                      cur_level.player.history[real_tick] = [pi + cur_di, pj + cur_dj]
          					  pushing_crates.forEach(pushing_crate => {
  						          cur_level.crates[pushing_crate].history[real_tick] = [next_space_i, next_space_j]
          					  })
          					  console.log(pushing_crates)
                    }
                  }
                }
              } else {
                stepSound.play()
                neutralTurn(cur_level)
                cur_level.player.history[real_tick] = [pi + cur_di, pj + cur_dj]
              }
            }
          }
        }
      }

      let covered_goals_late = getCoveredGoals(cur_level)
      if (covered_goals_late.some(n => {
        return covered_goals.indexOf(n) == -1
      })) goalSound.play();

      // forbidden_overlap stuff
      [pi, pj] = cur_level.player.history.at(-1)
      let forbidden_overlap = cur_level.crates.some((crate, i) => {
        // TODO: add hole support ?? already done, maybe
        if (crate.superSolid) {
          if (crate.inHole.get()) {
            // overlaps with a crate outside the hole?
            let [c1i, c1j] = crate.history.at(-1)
            return cur_level.crates.some((crate2, j) => {
              if (i == j) return false
              let [c2i, c2j] = crate2.history.at(-1)
              return c2i == c1i && c2j == c1j && crate2.inHole.get()
            })
          } else {
            // overlaps with a crate outside a hole?
            let [c1i, c1j] = crate.history.at(-1)
            return (c1i == pi && c1j == pj) || cur_level.crates.some((crate2, j) => {
              if (i == j) return false
              let [c2i, c2j] = crate2.history.at(-1)
              return c2i == c1i && c2j == c1j && !crate2.inHole.get()
            })
          }
        } else {
          return false
        }
      })

      console.log(forbidden_overlap)

      if (forbidden_overlap) {
        // TODO: add hole support
        // forget last move
        true_timeline_undos.pop()
        turn_time = 0
        SKIPPED_TURN = true
        cur_level.player.history.pop()
        cur_level.player.inmune_history.pop()
        cur_level.crates.forEach(crate => {
          crate.history.pop()
          crate.inmune_history.pop()
          crate.inHole.value.pop()
        })
      }

      /* if (!SKIPPED_TURN && cur_undo == 0) {
        // drop crates over holes
        let flying_crates = cur_level.crates.filter(crate => {
          let [ci, cj] = crate.history.at(-1)
          return openHoleAt(cur_level, ci, cj)
          // return !crate.inHole.get() &&
        })
        // console.log('flying crates: ', flying_crates);
        flying_crates.forEach(crate => {
          crate.inHole.value[crate.inHole.value.length - 1] = true
        })
        if (flying_crates.length > 0) holeSound.play()
      } */
    }
  }

  if (ALLOW_EDITOR) {
    // EDITOR
    let mi = Math.round((mouse.x - OFFX) / TILE - 0.5)
    let mj = Math.round((mouse.y - OFFY) / TILE - 0.5)
    if (mi >= 0 && mi < cur_level.w && mj >= 0 && mj < cur_level.h) {
      if (isButtonDown(0)) {
        cur_level.geo[mj][mi] = true
      } else if (isButtonDown(1)) {
        cur_level.geo[mj][mi] = false
        cur_level.holes = cur_level.holes.filter(([i, j]) =>	i != mi || j != mj)
        cur_level.targets = cur_level.targets.filter(([i, j]) =>	i != mi || j != mj)
        cur_level.crates = cur_level.crates.filter(crate =>	{
          let [i, j] = crate.history.at(-1)
          return i != mi || j != mj
        })
        cur_level.machines = cur_level.machines.filter(([i, j, t]) =>	i != mi || j != mj)
      } else if (wasKeyPressed('f')) {
        cur_level.crates.push(new Movable(mi, mj, 0, extra = true_timeline_undos.length))
      } else if (wasKeyPressed('g')) {
        cur_level.crates.push(new Movable(mi, mj, 1, extra = true_timeline_undos.length))
      } else if (wasKeyPressed('c')) {
        cur_level.crates.push(new Movable(mi, mj, 2, extra = true_timeline_undos.length))
      } else if (wasKeyPressed('v')) {
        cur_level.crates.push(new Movable(mi, mj, 3, extra = true_timeline_undos.length))
      } else if (wasKeyPressed('p')) {
        cur_level.buttons.push([mi, mj, 'p'])
      } else if (wasKeyPressed('P')) {
        cur_level.doors.push([mi, mj, 'P'])
      } else if (wasKeyPressed('q')) {
        cur_level.targets.push([mi, mj])
      } else if (wasKeyPressed('e')) {
        cur_level.holes.push([mi, mj])
      } else if (wasKeyPressed('i')) { // level sizing (smaller)
        resizeLevel(1, 0, 0, 0)
      } else if (wasKeyPressed('j')) {
        resizeLevel(0, 1, 0, 0)
      } else if (wasKeyPressed('k')) {
        resizeLevel(0, 0, 1, 0)
      } else if (wasKeyPressed('l')) {
        resizeLevel(0, 0, 0, 1)
      } else if (wasKeyPressed('I')) { // level sizing (bigger)
        resizeLevel(-1, 0, 0, 0)
      } else if (wasKeyPressed('J')) {
        resizeLevel(0, -1, 0, 0)
      } else if (wasKeyPressed('K')) {
        resizeLevel(0, 0, -1, 0)
      } else if (wasKeyPressed('L')) {
        resizeLevel(0, 0, 0, -1)
      } else if (wasKeyPressed('b')) { // undo machines
        cur_level.machines.push([mi, mj, 1])
      } else if (wasKeyPressed('n')) {
        cur_level.machines.push([mi, mj, 2])
      } else if (wasKeyPressed('m')) {
        cur_level.machines.push([mi, mj, 3])
      }
    }
  }

  let is_won = isWon(cur_level)
  if (is_won) {
    if (solved_levels.indexOf(cur_level_n) == -1) solved_levels.push(cur_level_n)

    document.getElementById('nextLevelButton').disabled = (cur_level_n >= levels.length - 1)

    ctx.fillStyle = COLORS.floorWin // "#437737";
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'black'

    if (!starts_won) winSound.play()

    if (wasKeyPressed(' ') && cur_level_n < levels.length - 1) {
      // loadLevel(cur_level_n + 1);
      nextLevel()
      cur_level = levels[cur_level_n]
    }
  }

  if (wasKeyPressed('r')) {
    resetLevel()
    // loadLevel(cur_level_n);
    cur_level = levels[cur_level_n]
  }

  // cheat
  /* if (wasKeyPressed('ñ') && cur_level_n < levels.length - 1) {
    nextLevel();
    cur_level = levels[cur_level_n];
  } */

  drawLevel(cur_level)

  /* if (wasButtonPressed(0)) console.log("0 pressed");
  if (isButtonDown(0)) console.log("0 down");
  if (wasButtonReleased(0)) console.log("0 unpressed");

  if (wasKeyPressed('a')) console.log("a pressed");
  if (isKeyDown('a')) console.log("a down");
  if (wasKeyReleased('a')) console.log("a unpressed"); */
  // if (wasKeyPressed('q')) HALT = true;

  mouse_prev = Object.assign({}, mouse)
  mouse.wheel = 0
  keyboard_prev = Object.assign({}, keyboard)
  if (!HALT) window.requestAnimationFrame(draw)
}

window.addEventListener('mousemove', e => _mouseEvent(e))
window.addEventListener('mousedown', e => _mouseEvent(e))
window.addEventListener('mouseup', e => _mouseEvent(e))
// document.onContextMenu = e => e.preventDefault();

function _mouseEvent (e) {
  mouse.x = e.clientX
  mouse.y = e.clientY
  mouse.buttons = e.buttons
  if (!ALLOW_EDITOR) e.preventDefault()
  return false
}

window.addEventListener('wheel', e => {
  let d = e.deltaY > 0 ? 1 : -1
  return mouse.wheel = d
})

let mouse = { x: 0, y: 0, buttons: 0, wheel: 0 }
let mouse_prev = Object.assign({}, mouse)

function isButtonDown (b) {
  return (mouse.buttons & (1 << b)) != 0
}

function wasButtonPressed (b) {
  return ((mouse.buttons & (1 << b)) !== 0) && ((mouse_prev.buttons & (1 << b)) === 0)
}

function wasButtonReleased (b) {
  return ((mouse.buttons & (1 << b)) === 0) && ((mouse_prev.buttons & (1 << b)) !== 0)
}

let keyboard = {}
let keyboard_prev = {}
let keyboard_last_pressed = {}

function keyMap (e) {
  // use key.code if key location is important
  if (ALLOW_EDITOR) return e.key
  if (e.key == 'ArrowLeft') return 'a'
  if (e.key == 'ArrowRight') return 'd'
  if (e.key == 'ArrowDown') return 's'
  if (e.key == 'ArrowUp') return 'w'
  return e.key.toLowerCase()
}

window.addEventListener('keydown', e => {
  if (e.repeat) return

  let k = keyMap(e)
  if ('wasdzx123456789'.indexOf(k) != -1) input_queue.push(k)
  keyboard[k] = true
  keyboard_last_pressed[k] = Date.now()
})

window.addEventListener('keyup', e => {
  let k = keyMap(e)
  keyboard[k] = false
  keyboard_last_pressed[k] = null
})

function isKeyDown (k) {
  return keyboard[k] || false
}

function wasKeyPressed (k) {
  let queue_pos = input_queue.findIndex(n => n == k)
  if (queue_pos == -1) return (keyboard[k] || false) && (!keyboard_prev[k] || false)
  input_queue.splice(queue_pos, 1)
  return true
}

function wasKeyReleased (k) {
  return (!keyboard[k] || false) && (keyboard_prev[k] || false)
}

document.addEventListener('swiped', function (e) {
  let dir2key = { 'left': 'a', 'right': 'd', 'up': 'w', 'down': 's' }
  let key = dir2key[e.detail.dir]
  input_queue.push(key)
  // alert(e.detail.dir); // swipe direction
})

// utility functions
function mod (n, m) {
  return ((n % m) + m) % m
}

function lerp (a, b, t) {
  return a * (1 - t) + b * t
}
