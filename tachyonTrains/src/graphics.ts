import { layout, board, Tile, Cable, contradictions, magicAdjacentCable } from 'hexGame';
import { mouse } from './engine';
import { Hex, Point } from './hexLib';
import { mod } from './index';

export let canvas = document.querySelector("canvas") as HTMLCanvasElement;
export let ctx = canvas.getContext("2d")!;

let pending_flashes: { cable: Cable; t: number; }[] = [];

window.addEventListener("resize", _e => {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
});

export function beginFrame() {
  // ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "#4e4e4e"; // "#4e4e4e"; d9d9d9
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function drawBoard(time: number) {
  if (allImgsLoaded) {
    pending_flashes = [];
    board.forEach(tile => {
      drawTile(tile, time);
    })
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.beginPath();
    pending_flashes.forEach(x => {
      let ballStart = cableSample(x.cable, x.t, time);
      ctx.moveTo(ballStart.x + layout.size * 0.5, ballStart.y);
      ctx.arc(ballStart.x, ballStart.y, layout.size * 0.5, 0, Math.PI * 2);
    });
    ctx.fill();
    ctx.stroke();
    /*ctx.globalAlpha = 0.5;
    contradictions.forEach(x => {
      if (Math.floor(x.time) === Math.floor(time)) {
        drawTrain(x.cable, time);
      }
    });
    ctx.globalAlpha = 1.0;*/
  } else {
    // draw loading screen
  }
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
  if (tile.masterSwapper) {
    ctx.globalAlpha = 0.3;
    drawCable(tile.coords, tile.swapCable1!.getOrigin(time), tile.swapCable2!.getTarget(time), tile.swapCable1!.direction === "backward");
    drawCable(tile.coords, tile.swapCable2!.getOrigin(time), tile.swapCable1!.getTarget(time), tile.swapCable1!.direction === "backward");
    ctx.globalAlpha = 1.0;
  }
  for (let k = 0; k < 6; k++) {
    let cur_cable = tile.cables[k];
    if (cur_cable !== null && cur_cable.origin === k) {
      /*ctx.lineWidth = 3;
      let inputVal = cur_cable.inputReqs[Math.floor(time)];
      if (inputVal !== null && inputVal !== undefined) {
        ctx.strokeStyle = inputVal ? "white" : "black";
      } else {
        ctx.strokeStyle = "gray";
      }
      const fillStyles_normal = {
        forward: "#bda564",
        backward: "#a461ba",
      }
      const fillStyles_swapper = {
        forward: "#751c1c",
        backward: "#4b1c75"
      }
      let fillStyles = cur_cable.swapper ? fillStyles_swapper : fillStyles_normal;
      ctx.fillStyle = fillStyles[cur_cable.direction];
      // ctx.strokeStyle = fillStyles[cur_cable.type];
      // ctx.fillStyle = cur_cable.type === "swapper" ? "#751c1c" : "#6c751c"
      pathCable(tile.coords, cur_cable.getOrigin(time), cur_cable.getTarget(time));
      ctx.stroke();
      ctx.fill();
      ctx.lineWidth = 1;*/

      // TODO: inputReqs highlight

      drawCable(tile.coords, cur_cable.getOrigin(time), cur_cable.getTarget(time), cur_cable.direction === "backward");

      /*if (cur_cable.globalState[Math.floor(time)]) {
        //drawTrain(cur_cable, time);
        drawTrainMiddle(cur_cable, time);
      }
      if (cur_cable.globalState[Math.floor(time + 1)]) {
        drawTrainEarly(cur_cable, time);
      }*/
      if (cur_cable.globalState[Math.floor(time)]) {
        drawTrain(cur_cable, time, 0);
      }
      if (cur_cable.globalState[Math.floor(time + 1)]) {
        drawTrain(cur_cable, time, -1);
      }
      if (cur_cable.globalState[Math.floor(time - 1)]) {
        drawTrain(cur_cable, time, 1);
      }
      if (contradictions.some(x => x.cable === cur_cable && x.time === Math.floor(time))) {
        ctx.globalAlpha = 0.5;
        drawTrain(cur_cable, time, 0);
        ctx.globalAlpha = 1.0;
      }

      // flashes of time travel
      if (cur_cable.direction === "forward") {
        let next_cable = magicAdjacentCable(cur_cable, time, "forward");
        let prev_cable = magicAdjacentCable(cur_cable, time, "backward");
        if (prev_cable && prev_cable.direction === "backward" && mod(time, 1) < 0.2 && cur_cable.globalState[Math.floor(time)]) {
          pending_flashes.push({cable: cur_cable, t: 0})
        }
        if (prev_cable && prev_cable.direction === "backward" && mod(time, 1) > 0.8 && cur_cable.globalState[Math.floor(time + 1)]) {
          pending_flashes.push({cable: cur_cable, t: 0})
        }
        if (next_cable && next_cable.direction === "backward" && mod(time, 1) > 0.8 && cur_cable.globalState[Math.floor(time)]) {
          pending_flashes.push({cable: cur_cable, t: 1})
        }
        if (next_cable && next_cable.direction === "backward" && mod(time, 1) < 0.2 && cur_cable.globalState[Math.floor(time - 1)]) {
          pending_flashes.push({cable: cur_cable, t: 1})
        }
      }
    }
  }
}

function drawTrain(cur_cable: Cable, time: number, dt: number) {
  ctx.strokeStyle = "black";
  let t = mod(time, 1) + dt;
  let times = [t - .2, t, t + .2];
  if (cur_cable.direction === "backward") {
    times = times.map(x => 1 - x);
  }

  ctx.beginPath();
  times.forEach(x => {
    if (x >= 0 && x <= 1) {
      let ballStart = cableSample(cur_cable, x, time - dt);
      ctx.moveTo(ballStart.x + layout.size * 0.2, ballStart.y);
      ctx.arc(ballStart.x, ballStart.y, layout.size * 0.2, 0, Math.PI * 2);
    }
  })
  ctx.fillStyle = cur_cable.direction === "forward" ? "orange" : "purple";
  ctx.fill();
  ctx.stroke();
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
  // let middle = layout.hexToPixel(hex);
  let middle_start_hex = hex.add(Hex.directions[origin].scale(0.5 / 4));
  let middle_end_hex = hex.add(Hex.directions[target].scale(0.5 / 4));
  let middle_start = layout.hexToPixel(middle_start_hex);
  let middle_end = layout.hexToPixel(middle_end_hex);

  ctx.beginPath();
  ctx.moveTo(start_left.x, start_left.y);
  // ctx.bezierCurveTo(middle.x, middle.y, middle.x, middle.y, end_left.x, end_left.y);
  // ctx.lineTo(end_right.x, end_right.y);
  ctx.bezierCurveTo(middle_start.x, middle_start.y, middle_end.x, middle_end.y, end.x, end.y);
  ctx.moveTo(end.x, end.y);
  ctx.bezierCurveTo(middle_end.x, middle_end.y, middle_start.x, middle_start.y, start_right.x, start_right.y);
  ctx.lineTo(start_left.x, start_left.y);

  /*let startMarker = bezierSample(0.05, start, middle, middle, end);
  ctx.moveTo(startMarker.x, startMarker.y);
  ctx.arc(startMarker.x, startMarker.y, layout.size * 0.1, 0, Math.PI * 2);*/
}

export function highlightCable(hex: Hex, origin: number, target: number) {
  let start = layout.hexToPixel(hex.add(Hex.directions[origin].scale(0.5)));
  let end = layout.hexToPixel(hex.add(Hex.directions[target].scale(0.5)));
  // let middle = layout.hexToPixel(hex);
  let middle_start_hex = hex.add(Hex.directions[origin].scale(0.5 * 0.303525 / 0.866025));
  let middle_end_hex = hex.add(Hex.directions[target].scale(0.5 * 0.303525 / 0.866025));
  let middle_start = layout.hexToPixel(middle_start_hex);
  let middle_end = layout.hexToPixel(middle_end_hex);


  ctx.lineWidth = layout.size / 3;
  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.bezierCurveTo(middle_start.x, middle_start.y, middle_end.x, middle_end.y, end.x, end.y);
  ctx.stroke();
  ctx.lineWidth = 1;
}

function drawCable(hex: Hex, origin: number, target: number, tachyon: boolean) {
  if (target === origin) throw new Error("can't draw that cable");
  let center = layout.hexToPixel(hex);
  let img_array = tachyon ? cable_images_tachyon : cable_images_normal;
  rotateAndPaintImage(
    img_array[mod(target - origin, 6)], (5-origin) * Math.PI / 3,
    center.x, center.y,
    layout.w/2, layout.h/2,
    layout.w, layout.h
  )
}

// from https://stackoverflow.com/questions/3793397/html5-canvas-drawimage-with-at-an-angle
function rotateAndPaintImage (image: CanvasImageSource, angleInRad: number , positionX: number, positionY: number, axisX: number, axisY: number, sizeX: number, sizeY: number ) {
  ctx.translate( positionX, positionY );
  ctx.rotate( angleInRad );
  ctx.drawImage( image, -axisX, -axisY, sizeX, sizeY );
  ctx.rotate( -angleInRad );
  ctx.translate( -positionX, -positionY );
}

export function cableSample(cable: Cable, t: number, time: number) {
  let hex = cable.tile.coords;
  let start = layout.hexToPixel(hex.add(Hex.directions[cable.getOrigin(time)].scale(0.5)));
  let end = layout.hexToPixel(hex.add(Hex.directions[cable.getTarget(time)].scale(0.5)));
  // let middle = layout.hexToPixel(hex);
  let middle_start_hex = hex.add(Hex.directions[cable.getOrigin(time)].scale(0.5 * 0.303525 / 0.866025));
  let middle_end_hex = hex.add(Hex.directions[cable.getTarget(time)].scale(0.5 * 0.303525 / 0.866025));
  let middle_start = layout.hexToPixel(middle_start_hex);
  let middle_end = layout.hexToPixel(middle_end_hex);

  return bezierSample(t, start, middle_start, middle_end, end);
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


// from https://stackoverflow.com/questions/34534549/how-do-you-deal-with-html5s-canvas-image-load-asynchrony
let allImgsLoaded = false;
let cable_images_normal: Record<number, HTMLImageElement> = {};
let cable_images_tachyon: Record<number, HTMLImageElement> = {};
let promiseArray: Promise<void>[] = [];
for (let k=1; k<=5; k++) {
  let prom1 = new Promise<void>(function(resolve,reject){
      let img = new Image();
      img.onload = function(){
          cable_images_tachyon[k] = img;
          resolve();
      };
      img.src = `./imgs/tachyon/cable_${k}.svg`;
  });
  promiseArray.push(prom1);

  let prom2 = new Promise<void>(function(resolve,reject){
      let img = new Image();
      img.onload = function(){
          cable_images_normal[k] = img;
          resolve();
      };
      img.src = `./imgs/normal/cable_${k}.svg`;
  });
  promiseArray.push(prom2);
}

Promise.all(promiseArray).then(() => {
  allImgsLoaded = true;
});
