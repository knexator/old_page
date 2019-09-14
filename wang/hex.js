let tileApot = 50;
let COLORS;
let board;
let editor;
let minGlue = 1;
//var Map = require("collections/map");
let canvas;
let ctx;

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.style('display', 'block');
  canvas = document.getElementById("defaultCanvas0");
  ctx = canvas.getContext("2d");
  document.addEventListener('contextmenu', event => event.preventDefault());  
  
  COLORS = [color("red"), color("blue"), color("green"), color("yellow"), color("purple"), color("cyan")]

  /*board = new Board((b) => {
    b.proteins.push(Protein.fromSingleColors([0,1,2,3,4,5],5,5,-10));   
    b.blueprints.push(PlatonicProtein.fromSingleColors([0,1,2,3,4,5]));
    b.blueprints.push(PlatonicProtein.fromSingleColors([3,4,5,0,1,2]));
  });*/
  /*board = new Board((b) => {
    b.proteins.push(Protein.fromSingleColors([0,1,0,1,0,1],5,5,-10));   
    b.blueprints.push(PlatonicProtein.fromSingleColors([0,1,0,1,0,1]));
    //b.blueprints.push(PlatonicProtein.fromSingleColors([2,0,2,0,2,0]));
    //b.blueprints.push(PlatonicProtein.fromSingleColors([2,0,2,0,2,0]));
    b.blueprints.push(PlatonicProtein.fromSingleColors([1,0,1,0,1,2]));
    //b.blueprints.push(PlatonicProtein.fromSingleColors([2,1,2,1,2,1]));
  });*/
  board = new Board((b) => {
    b.proteins.push(Protein.fromSingleColors([0,0,0,0,0,0],5,5,-10));   
  });
  editor = new PacketEditor();
}

