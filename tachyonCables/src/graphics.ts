import { layout, board, Tile, Cable } from 'hexGame';
import { Hex, Point } from './hexLib';
import { mod } from './index';

export let canvas = document.querySelector("canvas") as HTMLCanvasElement;
export let ctx = canvas.getContext("2d")!;

window.addEventListener("resize", _e => {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
});

export function beginFrame() {
  // ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "#4e4e4e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function drawBoard(time: number) {
  board.forEach(tile => {
    drawTile(tile, time);
  })
}

function drawTile(tile: Tile, time: number) {
  let tile_hex = tile.coords;
  let center = layout.hexToPixel(tile_hex);
  if (center.x < 0 || center.x >= canvas.width || center.y < 0 || center.y >= canvas.height) {
    return;
  }

  ctx.strokeStyle = "gray";
  pathHex(tile.coords);
  ctx.stroke();
  for (let k = 0; k < 6; k++) {
    let cur_cable = tile.cables[k];
    if (cur_cable !== null && cur_cable.origin === k) {
      ctx.lineWidth = 3;
      if (cur_cable.inputReqs.has(Math.floor(time))) {
        ctx.strokeStyle = cur_cable.inputReqs.get(Math.floor(time)) ? "white" : "black";
      } else {
        ctx.strokeStyle = "gray";
      }
      let fillStyles = {
        standard: "#bda564",
        tachyon: "#a461ba",
        bridgeForward: "#61baa8",
        bridgeBackward: "#ba6161",
        swapper: "#751c1c",
        swapperBackward: "#4b1c75"
      }
      ctx.fillStyle = fillStyles[cur_cable.type];
      // ctx.strokeStyle = fillStyles[cur_cable.type];
      // ctx.fillStyle = cur_cable.type === "swapper" ? "#751c1c" : "#6c751c"
      pathCable(tile.coords, cur_cable.origin, cur_cable.target);
      ctx.stroke();
      ctx.fill();
      ctx.lineWidth = 1;

      if (cur_cable.state) {
        if (cur_cable.type === "standard" || cur_cable.type === "swapper") {
          let ballStart = cableSample(cur_cable, mod(time, 1));
          ctx.beginPath();
          ctx.moveTo(ballStart.x, ballStart.y);
          ctx.arc(ballStart.x, ballStart.y, layout.size * 0.2, 0, Math.PI * 2);
          ctx.fillStyle = "orange";
          ctx.fill();
        } else if (cur_cable.type === "tachyon" || cur_cable.type === "swapperBackward") {
          let ballStart = cableSample(cur_cable, 1 - mod(time, 1));
          ctx.beginPath();
          ctx.moveTo(ballStart.x, ballStart.y);
          ctx.arc(ballStart.x, ballStart.y, layout.size * 0.2, 0, Math.PI * 2);
          ctx.fillStyle = "purple";
          ctx.fill();
        } else if (cur_cable.type === "bridgeBackward") {
          if (mod(time, 1) < 0.5) {
            let ballStart1 = cableSample(cur_cable, mod(time, 1));
            ctx.beginPath();
            ctx.moveTo(ballStart1.x, ballStart1.y);
            ctx.arc(ballStart1.x, ballStart1.y, layout.size * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = "orange";
            ctx.fill();

            let ballStart2 = cableSample(cur_cable, 1 - mod(time, 1));
            ctx.beginPath();
            ctx.moveTo(ballStart2.x, ballStart2.y);
            ctx.arc(ballStart2.x, ballStart2.y, layout.size * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = "purple";
            ctx.fill();
          }
        } else if (cur_cable.type === "bridgeForward") {
          if (mod(time, 1) > 0.5) {
            let ballStart1 = cableSample(cur_cable, mod(time, 1));
            ctx.beginPath();
            ctx.moveTo(ballStart1.x, ballStart1.y);
            ctx.arc(ballStart1.x, ballStart1.y, layout.size * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = "orange";
            ctx.fill();

            let ballStart2 = cableSample(cur_cable, 1 - mod(time, 1));
            ctx.beginPath();
            ctx.moveTo(ballStart2.x, ballStart2.y);
            ctx.arc(ballStart2.x, ballStart2.y, layout.size * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = "purple";
            ctx.fill();
          }
        }
      }
    }
  }
}

export function drawGhostHex(hex: Hex) {
  ctx.fillStyle = "#65944a";
  pathHex(hex);
  ctx.fill();
}

function pathHex(hex: Hex) {
  let corners = layout.polygonCorners(hex);
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let k = 1; k < 6; k++) {
    ctx.lineTo(corners[k].x, corners[k].y);
  }
  ctx.closePath();
}

export function drawGhostCable(hex: Hex, origin: number, target: number) {
  pathCable(hex, origin, target);
  ctx.stroke();
}

function pathCable(hex: Hex, origin: number, target: number) {
  let start_hex = hex.add(Hex.directions[origin].scale(0.5));
  let start_hex_right = start_hex.add(Hex.diagonals[mod(origin+1,6)].scale(0.05));
  let start_hex_left = start_hex.add(Hex.diagonals[mod(origin-2,6)].scale(0.05));
  let start = layout.hexToPixel(start_hex);
  let start_right = layout.hexToPixel(start_hex_right);
  let start_left = layout.hexToPixel(start_hex_left);
  let end_hex = hex.add(Hex.directions[target].scale(0.5));
  // let end_hex_right = end_hex.add(Hex.diagonals[mod(target+1,6)].scale(0.025));
  // let end_hex_left = end_hex.add(Hex.diagonals[mod(target-2,6)].scale(0.025));
  let end = layout.hexToPixel(end_hex);
  // let end_right = layout.hexToPixel(end_hex_right);
  // let end_left = layout.hexToPixel(end_hex_left);
  let middle = layout.hexToPixel(hex);

  ctx.beginPath();
  ctx.moveTo(start_left.x, start_left.y);
  // ctx.bezierCurveTo(middle.x, middle.y, middle.x, middle.y, end_left.x, end_left.y);
  // ctx.lineTo(end_right.x, end_right.y);
  ctx.bezierCurveTo(middle.x, middle.y, middle.x, middle.y, end.x, end.y);
  ctx.moveTo(end.x, end.y);
  ctx.bezierCurveTo(middle.x, middle.y, middle.x, middle.y, start_right.x, start_right.y);
  ctx.lineTo(start_left.x, start_left.y);

  /*let startMarker = bezierSample(0.05, start, middle, middle, end);
  ctx.moveTo(startMarker.x, startMarker.y);
  ctx.arc(startMarker.x, startMarker.y, layout.size * 0.1, 0, Math.PI * 2);*/
}

function cableSample(cable: Cable, t: number) {
  let hex = cable.tile.coords;
  let start = layout.hexToPixel(hex.add(Hex.directions[cable.origin].scale(0.5)));
  let end = layout.hexToPixel(hex.add(Hex.directions[cable.target].scale(0.5)));
  let middle = layout.hexToPixel(hex);
  return bezierSample(t, start, middle, middle, end);
}

// https://stackoverflow.com/questions/16227300/how-to-draw-bezier-curves-with-native-javascript-code-without-ctx-beziercurveto
function bezierSample(t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point {
  var cX = 3 * (p1.x - p0.x),
    bX = 3 * (p2.x - p1.x) - cX,
    aX = p3.x - p0.x - cX - bX;

  var cY = 3 * (p1.y - p0.y),
    bY = 3 * (p2.y - p1.y) - cY,
    aY = p3.y - p0.y - cY - bY;

  var x = (aX * Math.pow(t, 3)) + (bX * Math.pow(t, 2)) + (cX * t) + p0.x;
  var y = (aY * Math.pow(t, 3)) + (bY * Math.pow(t, 2)) + (cY * t) + p0.y;

  return { x: x, y: y };
};
