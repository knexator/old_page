// @ts-nocheck

let canvas = document.getElementById('canvas')
let ctx = canvas.getContext('2d')
// let canvasTxt = window.canvasTxt.default

let TILE = 40
let OFFX = TILE
let OFFY = TILE

let input_queue = []
let turn_time = 0
let screen_transition_turn = false
let level_transition_time = 0
let in_last_level = false
let intro_time = 1

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
let BACKGROUND_IS_WALL = true
let ENABLE_RESTART = false
let ENABLE_UNDO_2 = false
let ENABLE_UNDO_3 = false

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

let goalSound = new Howl({
  src: ['goal.wav']
})
let wallSound = new Howl({
  src: ['wall.wav']
})
let stepSound = new Howl({
  src: ['step.wav']
})
let pushSound = new Howl({
  src: ['push.wav']
})
let winSound = new Howl({
  src: ['win.wav']
})
let holeSound = new Howl({
  src: ['hole.wav']
})
let undoSounds = [
  new Howl({
    src: ['undo1.wav']
  }),
  new Howl({
    src: ['undo2.wav']
  }),
  new Howl({
    src: ['undo3.wav']
  }),
  new Howl({
    src: ['undo4.wav']
  })
]
undoSounds[8] = undoSounds[0]
let restartSound = new Howl({
  src: ['restart.wav'],
  volume: 0.4
})
let transitionSound = new Howl({
  src: ['transition.wav']
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
COLORS.true_background = '#5e5e5e' // COLORS.wall // #75366D
COLORS.transition = COLORS.floor // COLORS.wall // #75366D

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
  if (ALLOW_EDITOR) {
    ctx.strokeRect(OFFX - 0.1 * TILE, OFFY - 0.1 * TILE, (level.w + 0.2) * TILE, (level.h + 0.2) * TILE)
  }
  // ctx.fillStyle = COLORS.wall
  // ctx.fillStyle = BACKGROUND_IS_WALL ? COLORS.floor : COLORS.wall
  for (let j = 0; j < geo.length; j++) {
    for (let i = 0; i < geo[0].length; i++) {
      /* if (geo[j][i]) {
        // drawSpr(wallSpr, i, j)
        if (!BACKGROUND_IS_WALL) ctx.fillRect(i * TILE + OFFX, j * TILE + OFFY, TILE, TILE)
      } else {
        // drawSpr(is_won ? floorWinSpr : floorSpr, i, j)
        if (BACKGROUND_IS_WALL) ctx.fillRect(i * TILE + OFFX, j * TILE + OFFY, TILE, TILE)
      } */
      if (geo[j][i] == 1) {
        ctx.fillStyle = COLORS.wall
        ctx.fillRect(i * TILE + OFFX, j * TILE + OFFY, TILE, TILE)
      } else if (geo[j][i] == 0) {
        ctx.fillStyle = COLORS.floor
        ctx.fillRect(i * TILE + OFFX, j * TILE + OFFY, TILE, TILE)
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
    let state = crate.history.at(-1)
    let prevState = crate.history.at(-2)
    if (prevState === undefined) prevState = state
    let inmune = crate.inmune_history.at(-1)
    let crate_forward = get_times_directions(crate.history.length - 2)[inmune] == 1
    let ci = lerp(prevState[0], state[0], crate_forward ? forwardsT : backwardsT)
    let cj = lerp(prevState[1], state[1], crate_forward ? forwardsT : backwardsT)
    drawSpr(crateSprs[inmune], ci, cj)
  })
  sortedCrates.reverse()
  sortedCrates.forEach(crate => {
    if (!crate.inHole.get()) return
    let state = crate.history.at(-1)
    let prevState = crate.history.at(-2)
    if (prevState === undefined) prevState = state
    let inmune = crate.inmune_history.at(-1)
    let crate_forward = get_times_directions(crate.history.length - 2)[inmune] == 1
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

  /* level.targets.forEach(([i, j]) => {
    drawSpr(targetSpr, i, j)
  }) */
  level.machines.forEach(([i, j, t]) => {
    drawSpr(machineSprs[t - 1], i, j)
  })

  let playerState = level.player.history.at(-1)
  let prevPlayerState = level.player.history.at(-2)
  if (prevPlayerState === undefined) {
    // prevPlayerState = playerState
    prevPlayerState = [playerState[0] - level.enter[0], playerState[1] - level.enter[1]]
    // backwardsT = 1 - turn_time;
    forwardsT = Math.pow(1 - level_transition_time * 2, 1 / 2)
    // forwardsT = 1 - level_transition_time * 2
  }
  let player_forward = get_times_directions(level.player.history.length - 2)[0] == 1
  // console.log(player_forward);

  let pi = lerp(prevPlayerState[0], playerState[0], player_forward ? forwardsT : backwardsT)
  let pj = lerp(prevPlayerState[1], playerState[1], player_forward ? forwardsT : backwardsT)
  // drawSpr(playerSpr, pi, pj);

  // drawSpr(playerSpr, playerState[0], playerState[1]);
  // ctx.fillText("@", playerState[0]*TILE+OFFX, playerState[1]*TILE+OFFY);
  // result[playerState[1]][playerState[0]] = '@' + level.player.inmune_history.at(-1);
  // level.crates.forEach(crate => {
  sortedCrates.forEach(crate => {
    if (crate.inHole.get()) return
    let state = crate.history.at(-1)
    let prevState = crate.history.at(-2)
    if (prevState === undefined) prevState = state
    let inmune = crate.inmune_history.at(-1)
    // let crate_forward = get_times_directions(true_timeline_undos.length - 1)[inmune] == 1
    let crate_forward = get_times_directions(crate.history.length - 2)[inmune] == 1
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
    let state = crate.history.at(-1)
    let prevState = crate.history.at(-2)
    if (prevState === undefined) prevState = state
    let inmune = crate.inmune_history.at(-1)
    let crate_forward = get_times_directions(crate.history.length - 2)[inmune] == 1
    let ci = lerp(prevState[0], state[0], crate_forward ? forwardsT : backwardsT)
    let cj = lerp(prevState[1], state[1], crate_forward ? forwardsT : backwardsT)
    drawSpr(crateSprsB[inmune], ci, cj)
    // drawSpr(crateSpr, state[0], state[1]);
    // ctx.fillText((inmune+1).toString(), state[0]*TILE+OFFX, state[1]*TILE+OFFY);
    // result[state[1]][state[0]] += (inmune + 1).toString();
  })

  drawEntranceGradient(level)
  drawExitGradient(level)

  if (level.extraDrawCode) level.extraDrawCode()
}

function drawIntroText () {
  if (intro_time > 0) {
    ctx.fillStyle = hexToRGB(COLORS.wall, 1-intro_time)
  } else {
    ctx.fillStyle = COLORS.wall
  }
  /* canvasTxt.fontSize = TILE * 2.5
  canvasTxt.font = 'Salsa'
  canvasTxt.drawText(ctx, 'Undo Tres', OFFX - TILE * 0.5, OFFY - TILE * 0.5, TILE * 6, TILE * 6)
  */
  /* canvasTxt.fontSize = TILE * 0.45
  canvasTxt.font = 'Verdana'
  canvasTxt.drawText(ctx, 'WASD/Arrow Keys to Move', OFFX + TILE * 9, OFFY + TILE * 7.2, TILE * 4, TILE * 1)
  canvasTxt.drawText(ctx, 'Z to undo', OFFX + TILE * 9, OFFY + TILE * 8.1, TILE * 4, TILE * 1) */

  ctx.textAlign = 'center'
  // ctx.textBaseline = "middle";
  ctx.font = (TILE * 2.5).toString() + 'px Salsa'
  /* ctx.textAlign = "center";
  ctx.textBaseline = "middle"; */
  ctx.fillText('Undo', OFFX + TILE * 2.5, OFFY + TILE * 2.5)
  ctx.fillText('Tres', OFFX + TILE * 2.5, OFFY + TILE * 5)

  ctx.fillStyle = COLORS.wall
  ctx.font = (TILE * 0.45).toString() + 'px Verdana'
  ctx.fillText('Arrow Keys or', OFFX + TILE * 11, OFFY + TILE * 7.6)
  ctx.fillText('WASD to Move', OFFX + TILE * 11, OFFY + TILE * 8.1)

  ctx.fillText('Z to Undo', OFFX + TILE * 11, OFFY + TILE * 8.8)
}

function drawSecondText () {
  ctx.fillStyle = COLORS.wall

  // canvasTxt.fontSize = TILE * 0.5
  /* canvasTxt.fontSize = TILE * 0.45;
  canvasTxt.font = "Verdana"
  canvasTxt.drawText(ctx,"Z to undo",OFFX+TILE*9,OFFY+TILE*7.2,TILE*4,TILE*1); */
  // canvasTxt.drawText(ctx,"X to <i>really</i> undo",OFFX+TILE*9,OFFY+TILE*8.1,TILE*4,TILE*1);
  ctx.textAlign = 'left'
  // console.log(OFFX, OFFY, TILE)
  // let x = OFFX + TILE * 4.2
  let x = OFFX + TILE * 4.2
  let y = OFFY + TILE * 5.6
  ctx.font = (TILE * 0.5).toString() + 'px Verdana'
  ctx.fillText('Z to undo', x, y)

  if (ENABLE_RESTART) {
    y += TILE * 0.6
    ctx.fillText('R to reset', x, y)
    ENABLE_RESTART = true
  } else {
    let moved_orange = levels[1].crates[1].history.findIndex(([i, j]) => i != 4 || j != 2)
    if (moved_orange == -1) return
    let balance = 0;
    for (let k = moved_orange; k < true_timeline_undos.length; k++) {
      if (true_timeline_undos[k] == 0) {
        balance += 1
      } else {
        balance -= 1
      }
    }
    if (balance < -2) {
      setTimeout(function () { ENABLE_RESTART = true }, 1000)
    }
    /*let time_0 = Math.max(get_timeline_length(true_timeline_undos.length, 0), 1)
    let [oi, oj] = levels[1].crates[1].history[time_0 - 1]
    let [oi2, oj2] = levels[1].crates[1].history.at(-1)
    if (oi != oi2 || oj != oj2) {
      // ENABLE_RESTART = true
      setTimeout(function () { ENABLE_RESTART = true }, 1000)
    }*/
    /* let time_1 = get_timeline_length(true_timeline_undos.length, 1)
    if (time_1 - time_0 > 4) {
      ENABLE_RESTART = true
    } */
  }

  /* let [c1i, c1j]
  (c1i == 3 && c1j == 2) */

  /* let t1 = get_timeline_length(true_timeline_undos.length, 0)
  let t2 = get_timeline_length(true_timeline_undos.length, 1)
  console.log(t1, t2) */
  /* let should_show_extra = true

  if (should_show_extra) {
    y += TILE * 0.6

    let text1 = 'X to '
    let text2 = 'really'
    let text3 = ' undo'
    let text1Width = ctx.measureText(text1).width
    let text2Width = ctx.measureText(text2).width

    ctx.fillText(text1, x, y)
    ctx.fillText(text3, x + text1Width + text2Width, y)
    ctx.font = 'italic ' + (TILE * 0.5).toString() + 'px Verdana'
    ctx.fillText(text2, x + text1Width, y)
  } */
}

function drawXtoReallyText () {
  ctx.fillStyle = COLORS.wall

  // canvasTxt.fontSize = TILE * 0.5
  /* canvasTxt.fontSize = TILE * 0.45;
  canvasTxt.font = "Verdana"
  canvasTxt.drawText(ctx,"Z to undo",OFFX+TILE*9,OFFY+TILE*7.2,TILE*4,TILE*1); */
  // canvasTxt.drawText(ctx,"X to <i>really</i> undo",OFFX+TILE*9,OFFY+TILE*8.1,TILE*4,TILE*1);
  ctx.textAlign = 'left'
  // console.log(OFFX, OFFY, TILE)
  // let x = OFFX + TILE * 4.2
  let x = OFFX + TILE * 3.2
  let y = OFFY - TILE * 0.2
  /*let x = OFFX + TILE * 5.0
  let y = OFFY + TILE * 0.7*/
  ctx.font = (TILE * 0.5).toString() + 'px Verdana'

  let text1 = 'X to '
  let text2 = 'really'
  let text3 = ' undo'
  let text1Width = ctx.measureText(text1).width
  let text2Width = ctx.measureText(text2).width

  ctx.fillText(text1, x, y)
  ctx.fillText(text3, x + text1Width + text2Width, y)
  ctx.font = 'italic ' + (TILE * 0.5).toString() + 'px Verdana'
  ctx.fillText(text2, x + text1Width, y)
}

function hexToRGB (hex, alpha) {
  var r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16)

  if (alpha !== undefined) {
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')'
  } else {
    return 'rgb(' + r + ', ' + g + ', ' + b + ')'
  }
}

function drawEntranceGradient (level) {
  let [ei, ej] = level.player.history[0]
  let [di, dj] = level.enter

  if (entranceGradient === undefined) {
    entranceGradient = ctx.createLinearGradient(
        OFFX + TILE * (ei + 0.5 - di * -0.5), OFFY + TILE * (ej + 0.5 - dj * -0.5),
        OFFX + TILE * (ei + 0.5 - di * 2.5), OFFY + TILE * (ej + 0.5 - dj * 2.5))
    /* entranceGradient.addColorStop(0.33, hexToRGB(COLORS.floor, 0.0))
    entranceGradient.addColorStop(0.66, COLORS.true_background) */
    entranceGradient.addColorStop(0.2, hexToRGB(COLORS.floor, 0.0))
    entranceGradient.addColorStop(0.53, COLORS.true_background)
    console.log('computing gradient')
  }
  ctx.fillStyle = entranceGradient
  ctx.fillRect(
      OFFX + TILE * Math.min(ei, ei - 2 * di), OFFY + TILE * Math.min(ej, ej - 2 * dj),
      TILE * (1 + 2 * Math.abs(di)), TILE * (1 + 2 * Math.abs(dj)))

  if (entranceGradient2 === undefined) {
    entranceGradient2 = ctx.createLinearGradient(
        OFFX + TILE * (ei + 0.5 - di * -0.5), OFFY + TILE * (ej + 0.5 - dj * -0.5),
        OFFX + TILE * (ei + 0.5 - di * 2.5), OFFY + TILE * (ej + 0.5 - dj * 2.5))
    entranceGradient2.addColorStop(0.53, COLORS.wall)
    entranceGradient2.addColorStop(0.86, COLORS.true_background)
  }
  ctx.fillStyle = entranceGradient2
  notI = Math.abs(dj)
  notJ = Math.abs(di)
  ctx.fillRect(
      OFFX + TILE * Math.min(ei - notI, ei - di * 2 - notI), OFFY + TILE * Math.min(ej - notJ, ej - dj * 2 - notJ),
      TILE * (1 + 2 * Math.abs(di)), TILE * (1 + 2 * Math.abs(dj)))
  ctx.fillRect(
      OFFX + TILE * Math.min(ei + notI, ei - di * 2 + notI), OFFY + TILE * Math.min(ej + notJ, ej - dj * 2 + notJ),
      TILE * (1 + 2 * Math.abs(di)), TILE * (1 + 2 * Math.abs(dj)))
}

function drawExitGradient (level) {
  let [ei, ej] = level.targets[0]
  let [di, dj] = level.exit
  di *= -1
  dj *= -1

  if (exitGradient === undefined) {
    exitGradient = ctx.createLinearGradient(
        OFFX + TILE * (ei + 0.5 - di * -0.5), OFFY + TILE * (ej + 0.5 - dj * -0.5),
        OFFX + TILE * (ei + 0.5 - di * 2.5), OFFY + TILE * (ej + 0.5 - dj * 2.5))
    exitGradient.addColorStop(0.0, hexToRGB(COLORS.floor, 0.0))
    exitGradient.addColorStop(0.33, COLORS.true_background)
    console.log('computing gradient')
  }
  ctx.fillStyle = exitGradient
  ctx.fillRect(
      OFFX + TILE * Math.min(ei, ei - 2 * di), OFFY + TILE * Math.min(ej, ej - 2 * dj),
      TILE * (1 + 2 * Math.abs(di)), TILE * (1 + 2 * Math.abs(dj)))

  if (exitGradient2 === undefined) {
    exitGradient2 = ctx.createLinearGradient(
        OFFX + TILE * (ei + 0.5 - di * -0.5), OFFY + TILE * (ej + 0.5 - dj * -0.5),
        OFFX + TILE * (ei + 0.5 - di * 2.5), OFFY + TILE * (ej + 0.5 - dj * 2.5))
    exitGradient2.addColorStop(0.33, COLORS.wall)
    exitGradient2.addColorStop(0.66, COLORS.true_background)
  }
  ctx.fillStyle = exitGradient2
  notI = Math.abs(dj)
  notJ = Math.abs(di)
  ctx.fillRect(
      OFFX + TILE * Math.min(ei - notI, ei - di * 2 - notI), OFFY + TILE * Math.min(ej - notJ, ej - dj * 2 - notJ),
      TILE * (1 + 2 * Math.abs(di)), TILE * (1 + 2 * Math.abs(dj)))
  ctx.fillRect(
      OFFX + TILE * Math.min(ei + notI, ei - di * 2 + notI), OFFY + TILE * Math.min(ej + notJ, ej - dj * 2 + notJ),
      TILE * (1 + 2 * Math.abs(di)), TILE * (1 + 2 * Math.abs(dj)))
}

function drawScreen () {
  // ctx.fillStyle = BACKGROUND_IS_WALL ? COLORS.wall : COLORS.floor
  if (in_last_level) {
    ctx.fillStyle = COLORS.true_background
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = COLORS.wall
    ctx.textAlign = 'center'
    // ctx.textBaseline = "middle";
    ctx.font = (TILE * 4.5).toString() + 'px Salsa'

    //let x = OFFX + TILE * 6 - level_transition_time * 2 * canvas.width
    let x = OFFX + TILE * 6
    ctx.fillText('Thanks for', x, OFFY + TILE * 4)
    ctx.fillText('Playing!', x, OFFY + TILE * 8)

    if (level_transition_time > 0) {
      ctx.fillStyle = COLORS.transition
      //ctx.fillRect((1 - level_transition_time * 2) * canvas.width, 0, canvas.width, canvas.height)
      ctx.fillRect(0, 0, level_transition_time * 2 * canvas.width, canvas.height)
    }
    return
  }

  ctx.fillStyle = COLORS.true_background
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  if (level_transition_time > 0.5) {
    let t = (level_transition_time - 0.5) * 2
    let cur_level = levels[cur_level_n]
    /* ctx.save()
    ctx.beginPath()
    ctx.rect(OFFX, OFFY, cur_level.w * TILE, cur_level.h * TILE)
    ctx.clip() */
    drawLevel(cur_level)
    // ctx.restore()
    ctx.fillStyle = COLORS.transition // ctx.fillStyle = COLORS.background; // 'black' floorWin

    let di = cur_level.exit[0]
    let dj = cur_level.exit[1]
    let x_start = di < 0 ? canvas.width * t : 0
    let x_end = di > 0 ? canvas.width * (1 - t) : canvas.width
    let y_start = dj < 0 ? canvas.height * t : 0
    let y_end = dj > 0 ? canvas.height * (1 - t) : canvas.height
    ctx.fillRect(x_start, y_start, x_end - x_start, y_end - y_start)
  } else if (level_transition_time > 0) {
    turn_time = 1
    let t = level_transition_time * 2
    let cur_level = levels[cur_level_n]
    /* ctx.save()
    ctx.beginPath()
    ctx.rect(OFFX, OFFY, cur_level.w * TILE, cur_level.h * TILE)
    ctx.clip() */
    drawLevel(cur_level)
    // ctx.restore()
    ctx.fillStyle = COLORS.transition // ctx.fillStyle = COLORS.background; // 'black'
    // console.log("intermediate")
    let di = cur_level.enter[0]
    let dj = cur_level.enter[1]
    let x_start = di > 0 ? canvas.width * (1 - t) : 0
    // let x_end = di < 0 ? canvas.width * (1 - t) : canvas.width;
    let x_end = di < 0 ? canvas.width * t : canvas.width
    let y_start = dj > 0 ? canvas.height * (1 - t) : 0
    let y_end = dj < 0 ? canvas.height * t : canvas.height

    ctx.fillRect(x_start, y_start, x_end - x_start, y_end - y_start)
  } else {
    let cur_level = levels[cur_level_n]
    /* ctx.save()
    ctx.beginPath()
    ctx.rect(OFFX, OFFY, cur_level.w * TILE, cur_level.h * TILE)
    ctx.clip() */
    drawLevel(cur_level)
    // ctx.restore()
    // drawLevel(cur_level)
  }
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
  })

  fallFlying(level)
}

function isWon (level) {
  /* level.crates.forEach(crate => {

    //drawSpr(crateSpr, state[0], state[1]);
    //ctx.fillText((crate.inmune+1).toString(), state[0]*TILE+OFFX, state[1]*TILE+OFFY);
    result[state[1]][state[0]] += (crate.inmune+1).toString();
    }); */
  /* let crate_positions = level.crates.map(crate => {
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
  }) */

  let [pi, pj] = level.player.history.at(-1)
  let [ti, tj] = level.targets[0]
  return pi == ti && pj == tj
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

levels = hole_levels_raw.map(([str, enter, exit]) => str2level(str, enter, exit))
levels[0].extraDrawCode = drawIntroText
levels[1].extraDrawCode = drawSecondText
levels[5].extraDrawCode = drawXtoReallyText

let cur_level_n = 0
let solved_levels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]

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

function str2level (str, enter, exit) {
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
      // row.push(chr == '#')
      if (chr == '#') {
        row.push(1)
        continue
      } else if (chr == ',') {
        row.push(2)
        continue
      } else {
        row.push(0)
      }
      if (chr == '.' || chr == '#' || chr == ',') continue

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
      } else if (chr == '-') {
        holes.push([i, j])
        targets.push([i, j])
      }
    }
    geo.push(row)
  }
  let level = { geo: geo, player: player, crates: crates, targets: targets, buttons: buttons, doors: doors, player_target: player_target, machines: machines, holes: holes, w: w, h: h, enter: enter, exit: exit }
  /* neutralTurn(level);
  level.player.history[0][0] -= enter[0];
  level.player.history[0][1] -= enter[1]; */

  /* level.crates.forEach(crate => {
    crate.history.splice(1)
    crate.inmune_history.splice(1)
    crate.inHole.value.splice(1)
  })
  level.player.history.splice(1)
  level.player.inmune_history.splice(1) */

  return level
}

