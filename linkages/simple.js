let hoverElement = null;
let grabbedElement = null;

let pointRadius = 10;
let sqMouseHoverSize = 100;

let points = [];
let links = [];

let running = false;
let startRunning = new Date();
let lastRunning = new Date();

let drawnSegments = [];
let accuracy = 24;

function setup() {
  var cnv = createCanvas(windowWidth, windowHeight);
  cnv.style('display', 'block');
  document.addEventListener('contextmenu', event => event.preventDefault());
}

function draw() {
  background(32);
  if (running) {
    background(40, 28, 28);
  }
  for (let i=0; i<links.length; i++) {
    links[i].draw();
  }
  for (let i=0; i<points.length; i++) {
    points[i].draw();
  }
  if (running) {
    fullConstraint(new Date() - lastRunning);
    lastRunning = new Date();
  }
  stroke(255);
  strokeWeight(2);
  for (let i=0; i<drawnSegments.length; i++) {
    line(...drawnSegments[i]);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mouseMoved() {
  if (grabbedElement) {
    if (grabbedElement instanceof Point) {
      if (!running || (running && grabbedElement.fixed)) {
        grabbedElement.editorX = mouseX;
        grabbedElement.editorY = mouseY;
      }
      grabbedElement.x = mouseX;
      grabbedElement.y = mouseY;
    }
  }
  selectHoverPoint();
  return false;
}

function mousePressed() {
  if (hoverElement) {
    if (mouseButton === LEFT) {
      grabbedElement = hoverElement;
      hoverElement = null;
    } else if (mouseButton === RIGHT) {
      if (hoverElement instanceof Point) {
        points = points.filter( p => p!=hoverElement );
        links = links.filter( l => l.pointA!=hoverElement && l.pointB!=hoverElement );
      } else if (hoverElement instanceof Link) {
        links = links.filter( l => l!==hoverElement );
      }
      hoverElement = null;
    } else if (mouseButton === CENTER) {
      if (hoverElement instanceof Point) {
        //hoverElement = null;
        grabbedElement = new Point(mouseX, mouseY, false);
        points.push(grabbedElement);
        links.push(new Link(hoverElement, grabbedElement));
        hoverElement = null;
      } else if (hoverElement instanceof Link) {
        if (hoverElement.motorSpeed) {
          hoverElement.motorSpeed = null;
        } else {
          hoverElement.motorSpeed = 1;
        }
      }
    }
  } else {
    if (mouseButton === LEFT) {
      points.push(new Point(mouseX, mouseY, false));
    } else if (mouseButton === RIGHT) {

    } else if (mouseButton === CENTER) {

    }
  }
  selectHoverPoint();
  return false;
}

/*
  if (hoverElement) {
    if (mouseButton === LEFT) {
      grabbedElement = hoverElement;
      hoverElement = null;
    } else if (mouseButton === RIGHT) {

    } else if (mouseButton === CENTER) {

    }
  } else {
    if (mouseButton === LEFT) {
      
    } else if (mouseButton === RIGHT) {

    } else if (mouseButton === CENTER) {

    }
  }
*/
  
function mouseDragged() {
  if (grabbedElement) {
    if (grabbedElement instanceof Point) {
      if (!running || (running && grabbedElement.fixed)) {
        grabbedElement.editorX = mouseX;
        grabbedElement.editorY = mouseY;
      }
      grabbedElement.x = mouseX;
      grabbedElement.y = mouseY;
    }
  }
  selectHoverPoint();
  return false;
}

function mouseReleased() {
  if (grabbedElement) {
    if (hoverElement && grabbedElement !== hoverElement) {
      if (grabbedElement instanceof Point && hoverElement instanceof Point) {
        links.forEach(function(l) {
          if (l.pointA === grabbedElement) {
            l.pointA = hoverElement;
          }
          if (l.pointB === grabbedElement) {
            l.pointB = hoverElement;
          }          
        });
        links = links.filter(l => l.pointA !== l.pointB);
        points = points.filter(p => p!== grabbedElement);
      }
    }
  }
  grabbedElement = null;
  return false;
}

function mouseWheel(event) {
  if (hoverElement && hoverElement instanceof Link) {
    if (!hoverElement.motorSpeed) hoverElement.motorSpeed = 0;
    hoverElement.motorSpeed += Math.floor(event.delta/100);
  }
} 

function keyPressed() {
  if (key == 'f' && hoverElement && hoverElement instanceof Point) {
    hoverElement.fixed = !hoverElement.fixed;
  }
  if (key == 'd' && hoverElement && hoverElement instanceof Point) {
    hoverElement.drawer = !hoverElement.drawer;
  }
  if (key == 'e' && hoverElement && hoverElement instanceof Point) {
    grabbedElement = new Point(mouseX, mouseY, false);
    points.push(grabbedElement);
    links.push(new Link(hoverElement, grabbedElement));
    hoverElement = null;
  }
  if (key == 'q' && hoverElement && hoverElement instanceof Link) {
    if (!hoverElement.motorSpeed) hoverElement.motorSpeed = 0;
    hoverElement.motorSpeed -= 1;
  }
  if (key == 'w' && hoverElement && hoverElement instanceof Link) {
    if (!hoverElement.motorSpeed) hoverElement.motorSpeed = 0;
    hoverElement.motorSpeed += 1;
  }
  if (key == 'x' && hoverElement) {
    if (hoverElement instanceof Point) {
      points = points.filter( p => p!=hoverElement );
      links = links.filter( l => l.pointA!=hoverElement && l.pointB!=hoverElement );
    } else if (hoverElement instanceof Link) {
      links = links.filter( l => l!==hoverElement );
    }
    hoverElement = null;
    selectHoverPoint();
  }
  if (key == ' ') { 
    if (running) {
      stopRun();
    } else {
      startRun();
    }
  }
}

function keyReleased() {
  if (key == 'e') {
    if (grabbedElement) {
      if (hoverElement && grabbedElement !== hoverElement) {
        if (grabbedElement instanceof Point && hoverElement instanceof Point) {
          links.forEach(function(l) {
            if (l.pointA === grabbedElement) {
              l.pointA = hoverElement;
            }
            if (l.pointB === grabbedElement) {
              l.pointB = hoverElement;
            }          
          });
          links = links.filter(l => l.pointA !== l.pointB);
          points = points.filter(p => p!== grabbedElement);
        }
      }
    }
    grabbedElement = null;
    selectHoverPoint();
  }  
}

function startRun() {
  for (let i=0; i<links.length; i++) {
    links[i].targetDist = Util.dist(links[i].pointA, links[i].pointB);
    if (links[i].motorSpeed) {
      let motor = links[i];
      motor.motorOffset = Math.atan2(motor.pointB.editorY - motor.pointA.editorY, motor.pointB.editorX - motor.pointA.editorX);
    }
  }
  drawnSegments = [];
  startRunning = new Date();
  lastRunning = new Date();
  running = true;
}

function stopRun() {
  for (let i=0; i<points.length; i++) {
    points[i].x = points[i].editorX;
    points[i].y = points[i].editorY;
  }
  drawnSegments = [];
  running = false;
}

function fullConstraint(dt) {
  //points[0].x = points[0].editorX + totalTime/10;
  //let ang = Math.atan2(points[1].editorY - points[0].editorY, points[1].editorX - points[0].editorX);
  //let 
  let segmentId = drawnSegments.length;
  for (let i=0; i<points.length; i++) {
    if (points[i].drawer) {
      drawnSegments.push([points[i].x, points[i].y, 0, 0]);
    }
  }
  
  for (let i=0; i<links.length; i++) {
    if (!links[i].motorSpeed) continue;
    let motor = links[i];
    /*
    let motor = links[i];
    let ang = Math.atan2(motor.pointB.editorY - motor.pointA.editorY, motor.pointB.editorX - motor.pointA.editorX);
    motor.pointB.x = motor.pointA.x + Math.cos(ang + motor.motorSpeed*totalTime/1000)*motor.targetDist;
    motor.pointB.y = motor.pointA.y + Math.sin(ang + motor.motorSpeed*totalTime/1000)*motor.targetDist;
    */
    motor.motorOffset += motor.motorSpeed*dt/1000;
    motor.pointB.x = motor.pointA.x + Math.cos(motor.motorOffset)*motor.targetDist;
    motor.pointB.y = motor.pointA.y + Math.sin(motor.motorOffset)*motor.targetDist;
  }
  for (let i=0; i<points.length; i++) {
    if (points[i].fixed) {
      points[i].x = points[i].editorX;
      points[i].y = points[i].editorY;
    }
  }
  for (let k=0; k<accuracy; k++) {
    for (let i=0; i<links.length; i++) {
      links[i].enforce();
    }
  }
  
  let k=0;
  for (let i=0; i<points.length; i++) {
    if (points[i].drawer) {
      drawnSegments[segmentId+k][2] = points[i].x;
      drawnSegments[segmentId+k][3] = points[i].y;
      k++;
    }
  }
}



function Point(x,y,fixed) {
  this.x = x;
  this.y = y;
  this.fixed = fixed;
  this.editorX = x;
  this.editorY = y;
  this.drawer = false;
}

function Link(pointA, pointB, motorSpeed) {
  this.pointA = pointA;
  this.pointB = pointB;
  this.targetDist = Util.dist(pointA, pointB);
  this.motorSpeed = motorSpeed || 0;
  this.motorOffset = 0;
}

Point.prototype.draw = function() {
  strokeWeight(1);
  stroke(0);
  if (this.fixed) {
    strokeWeight(4);
    stroke(255);
  }
  fill(128);  
  if (this == hoverElement) {
    //fill(192);
    fill(192,0,0);
  } else if (this == grabbedElement) {
    //fill(255);
    fill(0,255,0);
  }
  ellipse(this.x, this.y, pointRadius*2, pointRadius*2);
}

Point.prototype.sqDistToXY = function(x,y) {
  let dx = x - this.x;
  let dy = y - this.y;
  return dx*dx + dy*dy;
}

Link.prototype.draw = function() {
  strokeWeight(8);
  stroke(128);
  if (this == hoverElement) {
    //stroke(192);
    stroke(192,0,0);
  } else if (this == grabbedElement) {
    //stroke(255);
    stroke(0,255,0);
  }
  line(this.pointA.x, this.pointA.y, this.pointB.x, this.pointB.y);
  
  if (this.motorSpeed) {
    strokeWeight(4);
    noFill();
    let ang = HALF_PI + Math.atan2(-this.pointB.x + this.pointA.x, this.pointB.y - this.pointA.y);
    if (this.motorSpeed > 0) {
      for (let i=0; i<this.motorSpeed; i++) {
        arc(this.pointA.x, this.pointA.y, pointRadius*(4+i*2), pointRadius*(4+i*2), ang, ang+PI/6);
      }
    } else {
      for (let i=0; i<-this.motorSpeed; i++) {
        arc(this.pointA.x, this.pointA.y, pointRadius*(4+i*2), pointRadius*(4+i*2), ang-PI/6, ang);
      }
    }
  }
}

Link.prototype.sqDistToXY = function(x,y) {
  let l2 = Util.distSq(this.pointA, this.pointB);
  if (l2 === 0) {
    return this.pointA.sqDistToXY(x,y);
  }
  let v0 = this.pointA.x;
  let v1 = this.pointA.y;
  let w0 = this.pointB.x;
  let w1 = this.pointB.y;
  let t = ((x - v0) * (w0 - v0) + (y - v1) * (w1 - v1)) / l2;
  //t = Math.max(0, Math.min(1, t));  
  let cap = 2*pointRadius/Math.sqrt(l2);
  t = Math.max(cap, Math.min(1 - cap, t));
  
  let cx = v0 + t*(w0-v0); //closest point x
  let cy = v1 + t*(w1-v1);
  return (cx-x)*(cx-x) + (cy-y)*(cy-y);
}

Link.prototype.enforce = function() {
  var p1 = this.pointA;
  var p2 = this.pointB;
  if (p1 != null && p2 != null) {
    // calculate the distance
    var diffX = p1.x - p2.x;
    var diffY = p1.y - p2.y;
    var d = Math.sqrt(diffX * diffX + diffY * diffY);
    
    //var difference = 0;
    
    /*if (d < this.minDist) {
      difference = (this.minDist - d) / d;
    } else if (d > this.maxDist) {
      difference = (this.maxDist - d) / d;
    }*/
    // difference scalar
    var difference = (this.targetDist - d) / d;
     
    // translation for each PointMass. They'll be pushed 1/2 the required distance to match their resting distances.
    var translateX = diffX * 0.5 * difference;
    var translateY = diffY * 0.5 * difference;
    
    if (p1.fixed || p2.fixed) {
      translateX *= 2;
      translateY *= 2;
    }
    
    if (!p1.fixed) {
      p1.x += translateX;
      p1.y += translateY;
    }
    
    if (!p2.fixed) {
      p2.x -= translateX;
      p2.y -= translateY;
    }    
  } else {
    console.log("terrible error");
  }
}

function selectHoverPoint() {
  if (hoverElement) {
    var d = hoverElement.sqDistToXY(mouseX, mouseY);
    if (d < sqMouseHoverSize) {
      return;
    } else {
      hoverElement = null;
    }
  }
  let closeElements = points.concat(links).filter(function(p) {
    return p!=grabbedElement;
  });
  //let closeElements = points.concat(links);
  closeElements.sort(function(pa, pb) {
    return pa.sqDistToXY(mouseX, mouseY) - pb.sqDistToXY(mouseX, mouseY);
  });
  if (closeElements[0] && closeElements[0].sqDistToXY(mouseX, mouseY) < sqMouseHoverSize) {
    hoverElement = closeElements[0];
  }
}


Util = {
  distSq: function (a, b) {
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    return dx*dx + dy*dy;
  },
  dist: function (a, b) {
    return Math.sqrt(Util.distSq(a, b));
  },
}