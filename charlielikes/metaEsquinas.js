let BOARD_SIDE = 5;
let N_COLORS = 4;
let SIZE_S = 50;
let OFF_X = 50;
let OFF_Y = 50;
const COLORS = ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93"];

let board = emptyBoard();
let curTile = 2;

function emptyBoard() {
    let res = []
    for (let j = 0; j < BOARD_SIDE; j++) {
        let row = [];
        for (let i = 0; i < BOARD_SIDE; i++) {
            row.push(0);
        }
        res.push(row);
    }
    return res;
}

function roundRect(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y,   x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x,   y+h, r);
    ctx.arcTo(x,   y+h, x,   y,   r);
    ctx.arcTo(x,   y,   x+w, y,   r);
    ctx.closePath();
}

function drawTile(i, j, c) {
    roundRect(OFF_X + i * SIZE_S, OFF_Y + j * SIZE_S, SIZE_S, SIZE_S, SIZE_S * 0.2);
    if (c === 0) {
        ctx.stroke();
    } else {        
        ctx.fillStyle = COLORS[c - 1];        
        ctx.fill();
        ctx.stroke();
    }
    
}

function drawBoard() {
    ctx.globalAlpha = 0.4;
    drawTile(0, 0, 1);    
    drawTile(0, BOARD_SIDE-1, 2);
    drawTile(BOARD_SIDE-1, 0, 3);
    drawTile(BOARD_SIDE-1, BOARD_SIDE-1, 4);    
    ctx.globalAlpha = 1.0;
    for (let j = 0; j < BOARD_SIDE; j++) {
        for (let i = 0; i < BOARD_SIDE; i++) {
            drawTile(i, j, board[j][i]);
        }
    }
}

function isCorner(i, j) {
    return (i === 0 || i === BOARD_SIDE - 1) && (j === 0 || j === BOARD_SIDE - 1)
}

function cornerColor(i,j) {
    if (i === 0) {
        if (j === 0) {
            return 1
        } else {
            return 2
        }
    } else {
        if (j === 0) {
            return 3
        } else {
            return 4
        }
    }
}

function explode(cornerColor, targetColor) {
    let newBoard = emptyBoard();
    for (let j = 0; j < BOARD_SIDE; j++) {
        for (let i = 0; i < BOARD_SIDE; i++) {
            if (board[j][i] === targetColor && adjacentTo(i, j, board, cornerColor)) {
                newBoard[j][i] = 0;
            } else {
                newBoard[j][i] = board[j][i];
            }
        }
    }
    board = newBoard;
}

function adjacentTo(i,j,board,color) {
    const dis = [1,0,-1,0];
    const djs = [0,1,0,-1];
    for (let k=0; k<4; k++) {
        let i2 = i + dis[k]
        let j2 = j + djs[k]
        if (i2 < 0 || i2 >= BOARD_SIDE || j2 < 0 || j2 >= BOARD_SIDE) {
            continue
        }
        if (board[j2][i2] == color) {
            return true;
        }
    }
    return false;
}

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext('2d');
window.addEventListener("resize", e => {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
});
window.addEventListener("load", _e => {
    window.dispatchEvent(new Event('resize'));
    window.requestAnimationFrame(update);
});
function update() {
    ctx.clearRect(0,0,canvas.width,canvas.height);    
    if (wasButtonPressed("left")) {
        let mi = Math.floor((mouse.x - OFF_X) / SIZE_S);
        let mj = Math.floor((mouse.y - OFF_Y) / SIZE_S);
        if (mi >= 0 && mi < BOARD_SIDE && mj >= 0 && mj < BOARD_SIDE) {
            if (board[mj][mi] === 0) {
                board[mj][mi] = curTile;
                if (isCorner(mi, mj)) {
                    explode(cornerColor(mi,mj), curTile)
                }
                curTile = Math.floor(Math.random() * N_COLORS) + 1;
            }
        }
    }
    drawBoard();
    ctx.fillStyle = COLORS[curTile - 1]
    roundRect(mouse.x, mouse.y, SIZE_S, SIZE_S, SIZE_S * 0.2);
    ctx.fill();
    mouse_prev = Object.assign({}, mouse);
    mouse.wheel = 0;
    keyboard_prev = Object.assign({}, keyboard);
    window.requestAnimationFrame(update);
}
window.addEventListener('mousemove', e => _mouseEvent(e));
window.addEventListener('mousedown', e => _mouseEvent(e));
window.addEventListener('mouseup', e => _mouseEvent(e));
function _mouseEvent(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.buttons = e.buttons;
    return false;
}
window.addEventListener('wheel', e => {
    let d = e.deltaY > 0 ? 1 : -1;
    return mouse.wheel = d;
});
let mouse = { x: 0, y: 0, buttons: 0, wheel: 0 };
let mouse_prev = Object.assign({}, mouse);
function isButtonDown(b) {
    let i = b == "left" ? 0 : b == "right" ? 1 : 2;
    return (mouse.buttons & (1 << i)) != 0;
}
function wasButtonPressed(b) {
    let i = b == "left" ? 0 : b == "right" ? 1 : 2;
    return ((mouse.buttons & (1 << i)) !== 0) && ((mouse_prev.buttons & (1 << i)) === 0);
}
function wasButtonReleased(b) {
    let i = b == "left" ? 0 : b == "right" ? 1 : 2;
    return ((mouse.buttons & (1 << i)) === 0) && ((mouse_prev.buttons & (1 << i)) !== 0);
}
let keyboard = {};
let keyboard_prev = {};
function keyMap(e) {
    // use key.code if key location is important
    return e.key.toLowerCase();
}
window.addEventListener('keydown', e => {
    let k = keyMap(e);
    keyboard[k] = true;
});
window.addEventListener('keyup', e => {
    let k = keyMap(e);
    keyboard[k] = false;
});
function isKeyDown(k) {
    return keyboard[k] || false;
}
function wasKeyPressed(k) {
    return (keyboard[k] || false) && (!keyboard_prev[k] || false);
}
function wasKeyReleased(k) {
    return (!keyboard[k] || false) && (keyboard_prev[k] || false);
}
// utility functions
function mod(n, m) {
    return ((n % m) + m) % m;
}
