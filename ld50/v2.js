let canvas = document.getElementById('canvas')
let ctx = canvas.getContext('2d')

let hidden_canvas = document.getElementById('hidden_canvas')
let hidden_ctx = hidden_canvas.getContext('2d')

let N_PIXELS = 20
let N_TILES_W = 9
let N_TILES_H = 10
let WALL_LENGTH = Math.floor((N_TILES_W - 1) / 2)
let SCALING = 4

let score = 0
let falling_score = 100
let lost = false

let board = emptyBoard()

let time = 0
let last_time = 0

let debug_score_plot = { x: [0], y: [0] }

function emptyBoard () {
  let res = []
  for (let j = 0; j < N_TILES_H; j++) {
    let row = []
    let color = j * 2 >= N_TILES_H ? 1 : 0
    for (let i = 0; i < N_TILES_W; i++) {
      row.push(emptyTile(color))
    }
    res.push(row)
  }
  return res
}

function emptyTile (n) {
  let res = []
  for (let j = 0; j < N_PIXELS; j++) {
    let row = []
    for (let i = 0; i < N_PIXELS; i++) {
      row.push(n)
    }
    res.push(row)
  }
  return res
}

function tileOneCount (i, j) {
  let tile = board[j][i]
  let res = 0
  for (let v = 0; v < N_PIXELS; v++) {
    for (let u = 0; u < N_PIXELS; u++) {
      if (tile[v][u] == 1) {
        res += 1
      }
    }
  }
  return res
}

function randint (n) {
  // int in [0, n-1]
  return Math.floor(Math.random() * n)
}

function mix2Tiles (i1, j1, i2, j2) {
  let oneCount1_og = tileOneCount(i1, j1)
  let oneCount = oneCount1_og + tileOneCount(i2, j2)
  board[j1][i1] = emptyTile(0)
  board[j2][i2] = emptyTile(0)
  let tiles = [board[j1][i1], board[j2][i2]]

  while (oneCount > 0) {
    let i = randint(N_PIXELS)
    let j = randint(N_PIXELS)
    let k = randint(2)
    if (tiles[k][j][i] == 0) {
      oneCount -= 1
      tiles[k][j][i] = 1
    }
  }
  let oneCount1_new = tileOneCount(i1, j1)
  drawTile(i1, j1)
  drawTile(i2, j2)
  return oneCount1_new - oneCount1_og
}

function drawTile (i, j) {
  let tile = board[j][i]
  let off_x = i * N_PIXELS
  let off_y = j * N_PIXELS

  hidden_ctx.fillStyle = '#FF9900'
  for (let v = 0; v < N_PIXELS; v++) {
    for (let u = 0; u < N_PIXELS; u++) {
      if (tile[v][u] == 0) {
        hidden_ctx.fillRect(off_x + u, off_y + v, 1, 1)
      }
    }
  }

  hidden_ctx.fillStyle = '#F000FF'
  for (let v = 0; v < N_PIXELS; v++) {
    for (let u = 0; u < N_PIXELS; u++) {
      if (tile[v][u] == 1) {
        hidden_ctx.fillRect(off_x + u, off_y + v, 1, 1)
      }
    }
  }
}

function drawFullBoard () {
  for (let j = 0; j < N_TILES_H; j++) {
    for (let i = 0; i < N_TILES_W; i++) {
      drawTile(i, j)
    }
  }
}

function dxdy2didj (dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) {
    return [Math.sign(dx), 0]
  } else {
    return [0, Math.sign(dy)]
  }
}

