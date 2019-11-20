let ballImg;
let playerImg;
let playerballImg;
let crateImg;
let crateballImg;
let floorImg;
let wallImg;

function preload() {
  ballImg = loadImage('assets/ball.png');
  playerImg = loadImage('assets/player.png');
  playerballImg = loadImage('assets/playerball.png');
  crateImg = loadImage('assets/crate.png');
  crateballImg = loadImage('assets/crateball.png');
  floorImg = loadImage('assets/floor.png');
  wallImg = loadImage('assets/wall.png');
}

function setup() {
  var cnv = createCanvas(windowWidth, windowHeight);
  cnv.style('display', 'block');  
}

function draw() {
  background(32);
  image(ballImg, 0, 0);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}