function draw() {
  background(32);
  for (let i=0; i<100; i++) {
    board.placeRandom();
  }
  board.draw();
  editor.draw();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mouseMoved(event) {
  return false;
}

function mousePressed(event) {
  if (editor.inside(mouseX, mouseY)) {
    /*[i,j,k] = editor.ijkAtXY(mouseX, mouseY);
    console.log(i,j,k);*/
    editor.mousePress(mouseX, mouseY);
  }
  return false;
}

function mouseDragged(event) {
  if (editor.inside(mouseX, mouseY)) {
    editor.offsetX += mouseX - pmouseX;
    editor.offsetY += mouseY - pmouseY;
  } else {
    board.offsetX += mouseX - pmouseX;
    board.offsetY += mouseY - pmouseY;
  }
  return false;
}

function mouseReleased(event) {
  return false;
}

function mouseWheel(event) {
  //Math.floor(event.delta/100);
  return false;
} 

function keyPressed(event) {
  if (key == ' ') {
    editor.launch();
  }
}

function keyReleased(event) {
  
}

function Tile(colors) {
  this.colors = [...colors];
  //this.minGlue = minGlue;
}

Tile.prototype.copy = function() {
  return new Tile(this.colors);
}

function PlatonicProtein() {
  this.tiles = new MyMap();
}

PlatonicProtein.prototype.recenter = function() {
  let ci = 0;
  let cj = 0;
  let ck = 0;
  this.tiles.forEach((tile, key) => {
    ci += key[0];
    cj += key[1];
    ck += key[2];
  });
  ci /= this.tiles.size();
  cj /= this.tiles.size();
  ck /= this.tiles.size();
  [ti,tj,tk] = cube_round(ci,cj,ck);
  console.log(ti,tj,tk);
  //return;
  let newTiles = new MyMap();
  this.tiles.forEach((tile, key) => {
    let [i,j,k] = key;
    newTiles.set([i-ti,j-tj,k-tk], tile);
  });
  this.tiles.clear();
  this.tiles = newTiles;
}

PlatonicProtein.fromSingleColors = function(colors) {
  let p = new PlatonicProtein();
  p.tiles.set([0,0,0], new Tile(colors));
  return p;
}

function Protein(blueprint, i, j, k) {
  this.blueprint = blueprint;
  this.i = i;
  this.j = j;
  this.k = k;
  if (this.i + this.j + this.k !== 0) {
    console.log("TERRIBLE ERROR");
  }
}

Protein.fromSingleColors = function(colors,i,j,k) {
  let plato = PlatonicProtein.fromSingleColors(colors);
  return new Protein(plato, i,j,k);
}

function Board(startFunction) {
  this.blueprints = [];
  this.proteins = [];
  this.tiles = new MyMap();
  this.offsetX = 0;
  this.offsetY = 0;
  this.startFunction = startFunction;
  if (this.startFunction) this.startFunction(this);
  this.color_triangles = [];
}

Board.prototype.ijkAtXY = function(_x,_y) {
  let x = _x - this.offsetX;
  let y = _y - this.offsetY;
  //var q = (Math.sqrt(3)/3 * x  -  1./3 * y) / tileApot
  //var r = (                       2./3 * y) / tileApot
  var q = (1./2. * x  -  Math.sqrt(3)/6 * y) / tileApot
  var r = (              Math.sqrt(3)/3 * y) / tileApot
  //console.log(q,r);
  return cube_round(q, r, -q-r);
}

Board.prototype.ijk2XY = function(i,j,k) {
  //var x = tileApot * (Math.sqrt(3) * i  +  Math.sqrt(3)/2 * j);
  //var y = tileApot * (                               3./2 * j);
  var x = tileApot * (2 * i  + j);
  var y = tileApot * (3./Math.sqrt(3) * j);
  return [x+this.offsetX, y+this.offsetY];
}

Board.prototype.draw = function() {
  this.color_triangles = [];
  for (let i=0; i<COLORS.length; i++) {
    this.color_triangles.push([]);
  }
  //stroke(0);
  /*let i1 = -8 - Math.floor(this.offsetX/tileSize);
  let i2 = i1 + Math.floor(2 + width / tileSize)+8;
  let j1 = -8 - Math.floor(this.offsetY/tileSize);
  let j2 = j1 + Math.floor(2 + height / tileSize)+8;*/
  //for (let k=0; k<this.proteins.length; k++) {    
  //  this.proteins[k].draw(this.offsetX, this.offsetY);
    /*let p = this.proteins[k];
    if (p.i >= i1 && p.i <= i2 && p.j >= j1 && p.j <= j2) {
      this.proteins[k].draw(this.offsetX, this.offsetY);
    }*/
  //}
  let sqrt3 = Math.sqrt(3);
  [ti,tj,tk] = this.ijkAtXY(width/3,0);
  for (let a=-1; a<=1+(2*width/3)/(tileApot*2); a++) {
    for (let b=0; b<=1+(height)*sqrt3/(tileApot*3); b++) {
      let i = a + ti - Math.floor(b/2);
      let j = b + tj;
      let tile = this.getTileAt(i,j,-i-j);
      if (tile) {
        let [x,y] = this.ijk2XY(i,j,-i-j);
        tile.draw(x,y);
      }
    }
  }
  for (let i=0; i<COLORS.length; i++) {    
    if (this.color_triangles[i].length > 0) {
      /*fill(COLORS[i]);
      this.color_triangles[i].forEach((el) => {
        triangle(...el);
      })*/
      ctx.beginPath();
      ctx.fillStyle = COLORS[i].toString();
      this.color_triangles[i].forEach((el) => {
        ctx.moveTo(el[0],el[1]);
        ctx.lineTo(el[2],el[3]);
        ctx.lineTo(el[4],el[5]);
      })
      ctx.fill();      
    }
  }
  ctx.strokeStyle = "#FFFFFF";
  //ctx.lineWidth = 5;
  for (let i=0; i<COLORS.length; i++) {    
    if (this.color_triangles[i].length > 0) {
      ctx.beginPath();
      this.color_triangles[i].forEach((el) => {
        ctx.moveTo(el[2],el[3]);
        ctx.lineTo(el[4],el[5]);
      })
      ctx.stroke();      
    }
  }
}

Board.prototype.getTileAt = function(i,j,k) {
  let t = this.tiles.get([i,j,k])
  if (t !== undefined) return t;
  
  for (let n=0; n<this.proteins.length; n++) {
    let protein = this.proteins[n];
    let di = i - protein.i;
    let dj = j - protein.j;
    let dk = k - protein.k;
    if (Util.inRange(di, -7, 7) && Util.inRange(dj, -7, 7)) {
      let tile = protein.blueprint.tiles.get([di,dj,dk]);
      if (tile) {
        this.tiles.set([i,j,k], tile);
        return tile;
      }
    }
  }
  this.tiles.set([i,j,k], null);
  return null;
}

Board.prototype.tileCanFit = function(tile, i, j, k, wants=false) {
  let neigh = [
    [1,0,-1],
    [1,-1,0],
    [0,-1,1],
    [-1,0,1],
    [-1,1,0],
    [0,1,-1]
  ];
  let glue = 0;
  if (this.getTileAt(i,j,k)) {
    return false;
  }
  for (let n=0; n<6; n++) {
    let coors = neigh[n];    
    let tileN = this.getTileAt(coors[0]+i,coors[1]+j,coors[2]+k);    
    if (tileN && tile.colors[n] != tileN.colors[(3+n)%6]) {
      return false;
    } else if (tileN && tile.colors[n] == tileN.colors[(3+n)%6]) {
      glue += 1;
    }
  }
  if (wants) {
    return glue > 0;
  } else {
    return true;
  }
}

Board.prototype.proteinFits = function(platonicProtein, i, j, k) {
  let allFit = true;
  platonicProtein.tiles.forEach((value, key) => {
    //console.log(this);
    if (!this.tileCanFit(value,i+key[0],j+key[1],k+key[2],false)) {
      allFit = false;
    }
  });
  if (!allFit) return false;
  let someWant = false;
  platonicProtein.tiles.forEach((value, key) => {
    if (this.tileCanFit(value,i+key[0],j+key[1],k+key[2],true)) {
      someWant = true;
    }
  });
  return someWant;
}

Board.prototype.placeRandom = function() {
  if (this.blueprints.length == 0) return;
  let x = Math.random()*width;
  let y = Math.random()*height;
  [i,j,k] = this.ijkAtXY(x,y);
  let n = Math.floor(Math.random()*this.blueprints.length);
  if (this.proteinFits(this.blueprints[n], i, j, k)) {
    let prot = new Protein(this.blueprints[n], i, j, k);
    this.proteins.push(prot);
    this.blueprints[n].tiles.forEach((tile, key) => {
       this.tiles.set([key[0]+i,key[1]+j,key[2]+k], tile);
    });
  }
}

Tile.prototype.draw = function(x,y) {
  let sqrt3 = Math.sqrt(3);
  board.color_triangles[this.colors[0]].push(
    [x, y, x+tileApot, y-tileApot/sqrt3, x+tileApot, y+tileApot/sqrt3]);
    
  board.color_triangles[this.colors[1]].push(
    [x, y, x, y-2*tileApot/sqrt3, x+tileApot, y-tileApot/sqrt3]);  
  
  board.color_triangles[this.colors[2]].push(
    [x, y, x-tileApot, y-tileApot/sqrt3, x, y-2*tileApot/sqrt3]);  
  
  board.color_triangles[this.colors[3]].push(
    [x, y, x-tileApot, y+tileApot/sqrt3, x-tileApot, y-tileApot/sqrt3]);  
  
  board.color_triangles[this.colors[4]].push(
    [x, y, x, y+2*tileApot/sqrt3, x-tileApot, y+tileApot/sqrt3]);
  
  board.color_triangles[this.colors[5]].push(
    [x, y, x+tileApot, y+tileApot/sqrt3, x, y+2*tileApot/sqrt3]);
}

/*Tile.prototype.trueDraw = function(x,y) {
  let sqrt3 = Math.sqrt(3);
  //stroke(0);
  fill(COLORS[this.colors[0]]);
  triangle(x, y, x+tileApot, y-tileApot/sqrt3, x+tileApot, y+tileApot/sqrt3);
  fill(COLORS[this.colors[1]]);
  triangle(x, y, x, y-2*tileApot/sqrt3, x+tileApot, y-tileApot/sqrt3);
  fill(COLORS[this.colors[2]]);
  triangle(x, y, x-tileApot, y-tileApot/sqrt3, x, y-2*tileApot/sqrt3);
  fill(COLORS[this.colors[3]]);
  triangle(x, y, x-tileApot, y+tileApot/sqrt3, x-tileApot, y-tileApot/sqrt3);
  fill(COLORS[this.colors[4]]);
  triangle(x, y, x, y+2*tileApot/sqrt3, x-tileApot, y+tileApot/sqrt3);
  fill(COLORS[this.colors[5]]);
  triangle(x, y, x+tileApot, y+tileApot/sqrt3, x, y+2*tileApot/sqrt3);
}*/

Tile.prototype.trueDraw = function(x,y) {
  let sqrt3 = Math.sqrt(3);
  
  ctx.beginPath();  
  ctx.fillStyle = COLORS[this.colors[0]].toString();
  ctx.moveTo(x,y);
  ctx.lineTo(x+tileApot, y-tileApot/sqrt3);
  ctx.lineTo(x+tileApot, y+tileApot/sqrt3);
  ctx.fill();
  
  ctx.beginPath();  
  ctx.fillStyle = COLORS[this.colors[1]].toString();
  ctx.moveTo(x,y);
  ctx.lineTo(x, y-2*tileApot/sqrt3);
  ctx.lineTo(x+tileApot, y-tileApot/sqrt3);
  ctx.fill();
  
  ctx.beginPath();
  ctx.fillStyle = COLORS[this.colors[2]].toString();
  ctx.moveTo(x,y);
  ctx.lineTo(x-tileApot, y-tileApot/sqrt3);
  ctx.lineTo(x, y-2*tileApot/sqrt3);
  ctx.fill();
  
  ctx.beginPath();  
  ctx.fillStyle = COLORS[this.colors[3]].toString();
  ctx.moveTo(x,y);
  ctx.lineTo(x-tileApot, y+tileApot/sqrt3);
  ctx.lineTo(x-tileApot, y-tileApot/sqrt3);
  ctx.fill();
  
  ctx.beginPath();
  ctx.fillStyle = COLORS[this.colors[4]].toString();
  ctx.moveTo(x,y);
  ctx.lineTo(x, y+2*tileApot/sqrt3);
  ctx.lineTo(x-tileApot, y+tileApot/sqrt3);
  ctx.fill();
  
  ctx.beginPath();
  ctx.fillStyle = COLORS[this.colors[5]].toString();
  ctx.moveTo(x,y);
  ctx.lineTo(x+tileApot, y+tileApot/sqrt3);
  ctx.lineTo(x, y+2*tileApot/sqrt3);
  ctx.fill();
  
  ctx.beginPath();
  ctx.strokeStyle = "#FFFFFF";
  ctx.moveTo(x+tileApot, y-tileApot/sqrt3);
  ctx.lineTo(x, y-2*tileApot/sqrt3);
  ctx.lineTo(x-tileApot, y-tileApot/sqrt3);
  ctx.lineTo(x-tileApot, y+tileApot/sqrt3);
  ctx.lineTo(x, y+2*tileApot/sqrt3);
  ctx.lineTo(x+tileApot, y+tileApot/sqrt3);
  ctx.lineTo(x+tileApot, y-tileApot/sqrt3);
  ctx.stroke();
}

Protein.prototype.draw = function(ox,oy) {
  this.blueprint.tiles.forEach((tile, key) => {
    let tx = ox + (this.i+key[0])*2*tileApot + (this.j+key[1])*tileApot;
    let ty = oy + (this.j+key[1])*tileApot*3/Math.sqrt(3);
    tile.draw(tx,ty);
  });
}

PacketEditor = function() {
  /*this.si = 8;
  this.sj = 8;
  this.tiles = [];
  this.margin = tileSize / 4;
  this.erase();*/
  this.tiles = new MyMap();
  this.offsetX = 0;
  this.offsetY = 0;
  //this.tiles.set([0,0,0], new Tile([0,1,2,3,4,5]));
}

PacketEditor.prototype.draw = function() {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width/3, height);
  ctx.clip();
  background(64);
  this.tiles.forEach((tile, key) => {
    let tx = this.offsetX + (key[0])*2*tileApot + (key[1])*tileApot;
    let ty = this.offsetY + (key[1])*tileApot*3/Math.sqrt(3);
    tile.trueDraw(tx,ty);
  });
  ctx.restore();
}

