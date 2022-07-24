// window.addEventListener("resize", e => {
//   canvas.width = innerWidth;
//   canvas.height = innerHeight;
// });

// window.addEventListener("load", _e => {
//   // window.dispatchEvent(new Event('resize'));
//   window.requestAnimationFrame(update);
// });



export function engine_update() {
  mouse_prev = Object.assign({}, mouse);
  mouse.wheel = 0;
  keyboard_prev = Object.assign({}, keyboard);
}

window.addEventListener('mousemove', e => _mouseEvent(e));
window.addEventListener('mousedown', e => _mouseEvent(e));
window.addEventListener('mouseup', e => _mouseEvent(e));

function _mouseEvent(e: MouseEvent) {
  /*let rect = pintar.canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.x;
  mouse.y = e.clientY - rect.y;*/
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.buttons = e.buttons;
  return false;
}

window.addEventListener('wheel', e => {
  let d = e.deltaY > 0 ? 1 : -1;
  return mouse.wheel = d;
});

export let mouse = { x: 0, y: 0, buttons: 0, wheel: 0 };
export let mouse_prev = Object.assign({}, mouse);

export type MouseButton = "left" | "right" | "middle"

export function isButtonDown(b: MouseButton) {
  let i = b == "left" ? 0 : b == "right" ? 1 : 2;
  return (mouse.buttons & (1 << i)) != 0;
}

export function wasButtonPressed(b: MouseButton) {
  let i = b == "left" ? 0 : b == "right" ? 1 : 2;
  return ((mouse.buttons & (1 << i)) !== 0) && ((mouse_prev.buttons & (1 << i)) === 0);
}

export function wasButtonReleased(b: MouseButton) {
  let i = b == "left" ? 0 : b == "right" ? 1 : 2;
  return ((mouse.buttons & (1 << i)) === 0) && ((mouse_prev.buttons & (1 << i)) !== 0);
}

export let keyboard: Record<string, boolean> = {};
export let keyboard_prev: Record<string, boolean> = {};

export function keyMap(e: KeyboardEvent) {
  // use key.code if key location is important
  if (e.key === "ArrowLeft") return "a";
  if (e.key === "ArrowRight") return "d";
  if (e.key === "ArrowUp") return "w";
  if (e.key === "ArrowDown") return "s";
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

export function isKeyDown(k: string) {
  return keyboard[k] || false;
}

export function wasKeyPressed(k: string) {
  return (keyboard[k] || false) && (!keyboard_prev[k] || false);
}

export function wasKeyReleased(k: string) {
  return (!keyboard[k] || false) && (keyboard_prev[k] || false);
}
