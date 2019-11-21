/*let ballImg;
let playerImg;
let playerballImg;
let crateImg;
let crateballImg;
let floorImg;
let wallImg;*/

let imgs = [];
let curLevel = null;

function preload() {
  imgs = [
    ballImg = loadImage('assets/ball.png'),
    playerImg = loadImage('assets/player.png'),
    playerballImg = loadImage('assets/playerball.png'),
    crateImg = loadImage('assets/crate.png'),
    crateballImg = loadImage('assets/crateball.png'),
    floorImg = loadImage('assets/floor.png'),
    wallImg = loadImage('assets/wall.png'),
    resetImg = loadImage('assets/reset.png'),
    undoImg = loadImage('assets/undo.png'),
    previousImg = loadImage('assets/previous.png'),
    nextImg = loadImage('assets/next.png'),
  ];
  /*ballImg = loadImage('assets/ball.png');
  playerImg = loadImage('assets/player.png');
  playerballImg = loadImage('assets/playerball.png');
  crateImg = loadImage('assets/crate.png');
  crateballImg = loadImage('assets/crateball.png');
  floorImg = loadImage('assets/floor.png');
  wallImg = loadImage('assets/wall.png');*/
}

function setup() {
  var cnv = createCanvas(windowWidth, windowHeight);
  cnv.style('display', 'block');
  
  curLevel = new Level(0);
  /*window.setInterval(function() {
    if (curLevel.moveQueue.length > 0) {
      console.log(curLevel.moveQueue)
      let [curi, curj] = curLevel.moveQueue.shift();
      console.log(curi, curj);
      curLevel.handleDirection(curi, curj);      
    }
  }, 100);*/
}

function draw() {
  background(32);
  curLevel.draw();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  curLevel.tileSize = Math.min(height/curLevel.height, width/curLevel.width);
}

function Level(n) {
  this.n = n;
  //let rows = levelStrings[n].split('\n').slice(1,-1);
  let rows = levelStrings[n].split('\n')
  this.height = rows.length;
  this.width = Math.max(...rows.map((x) => x.length));
  this.tileSize = Math.min(height/this.height, width/this.width);
  
  let levelDict = ".@+$* #";
  // data[i][j] is column i, row j (x,y)
  this.data = [];
  for (let i=0; i<this.width; i++) {
    this.data.push([]);
    for (let j=0; j<this.height; j++) {
      this.data[i].push(levelDict.indexOf(rows[j][i] || ' '));
      if (this.data[i][j] == 1 || this.data[i][j] == 2) {
        this.pi = i;
        this.pj = j;
      }
    }
  }
  this.history = [Level.copydata(this.data)];
  this.moveQueue = [];
  /*
  . (period) = Empty goal
  @ (at) = Man (pusher) on floor
  + (plus) = Man (pusher) on goal
  $ (dollar) = Box on floor
  * (asterisk) = Box on goal
    (space) = Floor
  # (hash) = Wall
  */
  /*
  0 - ballImg;
  1 - playerImg;
  2 - playerballImg;
  3 - crateImg;
  4 - crateballImg;
  5 - floorImg;
  6 - wallImg
  */
}

Level.removePlayer = function(n) {
  if (n==1) return 5;
  if (n==2) return 0;
  console.log("TERRIBLE ERROR");
}

Level.addPlayer = function(n) {
  if (n==5) return 1;
  if (n==0) return 2;
  console.log("TERRIBLE ERROR");
}

Level.removeCrate = function(n) {
  if (n==3) return 5;
  if (n==4) return 0;
  console.log("TERRIBLE ERROR");
}

Level.addCrate = function(n) {
  if (n==5) return 3;
  if (n==0) return 4;
  console.log("TERRIBLE ERROR");
}

Level.copydata = function(data) {
  return JSON.parse(JSON.stringify(data));
}

Level.prototype.draw = function() {
  let t = this.tileSize;
  for (let i=0; i<this.width; i++) {
    for (let j=0; j<this.height; j++) {
      image(imgs[this.data[i][j]], i*t, j*t, t, t);
    }
  }
  image(undoImg, this.width*t, 0, t, t);
  image(undoImg, 0, this.height*t, t, t);
  image(resetImg, this.width*t, 1*t, t, t);
  image(resetImg, 1*t, this.height*t, t, t);
  image(previousImg, this.width*t, 2*t, t, t);
  image(previousImg, 2*t, this.height*t, t, t);
  image(nextImg, this.width*t, 3*t, t, t);
  image(nextImg, 3*t, this.height*t, t, t);
}