PacketEditor.prototype.inside = function(x,y) {
  //return x>=0 && x<=this.si*tileSize+this.margin*2 && y>=0 && y<=this.sj*tileSize+this.margin*2;
  return x <= width/3;
}

PacketEditor.prototype.ijkAtXY = function(_x,_y) {
  let x = _x - this.offsetX;
  let y = _y - this.offsetY;
  //var q = (Math.sqrt(3)/3 * x  -  1./3 * y) / tileApot
  //var r = (                       2./3 * y) / tileApot
  var q = (1./2. * x  -  Math.sqrt(3)/6 * y) / tileApot;
  var r = (              Math.sqrt(3)/3 * y) / tileApot;
  //console.log(q,r);
  return cube_round(q, r, -q-r);
}

PacketEditor.prototype.mousePress = function(_x,_y) {
  if (mouseButton === "center") return;
  let x = _x - this.offsetX;
  let y = _y - this.offsetY;
  let q = (1./2. * x  -  Math.sqrt(3)/6 * y) / tileApot;
  let r = (              Math.sqrt(3)/3 * y) / tileApot;
  let [i,j,k] = cube_round(q, r, -q-r);
  let tile = this.tiles.get([i,j,k]);
  if (!tile) {
    this.tiles.set([i,j,k], new Tile([0,0,0,0,0,0]));
    return;
  }
  if (mouseButton == "center") {
    this.tiles.delete([i,j,k]);
  }
  //console.log(i,j,k);
  //console.log(i-q,j-r,k+q+r);
  let dx = q-i;
  let dy = r-j;
  let dz = -k-q-r;
  let n = 0;
  if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dz) >= Math.abs(dy)) {
    if (dx > 0) {
      n = 0;
    } else {
      n = 3;
    }
  } else if (Math.abs(dy) >= Math.abs(dx) && Math.abs(dz) >= Math.abs(dx)) {
    if (dy > 0) {
      n = 5;
    } else {
      n = 2;
    }
  } else {
    if (dx > 0) {
      n = 1;
    } else {
      n = 4;
    }
  }
  let d = 1;
  if (mouseButton == "right") {
    d = -1+COLORS.length;
  }
  console.log(mouseButton);
  tile.colors[n] += d;
  tile.colors[n] %= COLORS.length;
  //console.log(tile);
  //console.log(n);
}

