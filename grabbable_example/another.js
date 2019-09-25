let baseGUI;
let lastButtons = 0;

function setup() {
  var cnv = createCanvas(windowWidth, windowHeight);
  cnv.style('display', 'block');
  document.addEventListener('contextmenu', event => event.preventDefault());

  baseGUI = new GUI();
  baseGUI.x = 0;
  baseGUI.y = 0;
  baseGUI.sx = width;
  baseGUI.sy = height;
  
  let panel = new Panel();
  panel.parent = baseGUI;
  baseGUI.children.push(panel);
  panel.x = 20;
  panel.y = 20;
  
  let dragger = new Dragger(panel);
}

function draw() {
  background(32);
  baseGUI.draw();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

//function keyPressed(event) {baseGUI.mouseEvent(event); return false;}
//function keyReleased(event) {baseGUI.mouseEvent(event); return false;}
function mouseMoved(event) {baseGUI.mouseEvent(fixMouseEvent(event)); return false;}
function mouseDragged(event) {baseGUI.mouseEvent(fixMouseEvent(event)); return false;}
function mousePressed(event) {baseGUI.mouseEvent(fixMouseEvent(event)); return false;}
function mouseReleased(event) {baseGUI.mouseEvent(fixMouseEvent(event)); return false;}
function mouseWheel(event) {baseGUI.mouseEvent(fixMouseEvent(event)); return false;}

function fixMouseEvent(event) {
  event.lastButtons = lastButtons;
  event.changedButtons = lastButtons ^ event.buttons;
  lastButtons = event.buttons;
  return event;
}

function GUI() {
  this.x = 0;
  this.y = 0;
  this.sx = 100;
  this.sy = 100;
  this.parent = null;
  this.children = [];
}

GUI.prototype.draw = function() {
  for (let i=0; i<this.children.length; i++) {
    this.children[i].draw();
  }
};

GUI.prototype.containsXY = function(x,y) {
  return (x >= this.x) && (x <= this.x+this.sx) && (y >= this.y) && (y <= this.y+this.sy);
}

/*GUI.prototype.childAtXY = function(x,y) {
  for (let i=0; i<this.children.length; i++) {
    let c = this.children[i];
    if (c.x >= x && c.x <= x+c.sx && c.y >= y && c.y <= y+c.sy) {
      return c;
    }
  }
};*/

GUI.prototype.mouseEvent = function(event) {
  for (let i=0; i<this.children.length; i++) {
    this.children[i].mouseEvent(event);
  }
  /*console.log(event.pageY);
  console.log(event.movementY);*/
};

function Panel() {
  this.x = 0;
  this.y = 0;
  this.sx = 400;
  this.sy = 300;
  this.parent = null;
  this.children = [];
}

Panel.prototype = Object.create(GUI.prototype);

Panel.prototype.draw = function() {
  fill(192);
  rect(this.x, this.y, this.sx, this.sy);
  for (let i=0; i<this.children.length; i++) {
    this.children[i].draw();
  }
};

function Dragger(p) {
  this.parent = p;
  p.children.push(this);
  this.x = p.x+10;
  this.y = p.y+10;
  this.sx = 20;
  this.sy = 20;
  this.children = [];
  this.state = 0; //0 none, 1 grabbed
}

Dragger.prototype = Object.create(GUI.prototype);

Dragger.prototype.draw = function() {
  fill(32);
  rect(this.x, this.y, this.sx, this.sy);
};

Dragger.prototype.mouseEvent = function(event) {
  let inside = this.containsXY(event.pageX, event.pageY);
  if (this.state === 0) {
    if (inside && event.type === "mousedown" && event.changedButtons & 1) {
      this.state = 1;
    }
  }
  if (this.state === 1) {
    if (event.type === "mouseup" && event.changedButtons & 1) {
      this.state = 0;
    } else {
      if (this.parent.x + event.movementX < width/2) {
        this.parent.x += event.movementX;
        this.parent.y += event.movementY;
        this.x += event.movementX;
        this.y += event.movementY;
      }      
    }
  }
};