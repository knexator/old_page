let tileSize = 50;
//let COLORS = [color("red"), color("blue"), color("green"), color("yellow"), color("purple")]
//let COLORS = ["red", "blue", "green", "yellow", "purple"]
let COLORS;
let board;
let editor;

function setup() {
  var cnv = createCanvas(windowWidth, windowHeight);
  cnv.style('display', 'block');
  document.addEventListener('contextmenu', event => event.preventDefault());
  
  COLORS = [color("red"), color("blue"), color("green"), color("yellow"), color("purple")]

  /*platonic = new PlatonicProtein();
  platonic.tiles[0][0] = new Tile(0,1,2,3);
  platonic.tiles[1][0] = new Tile(2,1,0,3);
  board.blueprints.push(platonic);
  let protein = new Protein(platonic, 10, 10);
  board.proteins.push(protein);
  let protein2 = new Protein(platonic, 10, 1);
  board.proteins.push(protein2);*/
  board = new Board();
  editor = new PacketEditor();
  let platonic = new PlatonicProtein();
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
    let i = Math.floor((mouseX-editor.margin)/tileSize);
    let j = Math.floor((mouseY-editor.margin)/tileSize);
    if (Util.inRange(i,0,editor.si-1) && Util.inRange(j,0,editor.sj-1)) {
      if (!editor.tiles[i][j]) {
        editor.tiles[i][j] = new Tile(0,0,0,0);
      } else {
        let x = ((mouseX-editor.margin)/tileSize % 1) - 0.5;
        let y = ((mouseY-editor.margin)/tileSize % 1) - 0.5;
        let dir = (mouseButton == 'left') ? 1 : -1;
        if (x>0.125 && x >= Math.abs(y)) {
          editor.tiles[i][j].colors[0] += dir + COLORS.length;
          editor.tiles[i][j].colors[0]%=COLORS.length;
        } else if (-y>0.125 && -y >= Math.abs(x)) {
          editor.tiles[i][j].colors[1] += dir + COLORS.length;
          editor.tiles[i][j].colors[1]%=COLORS.length;
        } else if (-x>0.125 && -x >= Math.abs(y)) {
          editor.tiles[i][j].colors[2] += dir + COLORS.length;
          editor.tiles[i][j].colors[2]%=COLORS.length;
        } else if (y>0.125 && y >= Math.abs(x)) {
          editor.tiles[i][j].colors[3] += dir + COLORS.length;
          editor.tiles[i][j].colors[3]%=COLORS.length;
        } else {
          editor.tiles[i][j] = null;
        }
      }
    } else {
      editor.launch();
    }
  }
  return false;
}

