"use strict";
let sound_1 = new Howl({
    src: ['hihat.wav']
});
let sound_2 = new Howl({
    src: ['kick.wav']
});
let sound_3 = new Howl({
    src: ['snare.wav']
});
//sound.play();
// window.setInterval(() => sound_1.play(), 1000)
// window.setInterval(() => sound_2.play(), 800)
let canvas = document.querySelector("canvas");
let ctx = canvas.getContext('2d');
canvas.style.position = "fixed";
canvas.style.left = "0px";
canvas.style.top = "0px";
canvas.style.right = "0px";
canvas.style.bottom = "0px";
/*canvas.style.width = "100%";
canvas.style.height = "100%";*/
canvas.style.display = "block";
window.addEventListener("resize", _e => {
    if (innerWidth > innerHeight) {
        canvas.height = innerHeight;
        canvas.width = innerHeight * (360 / 640);
    }
    else {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
    }
});
// declare let PintarJS: any;
//
// let pintar = new PintarJS();
// pintar.makeFullscreen()
let BPM = 40;
let MAX_MEMORY = 2 * (60000 / BPM); // 2 bars
let TOLERANCE = 0.05;
let WIN_SPEED = 0.33;
let LOSE_SPEED = 0.66;
let taps_right = [];
let taps_left = [];
let state_right = 0.0;
let state_left = 0.0;
let score_right = 0.0;
let score_left = 0.0;
let goal_right = 2;
let goal_left = 3;
window.addEventListener("load", _e => {
    window.dispatchEvent(new Event('resize'));
    window.setInterval(() => sound_3.play(), 1000 * 60 / BPM);
    window.requestAnimationFrame(update);
});
let touched_left = false;
let touched_right = false;
let last_frame_time = 0;
let game_time = 0;
function update(cur_frame_time) {
    let delta_frame_time = cur_frame_time - last_frame_time;
    delta_frame_time = Math.min(delta_frame_time, 30.0);
    game_time += delta_frame_time;
    last_frame_time = cur_frame_time;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // pintar.startFrame()
    if (wasKeyPressed('z') || touched_left || wasButtonPressed("left")) {
        sound_1.play();
        taps_left.push(game_time);
        touched_left = false;
        /*pintar.drawRectangle(
          new PintarJS.ColoredRectangle(
            new PintarJS.Point(0, 0),
            // new PintarJS.Point(pintar._canvas.width / 2, pintar._canvas.height),
            new PintarJS.Point(100, 100),
            PintarJS.Color.red(),
            null, true));*/
    }
    if (wasKeyPressed('m') || touched_right || wasButtonPressed("right")) {
        sound_2.play();
        taps_right.push(game_time);
        touched_right = false;
        /*pintar.drawRectangle(
          new PintarJS.ColoredRectangle(
            new PintarJS.Point(100, 0),
            new PintarJS.Point(100, 100),
            // new PintarJS.Point(pintar._canvas.width / 2, 0),
            // new PintarJS.Point(pintar._canvas.width / 2, pintar._canvas.height),
            PintarJS.Color.green(),
            null, true));*/
    }
    trimArr(taps_left, game_time);
    trimArr(taps_right, game_time);
    let freq_left = getFreq(taps_left);
    let freq_right = getFreq(taps_right);
    state_left = lerp(state_left, freq_left, 0.05);
    // state_left = 2
    state_right = lerp(state_right, freq_right, 0.05);
    if (Math.abs(state_left - goal_left) < TOLERANCE) {
        score_left = Math.min(1.0, score_left + delta_frame_time * WIN_SPEED * 0.001);
    }
    else {
        score_left = Math.max(0.0, score_left - delta_frame_time * LOSE_SPEED * 0.001);
    }
    if (Math.abs(state_right - goal_right) < TOLERANCE) {
        score_right = Math.min(1.0, score_right + delta_frame_time * WIN_SPEED * 0.001);
    }
    else {
        score_right = Math.max(0.0, score_right - delta_frame_time * LOSE_SPEED * 0.001);
    }
    console.log(score_left, score_right);
    // console.log(freq_left, freq_right)
    let TAP_AFTERGLOW = 100;
    let bar_w = canvas.width / 12;
    let bar_h = canvas.height * 9 / 10;
    let drum_x = canvas.width / 6;
    let drum_y = canvas.height * (1 - 1 / 20);
    let drum_r = canvas.width / 4;
    let mark_spacing = bar_h / 6;
    let mark_y = drum_y - 1.5 * mark_spacing;
    let mark_w = bar_w * 1.0;
    let mark_h = mark_spacing / 8;
    let marker_x = bar_w;
    let marker_w = bar_w / 2;
    let marker_h = marker_w * 2;
    let center_y = canvas.height / 3;
    let center_r = canvas.width / 3;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "black";
    ctx.font = (canvas.width * 0.2).toString() + "px Arial";
    ctx.fillText(goal_left.toString() + ":" + goal_right.toString(), canvas.width / 2, canvas.height * 2 / 3);
    ctx.fillStyle = "gray";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, center_y, center_r, 0, TAU);
    ctx.fill();
    // ctx.stroke()
    ctx.fillStyle = "orange";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, center_y, center_r * score_left, TAU / 4, TAU * 3 / 4);
    ctx.fill();
    ctx.fillStyle = "#14efff";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, center_y, center_r * score_right, TAU * 3 / 4, TAU / 4);
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.lineWidth = bar_w / 4;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, center_y, center_r, 0, TAU);
    ctx.moveTo(canvas.width / 2, center_y - center_r);
    ctx.lineTo(canvas.width / 2, center_y + center_r);
    ctx.stroke();
    // ctx.fillStyle = "#e09100"
    ctx.fillStyle = "orange";
    let marker_y_left = mark_y - mark_spacing * (state_left - 1);
    ctx.beginPath();
    ctx.moveTo(marker_x, marker_y_left);
    ctx.lineTo(marker_x + marker_w, marker_y_left + marker_h / 2);
    ctx.lineTo(marker_x + marker_w, marker_y_left - marker_h / 2);
    ctx.closePath();
    ctx.fill();
    // ctx.fillStyle = "orange"
    ctx.fillRect(0, canvas.height - bar_h, bar_w, bar_h);
    ctx.beginPath();
    ctx.arc(drum_x, drum_y, drum_r, 0, 2 * Math.PI);
    ctx.arc(0, canvas.height - bar_h, bar_w, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = timeSinceLastTap(taps_left, game_time) < TAP_AFTERGLOW ? "#ffc966" : "orange";
    ctx.beginPath();
    ctx.arc(drum_x, drum_y, drum_r * 0.8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "#e09100";
    ctx.beginPath();
    for (let k = 0; k <= 5; k++) {
        ctx.rect(0, mark_y - mark_spacing * k - mark_h / 2, mark_w, mark_h);
    }
    ctx.fill();
    ctx.fillStyle = "#14efff";
    let marker_y_right = mark_y - mark_spacing * (state_right - 1);
    ctx.beginPath();
    ctx.moveTo(canvas.width - marker_x, marker_y_right);
    ctx.lineTo(canvas.width - marker_x - marker_w, marker_y_right + marker_h / 2);
    ctx.lineTo(canvas.width - marker_x - marker_w, marker_y_right - marker_h / 2);
    ctx.closePath();
    ctx.fill();
    // ctx.fillStyle = "#14efff"
    ctx.fillRect(canvas.width - bar_w, canvas.height - bar_h, bar_w, bar_h);
    // ctx.fillStyle = timeSinceLastTap(taps_left, game_time) < TAP_AFTERGLOW ? "white" : "orange"
    ctx.beginPath();
    ctx.arc(canvas.width - drum_x, drum_y, drum_r, 0, 2 * Math.PI);
    ctx.arc(canvas.width, canvas.height - bar_h, bar_w, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = timeSinceLastTap(taps_right, game_time) < TAP_AFTERGLOW ? "#85f7ff" : "#14efff";
    ctx.beginPath();
    ctx.arc(canvas.width - drum_x, drum_y, drum_r * 0.8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "#0dc7d4";
    ctx.beginPath();
    for (let k = 0; k <= 5; k++) {
        ctx.rect(canvas.width - mark_w, mark_y - mark_spacing * k, mark_w, mark_h);
    }
    ctx.fill();
    // pintar.drawRectangle(
    //   new PintarJS.ColoredRectangle(
    //     new PintarJS.Point(0, pintar._canvas.height - bar_h),
    //     new PintarJS.Point(bar_w, bar_h),
    //     // new PintarJS.Point(pintar._canvas.width / 2, 0),
    //     // new PintarJS.Point(pintar._canvas.width / 2, pintar._canvas.height),
    //     PintarJS.Color.orange(),
    //     null, true));
    /*pintar.drawLine(
      new PintarJS.ColoredLine(
        new PintarJS.Point(100, 100),
        new PintarJS.Point(100, 300),
        PintarJS.Color.red()
      )
    )
    for (let k = 0; k <= 5; k++) {
      pintar.drawLine(
        new PintarJS.ColoredLine(
          new PintarJS.Point(90, 300 - k * 40),
          new PintarJS.Point(110, 300 - k * 40),
          PintarJS.Color.red()
        )
      )
    }
    let y_left = 300 - state_left * 40
    pintar.drawLine(
      new PintarJS.ColoredLine(
        new PintarJS.Point(80, y_left),
        new PintarJS.Point(120, y_left),
        PintarJS.Color.red()
      )
    )
  
    pintar.drawLine(
      new PintarJS.ColoredLine(
        new PintarJS.Point(300, 100),
        new PintarJS.Point(300, 300),
        PintarJS.Color.blue()
      )
    )
    for (let k = 0; k <= 5; k++) {
      pintar.drawLine(
        new PintarJS.ColoredLine(
          new PintarJS.Point(290, 300 - k * 40),
          new PintarJS.Point(310, 300 - k * 40),
          PintarJS.Color.blue()
        )
      )
    }
    let y_right = 300 - state_right * 40
    pintar.drawLine(
      new PintarJS.ColoredLine(
        new PintarJS.Point(280, y_right),
        new PintarJS.Point(320, y_right),
        PintarJS.Color.blue()
      )
    )
    pintar.endFrame()*/
    mouse_prev = Object.assign({}, mouse);
    mouse.wheel = 0;
    keyboard_prev = Object.assign({}, keyboard);
    window.requestAnimationFrame(update);
}
/*function draw_bar(state: number, left: boolean) {
  let color = left ? PintarJS.Color.red() : PintarJS.Color.blue()
  let off_x = left ? 100 : 300

}*/
function trimArr(arr, curT) {
    while (arr.length > 0 && curT - arr[0] > MAX_MEMORY) {
        arr.shift();
    }
}
function getFreq(arr) {
    /*let accumulator = 0.0
    let total_count = 0
    for (let k=0; k<arr.length - 1; k++) {
      accumulator
    }*/
    if (arr.length < 2)
        return 0;
    return (60000 / BPM) / ((arr[arr.length - 1] - arr[0]) / (arr.length - 1));
}
/*function getErr(arr: number[]) {

}*/
function timeSinceLastTap(arr, cur_t) {
    if (arr.length < 1)
        return Infinity;
    return cur_t - arr[arr.length - 1];
}
window.addEventListener('touchstart', e => {
  let touches = e.changedTouches;
  for (let k=0; k<touches.length; k++) {
    let touch = touches[k]
    if (touch.pageX < canvas.width / 2) {
      touched_left = true
    } else {
      touched_right = true
    }
  }
});
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
function lerp(a, b, t) {
    return a * (1 - t) + b * t;
}
let TAU = Math.PI * 2;
