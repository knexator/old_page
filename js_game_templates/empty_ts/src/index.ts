import { engine_update, mouse, wasButtonPressed, wasButtonReleased, wasKeyPressed } from 'engine';


let canvas = document.querySelector("canvas") as HTMLCanvasElement;
let ctx = canvas.getContext("2d")!;

let last_time = 0;

function initOnce() {
  window.requestAnimationFrame(update);
}

function update(curTime: number) {
  let deltaTime = curTime - last_time
  deltaTime = Math.min(deltaTime, 30.0)
  last_time = curTime;

  ctx.fillStyle = "black";
  ctx.fillRect(mouse.x, mouse.y, 100, 100);

  engine_update();
  window.requestAnimationFrame(update);
}

initOnce()

function lerp(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t
}
