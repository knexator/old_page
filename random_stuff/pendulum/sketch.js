let oX = 0;
let oY = 0;
let z = 200;
let points = [[0,0], [1., 0]];
let t = 0;
let curPoints = [];
let minDrawDist = 10;

function setup() {
  var cnv = createCanvas(windowWidth, windowHeight);
  cnv.style('display', 'block');
  oX = width/2;
  oY = height/2;
  stroke(255);
}

function draw() {
  background(32);
  translate(oX, oY);
  let dt = 1/2400;
  for (let k=0; k<100; k++) {
    for (let i=0; i<points.length; i++) {
      let p = points[i]
      let nx = p[0] + p[1]*dt;
      let ny = p[1] - Math.sin(p[0])*dt;
      points[i] = [nx, ny];
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
  dt = 1/240;
  let x = (mouseX-oX)/z;
  let y = (mouseY-oY)/z;  
  for (let i=0; i<3000; i++) {
    let nx = x + y*dt;
    let ny = y - Math.sin(x)*dt;
    line(x*z,y*z,nx*z,ny*z);
    x = nx;
    y = ny;
  }  
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