let eps = 0.1;
let _dt = 1/20;

let oX = 0;
let oY = 0;
let z = 200;
let points = [];//[[0,0], [1., 0]];
let t = 0;
let curPoints = [];
let minDrawDist = 10;

function setup() {
  var cnv = createCanvas(windowWidth, windowHeight);
  cnv.style('display', 'block');
  oX = width/2;
  oY = height/2;
  stroke(255);
  //frameRate(1);
}

function f(x, y, dt) {
  return [x + y*dt,
          y - Math.sin(x)*dt];
  //return [x + y*dt,
  //        y + (x*(5+3*x-2*x*x))*dt];
  //return [x + (y+x*(1-x*x-y*y))*dt,
  //        y + (-x+y*(1-x*x-y*y))*dt];
  /*let a = 0.4;
  let b = 0.4;
  let c = 0.4;
  let d = 0.4;
  let xr = 0.2;
  return [x + (a*x - b*y*(x-xr))*dt,
          y + (c*y*(x-xr) - d*y)*dt];*/
  
  /*let r = 3.48;
  return [x + (-r*x*y + y)*dt,
          y + ( r*x*y - y)*dt];*/
  //return [x + (-x+(2-x)*y)*dt,
  //        y + (-y+(2-y)*x)*dt];
  
  //return [x + (-x-y-y/Math.sqrt(x*x+y*y))*dt,
  //        y + (x-y+x/Math.sqrt(x*x+y*y))*dt];
  
  //return [x + (-y-x+(x*x+2*y*y)*x)*dt,
  //        y + (x-y+(x*x+2*y*y)*y)*dt];
  
  //return [x + (x+y*y+x*x*x)*dt, y + (-x+y+y*x*x)*dt];
  
  //return [x + (1 - x*y)*dt, y + x*dt];
  
  //let f = -(x*x+y*y-1)*y - x*x*x;
  //return [x + y*dt, y + f*dt];
  
  /*if (x > 0) {
    return [x + y*dt, y];
  }
  //let force = -sign(tx) / (4 - tx);
  let force = (-12*x) / ((x*x-4)*(x*x-4));
  return [x + y*dt, y + force*dt];*/
  
  /*let pushDist = 500;
  let u = 4;
  let v = 3;
  if (x*x < pushDist*pushDist) {
    //let d = Math.sqrt(dd) - pushDist;
    //let f = (v/u) * (d / ((1 - d*d)*(1 - d*d)));
    let d = Math.abs(x);
    let f = - sign(x)*(u/v) * (pushDist*pushDist*(pushDist*pushDist-1)*(d-pushDist)) / (d*d * (d-2*pushDist)*(d-2*pushDist));
    //let f = - sign(x) * (u/v) * (d-pushDist) / (x*x * (d-2*pushDist)*(d-2*pushDist));
    //console.log({d: dd, f: f});
    return [x + y*dt, y + f*dt];
  }
  return [x + y*dt, y];*/
  
  
  /*tx = Math.abs(x);
  if (tx > 1) {
    return [x + y*dt, y];
  }
  //let force = -sign(tx) / (4 - tx);
  //let force = (-12*x) / ((x*x-4)*(x*x-4));
  let v = (tx-1)*(tx-1) - 1;
  let force = sign(x) * (-6/8) * ((tx-1) / (v*v));
  return [x + y*dt, y + force*dt];
  //return [x + dt*(y - eps*(x-(x*x*x/3))), y - x*dt];  
  //return [x + y*dt, y - Math.sin(x)*dt];*/
}


function sign(x) {
  if (x>0) return 1;
  if (x<0) return -1;
  return 0;
}

function draw() {
  background(32);
  translate(oX, oY);
  //let dt = 1/2400;
  let dt = 1/2400;  
  for (let k=0; k<200; k++) {
    for (let i=0; i<points.length; i++) {
      let p = points[i];
      points[i] = f(p[0], p[1], dt);
    }
  }
  fill(128);
  for (let i=0; i<points.length; i++) {
    ellipse(points[i][0]*z, points[i][1]*z, 20, 20);
  }
  fill(0);
  for (let i=0; i<curPoints.length; i++) {
    let p = s2w(...curPoints[i]);
    ellipse(p[0]*z, p[1]*z, 20, 20);
  }
  dt = _dt;
  let x = (mouseX-oX)/z;
  let y = (mouseY-oY)/z;
  for (let i=0; i<50/_dt; i++) {
    /*let nx = x + y*dt;
    let ny = y - Math.sin(x)*dt;*/
    [nx, ny] = f(x, y, dt);
    line(x*z,y*z,nx*z,ny*z);
    x = nx;
    y = ny;
  }
  //ellipse(-1*z,0,10,10);
  ellipse(0,0,10,10);
  //ellipse(.5*z,0,10,10);
  ellipse(1*z,0,10,10);
  //ellipse(2*z,0,10,10);
  //ellipse(-2*z,0,10,10);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
  if (mouseButton == LEFT) {
    curPoints.push([mouseX, mouseY]);
    /*if (curPoints.length == 0) {
      curPoints.push([mouseX, mouseY]);
    }*/
    //let x = (mouseX-oX)/z;
    //let y = (mouseY-oY)/z;
  }
}

function mouseReleased() {
  /*if (curPoints.length == 1) {
    points.push(s2w(curPoints[0]));
  } else if (curPoints.length > 1) {
    
  }*/
  //console.log(curPoints);
  for (let i=0; i<curPoints.length; i++) {
    //console.log(curPoints[i]);
    //console.log(s2w(...curPoints[i]));
    points.push(s2w(...curPoints[i]));
  }
  curPoints = [];
}

function mouseDragged() {
  if (mouseButton == CENTER) {
    oX += mouseX - pmouseX;
    oY += mouseY - pmouseY;
  } else if (mouseButton == LEFT) {    
    if (atDist([mouseX, mouseY], curPoints, minDrawDist)) {
      curPoints.push([mouseX, mouseY]);
    }
  }
}

function mouseWheel(event) {
  let nz = z - z*event.delta/1000;
  oX += (z-nz) * (mouseX - oX)/z;
  oY += (z-nz) * (mouseY - oY)/z;
  z = nz;
}

function s2w(x,y) {
  return [(x-oX)/z, (y-oY)/z];
}

function atDist(p, ps, d) {
  let minDist = 10000000;
  for (let i=0; i<ps.length; i++) {
    let cp = ps[i];
    let dx = cp[0]-p[0];
    let dy = cp[1]-p[1];
    //console.log(dx*dx+dy*dy);
    //if (d*d < dx*dx+dy*dy) return false;
    if (dx*dx+dy*dy < minDist) {
      minDist = dx*dx + dy*dy;
    }
  }
  //console.log(minDist);
  return minDist > d*d;
}