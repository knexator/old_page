// let canvas = document.getElementById("canvas");
// let ctx = canvas.getContext('2d');

declare let PintarJS: any;

let pintar = new PintarJS();
pintar.makeFullscreen()

// window.addEventListener("resize", e => {
//   canvas.width = innerWidth;
//   canvas.height = innerHeight;
// });

window.addEventListener("load", _e => {
  // window.dispatchEvent(new Event('resize'));
  window.requestAnimationFrame(update);
});

let last_time = 0
function update(curTime: number) {
  let deltaTime = curTime - last_time
  deltaTime = Math.min(deltaTime, 30.0)
  last_time = curTime;
  // ctx.clearRect(0,0,canvas.width,canvas.height);

  if (wasButtonPressed("left")) console.log("0 pressed");
  if (isButtonDown("left")) console.log("0 down");
  if (wasButtonReleased("left")) console.log("0 unpressed");

  if (wasKeyPressed('a')) console.log("a pressed");
  if (isKeyDown('a')) console.log("a down");
  if (wasKeyReleased('a')) console.log("a unpressed");
  
  pintar.startFrame()
  pintar.drawRectangle(
    new PintarJS.ColoredRectangle(
      new PintarJS.Point(100, 200),
      new PintarJS.Point(300, 400),
      PintarJS.Color.green(),
      null, true));
  pintar.endFrame()

  mouse_prev = Object.assign({}, mouse);
  mouse.wheel = 0;
  keyboard_prev = Object.assign({}, keyboard);
  window.requestAnimationFrame(update);
}

window.addEventListener('mousemove', e => _mouseEvent(e));
window.addEventListener('mousedown', e => _mouseEvent(e));
window.addEventListener('mouseup', e => _mouseEvent(e));

function _mouseEvent(e: MouseEvent) {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.buttons = e.buttons;
  return false;
}

window.addEventListener('wheel', e => {
  let d = e.deltaY > 0 ? 1 : -1;
  return mouse.wheel = d;
});

let mouse = {x: 0, y: 0, buttons: 0, wheel: 0};
let mouse_prev = Object.assign({}, mouse);

type MouseButton = "left" | "right" | "middle"

function isButtonDown(b: MouseButton) {
  let i = b == "left" ? 0 : b == "right" ? 1 : 2;
  return (mouse.buttons & (1 << i)) != 0;
}

function wasButtonPressed(b: MouseButton) {
  let i = b == "left" ? 0 : b == "right" ? 1 : 2;
  return ((mouse.buttons & (1 << i)) !== 0) && ((mouse_prev.buttons & (1 << i)) === 0);
}

function wasButtonReleased(b: MouseButton) {
  let i = b == "left" ? 0 : b == "right" ? 1 : 2;
  return ((mouse.buttons & (1 << i)) === 0) && ((mouse_prev.buttons & (1 << i)) !== 0);
}

let keyboard: Record<string, boolean> = {};
let keyboard_prev: Record<string, boolean> = {};

function keyMap(e : KeyboardEvent) {
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

function isKeyDown(k : string) {
  return keyboard[k] || false;
}

function wasKeyPressed(k : string) {
  return (keyboard[k] || false) && (!keyboard_prev[k] || false);
}

function wasKeyReleased(k : string) {
  return (!keyboard[k] || false) && (keyboard_prev[k] || false);
}

// utility functions
function mod(n : number, m : number) {
  return ((n % m) + m) % m;
}