Level.prototype.click = function(x, y) {
  let i = Math.floor(x / this.tileSize);
  let j = Math.floor(y / this.tileSize);  
  if (i<this.width && j<this.height) {
    let di = i - this.pi;
    let dj = j - this.pj;
    let b = this.data[i][j];
    if (Math.abs(di) + Math.abs(dj) == 1) {
      this.directInput(di, dj);
    } else if (b == 0 || b == 5) {
      path = this.findPlayerPathTo(i, j);
      if (path) {
        this.moveQueue = this.moveQueue.concat(path);
        this.queueAdvance();
      }
    }
  } else {
    if ((i==this.width && j==0) || (j==this.height && i==0)) {
      this.undo();
    } else if ((i==this.width && j==1) || (j==this.height && i==1)) {
      this.reset();
    } else if ((i==this.width && j==2) || (j==this.height && i==2)) {
      this.prevLevel();
    } else if ((i==this.width && j==3) || (j==this.height && i==3)) {
      this.nextLevel();
    }
  }
}

Level.prototype.findPlayerPathTo = function(ti, tj) {
  // i, j, index, parent
  let nodes = [[this.pi, this.pj, 0, 0]];
  let toCheck = [nodes[0]];
  let k = 1;
  while (toCheck.length > 0) {
    [curi, curj, index, _] = toCheck.shift();
    for ([di,dj] of [[-1,0],[0,-1],[1,0],[0,1]]) {
      //console.log(di, dj);
      let ci = curi+di;
      let cj = curj+dj;
      if (ci==ti && cj==tj) {
        let cur = [ci, cj, k, index];
        let directions = [];
        while (cur[2] != 0) {
          let newCur = nodes[cur[3]];
          directions.push([cur[0]-newCur[0],cur[1]-newCur[1]]);
          cur = newCur;          
        }        
        return directions.reverse();
      }
      if (ci<0 || cj<0 || ci>=this.width || cj>=this.height) {
        continue;
      }
      let block = this.data[ci][cj];
      if (block == 3 || block == 4 || block == 6) {
        continue;
      }
      if (nodes.some(([i,j,ind,par]) => i==ci && j==cj)) {
        continue;
      }
      let cur = [ci, cj, k, index];
      toCheck.push(cur);
      nodes.push(cur);
      k+=1;
    }
  }
  return null;
}

Level.prototype.directInput = function(di, dj) {
  this.moveQueue.push([di,dj]);
  this.queueAdvance();
}

Level.prototype.queueAdvance = function() {
  if (this.isWon()) {
    if (this.n < levelStrings.length - 1) {
      curLevel = new Level(this.n + 1);
    }
  }
  if (curLevel.moveQueue.length > 0) {
    let [curi, curj] = this.moveQueue.shift();
    this.handleDirection(curi, curj);
    setTimeout(() => this.queueAdvance(), 50);
  }
}

Level.prototype.isWon = function() {
  for (let i=0; i<this.width; i++) {
    for (let j=0; j<this.height; j++) {
      if (this.data[i][j] == 3) {
        return false;
      }
    }
  }
  return true;
}

/*
  0 - ballImg;
  1 - playerImg;
  2 - playerballImg;
  3 - crateImg;
  4 - crateballImg;
  5 - floorImg;
  6 - wallImg
*/
Level.prototype.handleDirection = function(di, dj) {
  let block = this.data[this.pi+di][this.pj+dj];
  let pblock = this.data[this.pi][this.pj]
  if (block == 0 || block == 5) {
    this.data[this.pi][this.pj] = Level.removePlayer(pblock);
    this.data[this.pi+di][this.pj+dj] = Level.addPlayer(block);
    this.pi += di;
    this.pj += dj;
    this.history.push(Level.copydata(this.data));
  }
  if (block == 3 || block == 4) {
    let nextBlock = this.data[this.pi+di*2][this.pj+dj*2];
    if (nextBlock == 0 || nextBlock == 5) {
      this.data[this.pi+di*2][this.pj+dj*2] = Level.addCrate(nextBlock);
      this.data[this.pi+di][this.pj+dj] = Level.addPlayer(Level.removeCrate(block));
      this.data[this.pi][this.pj] = Level.removePlayer(pblock);
      this.pi += di;
      this.pj += dj;
      this.history.push(Level.copydata(this.data));
    }
  }
}

