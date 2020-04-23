let canvas;
let ctx;
let frameCount = 0;
let mouseButtonState = 0;
let mouseButtonDelta = 0;

let gridSide = 50;
let gridW = 8;
let gridH = 8;

let memory = new MemoryStrip(120);

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.style('display', 'block');
  canvas = document.getElementById("defaultCanvas0");
  ctx = canvas.getContext("2d");
  document.addEventListener('contextmenu', event => event.preventDefault());
  
  noCursor();
}

function draw() {
  background(32);
  memory.update();
  memory.draw();
  frameCount += 1;
  mouseButtonDelta = 0;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mouseMoved(event) {
	mouseButtonDelta = mouseButtonState ^ event.buttons;
	mouseButtonState = event.buttons;
	return false;
}

function mousePressed(event) {
	mouseButtonDelta = mouseButtonState ^ event.buttons;
  mouseButtonState = event.buttons;
  return false;
}

function mouseDragged(event) {
	mouseButtonDelta = mouseButtonState ^ event.buttons;
	mouseButtonState = event.buttons;
  return false;
}

function mouseReleased(event) {
	mouseButtonDelta = mouseButtonState ^ event.buttons;
	mouseButtonState = event.buttons;
  return false;
}

function mouseWheel(event) {
  return false;
} 

function keyPressed(event) {
  //return false;
}

function keyReleased(event) {
  //return false;
}

function MemoryStrip(duration) {
	this.duration = duration;
	this.cursors = [];
	/*this.cursor = [];
	for (let i = 0; i < duration; i++) {
		this.actions.push([])
	}*/
}

MemoryStrip.prototype.update = function() {
	if (frameCount % this.duration == 0) {
		this.cursors.push([]);
	}
	let i = this.cursors.length - 1;
	this.cursors[i].push(getCursor());	
}

MemoryStrip.prototype.draw = function() {
	fill(255);
	stroke(0);
	let j = frameCount % this.duration;
	for (let i = 0; i < this.cursors.length; i++) {
		let cur = this.cursors[i][j];
		drawCursor(cur);
	}
}

function getCursor() {
	return [mouseX, mouseY, mouseButtonState, mouseButtonDelta];
}

function drawCursor(cur) {
	ellipse(cur[0], cur[1], 5);
	if (cur[3] & 1) { //&& cur[2] & 1) {
		ellipse(cur[0], cur[1], 20);
	}
	if (cur[2] & 1) {
		ellipse(cur[0], cur[1], 10);
	}
}

function Block(i, j) {
	this.state = 0;
	/*
	0 nothing
	1 tr - bl \
	2 tl - br /
	*/
}

/*function Ball(px, py, vx, vy) {
	this.px = px;
	this.py = py;
	this.vx = vx;
	this.vy = vy;
	this.r = 20;
}

Ball.prototype.draw = function() {
	fill(255);
	noStroke();
	ellipse(this.px, this.py, this.r/2);
}*/

function mod(n, m) {
  return ((n % m) + m) % m;
}