let true_timeline_undos = []

let HALT = false

window.addEventListener('resize', e => {
  canvas.width = innerWidth
  canvas.height = innerHeight
  recalcTileSize()
  if (in_last_level) drawScreen()
})

window.addEventListener('load', e => {
  loadLevel(0) // 152 159 60
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
  } else {
    in_last_level = true
    recalcTileSize()
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
  turn_time = 1
  /* let undoButtons = document.getElementById("footer").children;
  if (n == 1) {
    undoButtons[1].style.display = '';
  } else if (n == 4) {
    undoButtons[2].style.display = '';
  } */
  if (n == 4) ENABLE_UNDO_2 = true
}

function recalcTileSize (level) {
  if (in_last_level) {
    let tile_w = Math.min(canvas.width / (12), 60)
    let tile_h = Math.min(canvas.height / (12), 60)
    TILE = Math.floor(Math.min(tile_h, tile_w))
    OFFX = Math.floor((canvas.width - (TILE * 12)) / 2)
    OFFY = Math.floor((canvas.height - (TILE * 12)) / 2)
    return;
  }
  if (!level) level = levels[cur_level_n]
  let tile_w = Math.min(canvas.width / (level.w), 60)
  let tile_h = Math.min(canvas.height / (level.h), 60)
  TILE = Math.floor(Math.min(tile_h, tile_w))
  OFFX = Math.floor((canvas.width - (TILE * level.w)) / 2)
  OFFY = Math.floor((canvas.height - (TILE * level.h)) / 2)
  entranceGradient = undefined
  entranceGradient2 = undefined
  exitGradient = undefined
  exitGradient2 = undefined
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

function fallFlying (level) {
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
  if (flying_crates.length > 0) holeSound.play()
}

function movesBackToEntrance (level, pi, pj, cur_di, cur_dj) {
  let [si, sj] = level.player.history[0]
  return pi == si && pj == sj && cur_di == -level.enter[0] && cur_dj == -level.enter[1]
}

function draw () {
  // ctx.clearRect(0, 0, canvas.width, canvas.height);
  // ctx.fillStyle = ALLOW_EDITOR ? COLORS.floorWin : COLORS.background // #75366D
  //ctx.fillStyle = COLORS.background // #75366D
  //ctx.fillRect(0, 0, canvas.width, canvas.height)

  if (in_last_level) {
    level_transition_time -= TURN_SPEED * 0.1
    level_transition_time = Math.max(level_transition_time, 0)
    drawScreen()
    //console.log();
    //return
    /*mouse_prev = Object.assign({}, mouse)
    mouse.wheel = 0
    keyboard_prev = Object.assign({}, keyboard)*/
    if (level_transition_time > 0) {
      window.requestAnimationFrame(draw)
    } else {
      //console.log("done");
    }
    return
  }

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
    if (turn_time <= 0 && screen_transition_turn) {
      // time to end the level transition
      screen_transition_turn = false
      // level_transition_time = 1
      // nextLevel()
    }
    turn_time = Math.max(turn_time, 0)
  }
  if (level_transition_time > 0) {
    // console.log("in transition");
    let starts_above_half = level_transition_time > 0.5
    level_transition_time -= TURN_SPEED * 0.1
    let ends_below_half = level_transition_time <= 0.5
    if (starts_above_half && ends_below_half) {
      nextLevel()
    }
    // if (level_transition_time <= 0) nextLevel();
    level_transition_time = Math.max(level_transition_time, 0)
  }
  if (intro_time > 0 && true_timeline_undos.length > 0) {
    intro_time -= TURN_SPEED * 0.1
    intro_time = Math.max(intro_time, 0)
  }
  if (turn_time == 0) {
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
          } else if (starts_won && cur_di == cur_level.exit[0] && cur_dj == cur_level.exit[1]) {
            // player exited the level
            // nextLevel();
            transitionSound.play();
            screen_transition_turn = true
            turn_time = 1
            level_transition_time = 1
            neutralTurn(cur_level);
            [pi, pj] = cur_level.player.history.at(-1)
            cur_level.player.history[real_tick] = [pi + cur_di, pj + cur_dj]
          } else { // player did an original move
            [pi, pj] = cur_level.player.history[real_tick - 1]
            let bad_move = (pi + cur_di < 0) || (pi + cur_di >= cur_level.w) ||
              (pj + cur_dj < 0) || (pj + cur_dj >= cur_level.h) ||
              cur_level.geo[pj + cur_dj][pi + cur_di] ||
              closedDoorAt(cur_level, pi + cur_di, pj + cur_dj) ||
              openHoleAt(cur_level, pi + cur_di, pj + cur_dj) ||
              movesBackToEntrance(cur_level, pi, pj, cur_di, cur_dj)
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

    /* ctx.fillStyle = COLORS.floorWin // "#437737";
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'black' */

    // if (!starts_won) winSound.play()

    /* if (wasKeyPressed(' ') && cur_level_n < levels.length - 1) {
      // loadLevel(cur_level_n + 1);
      nextLevel()
      cur_level = levels[cur_level_n]
    } */
  }

  if (wasKeyPressed('r')) {
    resetLevel()
    // loadLevel(cur_level_n);
    cur_level = levels[cur_level_n]
  }

  // cheat
  if (wasKeyPressed('ñ') && cur_level_n < levels.length - 1) {
    nextLevel()
    cur_level = levels[cur_level_n]
  }
  if (wasKeyPressed('l') && cur_level_n > 0) {
    prevLevel()
    cur_level = levels[cur_level_n]
  }

  // drawLevel(cur_level)
  drawScreen()

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
  if (e.key == 'z') return '1'
  if (e.key == 'x') return ENABLE_UNDO_2 ? '2' : '.'
  if (e.key == 'c') return ENABLE_UNDO_3 ? '3' : '.'
  if (e.key == 'r') return ENABLE_RESTART ? 'r' : '.'
  // return '.'
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