Level.prototype.undo = function() {
  if (this.history.length > 1) {
    this.history.pop();
    this.data = Level.copydata(this.history[this.history.length-1]);
    this.findPlayer();
  }
}

Level.prototype.reset = function() {
  this.data = Level.copydata(this.history[0]);
  this.history = [this.history[0]];
  this.findPlayer();
}

Level.prototype.nextLevel = function() {
  if (this.n < levelStrings.length - 1) {
    curLevel = new Level(this.n + 1);
  }
}

Level.prototype.prevLevel = function() {
  if (this.n > 0) {
    curLevel = new Level(this.n - 1);
  }
}

Level.prototype.findPlayer = function() {
  for (let i=0; i<this.width; i++) {
    for (let j=0; j<this.height; j++) {
      let d = this.data[i][j];
      if (d == 1 || d == 2) {
        this.pi = i;
        this.pj = j;
        return;
      }
    }
  }
}

function mousePressed() {
  curLevel.click(mouseX, mouseY);
}

function keyPressed() {
  /*if (key == 'w') curLevel.handleDirection( 0,-1);
  if (key == 'a') curLevel.handleDirection(-1, 0);
  if (key == 's') curLevel.handleDirection( 0, 1);
  if (key == 'd') curLevel.handleDirection( 1, 0);*/
  /*if (key == 'w') curLevel.moveQueue.push([ 0,-1]);
  if (key == 'a') curLevel.moveQueue.push([-1, 0]);
  if (key == 's') curLevel.moveQueue.push([ 0, 1]);
  if (key == 'd') curLevel.moveQueue.push([ 1, 0]);*/
  if (key == 'w') curLevel.directInput( 0,-1);
  if (key == 'a') curLevel.directInput(-1, 0);
  if (key == 's') curLevel.directInput( 0, 1);
  if (key == 'd') curLevel.directInput( 1, 0);
  if (key == 'z') curLevel.undo();
  if (key == 'r') curLevel.reset();
  if (key == 'q') curLevel.prevLevel();
  if (key == 'e') curLevel.nextLevel();
}

