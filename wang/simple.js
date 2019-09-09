let tileSize = 50;
let COLORS = ["red", "blue", "green", "yellow", "purple"]
let board = new Board();
let platonic;

function setup() {
  var cnv = createCanvas(windowWidth, windowHeight);
  cnv.style('display', 'block');
  document.addEventListener('contextmenu', event => event.preventDefault());
  
  /*platonic = new PlatonicProtein();
  platonic.tiles[0][0] = new Tile(0,1,2,3);
  platonic.tiles[1][0] = new Tile(2,1,0,3);
  board.blueprints.push(platonic);
  let protein = new Protein(platonic, 10, 10);
  board.proteins.push(protein);
  let protein2 = new Protein(platonic, 10, 1);
  board.proteins.push(protein2);*/
  
  platonic = new PlatonicProtein();
  platonic.tiles[0][0] = new Tile(0,1,2,0);
  platonic.tiles[1][0] = new Tile(2,3,0,3);
  platonic.tiles[0][1] = new Tile(3,0,3,1);
  board.blueprints.push(platonic);
  board.proteins.push(new Protein(platonic, 10, 10));
}

function draw() {
  background(32);
  for (let i=0; i<100; i++) {
    board.placeRandom();
  }
  board.draw();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mouseMoved(event) {
  return false;
}

function mousePressed(event) {
  return false;
}

function mouseDragged(event) {
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
  
}

function keyReleased(event) {
  
}

function Tile(right,up,left,down) {
  this.colors = [right,up,left,down];
  this.minGlue = 1;
}

function PlatonicProtein() {
  this.tiles = [];
  for (let i=0; i<8; i++) {
    this.tiles[i] = []
    for (let j=0; j<8; j++) {
      this.tiles[i][j] = null;
    }
  }
}

function Protein(blueprint, i, j) {
  this.blueprint = blueprint;
  this.i = i;
  this.j = j;
}

function Board() {
  this.blueprints = [];
  this.proteins = [];
}

Board.prototype.draw = function() {
  for (let k=0; k<this.proteins.length; k++) {
    this.proteins[k].draw();
  }
}

Board.prototype.getTileAt = function(i,j) {
  for (let k=0; k<this.proteins.length; k++) {
    let protein = this.proteins[k];
    let di = i - protein.i;
    let dj = j - protein.j;
    if (Util.inRange(di, 0, 7) && Util.inRange(dj, 0, 7)) {
      let tile = protein.blueprint.tiles[di][dj];
      if (tile) {
        return tile;
      }
    }
  }
  return null;
}

Board.prototype.tileCanFit = function(tile, i, j, wants=false) {
  let glue = 0;
  if (this.getTileAt(i,j)) {
    return false;
  }
  let tileRight = this.getTileAt(i+1,j);
  if (tileRight) {
    if (tile.colors[0] != tileRight.colors[2]) {
      return false;
    } else {
      glue += 1;
    }
  }
  let tileUp = this.getTileAt(i,j-1);
  if (tileUp) {
    if (tile.colors[1] != tileUp.colors[3]) {
      return false;
    } else {
      glue += 1;
    }
  }
  let tileLeft = this.getTileAt(i-1,j);
  if (tileLeft) {
    if (tile.colors[2] != tileLeft.colors[0]) {
      return false;
    } else {
      glue += 1;
    }
  }
  let tileDown = this.getTileAt(i,j+1);
  if (tileDown) {
    if (tile.colors[3] != tileDown.colors[1]) {
      return false;
    } else {
      glue += 1;
    }
  }
  if (wants) {
    return glue >= tile.minGlue;
  } else {
    return true;
  }
}

Board.prototype.proteinFits = function(platonicProtein, i, j) {
  for (let di=0; di<8; di++) {
    for (let dj=0; dj<8; dj++) {
      if (platonicProtein.tiles[di][dj]) {
        if (!this.tileCanFit(platonicProtein.tiles[di][dj],i+di,j+dj,false)) {
          return false;
        }
      }
    }
  }
  for (let di=0; di<8; di++) {
    for (let dj=0; dj<8; dj++) {
      if (platonicProtein.tiles[di][dj]) {
        if (this.tileCanFit(platonicProtein.tiles[di][dj],i+di,j+dj,true)) {
          return true;
        }
      }
    }
  }
  return false;
}

Board.prototype.placeRandom = function() {
  let i = Math.floor(Math.random()*50);
  let j = Math.floor(Math.random()*50);
  let k = Math.floor(Math.random()*this.blueprints.length);
  if (this.proteinFits(this.blueprints[k], i, j)) {
    this.proteins.push(new Protein(this.blueprints[k], i, j));
  }
}

Tile.prototype.draw = function(x,y) {
  stroke(0);
  fill(COLORS[this.colors[0]]);
  triangle(x, y, x+tileSize/2, y-tileSize/2, x+tileSize/2, y+tileSize/2);
  fill(COLORS[this.colors[1]]);
  triangle(x, y, x-tileSize/2, y-tileSize/2, x+tileSize/2, y-tileSize/2);
  fill(COLORS[this.colors[2]]);
  triangle(x, y, x-tileSize/2, y+tileSize/2, x-tileSize/2, y-tileSize/2);
  fill(COLORS[this.colors[3]]);
  triangle(x, y, x+tileSize/2, y+tileSize/2, x-tileSize/2, y+tileSize/2);
}

Protein.prototype.draw = function() {
  for (let i=0; i<8; i++) {
    for (let j=0; j<8; j++) {
      if (this.blueprint.tiles[i][j]) {
        this.blueprint.tiles[i][j].draw(tileSize*(i+this.i),tileSize*(j+this.j));
      }
    }
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
  inRange: function (t, a, b) {
    return t>=a && t<=b;
  }
}