// Implements hovereable and grabbable elements

let hoverElement = null;
let grabbedElement = null;
let hoverables = [];

function setup() {
  var cnv = createCanvas(windowWidth, windowHeight);
  cnv.style('display', 'block');
  document.addEventListener('contextmenu', event => event.preventDefault());
}

function draw() {
  background(32);
  for (let i=0; i<hoverables.length; i++) {
    hoverables[i].draw();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mouseMoved(event) {
  if (hoverElement && hoverElement.mouseMoved) {
    hoverElement.mouseMoved(event);
  }
  if (grabbedElement && grabbedElement.mouseMoved) {
    grabbedElement.mouseMoved(event);
  }
  selectHoverPoint();
  return false;
}

function mousePressed(event) {
  if (grabbedElement && grabbedElement.mousePressed) {
    grabbedElement.mousePressed(event);
  }
  if (hoverElement && hoverElement.mousePressed) {
    hoverElement.mousePressed(event);
  }
  if (!grabbedElement && !hoverElement) {
    hoverables.push(new ExampleGrabbable(mouseX, mouseY));
  }
  selectHoverPoint();
  return false;
}

function mouseDragged(event) {
  if (hoverElement && hoverElement.mouseDragged) {
    hoverElement.mouseDragged(event);
  }
  if (grabbedElement && grabbedElement.mouseDragged) {
    grabbedElement.mouseDragged(event);
  }
  selectHoverPoint();
  return false;
}

function mouseReleased(event) {
  if (hoverElement && hoverElement.mouseReleased) {
    hoverElement.mouseReleased(event);
  }
  if (grabbedElement && grabbedElement.mouseReleased) {
    grabbedElement.mouseReleased(event);
    //grabbedElement = null; very probably
  }
  selectHoverPoint();
  return false;
}

function mouseWheel(event) {
  if (hoverElement && hoverElement.mouseWheel) {
    hoverElement.mouseWheel(event);
  }
  if (grabbedElement && grabbedElement.mouseWheel) {
    grabbedElement.mouseWheel(event);
    //grabbedElement = null; very probably
  }
  //Math.floor(event.delta/100);
} 

function keyPressed(event) {
  
}

function keyReleased(event) {
  
}

function selectHoverPoint() {
  if (hoverElement) {
    hoverElement.tryHover(); // Might set it to null
  }
  if (!hoverElement) {
    for (let i=0; i<hoverables.length; i++) {
      hoverables[i].tryHover();
    }    
  }
  
  /*if (hoverElement) {
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
  }*/
}

function ExampleGrabbable(x,y) {
  this.x = x;
  this.y = y;
}

ExampleGrabbable.prototype.tryHover = function() {
  if (this === grabbedElement) {
    return;
  }
  if (this === hoverElement) {
    if (this.sqDistToMouse() > 20*20) {
      hoverElement = null;
    }
  } else {
    if (this.sqDistToMouse() <= 20*20) {
      hoverElement = this;
    }
  }
}

ExampleGrabbable.prototype.mousePressed = function() {
  if (this === hoverElement && !grabbedElement) {
    grabbedElement = this;
    hoverElement = null;
    this.x = mouseX;
    this.y = mouseY;
  }
}

ExampleGrabbable.prototype.mouseReleased = function() {
  if (this === grabbedElement) {
    grabbedElement = null;
  }
}

ExampleGrabbable.prototype.mouseMoved = function() {
  if (this === grabbedElement) {
    this.x = mouseX;
    this.y = mouseY;
  }
}

ExampleGrabbable.prototype.mouseDragged = ExampleGrabbable.prototype.mouseMoved;

ExampleGrabbable.prototype.sqDistToMouse = function() {
  let dx = mouseX - this.x;
  let dy = mouseY - this.y;
  let d2 = dx*dx + dy*dy;
  return d2;
}

ExampleGrabbable.prototype.draw = function() {
  fill(128);
  if (this === hoverElement) {
    fill(255, 0, 0);
  }
  if (this === grabbedElement) {
    fill(0, 255, 0);
  }
  ellipse(this.x, this.y, 40, 40);
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