PacketEditor.prototype.launch = function() {
  let platonics = [];
  let visited = new Set();
  
  this.tiles.forEach((tile, key) => {
    let [i,j,k] = key;
    if (visited.has(JSON.stringify([i,j,k]))) return;
    visited.add(JSON.stringify([i,j,k]));
    
    let curPlatonic = new PlatonicProtein();
    curPlatonic.tiles.set([i,j,k], tile.copy());
    let toVisit = validNextTo(i,j,k,this.tiles,visited);    
    while (toVisit.length > 0 && toVisit.length < 10) {      
      //console.log(visited);
      let [curI, curJ, curK] = toVisit.pop();
      visited.add(JSON.stringify([curI, curJ, curK]));
      curPlatonic.tiles.set([curI, curJ, curK], this.tiles.get([curI, curJ, curK]).copy());
      toVisit = toVisit.concat(validNextTo(curI,curJ,curK,this.tiles,visited));
    }
    curPlatonic.recenter();
    platonics.push(curPlatonic);
  });
  
  // TODO: fix bug in this function
  console.log(platonics);
  board.blueprints = platonics;
  
  function validNextTo(i,j,k,tiles,visited) {
    let tile = tiles.get([i,j,k]);
    let neigh = [
      [1,0,-1],
      [1,-1,0],
      [0,-1,1],
      [-1,0,1],
      [-1,1,0],
      [0,1,-1]
    ];
    let result = [];
    for (let n=0; n<6; n++) {
      let c = neigh[n];
      let otherTile = tiles.get([i+c[0],j+c[1],k+c[2]]);
      if (!otherTile) continue;
      if (visited.has(JSON.stringify([i+c[0],j+c[1],k+c[2]]))) continue;
      //visited.add([i+c[0],j+c[1],k+c[2]]);
      if (tile.colors[n] != otherTile.colors[(n+3)%6]) continue;
      result.push([i+c[0],j+c[1],k+c[2]]);
    }
    return result;
  }
}

