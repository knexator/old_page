//let bars = [[0,2], [0,3], [0,5], [0,7], [0,11]];
let bars = [[1,5], [2,7], [0, 3], [1, 7]];
let numbers = [];
let instructions = [];
let textArea;
let oscillators;
let soundEnabled = false;

function resetBars() {
  //bars = [[0,2], [0,3], [0,5], [0,7], [0,11]];
  bars = [[1,5], [2,7], [0, 3], [1, 7]];
}

function changeCode() {
  eval(textArea.value);
}

function highlightLine(n) {  
  let lines = textArea.value.split("\n");
  let line = lines.splice(n)[0];
  let a = lines.join("\n").length+1;
  let b = line.length;
  textArea.setSelectionRange(a,a+b);
}

function initSounds() {
  if (oscillators) return;
  oscillators = [];
  for (let i=0; i<bars.length; i++) {
    let osc = new p5.Oscillator();
    osc.setType('sine');
    //osc.freq(240*bars[i][1]);
    osc.freq(getFreq(bars[i][1]));
    osc.amp(0);
    osc.start();
    oscillators.push(osc); 
  }
}

function getFreq(n) {
  if (n==0) return 240;
  return getFreq(n-1) * 3 / 2;
}

function playSound() {
  if (!soundEnabled) return;
  for (let i=0; i<bars.length; i++) {
    let osc = oscillators[i];
    if (bars[i][0] == 0) {
      osc.amp(4, 0.02);
      osc.amp(0, 0.02, 0.25);
    }
  }
}

function setup() {
  var cnv = createCanvas(windowWidth, windowHeight);
  cnv.style('display', 'block');
  document.addEventListener('contextmenu', event => event.preventDefault());  
  
  textArea = document.querySelector("textarea");
  textArea.addEventListener("change", event => {
    console.log("asdfasdfjñlkasdg");
  });  
  for (let i=0; i<Math.pow(2,bars.length); i++) {
    instructions[i] = NOP();
    textArea.value += "instructions["+i.toString()+"] = NOP()\n";
  }
  textArea.value += "\n\n\n/*NOP(), GRW(n) and SML(n), INC(n) and DEC(n)*/"
  /*
  Starting with 2,3,5,7,11 and all at 0, this will get them all to 3 and stable:
  instructions[16] = GRW(0);
  instructions[8] = SML(3);
  instructions[20] = SML(4);
  instructions[10] = DEC(0);
  instructions[24] = SML(3);
  instructions[26] = SML(4);
  instructions[1] = INC(4);
  instructions[27] = SML(2);
  instructions[4] = INC(2);*/
}

function draw() {
  background(32);
  for (let i=0; i<bars.length; i++) {
    for (let j=0; j<bars[i][1]; j++) {
      fill(bars[i][0] == j ? 128 : 255);
      rect(50+j*60, 50+i*60, 60, 50);
    }
  }
  fill(128);
  rect(0,0,40,40);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
  if (mouseX <= 40 && mouseY <= 40) {
    step();
  }
  initSounds();
}

function keyPressed() {  
  if (keyCode == ESCAPE) step();
}

function step() {
  let n = getNum();
  instructions[n]();
  highlightLine(n);
  playSound();
  advanceBars();
  console.log(n);
  numbers.push(n);
}

function getNum() {
  let n = 0;
  for (let i=0; i<bars.length; i++) {
    n*=2;
    if (bars[i][0] == 0) {
      n+=1;
    }
  }
  return n;
}

function advanceBars() {
  for (let i=0; i<bars.length; i++) {
    bars[i][0] += 1;
    bars[i][0] %= bars[i][1];
  }
}

function NOP() {
  return () => {};
}

function GRW(bar, n) {
  if (!n) n = 1;
  return () => {bars[bar][1] += n};
}

function SML(bar,n) {
  if (!n) n = 1;
  return () => {
    bars[bar][1] -= n;
    if (bars[bar][1] <= 1) {
      bars[bar][1] = 1;
    }
  }
}

function INC(bar, n) {
  if (!n) n=1;
  return () => {
    bars[bar][0] += n;
    bars[bar][0] %= bars[bar][1];
  }
}

function DEC(bar,n) {
  if (!n) n=1;
  return () => {
    bars[bar][0] += Math.abs(n)*bars[bar][1] - n;
    bars[bar][0] %= bars[bar][1];
  }
}

function MANY() {
  // The [0] is complete bonkers or dark magic, but it works
  let args = [].concat.call(arguments)[0];
  return () => {
    for (var i = 0; i < args.length; i++) {
      args[i]();
    }
  }
}