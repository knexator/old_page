let canvas;
let ctx;
let frameCount = 0;

let isMouseDown = false;
let lastMousePressX;
let lastMousePressY;

let memory = new MemoryStrip(120);
let balls = [];
let ballSpawners = [];

let gridSide = 50;
let gridW = 8;
let gridH = 8;

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.style('display', 'block');
  canvas = document.getElementById("defaultCanvas0");
  ctx = canvas.getContext("2d");
  document.addEventListener('contextmenu', event => event.preventDefault());
}

function draw() {
  background(32);
  
  if (isMouseDown) {
	  memory.addCurSeg();
  }
  let segs = memory.getCurSegs();
  //console.log(segs);
  for (let i = 0; i < segs.length; i++) {
	  segs[i].draw();
  }
  
  for (let i = 0; i < ballSpawners.length; i++) {
	  ballSpawners[i].update();
	  ballSpawners[i].draw();
  }
  for (let i = 0; i < balls.length; i++) {
	  //balls[i].update(1.0/60);
	  memory.updateBall(balls[i], 1.0/60);
	  balls[i].draw();
  }
  
  /*if (frameCount % 60 == 0) {
	  balls.push(new Ball(width/2, height/2, 60, 0));
  }*/
  if (frameCount % 240 == 0) {
	  let v = 50;
	  let freq = 60 * 2;
	  let off = 0;
	  let i = 0;
	  let j = 0;
	  //let k = Math.floor(Math.random() * gridW * 2 + 1);
	  if (Math.random() < .5) {
		  i = Math.floor(Math.random() * (gridW * 2 + 1)) + 1;
		  if (Math.random() < .5) {
			  j = 0;
			  ballSpawners.push(new BallSpawner(i * gridSide, j * gridSide, 0, v, freq, off));
		  } else {
			  j = gridH * 2 + 1;
			  ballSpawners.push(new BallSpawner(i * gridSide, j * gridSide, 0, -v, freq, off));
		  }
	  }	else {
		  j = Math.floor(Math.random() * (gridH * 2 + 1)) + 1;
		  if (Math.random() < .5) {
			  i = 0;
			  ballSpawners.push(new BallSpawner(i * gridSide, j * gridSide, v, 0, freq, off));
		  } else {
			  i = gridW * 2 + 1;
			  ballSpawners.push(new BallSpawner(i * gridSide, j * gridSide, -v, 0, freq, off));
		  }
	  }
	  console.log(i, j);
  }
  
  frameCount += 1;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mouseMoved(event) {
  return false;
}

function mousePressed(event) {
  lastMousePressX = mouseX;
  lastMousePressY = mouseY;
  isMouseDown = true;
  return false;
}

function mouseDragged(event) {
  return false;
}

function mouseReleased(event) {
	isMouseDown = false;
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
	this.segments = [];
	for (let i = 0; i<this.duration; i++) {
		this.segments.push([]);
	}
}

MemoryStrip.prototype.addCurSeg = function() {
	this.segments[mod(frameCount, this.duration)].push(new Segment(lastMousePressX, lastMousePressY, mouseX, mouseY));
}

MemoryStrip.prototype.getCurSegs = function() {
	return this.segments[mod(frameCount, this.duration)];
}

MemoryStrip.prototype.updateBall = function(ball, dt) {
	let nx = ball.px + ball.vx*dt;
	let ny = ball.py + ball.vy*dt;
	
	let firstT = Infinity;
	let segI = 0;
	//console.log(firstT);
	let segs = this.segments[mod(frameCount, this.duration)];
	for (let i = 0; i < segs.length; i++) {
		let curT = segs[i].intersectBall(ball.px, ball.py, nx, ny)
		if (curT < firstT) {
			segI = i;
			firstT = curT;
		}
	}
	//console.log(firstT);
	if (firstT <= 1) {
		let ix = ball.px + (firstT * (nx - ball.px));
		let iy = ball.py + (firstT * (ny - ball.py));
		//console.log(ix, iy);
		let colSeg = segs[segI];
		
		let normX = -(colSeg.by - colSeg.ay);
		let normY = colSeg.bx - colSeg.ax;
		let normMag = Math.sqrt(normX*normX + normY*normY);
		normX /= normMag;
		normY /= normMag;
		
		let dx = nx - ix;
		let dy = ny - iy;
		let d = dx * normX + dy * normY;
		
		ball.px = ix + dx - 2 * normX * d;
		ball.py = iy + dy - 2 * normY * d;
		
		let d2 = ball.vx * normX + ball.vy * normY;
		ball.vx = ball.vx - 2 * normX * d2;
		ball.vy = ball.vy - 2 * normY * d2;
	} else {
		ball.px = nx;
		ball.py = ny;
	}
}

function Segment(ax, ay, bx, by) {
	this.ax = ax;
	this.ay = ay;
	this.bx = bx;
	this.by = by;	
}

Segment.prototype.draw = function() {
	stroke(255);
	line(this.ax, this.ay, this.bx, this.by);
}


// Taken from https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
Segment.prototype.intersectBall = function(p0_x, p0_y, p1_x, p1_y) {
	let p2_x = this.ax;
	let p2_y = this.ay;
	let p3_x = this.bx;
	let p3_y = this.by;
	
    let s1_x = p1_x - p0_x;
	let s1_y = p1_y - p0_y;
    let s2_x = p3_x - p2_x;
	let s2_y = p3_y - p2_y;

    let s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
    let t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
		return t;
        // Collision detected
        /*if (i_x != NULL)
            *i_x = p0_x + (t * s1_x);
        if (i_y != NULL)
            *i_y = p0_y + (t * s1_y);
        return 1;*/
    }
	return Infinity;
}

function Ball(px, py, vx, vy) {
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
}

function BallSpawner(px, py, vx, vy, freq, offset) {
	this.px = px;
	this.py = py;
	this.vx = vx;
	this.vy = vy;
	this.freq = freq;
	this.offset = offset;
}

BallSpawner.prototype.draw = function() {
	fill(128);
	noStroke();
	rectMode(RADIUS);
	rect(this.px, this.py, 20, 20);
}

BallSpawner.prototype.update = function() {
	if (frameCount % this.freq == this.offset) {
		balls.push(new Ball(this.px, this.py, this.vx, this.vy));
	}
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

// Taken from https://gist.github.com/gordonwoodhull/50eb65d2f048789f9558
// Adapted from http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect/1968345#1968345
var eps = 0.0000001;
function between(a, b, c) {
    return a-eps <= b && b <= c+eps;
}
function segment_intersection(x1,y1,x2,y2, x3,y3,x4,y4) {
    var x=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4)) /
            ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    var y=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4)) /
            ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    if (isNaN(x)||isNaN(y)) {
        return false;
    } else {
        if (x1>=x2) {
            if (!between(x2, x, x1)) {return false;}
        } else {
            if (!between(x1, x, x2)) {return false;}
        }
        if (y1>=y2) {
            if (!between(y2, y, y1)) {return false;}
        } else {
            if (!between(y1, y, y2)) {return false;}
        }
        if (x3>=x4) {
            if (!between(x4, x, x3)) {return false;}
        } else {
            if (!between(x3, x, x4)) {return false;}
        }
        if (y3>=y4) {
            if (!between(y4, y, y3)) {return false;}
        } else {
            if (!between(y3, y, y4)) {return false;}
        }
    }
    return {x: x, y: y};
}