let canvas;
let ctx;
let frameCount = 0;
let mouseButtonState = 0;
let mouseButtonDelta = 0;

let gridSide = 50;
let gridW = 12;
let gridH = 12;

let memory = new MemoryStrip(120);
let blocks = [];
for (let i = 0; i < gridW; i++) {
	for (let j = 0; j < gridH; j++) {
		blocks.push(new Block(i, j));
	}
}
let balls = [];
let ballSpawners = [];

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
  if (frameCount % 120*4 == 0) {
	  [di, dj] = rndDir();
	  console.log(di, dj);
	  //ballSpawners.push(new BallSpawner(3, 4, di, dj, 120, 0));
	  ballSpawners.push(new BallSpawner(Math.floor(Math.random()*gridW), Math.floor(Math.random()*gridH), di, dj, 120, 0));
  }
  for (let i = 0; i < ballSpawners.length; i++) {
	  ballSpawners[i].update();
  }
  memory.update();
  for (let i = 0; i < blocks.length; i++) {
	  blocks[i].draw();
	  memory.press(blocks[i]);
  }
  for (let i = 0; i < balls.length; i++) {
	  balls[i].update(1.0/60);
	  balls[i].draw();
  }  
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

MemoryStrip.prototype.press = function(tile) {
	let j = frameCount % this.duration;
	for (let i = 0; i < this.cursors.length; i++) {
		let cur = this.cursors[i][j];
		tile.cursorAction(cur);
	}	
}


function getCursor() {
	return [mouseX, mouseY, mouseButtonState, mouseButtonDelta];
}

function drawCursor(cur) {
	ellipse(cur[0], cur[1], 5);
	/*if (cur[3] & 1) { //&& cur[2] & 1) {
		ellipse(cur[0], cur[1], 20);
	}*/
	if (cur[2] & 1) {
		ellipse(cur[0], cur[1], 10);
	}
}

function Block(i, j) {
	this.state = 0;
	/*
	0 nothing
	1 tl - br /
	2 tr - bl \
	*/
	this.i = i;
	this.j = j;
	this.x = i * gridSide + gridSide/2;
	this.y = j * gridSide + gridSide/2;
}

Block.prototype.cursorAction = function(cur) {
	if (cur[3] & 1 && cur[2] & 1) { // left click
		[i, j] = xy2ij(cur[0], cur[1]);
		if (Math.floor(i) == this.i && Math.floor(j) == this.j) {
			i = i%1 - .5;
			j = j%1 - .5;
			//console.log(i, j);
			if (Math.abs(i) + Math.abs(j) < .35) {
				this.state = 0;
			} else if (i*j < 0) {
				this.state = 1;
			} else {
				this.state = 2;
			}
		}
	}
}

Block.prototype.draw = function() {
	noFill();
	stroke(255);
	line(this.x - gridSide/2, this.y - gridSide/2, this.x - gridSide/2, this.y - gridSide/3);
	line(this.x - gridSide/2, this.y - gridSide/2, this.x - gridSide/3, this.y - gridSide/2);
	
	line(this.x + gridSide/2, this.y - gridSide/2, this.x + gridSide/2, this.y - gridSide/3);
	line(this.x + gridSide/2, this.y - gridSide/2, this.x + gridSide/3, this.y - gridSide/2);
	
	line(this.x - gridSide/2, this.y + gridSide/2, this.x - gridSide/2, this.y + gridSide/3);
	line(this.x - gridSide/2, this.y + gridSide/2, this.x - gridSide/3, this.y + gridSide/2);
	
	line(this.x + gridSide/2, this.y + gridSide/2, this.x + gridSide/2, this.y + gridSide/3);
	line(this.x + gridSide/2, this.y + gridSide/2, this.x + gridSide/3, this.y + gridSide/2);
	if (this.state == 0) {
		//ellipse(this.x, this.y, 5);		
	} else if (this.state == 1) {
		line(this.x - gridSide/3, this.y + gridSide/3, this.x + gridSide/3, this.y - gridSide/3);
	} else if (this.state == 2) {
		line(this.x - gridSide/3, this.y - gridSide/3, this.x + gridSide/3, this.y + gridSide/3);
	}
}

function xy2ij(x, y) {
	return [x/gridSide, y/gridSide];
}

function Ball(pi, pj, vi, vj) {
	this.pi = pi;
	this.pj = pj;
	this.vi = vi;
	this.vj = vj;
	this.r = 20;
}

Ball.prototype.draw = function() {
	fill(255);
	noStroke();
	ellipse(this.pi * gridSide + gridSide/2, this.pj * gridSide + gridSide/2, 10);
}

Ball.prototype.update = function(dt) {
	let ni = this.pi + this.vi * dt;
	let nj = this.pj + this.vj * dt;
	console.log(this.pi, this.pj, this.vi, this.vj, dt);
	if (flr(this.pi) != flr(ni) || flr(this.pj) != flr(nj)) {
		if (round(ni) < 0 || round(ni) >= gridW || round(nj) < 0 || round(nj) >= gridH) {
			return;
		}
		let frac = abs(round(ni) - ni) + abs(round(nj) - nj);
		//console.log(frac);
		block = blocks[gridH * round(ni) + round(nj)];
		this.pi = Math.round(ni);
		this.pj = Math.round(nj);
		if (block.state == 1) {
			let temp = this.vi;
			this.vi = -this.vj;
			this.vj = -temp;
		} else if (block.state == 2) {
			let temp = this.vi;
			this.vi = this.vj;
			this.vj = temp;			
		}
		this.pi += this.vi * frac;
		this.pj += this.vj * frac;
	} else {	
		this.pi = ni;
		this.pj = nj;
	}
	//console.log(this.pi, this.pj);
}

function BallSpawner(pi,pj,vi,vj,freq,off) {
	this.pi = pi;
	this.pj = pj;
	this.vi = vi;
	this.vj = vj;
	this.freq = freq;
	this.off = off;
}

BallSpawner.prototype.update = function() {
	if (frameCount % this.freq == this.off) {
		balls.push(new Ball(this.pi, this.pj, this.vi, this.vj));
	}
}

function rndDir() {
	let k = flr(Math.random()*4);
	if (k==0) return [1, 0];
	if (k==1) return [0, 1];
	if (k==2) return [-1, 0];
	if (k==3) return [0, -1];
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

flr = Math.floor;