function mouseDragged(event) {
  if (!editor.inside(mouseX, mouseY)) {
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
  
}

function keyReleased(event) {
  
}

function Tile(right,up,left,down) {
  this.colors = [right,up,left,down];
  this.minGlue = 1;
}

Tile.prototype.copy = function() {
  return new Tile(...this.colors);
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
  this.offsetX = 0;
  this.offsetY = 0;
  
  this.color_triangles = [];
}

Board.prototype.draw = function() {
  this.color_triangles = [];
  for (let i=0; i<COLORS.length; i++) {
    this.color_triangles.push([]);
  }
  stroke(0);
  let i1 = -8 - Math.floor(this.offsetX/tileSize);
  let i2 = i1 + Math.floor(2 + width / tileSize)+8;
  let j1 = -8 - Math.floor(this.offsetY/tileSize);
  let j2 = j1 + Math.floor(2 + height / tileSize)+8;
  for (let k=0; k<this.proteins.length; k++) {
    let p = this.proteins[k];
    if (p.i >= i1 && p.i <= i2 && p.j >= j1 && p.j <= j2) {
      this.proteins[k].draw(this.offsetX, this.offsetY);
    }
  }
  for (let i=0; i<COLORS.length; i++) {
    if (this.color_triangles[i].length > 0) {
      fill(COLORS[i]);
      this.color_triangles[i].forEach((el) => {
        triangle(...el);
      })
    }
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
  if (this.blueprints.length == 0) return;
  //let i = Math.floor(Math.random()*50);
  //let j = Math.floor(Math.random()*50);
  let i = -2 - Math.floor(this.offsetX/tileSize) + Math.floor(Math.random() * (2 + width / tileSize));
  let j = -2 - Math.floor(this.offsetY/tileSize) + Math.floor(Math.random() * (2 + height / tileSize));

  let k = Math.floor(Math.random()*this.blueprints.length);  
  if (this.proteinFits(this.blueprints[k], i, j)) {
    this.proteins.push(new Protein(this.blueprints[k], i, j));
  }
}

Tile.prototype.draw = function(x,y) {
  board.color_triangles[this.colors[0]].push([x, y, x+tileSize/2, y-tileSize/2, x+tileSize/2, y+tileSize/2]);
  board.color_triangles[this.colors[1]].push([x, y, x-tileSize/2, y-tileSize/2, x+tileSize/2, y-tileSize/2]);
  board.color_triangles[this.colors[2]].push([x, y, x-tileSize/2, y+tileSize/2, x-tileSize/2, y-tileSize/2]);
  board.color_triangles[this.colors[3]].push([x, y, x+tileSize/2, y+tileSize/2, x-tileSize/2, y+tileSize/2]);
}

Tile.prototype.trueDraw = function(x,y) {
  stroke(0);
  fill(COLORS[this.colors[0]]);
  triangle(x, y, x+tileSize/2, y-tileSize/2, x+tileSize/2, y+tileSize/2);
  fill(COLORS[this.colors[1]]);
  triangle(x, y, x-tileSize/2, y-tileSize/2, x+tileSize/2, y-tileSize/2);
  fill(COLORS[this.colors[2]]);
  triangle(x, y, x-tileSize/2, y+tileSize/2, x-tileSize/2, y-tileSize/2);
  fill(COLORS[this.colors[3]]);
  triangle(x, y, x+tileSize/2, y+tileSize/2, x-tileSize/2, y+tileSize/2);
  fill(128);
  rect(x-tileSize/8,y-tileSize/8,tileSize/4,tileSize/4);
}

Protein.prototype.draw = function(ox,oy) {
  for (let i=0; i<8; i++) {
    for (let j=0; j<8; j++) {
      if (this.blueprint.tiles[i][j]) {
        this.blueprint.tiles[i][j].draw(ox+tileSize*(i+this.i),oy+tileSize*(j+this.j));
      }
    }
  }
}

PacketEditor = function() {
  this.si = 4;
  this.sj = 4;
  this.tiles = [];
  this.margin = tileSize / 4;
  this.erase();
}

PacketEditor.prototype.erase = function() {
  this.tiles = [];
  for (let i=0; i<this.si; i++) {
    this.tiles.push([]);
    for (let j=0; j<this.sj; j++) {
      this.tiles[i].push(null);
    }
  }
}

PacketEditor.prototype.draw = function() {
  fill(192);
  rect(0,0,this.si*tileSize+this.margin*2,this.sj*tileSize+this.margin*2);
  fill(128);
  rect(this.margin,this.margin,this.si*tileSize,this.sj*tileSize);
  for (let i=0; i<this.si; i++) {
    for (let j=0; j<this.sj; j++) {
      if (this.tiles[i][j]) {
        this.tiles[i][j].trueDraw(this.margin+i*tileSize+tileSize/2,this.margin+j*tileSize+tileSize/2);
      } else {
        fill(128);
        rect(this.margin+i*tileSize,this.margin+j*tileSize,tileSize,tileSize);
      }
    }
  }
}

PacketEditor.prototype.inside = function(x,y) {
  return x>=0 && x<=this.si*tileSize+this.margin*2 && y>=0 && y<=this.sj*tileSize+this.margin*2;
}

PacketEditor.prototype.launch = function() {
  let platonics = [];
  let visited = [];
  for (let i=0; i<this.si; i++) {
    visited.push([]);
    for (let j=0; j<this.sj; j++) {
      visited[i].push(false);
    }
  }
  
  for (let i=0; i<this.si; i++) {
    for (let j=0; j<this.sj; j++) {
      if (visited[i][j]) continue;
      visited[i][j] = true;
      if (!this.tiles[i][j]) continue;
      
      let curPlatonic = new PlatonicProtein();
      curPlatonic.tiles[i][j] = this.tiles[i][j].copy();
      let toVisit = validNextTo(i,j,this.tiles,visited,this.si,this.sj);
      while (toVisit.length > 0) {
        let [curI, curJ] = toVisit.pop();
        visited[curI][curJ] = true;
        curPlatonic.tiles[curI][curJ] = this.tiles[curI][curJ].copy();
        toVisit = toVisit.concat(validNextTo(curI,curJ,this.tiles,visited,this.si,this.sj));
      }
      platonics.push(curPlatonic);
    }
  }
  
  //console.log(platonics);
  board.blueprints = platonics;
  //board.blueprints = [...platonics];
  
  function validNextTo(i,j,tiles,visited,si,sj) {
    if (!tiles[i][j]) return null;
    let result = [];
    if (i > 0 && tiles[i-1][j] && !visited[i-1][j]
        && tiles[i-1][j].colors[0] == tiles[i][j].colors[2]) {      
      result.push([i-1,j]);
    }
    if (j > 0 && tiles[i][j-1] && !visited[i][j-1]
        && tiles[i][j-1].colors[3] == tiles[i][j].colors[1]) {      
      result.push([i,j-1]);
    }
    if (i < si-1 && tiles[i+1][j] && !visited[i+1][j]
        && tiles[i+1][j].colors[2] == tiles[i][j].colors[0]) {      
      result.push([i+1,j]);
    }
    if (j < sj-1 && tiles[i][j+1] && !visited[i][j+1]
        && tiles[i][j+1].colors[1] == tiles[i][j].colors[3]) {      
      result.push([i,j+1]);
    }
    return result;
  }
}

PacketEditor.prototype.nextTo = function(i,j) {
  let result = [];
  if (i > 0) result.push([i-1,j]);
  if (j > 0) result.push([i,j-1]);
  if (i < this.si-1) result.push([i+1,j]);
  if (j < this.sj-1) result.push([i,j+1]);
  return result;
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