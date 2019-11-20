function setup() {
  var cnv = createCanvas(windowWidth, windowHeight);
  cnv.style('display', 'block');  
}

function draw() {
  background(32);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}