/*PacketEditor.prototype.nextTo = function(i,j) {
  let result = [];
  if (i > 0) result.push([i-1,j]);
  if (j > 0) result.push([i,j-1]);
  if (i < this.si-1) result.push([i+1,j]);
  if (j < this.sj-1) result.push([i,j+1]);
  return result;
}*/


Util = {
  distSq: function (a, b) {
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    return dx*dx + dy*dy;
  },
  dist: function (a, b) {
    return Math.sqrt(Util.distSq(a, b));
  },
  inRange: function (t, a, b) {
    return t>=a && t<=b;
  }
}

function MyMap() {
  this.map = new Map();
}

MyMap.prototype.set = function(key, value) {
  this.map.set(JSON.stringify(key), value);
}

MyMap.prototype.get = function(key) {
  return this.map.get(JSON.stringify(key));
}

MyMap.prototype.clear = function() {
  this.map.clear();
}

MyMap.prototype.delete = function(key) {
  return this.map.delete(JSON.stringify(key));
}

MyMap.prototype.has = function(key) {
  return this.map.has(JSON.stringify(key));
}

MyMap.prototype.size = function() {
  return this.map.size;
}

MyMap.prototype.forEach = function(callbackfn) {
  this.map.forEach((value, key) => {
    callbackfn(value, JSON.parse(key), this);
  });
}

function cube_round(x,y,z) {
  var rx = Math.round(x)
  var ry = Math.round(y)
  var rz = Math.round(z)

  var x_diff = Math.abs(rx - x)
  var y_diff = Math.abs(ry - y)
  var z_diff = Math.abs(rz - z)

  if (x_diff > y_diff && x_diff > z_diff) {
    rx = -ry-rz
  } else if (y_diff > z_diff) {
    ry = -rx-rz
  } else {
    rz = -rx-ry
  }

  return [rx, ry, rz];
}