let levelStrings =
`  ###
  #.#
  # ####
###$ $.#
#. $@###
####$#
   #.#
   ###

#####
#@  #
# $$# ###
# $ # #.#
### ###.#
 ##    .#
 #   #  #
 #   ####
 #####

 #######
 #     ###
##$###   #
# @ $  $ #
# ..# $ ##
##..#   #
 ########

 ####
##  #
#@$ #
##$ ##
## $ #
#.$  #
#..*.#
######

 #####
 #@ ###
 # $  #
### # ##
#.# #  #
#.$  # #
#.   $ #
########

   #######
####     #
#   .### #
# # #    ##
# # $ $#. #
# #  *  # #
# .#$ $ # #
##    # # ###
 # ###.    @#
 #     ##   #
 ############

   #######
  ##  # @#
  #   #  #
  #$ $ $ #
  # $##  #
### $ # ##
#.....  #
#########

   ######
 ###    #
##. $## ##
#..$ $  @#
#.. $ $ ##
######  #
     ####

 #########
 #  ##   #
 #   $   #
 #$ ### $#
 # #...# #
## #...# ##
# $  $  $ #
#     # @ #
###########

  ######
  #    #
###$$$ #
#@ $.. #
# $...##
####  #
   ####

 ####  #####
##  #  #   #
# $ ####$  #
#  $.... $ #
##    # @ ##
 ##########

  #####
###  @#
#  $. ##
#  .$. #
### *$ #
  #   ##
  #####

  ####
  #..#
 ## .##
 #  $.#
## $  ##
#  #$$ #
#  @   #
########

########
#  #   #
# $..$ #
#@$.* ##
# $..$ #
#  #   #
########

 ######
##    ##
# $ $$ #
#......#
# $$ $ #
### @###
  ####

  ######
  #    ###
  # $    #
### $ ## #
#... $   #
#...$#$ ##
#### # $ #
   #  @  #
   #######

######
#    #
# $$$##
#  #..###
##  ..$ #
 # @    #
 ########

  ########
  #   #. #
 ##  $...#
 #  $ #*.#
## ##$# ##
#   $  $ #
#   #    #
#######@ #
      ####

 #######
 #.... #
###...$###
#  $#$ $ #
# $$  #$ #
#    #   #
#### @ ###
   #####

#######
#..$..#
#..#..#
# $$$ #
#  $  #
# $$$ #
#  #@ #
#######

   ######
   # ...#
####....#
#  ###$ ###
# $ $  $$ #
#@ $ $    #
#   ###   #
##### #####

########
#      #
# #$$  #
# ...# #
##...$ ##
 # ## $ #
 #$  $  #
 #  #  @#
 ########

  #####
###   ####
#   $ $  #
# $   $ @#
###$$#####
  #  ..#
  #....#
  ######

######   #####
#    ### #  .#
#  $ $ # #...#
# #  $ ###  .#
#  $$$   $ @.#
###  $  $#  .#
  #  $#$ #...#
  ##     #  .#
   ###########

     ######
 #####.   #
 #  #..## #
 #  $..   #
 #  # .# ##
### ##$#  #
# $    $$ #
# #$#  #  #
#@  #######
#####

 #########
 #   ##  ####
 # $        #
 ##$### ##  #
 #  ## * # ##
 # $...... #
## ### . # #
#     $###$#
#   #    $@#
#####$# ####
    #   #
    #####

      #########
      #       #
      # # # # #
      #  $ $# #
#######   $   #
#..#  ## $ $# #
#..   ## $ $  #
#..#  ## ######
#..# # $ $ #
#..     $  #
#  ### @ ###
#### #####

    ####
#####  #
#  $ $ # #######
#   $  # #*.*.*#
## $ $ ###.*.*.#
 #$ $  #  *.*.*#
 #@$ $    .*.*##
 #$ $  #  *.*.*#
## $ $ ###.*.*.#
#   $  # #*.*.*#
#  $ $ # #######
#####  #
    ####

########
#......#
#  $ # ##
# $ # $ #
##$ $ $ #
 #  @   #
 ########

  ##########
###   .    #
#   ##$##  #
# @$. . .$##
## $##$## #
 #    .   #
 ##########

   ######
####.  @#
#  $$$  #
#.##.##.#
#   $   #
#  $.# ##
####   #
   #####

 ######
 #. ..#
 #. $.#
###  $##
# $  $ #
# #$## #
#   @  #
########

    ######
  ###    ###
  #   #$   ###
  #   $   $$ #
  # $$ #$    #
  ##   $   $ #
###### #$#####
#..@ #$  #
#.#..  $##
#....$# #
#....   #
#########

###############
#      #      #
# $ #$ # $##$ #
# #  $ #      #
#   ##$#$##$$ #
# # # ... #   #
# $  . # .$ # #
# $#@$...# #  #
#    . # .  $ #
# ##.$###$. # #
# # $..... ## #
#             #
###############

#########
#   ##  #
# # $ $ #
#  *.#  #
## #.@.##
##$###*###
#        #
#   ## # #
######   #
     #####

########
#      #
# $$   ###
#  $ $$$ #####
## ## ...    ##
 # #@#...###$ #
 # # $...     #
## # $...$ # ##
#  ##### ### #
#      $   $ #
###########  #
          ####

   #####
   # @ #
   #$$$#
####   #
#   .#$##
# $.$. .#
#  #.#.##
########

############
#... #     #
#..  # ##  #
#..     #  #
#..  # $## #
#... #$ $  #
######  $$ #
 ##  $ $$  #
 #@ $$$  # #
 ## $ ##   #
  #        #
  ##########

#########
#       #
#  $ $ $#
## #$## #
 # .. ..##
 ##.. .. #
  # ##$# ##
  #$ $ $  #
  #      @#
  #########

#####      ####
#@  ########  #
## $       $  #
 # # #  ####  #
 #  $   ####$##
 #$ ## # $ $ #
## $  $#     #
#   #      # #
#   #####$####
#####   #   #
    #...  $ #
    #....#  #
    #....####
    ######

     #####
 #####   #
 # .. $# #
 # #.*   #
## *.#$ ##
# $  $  #
#   ## @#
#########

##### #######
#   ###  #  #
# $     $ @ #
## #$##.##  #
 #  ...*. $ #
 # $# #.# # #
 ##    $    #
  #  ########
  ####

         ###
    ######@##
    #....#$ ##
    #....# $ #
    #.... $  #
    # ...#   #
###### ##### ##
# $ $   $  #  #
#    $$   $ $ #
### $ $ $  ####
  ##   $ $ #
   #  ######
   ####

   #####
 ###   ###
##  @$ $ #
#  ## ## ##
# $.#.$   #
# #.#*#   #
# $...  ###
###$# ###
  #   #
  #####

      ####
      #  ######
      #    #  #
      # $$    #
#######$#  #  #
#  #. .. ###$##
#  #.#*.$     #
#  #.#.*# #   #
# $$....# #####
# @$ # ## #
# $$$#    #
#    ######
######

####
#  ###
# $  ###
# $ $  ###
# $ $ $  ###
# $ $ $    #
# $ $  #   ##
# $  ## $$$ #
#@ ####     ##
## # #.$$$$$.#
 # ###.......##
 #   .*******.#
 ####.........#
    ###########

#######
# @#  #####
# $$  $   #
#  #.##$# #
##$#...   #
## ...##$##
#  ##.##  #
#  $  $   #
#  #   #  #
###########

   #####
   # @ #
   # $ #
   #$.$#
 ###.$.##
## .$.$.###
#  $.$.$  #
#    .    #
###########

#############
#  $ $ $.*..#
# $ $ $ *...#
#  $ $ $.*..#
# $ $ $ *...#
#  $ $ $.*..#
# $ $ $ *...#
#  $ $ $.*..#
# $ $ $ *...#
#  $ $ $.*..#
#@$ $ $ *...#
#############

             #
            ##
           ###
          #   #
   ######## # #
  # $ $ $ $   #
 ## #.#.#.#@$#
###.......   ##
 ## # # # #$##
  # $ $ $ $   #
   ######## # #
          #   #
           ###
            ##

#######
#  .$ ###
# .$.$  #
#*$.$.@ #
# .$.$ ##
#  .$  #
########

         #####
         #   #
########## * ###
#          .   #
# $$$$****$...@#
#          .   #
########## * ###
         #   #
         #####

     ####
######  #####
#@$    $  $ #
#$### $ # # #
#  #  # $   #
# $#    # ###
#  $ #$#   #
#......... #
########   #
       #####

 #########
 #   ##  ####
 # $        #
 ##$### ##  #
 #  ##.$ # ##
 # $...... #
## ###.  # #
#     $###$#
#   #    $@#
#####$# ####
    #   #
    #####

###########
#    #    #
# $@$$$$$ #
#         #
##### #####
   #.  #
   #.  #
   #...#
   #.  #
   #####

  #####
  # @ #
  # $ #
### . ###
#   *   #
# ***** #
#   *   #
###$*$###
  # . #
  # * #
  # . #
  #####

##############
#.           #
#.$ $ $ $ $  #
#.#########  #
#.#.* $ ..$*##
#.# $ $ *.$@#
#.#.  $ ..$$#
#.#########.#
#.          #
#.#$#$#$#$#$#
#.          #
#############

############
#..  #     ###
#..  # $  $  #
#..  #$####  #
#..    @ ##  #
#..  # #  $ ##
###### ##$ $ #
  # $  $ $ $ #
  #    #     #
  ############

       ####
########  ####
#   ##.....  #
#  $  ##...# #
##  $  ### # #
 # # $  #    #
 #  # $  #   #
 #   # $  #  #
 #    # $ # ##
 ####  # $  #
    ##  # $ #
     ##@#   #
      #######

####      ####
#..########..#
#*.*.....*.*.#
# $ $ $ $ $ $#
#$ $ $@$ $ $ #
# $ $ $ $ $ $#
#$ $ $ $ $ $ #
#.*.*.....*.*#
#..########..#
####      ####

    #####
   ##   ####
   # ..* $ #
#### #.#   #
#    .*.#@##
# #$##$## #
#     $ $ #
##  #   ###
 ########

######
#    #
# $  ####
# $*..* #
# *..*$ #
####  $ #
   # @  #
   ######

   #####
####.  ##
# $.$.  #
#@$# #$ #
# $. .  #
####$#$ #
  #. .  #
  #######

############
#    ... $ #
# $$$*** $@#
#    ... $ #
############

##########
##       #
#   #$#$ #
# $$  .$.#
# @###...#
##########

 ####
 #  #####
##$ ##  #
#  $@$  #
#   ##$ #
###.## ###
 #...$ $ #
 ##..    #
  ########

##### ####
#...# #  ####
#...###  $  #
#....## $  $###
##....##   $  #
###... ## $ $ #
# ##    #  $  #
#  ## # ### ####
# $ # #$  $    #
#  $ @ $    $  #
#   # $ $$ $ ###
#  ######  ###
# ##    ####
###

#######
#. . .#
# $$$ #
#.$@$.#
# $$$ #
#. . .#
#######

      ####
#######  #
#     $  #
#   $##@$#
##$#...# #
 # $...  #
 # #. .# ##
 #   # #$ #
 #$  $    #
 #  #######
 ####

   #########
   #   #   #
   #       #
#####*### ##
#   ...   #
# # #*###$##
# $    $   #
#####@ #   #
    ########

#####
#...# #####
#...###   #
#....   $$#####
#....  #  #   ##
#..#$#### #$#  #
## $  #     $$ #
#  $# @ $ $$#  #
# $ $ $ #   $ ##
#   #  $ ##   #
######   ######
     #####

###############
###.#      ####
##..# $  $ #  #
#...# ## $ #  #
#.....  #$$   #
##....$    #$ #
#### #######  #
#   $        ##
#  $ #  $# $ ##
# $### $ # $$ #
#   @#  ##    #
###############

       ########
       #  #   #
 ####### $$...#
 #        #...#
 # ######$#...#
## #      #...#
#  # #$ $ #####
# # $ $ $ #
# @  $ #  #
#####$ $$ #
    #     #
    #######

       #####
  ######   #
###    . $ #
# $  #$.#$##
#  #  @.#  #
## ####.   #
 # $  #*####
 # ## #.  #
 #     .# #
 ###$     #
   #  #####
   ####

    ####
#####  #####
#    $   $ #
#  $#$##   #
### #.*. ###
  # ... @#
  ## #$###
   #   #
   #####

   ########
####    . #
#  $ $ $. #
#  .####.##
# $.$ $ @#
#  .  ####
#######

  #####
  #   #
###$.$#####
#   . $   #
# ##$## @ #
#   . #####
### . #
  #   #
  #####

 #####
 # @ ######
 # #..*   #
 # ...#   #
##$## $ $ #
#   #$#####
#   $   #
##### # #
    #   #
    #####

     ######
   ###    ##
   #   ##  #
 ###$##  # #
##     ..# #
#  $#$#*.# #
# $$@ #.*# ###
#  $$ #..#   #
##    #..$   #
 ###$##. # ###
   #  ###  #
   ##     ##
    #######

     #######
     #  #  #
     #  $$ #
###### $#  #
#...### #  ##
#.  #  $ #  #
#.    $ $ $ #
#.  #  $ #  #
#...### #  ##
###### $   #
     #@ #  #
     #######

          ######
          #    #
#####   ### ## #
#.. ##### $  # #
#..     $   $# #
#..  ## ##   # #
#.. ## $ #$ $# #
#.. #     $  # #
#.. #  $ ###$  #
#.. # $ $  $ ###
### ## # $    #
  #    #@## $ #
  #########  ##
          ####

       #
     #####
   ### @ ###
   #  $ $  #
   # *.*.* #
  ## .$ $. ##
 ### *.*.* ###
####  $ $  ####
   ######  #
    ##   ##

 ##############
 # @ * * * #  ##
 #$#  * *  #   #
 # # * * *     #
 # #  * *  ## ##
 # # * * * ## #
 # #  * *  ## #
 # # * * * ## #
 # #  * *  ## #
 # # * . * ## ##
## ##########  #
#              #
#   #########  #
#####       ####

 #############
 #    #  ##  #
 #$$$ # $$  $##
 # $  #  .... #
 #  $  #$.##. #
 #  # $# ....##
##$ $  #$.##. #
# $  $ @$.... #
#   ###  ######
##### ####

     #########
     #       #
     #  $#$# #
 ######  # $ #
 #   # $  $  #
## $     ### #
#   #$####   #
#    $ ### ###
#####.. @# ##
   #...$ $$ #
   #...#    #
   #...######
   #####

####     ####
#  #######..###
# $ $ $  #....#
# $   $$ #***.#
# $ $ $  #..*.#
#  $ $ $ #*.*.#
## $ $ $ .*.*.##
#  $ $ $ .*.*.@#
#  $ $ $ #*.*.##
# $ $ $  #..*.#
# $   $$ #***.#
# $ $ $  #....#
#  #######..###
####     ####

      #####
#######   #
#   ##.   #
#  $#..  ###
##  ...#$$ #####
 # $.#.$       #
 # $###$## # $ #
 #   #     $$# #
 ##$$# ##$#$   #
 #... $@ $   ###
 #...#$#   ###
 #...  #####
 #######

 ####  ######
 #  ####    #
##*   * **  #
# $ *    *# #
# .   ###   #
######   #@##
# * . *  ** #
#   #   #   #
##*   * #$# #
 #  #####   #
 ####   #####

 #########
 #   #   #
 # $$$$$ #
## $ $ $ #
# $  @   #
# $ #### ##
#  #..... #
##  ..... #
 ##########

   #######
   #     #
   # $ $ ##
   #####..#####
######..*.  $ #
#  $@$....#$$ #
#   $ #$###   #
#####       ###
    ###  ####
      #  #
      ####

#####
#   ######
# $ .. $ #
##$ ..$$@#
 #  .. $ #
 #########

  #####
  #   ######
###$#.     #
# $ ...# $ #
#@ $.#*$   #
####    ####
   ######

    #####
#####   #
#   $ @ #
#  $ #.#####
##$ ##.##  ####
 #  ..... $#  #
 # $##.##  #$ #
 #   #.##     #
 ### $ ##### ##
   # #$     $ #
   #    ###   #
   ###### #####

#######
#  *  #
# @.$ #
# $.  #
#*.***#
#  *  #
# $*$ #
#  .  #
#######

  #########
  #    #  #
### #$  $ ####
#  $  ##..#  ###
# #  $ #..$ $  #
# $$  $#..  #  #
##  #  ...#$   #
 #$ @ #...# $  #
 #    #...$   ##
 # ##$ ###   ##
 #   $     ###
 #  ########
 ####

   ##########
####......  #
#   .....#  #
#  #...... ##
## ####$##$#
#@$  $ $   ###
# $$    ##   #
# #  $$##  # #
#   $  # $$  #
#  $  $   #$ #
####   # $ $ #
   #   #     #
   ###########

      #########
      #       #
      #$ $$$  #
      #   # $ #
      #   $@$ #
    ###$ $ # ##
    #   $#$# #
##### #  #   #
#...  # $# ###
#.....   # #
#.....# $# #
########   #
       #####

 ##### ######
 #   ###    #
## $ $ #$ #$#
#  $ @ $  $ ##
# #  ## #....#
#  ## $ #.##.#
##  $    ....#
 # $$ #$#....#
 #   #   #$ ##
 ##### $    #
     ####  ##
        ####

####
#  #
#  ##########
#    ##     #
#..#    $$# #
#..  ##   $ ###
#..#  ##$# $  #
#..   # @$ $  #
#..#  # $ $   #
# .   # $ $ ###
#  #  #   ###
#  #    ###
#########

         #####
        #     #
       #  $##  #
      #  #   $ #
#  #  # #  # # #
 # #  # $ $  $ #
  ####### #$#  #
  #  $ $      #
  #@..$ **.###
   #......#####
    ############`.split('\n\n');