window.addEventListener('resize', e => {
  canvas.width = innerWidth
  canvas.height = innerHeight
  SCALING = canvas.height / (N_TILES_H * N_PIXELS)
})
window.addEventListener('load', _e => {
  window.dispatchEvent(new Event('resize'))
  hidden_canvas.width = N_PIXELS * N_TILES_W
  hidden_canvas.height = N_PIXELS * N_TILES_H
  board = emptyBoard()
  drawFullBoard()
  window.requestAnimationFrame(update)
})
function update (cur_time) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  let delta_time = cur_time - last_time
  last_time = cur_time
  if (!lost) {
    time += delta_time
    falling_score -= delta_time * 0.01
    if (falling_score <= 0) {
      // lost, etc
      falling_score = 0
      lost = true
    }
  }

  ctx.imageSmoothingEnabled = false
  ctx.drawImage(
    hidden_canvas,
    0,
    0,
    N_PIXELS * N_TILES_W * SCALING,
    N_PIXELS * N_TILES_H * SCALING
  )

  ctx.beginPath()
  ctx.lineWidth = 1
  ctx.strokeStyle = 'gray'
  for (let i = 0; i <= N_TILES_W; i++) {
    ctx.moveTo(i * N_PIXELS * SCALING, 0)
    ctx.lineTo(i * N_PIXELS * SCALING, N_TILES_H * N_PIXELS * SCALING)
  }
  for (let j = 0; j <= N_TILES_H; j++) {
    ctx.moveTo(0, j * N_PIXELS * SCALING)
    ctx.lineTo(N_TILES_W * N_PIXELS * SCALING, j * N_PIXELS * SCALING)
  }
  ctx.stroke()

  let mx = mouse.x / (SCALING * N_PIXELS)
  let my = mouse.y / (SCALING * N_PIXELS)
  let mi1 = Math.floor(mx)
  let mj1 = Math.floor(my)

  if (mi1 >= 0 && mi1 < N_TILES_W && mj1 >= 0 && mj1 < N_TILES_H) {
    let mu = mx - mi1 - 0.5
    let mv = my - mj1 - 0.5

    //let diff = Math.abs(Math.abs(mu) - Math.abs(mv))
    //if (diff > 0.1) {
    let [di, dj] = dxdy2didj(mu, mv)

    let dx = 2 * mu - di
    let dy = 2 * mv - dj

    if (dx * dx + dy * dy < 0.6 * 0.6) {
      if (di != 0 || dj != 0) {
        let mi2 = mi1 + di
        let mj2 = mj1 + dj
        if (mi2 >= 0 && mi2 < N_TILES_W && mj2 >= 0 && mj2 < N_TILES_H) {
          if (mi1 > mi2) {
            ;[mi1, mi2] = [mi2, mi1]
          }
          if (mj1 > mj2) {
            ;[mj1, mj2] = [mj2, mj1]
          }
          let halfway =
            Math.floor((mj1 * 2) / N_TILES_H) !=
            Math.floor((mj2 * 2) / N_TILES_H)

          if (!halfway || mi1 * 2 + 1 == N_TILES_W) {
            ctx.strokeStyle = 'white'
            ctx.lineWidth = 2
            // ctx.lineWidth = 3
            ctx.strokeRect(
              mi1 * SCALING * N_PIXELS,
              mj1 * SCALING * N_PIXELS,
              SCALING * N_PIXELS * (mi2 - mi1 + 1),
              SCALING * N_PIXELS * (mj2 - mj1 + 1)
            )

            if (wasButtonPressed('left')) {
              let delta_score = mix2Tiles(mi1, mj1, mi2, mj2)
              if (halfway) {
                score += delta_score
                debug_score_plot.x.push(time)
                debug_score_plot.y.push(score)
                falling_score += delta_score
                falling_score = Math.max(0, Math.min(100, falling_score))
              }
            }
          }
        }
      }
    }
  }

  let bar_height = Math.round(
    (falling_score * N_PIXELS * N_TILES_H * SCALING) / 100
  )
  ctx.fillStyle = 'black'
  ctx.fillRect(
    N_PIXELS * N_TILES_W * SCALING,
    N_PIXELS * N_TILES_H * SCALING - bar_height,
    Math.round((SCALING * N_PIXELS) / 2),
    bar_height
  )

  ctx.beginPath()
  ctx.strokeStyle = 'black'
  ctx.lineWidth = 3
  let half_height = Math.floor((SCALING * N_PIXELS * N_TILES_H) / 2)
  ctx.moveTo(0, half_height)
  ctx.lineTo(WALL_LENGTH * SCALING * N_PIXELS, half_height)
  ctx.stroke()
  ctx.moveTo((WALL_LENGTH + 1) * SCALING * N_PIXELS, half_height)
  ctx.lineTo(N_TILES_W * SCALING * N_PIXELS, half_height)
  ctx.stroke()
  // ctx.lineWidth = 1

  ctx.font = '48px Arial'
  // ctx.fillText(score.toString(), 100, 100)
  ctx.fillText(
    (time * 0.001).toFixed(2),
    (N_TILES_W + 1) * SCALING * N_PIXELS,
    SCALING * N_PIXELS
  )

  mouse_prev = Object.assign({}, mouse)
  mouse.wheel = 0
  keyboard_prev = Object.assign({}, keyboard)
  window.requestAnimationFrame(update)
}

window.addEventListener('mousemove', e => _mouseEvent(e))
window.addEventListener('mousedown', e => _mouseEvent(e))
window.addEventListener('mouseup', e => _mouseEvent(e))
function _mouseEvent (e) {
  mouse.x = e.clientX
  mouse.y = e.clientY
  mouse.buttons = e.buttons
  return false
}
window.addEventListener('wheel', e => {
  let d = e.deltaY > 0 ? 1 : -1
  return (mouse.wheel = d)
})
let mouse = { x: 0, y: 0, buttons: 0, wheel: 0 }
let mouse_prev = Object.assign({}, mouse)
function isButtonDown (b) {
  let i = b == 'left' ? 0 : b == 'right' ? 1 : 2
  return (mouse.buttons & (1 << i)) != 0
}
function wasButtonPressed (b) {
  let i = b == 'left' ? 0 : b == 'right' ? 1 : 2
  return (
    (mouse.buttons & (1 << i)) !== 0 && (mouse_prev.buttons & (1 << i)) === 0
  )
}
function wasButtonReleased (b) {
  let i = b == 'left' ? 0 : b == 'right' ? 1 : 2
  return (
    (mouse.buttons & (1 << i)) === 0 && (mouse_prev.buttons & (1 << i)) !== 0
  )
}
let keyboard = {}
let keyboard_prev = {}
function keyMap (e) {
  // use key.code if key location is important
  return e.key.toLowerCase()
}
window.addEventListener('keydown', e => {
  let k = keyMap(e)
  keyboard[k] = true
})
window.addEventListener('keyup', e => {
  let k = keyMap(e)
  keyboard[k] = false
})
function isKeyDown (k) {
  return keyboard[k] || false
}
function wasKeyPressed (k) {
  return (keyboard[k] || false) && (!keyboard_prev[k] || false)
}
function wasKeyReleased (k) {
  return (!keyboard[k] || false) && (keyboard_prev[k] || false)
}
// utility functions
function mod (n, m) {
  return ((n % m) + m) % m
}
