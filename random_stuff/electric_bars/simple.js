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
  baseGUI.offsetX = 0;
  baseGUI.offsetY = 0;
  
  /*let panel = new Panel();
  panel.parent = baseGUI;
  baseGUI.children.push(panel);
  panel.x = 140;
  panel.y = 20;  
  let socket1 = new Socket(panel, 60, 60);
  let socket2 = new Socket(panel, 120, 60);  
  let dragger = new Dragger(panel);*/
  
  new BinaryMemoryPanel(4, 50, 30);
  new ConstPanel(200, 120, 100);
  new ConstPanel(260, 220, 0);
  new RythmStripPanel(500, 40);
  new ClockPanel(700, 800, 500);  
  new AndPanel(760, 700);  
  new OrPanel(330, 500);  
  new NotPanel(500, 700);
}

function draw() {
  background(32);
  translate(baseGUI.offsetX, baseGUI.offsetY);
  baseGUI.draw();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed(event) {
  let x = mouseX-baseGUI.offsetX;
  let y = mouseY-baseGUI.offsetY;
  switch(event.key) {
    case '1':
      new ConstPanel(x, y, 100);
      break;
    case '2':
      new ReadPanel(x, y);
      break;
    case '3':
      new ClockPanel(x, y, 500);
      break;
    case '4':
      new AndPanel(x, y);
      break;
    case '5':
      new OrPanel(x, y);
      break;
    case '6':
      new NotPanel(x, y);
      break;
    case '7':
      new BinaryMemoryPanel(4, x, y);
      break;
    case '8':
      new RythmStripPanel(x, y);
      break;
  }
}

//function keyPressed(event) {baseGUI.mouseEvent(event); return false;}
//function keyReleased(event) {baseGUI.mouseEvent(event); return false;}
function mouseMoved(event) {baseGUI.mouseEvent(fixMouseEvent(event)); return false;}
function mouseDragged(event) {
  if (event.buttons & 4) {
    baseGUI.offsetX += event.movementX;
    baseGUI.offsetY += event.movementY;    
  } else {
    baseGUI.mouseEvent(fixMouseEvent(event));
  }
  return false;
}
function mousePressed(event) {baseGUI.mouseEvent(fixMouseEvent(event)); return false;}
function mouseReleased(event) {baseGUI.mouseEvent(fixMouseEvent(event)); return false;}
function mouseWheel(event) {baseGUI.mouseEvent(fixMouseEvent(event)); return false;}

function fixMouseEvent(event) {
  event.lastButtons = lastButtons;
  event.changedButtons = lastButtons ^ event.buttons;
  lastButtons = event.buttons;
  event.gx = event.x - baseGUI.offsetX;
  event.gy = event.y - baseGUI.offsetY;
  return event;
}

function makeRandomPanel(x,y) {
  if (!x || !y) {
    x = baseGUI.offsetX + Math.random()*width;
    y = baseGUI.offsetY + Math.random()*height;
  }
  let n = Math.floor(Math.random()*6);
  switch(n) {
    case 0:
      new ConstPanel(x,y,100);
      break;
    case 1:
      new ReadPanel(x,y);
      break;
    case 2:
      new AndPanel(x,y);
      break;
    case 3:
      new OrPanel(x,y);
      break;
    case 4:
      new NotPanel(x,y);
      break;
    case 5:
      new BinaryMemoryPanel(4,x,y);
      break;
  }
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

GUI.prototype.childAtXY = function(x,y,f) {
  if (!f) f = () => true;
  let toTest = [...this.children]
  while (toTest.length > 0) {
    let elem = toTest.pop();
    if (elem.containsXY(x,y)) {
      toTest = toTest.concat(elem.children);
      if (f(elem)) {
        return elem;
      }
    }
  }
  return null;
}

GUI.prototype.childrenAtXY = function(x,y,f) {
  if (!f) f = () => true;
  let toTest = [...this.children]
  let found = [];
  while (toTest.length > 0) {
    let elem = toTest.pop();
    if (elem.containsXY(x,y)) {
      toTest = toTest.concat(elem.children);
      if (f(elem)) {
        found.push(elem);
      }
    }
  }
  return found;
}

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

function TextLabel(parent, text) {
  this.parent = parent;
  parent.children.push(this);
  this.x = parent.x;
  this.y = parent.y+parent.sy;
  this.sx = 400;
  this.sy = 30;  
  this.children = [];
  this.text = text;
}

TextLabel.prototype = Object.create(GUI.prototype);

TextLabel.prototype.draw = function() {
  textAlign(LEFT, BOTTOM);
  fill(0);
  textSize(24);
  noStroke();
  text(this.text, this.x, this.y);
  stroke(0);
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
  let inside = this.containsXY(event.gx, event.gy);
  //console.log(inside);
  if (this.state === 0) {
    if (inside && event.type === "mousedown" && event.changedButtons & 1) {
      this.state = 1;
    }
  }
  if (this.state === 1) {
    if (event.type === "mouseup" && event.changedButtons & 1) {
      this.state = 0;
    } else {
      this.parent.x += event.movementX;
      this.parent.y += event.movementY;
      for (let i=0; i<this.parent.children.length; i++) {
        let c = this.parent.children[i];
        c.x += event.movementX;
        c.y += event.movementY;
      }
    }
  }
};

function Socket(parent,lx,ly) {
  this.parent = parent;
  parent.children.push(this);
  this.x = parent.x+lx;
  this.y = parent.y+ly;
  this.children = [];
  this.sx = 40;
  this.sy = 40;
  this.state = 0; //0 is nothing, 1 is extruding a cable from it, 
}

Socket.prototype = Object.create(GUI.prototype);

Socket.prototype.draw = function() {
  let v = this.getValue();
  if (v > 0) {
    fill(128);
  } else {
    fill(64);
  }  
  ellipse(this.x+this.sx/2,this.y+this.sy/2,this.sx,this.sy);
}

Socket.prototype.containsXY = function(x,y) {
  let dx = x - (this.x+this.sx/2);
  let dy = y - (this.y+this.sy/2);
  return (dx*dx+dy*dy)*4 <= this.sx*this.sx;
  //return (x >= this.x) && (x <= this.x+this.sx) && (y >= this.y) && (y <= this.y+this.sy);
}

Socket.prototype.mouseEvent = function(event) {
  let contains = this.containsXY(event.gx, event.gy);
  //console.log(contains);
  if (this.state === 0 && contains && event.type === "mousedown") {
    let plug = baseGUI.childAtXY(event.gx, event.gy, (elem) => elem instanceof Plug);
    if (plug && plug.socketA !== this && plug.socketB !== this) plug = null;
    if (event.changedButtons & 1) {
      if (plug && !event.ctrlKey) {
        //console.log(plug);
        if (plug.socketA === this) plug.socketA = null;
        if (plug.socketB === this) plug.socketB = null;
        //this.state = 1;
      } else {
        new Plug(this, null);
        this.state = 1;
      }
    }
  }
}

Socket.prototype.getValue = function() {
  return 0;
}

Socket.prototype.connectedSockets = function() {
  let plugs = baseGUI.childrenAtXY(this.x+this.sx/2, this.y+this.sy/2, (elem) => elem instanceof Plug);
  let sockets = [];
  for (let i=0; i<plugs.length; i++) {
    if (plugs[i].socketA !== this) sockets.push(plugs[i].socketA);
    if (plugs[i].socketB !== this) sockets.push(plugs[i].socketB);
  }
  return sockets;
}

Socket.prototype.getValueConnected = function() {
  let connected = this.connectedSockets()[0];
  if (connected) return connected.getValue();
  return 0;
}

Socket.prototype.setStateSocket = function(f) {
  this.state2 = 0;
  this.getValue = function() {
    let v = this.getValueConnected();
    //console.log(v);
    //console.log(this);
    if (v > 0) {
      if (this.state2 == 0) {
        //console.log("callling");
        f();
      }
      this.state2 = 1;
    } else {
      this.state2 = 0;
    }
  }
}

function Plug(socketA, socketB) {
  this.parent = baseGUI;
  baseGUI.children.push(this);
  this.socketA = socketA;
  this.socketB = socketB;
  this.x = 0;
  this.y = 0;
  this.sx = 0;
  this.sy = 0;
  this.children = [];
  this.color = Plug.getPlugColor();
}

Plug.color = 0;

Plug.getPlugColor = function() {
  let colors = ["red", "cyan", "green", "yellow"];
  let color = colors[Plug.color];
  Plug.color += 1;
  Plug.color %= colors.length;
  return color;
}

Plug.prototype = Object.create(GUI.prototype);

Plug.prototype.draw = function() {
  fill(64);
  let ax = this.socketA ? this.socketA.x+20 : mouseX - baseGUI.offsetX;
  let ay = this.socketA ? this.socketA.y+20 : mouseY - baseGUI.offsetY;
  let bx = this.socketB ? this.socketB.x+20 : mouseX - baseGUI.offsetX;
  let by = this.socketB ? this.socketB.y+20 : mouseY - baseGUI.offsetY;
  ellipse(ax,ay,20,20);
  ellipse(bx,by,20,20);
  strokeWeight(10);
  stroke(this.color);
  //line(ax,ay,bx,by);
  noFill();
  let px = (ax+bx) / 2;
  let py = Math.max(ay,by) + Math.abs(ax-bx) / 2;
  bezier(ax,ay,(ax+px)/2,(ay+py)/2,(bx+px)/2,(by+py)/2,bx,by);
  strokeWeight(1);
  stroke(0);
}

Plug.prototype.mouseEvent = function(event) {
  if (this.socketA === null || this.socketB === null) {
    if (event.type === "mouseup" && event.changedButtons & 1) {
      let socket = baseGUI.childAtXY(event.gx, event.gy, (elem) => elem instanceof Socket);
      if (!socket || socket == this.socketA || socket == this.socketB) {
        if (this.socketA) this.socketA.state = 0;
        if (this.socketB) this.socketB.state = 0;
        this.socketA = null;
        this.socketB = null;
        this.parent.children = this.parent.children.filter((elem) => elem!=this);
      } else {
        if (this.socketA) {
          this.socketB = socket;
          this.socketA.state = 0;
        } else {
          this.socketA = socket;
          this.socketB.state = 0;
        }
      }
    }
  }
}

Plug.prototype.containsXY = function(x,y) {
  if (this.socketA && this.socketA.containsXY(x,y)) return true;
  if (this.socketB && this.socketB.containsXY(x,y)) return true;
  return false;
}

function ConstPanel(x,y,v) {
  this.parent = baseGUI;
  baseGUI.children.push(this);
  this.x = x;
  this.y = y;
  this.sx = 100;
  this.sy = 100;
  this.children = [];
  this.v = v;
  let dragger = new Dragger(this);
  let socketA = new Socket(this,40,30);
  socketA.getValue = () => this.v;
  this.textLabel = new TextLabel(this, v.toString());
}

ConstPanel.prototype = Object.create(Panel.prototype);

ConstPanel.prototype.mouseEvent = function(event) {
  if (this.containsXY(event.gx, event.gy) && event.type == "wheel") {
    let d = -event.delta / 100;
    if (event.ctrlKey) d *= 20;
    this.v += d;
    this.textLabel.text = this.v.toString();    
  }
  for (let i=0; i<this.children.length; i++) {
    this.children[i].mouseEvent(event);
  }
}

function ReadPanel(x,y) {
  this.parent = baseGUI;
  baseGUI.children.push(this);
  this.x = x;
  this.y = y;
  this.sx = 120;
  this.sy = 100;
  this.children = [];
  let dragger = new Dragger(this);
  this.socketA = new Socket(this,40,30);
  this.socketA.getValue = this.socketA.getValueConnected;
  this.textLabel = new TextLabel(this, "r: -");
}

ReadPanel.prototype = Object.create(Panel.prototype);

ReadPanel.prototype.draw = function() {
  if (this.socketA) this.textLabel.text = "r: " + this.socketA.getValue().toString();
  Panel.prototype.draw.call(this);
}

function ClockPanel(x,y,v) {
  this.parent = baseGUI;
  baseGUI.children.push(this);
  this.x = x;
  this.y = y;
  this.sx = 120;
  this.sy = 100;
  this.lastMillis = millis();
  this.curMillis = 0;
  this.period = v;
  this.state = false;
  this.children = [];
  let dragger = new Dragger(this);
  let that = this;
  this.socketA = new Socket(this,40,30);  
  this.socketA.getValue = function() {
    that.curMillis += (millis() - that.lastMillis);
    //if (isNaN(this.curMillis)) that.curMillis = 0;
    //console.log(this.curMillis);    
    if (that.curMillis >= that.period) {
      //console.log("asdf");
      that.state = !that.state;
      that.curMillis %= that.period;
    }
    that.lastMillis = millis();
    return that.state ? 100 : 0;
  }
  this.textLabel = new TextLabel(this, "clk");
}

ClockPanel.prototype = Object.create(Panel.prototype);

/*ClockPanel.prototype.draw = function() {
  if (this.socketA) this.textLabel.text = "r: " + this.socketA.getValue().toString();
  Panel.prototype.draw.call(this);
}*/

ClockPanel.prototype.mouseEvent = function(event) {
  if (this.containsXY(event.gx, event.gy) && event.type == "wheel") {
    let d = -event.delta / 100;
    if (event.ctrlKey) d *= 20;
    this.period += d;
    this.period = Math.max(50, this.period);
    this.textLabel.text = "clk: " + this.period.toString();    
  }
  for (let i=0; i<this.children.length; i++) {
    this.children[i].mouseEvent(event);
  }
}

function AndPanel(x,y) {
  this.parent = baseGUI;
  baseGUI.children.push(this);
  this.x = x;
  this.y = y;
  this.sx = 240;
  this.sy = 100;
  this.children = [];
  let dragger = new Dragger(this);
  let socketA = new Socket(this,40,30);
  let socketB = new Socket(this,100,30);
  let socketC = new Socket(this,160,30);
  socketA.getValue = socketA.getValueConnected;
  socketB.getValue = socketB.getValueConnected;
  socketC.getValue = function() {
    let a = socketA.getValue() > 0;
    let b = socketB.getValue() > 0;
    return (a && b) ? 100 : 0;
  }
  let text = new TextLabel(this, "and");
}

AndPanel.prototype = Object.create(Panel.prototype);

function OrPanel(x,y) {
  this.parent = baseGUI;
  baseGUI.children.push(this);
  this.x = x;
  this.y = y;
  this.sx = 240;
  this.sy = 100;
  this.children = [];
  let dragger = new Dragger(this);
  let socketA = new Socket(this,40,30);
  let socketB = new Socket(this,100,30);
  let socketC = new Socket(this,160,30);
  socketA.getValue = socketA.getValueConnected;
  socketB.getValue = socketB.getValueConnected;
  socketC.getValue = function() {
    let a = socketA.getValue() > 0;
    let b = socketB.getValue() > 0;
    return (a || b) ? 100 : 0;
  }
  let text = new TextLabel(this, "or");
}

OrPanel.prototype = Object.create(Panel.prototype);

function NotPanel(x,y) {
  this.parent = baseGUI;
  baseGUI.children.push(this);
  this.x = x;
  this.y = y;
  this.sx = 200;
  this.sy = 100;
  this.children = [];
  let dragger = new Dragger(this);
  let socketA = new Socket(this,40,30);
  let socketB = new Socket(this,100,30);
  socketA.getValue = socketA.getValueConnected;
  socketB.getValue = function() {
    let a = socketA.getValue() > 0;
    return (!a) ? 100 : 0;
  }
  let text = new TextLabel(this, "not");
}

NotPanel.prototype = Object.create(Panel.prototype);

function BinaryMemoryPanel(n,x,y) {
  this.parent = baseGUI;
  baseGUI.children.push(this);
  this.x = x;
  this.y = y;
  this.sx = 170;
  this.sy = Math.pow(2, n)*45+60;
  this.children = [];
  let dragger = new Dragger(this);
  this.inputSockets = []
  for (let i=0; i<n; i++) {
    this.inputSockets.push(new Socket(this, 40, 30+i*45));
    this.inputSockets[i].getValue = this.inputSockets[i].getValueConnected;
  }
  this.outputSockets = [];
  for (let i=0; i<Math.pow(2,n); i++) {
    this.outputSockets.push(new Socket(this, 110, 30+i*45));
    this.outputSockets[i].n = i;
    this.outputSockets[i].getValue = this.getValueN(i);
    /*this.outputSockets[i].getValue = function() {
      return this.getCurNumber() ==
    }*/  
  }
  this.n = n;
  /*let socketA = new Socket(this,40,30);
  let socketB = new Socket(this,100,30);
  socketA.getValue = socketA.getValueConnected;
  socketB.getValue = function() {
    let a = socketA.getValue() > 0;
    return (!a) ? 100 : 0;
  }*/
  let text = new TextLabel(this, "mem");
}

BinaryMemoryPanel.prototype = Object.create(Panel.prototype);

BinaryMemoryPanel.prototype.getCurNumber = function() {
  let n = 0;
  for (let i=0; i<this.n; i++) {
    n*=2;
    if (this.inputSockets[i].getValue() > 0) n+=1;    
  }
  return n;
}

BinaryMemoryPanel.prototype.getValueN = function(n) {
  return () => (this.getCurNumber() == n) ? 100 : 0;
}

function RythmStripPanel(x,y,count,cur,hardcount) {
  this.parent = baseGUI;
  baseGUI.children.push(this);
  this.count = count || 7;
  this.hardcount = hardcount || 13;
  this.cur = cur || 0;
  this.x = x;
  this.y = y;
  this.sx = 60+this.hardcount*45;
  this.sy = 180;  
  this.children = [];
  let dragger = new Dragger(this);
  this.countSockets = [];
  for (let i=0; i<this.hardcount; i++) {
    this.countSockets.push(new Socket(this, 30+i*45, 40));
    this.countSockets[i].getValue = this.getValueN(i);
  }
  this.cycleSocket = new Socket(this, 30, 85);
  this.cycleSocket.setStateSocket(() => this.cycle());
  this.backSocket = new Socket(this, 30+45, 85);
  this.backSocket.setStateSocket(() => this.back());
  this.forwardSocket = new Socket(this, 30+45*2, 85);
  this.forwardSocket.setStateSocket(() => this.forward());
  this.shrinkSocket = new Socket(this, 30+45*3, 85);
  this.shrinkSocket.setStateSocket(() => this.shrink());
  this.growSocket = new Socket(this, 30+45*4, 85);
  this.growSocket.setStateSocket(() => this.grow());
}

RythmStripPanel.prototype = Object.create(Panel.prototype);

RythmStripPanel.prototype.getValueN = function(n) {
  return () => (this.cur == n) ? 100 : 0;
}

RythmStripPanel.prototype.cycle = function() {
  this.cur += 1;
  this.cur %= this.count;
}

RythmStripPanel.prototype.back = function() {
  this.cur += this.count - 1;
  this.cur %= this.count;
}

RythmStripPanel.prototype.forward = function() {
  this.cur += 1;
  this.cur %= this.count;
}

RythmStripPanel.prototype.shrink = function() {
  if (this.count > 1) this.count -= 1;
  this.cur %= this.count;
}

RythmStripPanel.prototype.grow = function() {
  if (this.count < this.hardcount - 1) this.count += 1;
  this.cur %= this.count;
}


RythmStripPanel.prototype.draw = function() {
  Panel.prototype.draw.call(this);
  strokeWeight(10);
  stroke(0);
  let x = this.x + 30 + this.count*45;
  line(x, this.y, x, this.y+85);
  strokeWeight(1);
  noStroke();
  text("cycle", this.cycleSocket.x, this.cycleSocket.y+65);
  text("dec", this.cycleSocket.x+45, this.cycleSocket.y+85);
  text("inc", this.cycleSocket.x+45*2, this.cycleSocket.y+65);
  text("shrink", this.cycleSocket.x+45*3, this.cycleSocket.y+85);
  text("grow", this.cycleSocket.x+45*4, this.cycleSocket.y+65);
  stroke(0);
}