// @ts-nocheck

// let canvasTxt = window.canvasTxt.default

let pintar = new PintarJS();
pintar.clearColor = PintarJS.Color.fromHex('4e4e4e'); // F7A36B B7B4E2 5e5e5e
//pintar.clearColor = PintarJS.Color.fromHex('F7A36B');

let canvas = document.getElementById('canvas')
//let ctx = canvas.getContext('webgl2')

let globalT = 0.0;
let last_t = null;

class WobblyShader extends PintarJS.DefaultShader
  {
    get fragmentShaderTextureCode()
    {
        return `

        vec2 coor = vec2(gl_FragCoord.x * 0.001, gl_FragCoord.y * 0.001) + (u_color.xy);
        //gl_FragColor = vec4(, u_deltaTime, 1.0) + 0.0 * (clamp(texture2D(u_image, v_texCoord) + u_colorBooster, 0.0, 1.0) * u_color);

        //if (0.5 < cnoise(vec3((vec2(gl_FragCoord.x / _ScreenParams.x, gl_FragCoord.y / _ScreenParams.y))*20.0, u_deltaTime*0.001))) {
        if (0.1 < cnoise(vec3(coor * 30.0, u_deltaTime*0.001))) {
            gl_FragColor = (clamp(texture2D(u_image, v_texCoord) + u_colorBooster, 0.0, 1.0) * u_color);
        } else {
            gl_FragColor = vec4(0.0);
        }
            //gl_FragColor = clamp(texture2D(u_image, v_texCoord) + u_colorBooster, 0.0, 1.0) * u_color * sin(u_deltaTime);
            //gl_FragColor.a = min(1.0, max(0.0, cnoise(vec3(v_texCoord*8.0, u_deltaTime*0.1))));
            //gl_FragColor.rgb *= min(gl_FragColor.a, 1.0);
        `;
    }

    get uniformNames() {
      return super.uniformNames.concat(["u_deltaTime"])
    }

    get fragmentShaderAdditionalUniforms() {
     return `uniform float u_deltaTime;
     vec3 mod289(vec3 x)
      {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
      }

      vec4 mod289(vec4 x)
      {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
      }

      vec4 permute(vec4 x)
      {
      return mod289(((x*34.0)+10.0)*x);
      }

      vec4 taylorInvSqrt(vec4 r)
      {
      return 1.79284291400159 - 0.85373472095314 * r;
      }

      vec3 fade(vec3 t) {
      return t*t*t*(t*(t*6.0-15.0)+10.0);
      }

      // Classic Perlin noise
      float cnoise(vec3 P)
      {
      vec3 Pi0 = floor(P); // Integer part for indexing
      vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
      Pi0 = mod289(Pi0);
      Pi1 = mod289(Pi1);
      vec3 Pf0 = fract(P); // Fractional part for interpolation
      vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
      vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
      vec4 iy = vec4(Pi0.yy, Pi1.yy);
      vec4 iz0 = Pi0.zzzz;
      vec4 iz1 = Pi1.zzzz;

      vec4 ixy = permute(permute(ix) + iy);
      vec4 ixy0 = permute(ixy + iz0);
      vec4 ixy1 = permute(ixy + iz1);

      vec4 gx0 = ixy0 * (1.0 / 7.0);
      vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
      gx0 = fract(gx0);
      vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
      vec4 sz0 = step(gz0, vec4(0.0));
      gx0 -= sz0 * (step(0.0, gx0) - 0.5);
      gy0 -= sz0 * (step(0.0, gy0) - 0.5);

      vec4 gx1 = ixy1 * (1.0 / 7.0);
      vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
      gx1 = fract(gx1);
      vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
      vec4 sz1 = step(gz1, vec4(0.0));
      gx1 -= sz1 * (step(0.0, gx1) - 0.5);
      gy1 -= sz1 * (step(0.0, gy1) - 0.5);

      vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
      vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
      vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
      vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
      vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
      vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
      vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
      vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

      vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
      g000 *= norm0.x;
      g010 *= norm0.y;
      g100 *= norm0.z;
      g110 *= norm0.w;
      vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
      g001 *= norm1.x;
      g011 *= norm1.y;
      g101 *= norm1.z;
      g111 *= norm1.w;

      float n000 = dot(g000, Pf0);
      float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
      float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
      float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
      float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
      float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
      float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
      float n111 = dot(g111, Pf1);

      vec3 fade_xyz = fade(Pf0);
      vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
      vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
      float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
      return 2.2 * n_xyz;
      }
     `;
   }

    prepare(renderable, viewport)
    {
      super.prepare(renderable, viewport);
      this.setUniformf(this.uniforms.u_deltaTime, globalT);
      //deltaTime += 0.1;
    }
  }

let wobblyShader = new WobblyShader();

let TILE = 40
let OFFX = TILE
let OFFY = TILE

let input_queue = []
let turn_time = 0
let screen_transition_turn = false
let level_transition_time = 0
let in_last_level = false
let intro_time = 1
let next_level = null
let first_undo_press = false
let first_key_press = false
let won_cur_level = false
let player_parity = 0

let DEFAULT_PLAYER_INMUNE_LEVEL = 0
let TURN_SPEED = 0.15 //0.3
let TRANSITION_SPEED = 0.03
let ALLOW_CHANGE_PLAYER = false
let ALLOW_CHANGE_CRATES = false
let ALLOW_EDITOR = false
let ALLOW_MACHINES = true
let ALLOW_CRATE_ON_TOP_OF_MACHINE = true
let ALLOW_MAGIC_INPUT = false
let KEEP_UNDOING_UNTIL_CRATE_MOVE = false
let DEFAULT_FORBID_OVERLAP = false
let KEY_RETRIGGER_TIME = 200
let BACKGROUND_IS_WALL = true
let ENABLE_RESTART = false
let ENABLE_UNDO_2 = false
let ENABLE_UNDO_3 = false

function PropertyHistory (initial_value, inmune, extra = 0) {
  this.value = [initial_value]
  if (typeof inmune === 'number') inmune = [inmune]
  this.inmune = inmune
  for (let k = 0; k < extra; k++) {
    this.value.push(initial_value)
  }
}

PropertyHistory.prototype.get = function (tick = undefined) {
  if (tick === undefined) return this.value.at(-1)
  return this.value[get_original_tick_2(tick, this.inmune)]
}

PropertyHistory.prototype.add = function (value = undefined) {
  if (value === undefined) {
    this.value.push(this.value.at(-1))
  } else {
    this.value.push(value)
  }
}

let goalSound = new Howl({
  src: ['goal.wav']
})
let wallSound = new Howl({
  src: ['wall.wav']
})
let stepSound = new Howl({
  src: ['step.wav']
})
let pushSound = new Howl({
  src: ['push.wav']
})
let winSound = new Howl({
  src: ['win.wav']
})
let holeSound = new Howl({
  src: ['hole.wav']
})
let undoSounds = [
  new Howl({
    src: ['undo1.wav']
  }),
  new Howl({
    src: ['undo2.wav']
  }),
  new Howl({
    src: ['undo3.wav']
  }),
  new Howl({
    src: ['undo4.wav']
  })
]
undoSounds[8] = undoSounds[0]
let restartSound = new Howl({
  src: ['restart.wav'],
  volume: 0.4
})
let transitionSound = new Howl({
  src: ['transition.wav']
})

// let using_machine_n_turns = 0;
let using_machine_type = null

let COLORS = {
  'wall': '#909C6E', // '#006a9c #007ca8'
  'floor': '#696E4F', // '#803D7D #75366D'
  'floorWin': '#507f3d', // '#507f3d #437737'  // 437737
  'player': '#6EE745', // F07167 '#947BD3', // '#ffd080 #fe546f'
  'target': '#83765D', // #ff9e7d
  /* 'crate1': '#24d3f2', // 24d3f2
  'crate2': '#abff4f', // aaff54
  'crate3': '#ff3366' // ff245b */
  'crate1': '#F8CB58',
  'crate2': '#F8984E',
  'crate3': '#F8643F',
  'machine1': '#F5B512',  // E9C46A D2BA7F E9A90A
  'machine2': '#F46F0A', // E89A5E D09D76 E26709
  'machine3': '#EC3609' // E76F51 CD7E6A D83208
}
COLORS.background = COLORS.floor // #75366D
COLORS.true_background = '#5e5e5e' // COLORS.wall // #75366D
//COLORS.transition = COLORS.floor // COLORS.wall // #75366D
COLORS.floor = COLORS.true_background
COLORS.crates = [
  COLORS.crate1,
  COLORS.crate2,
  COLORS.crate3,
]

COLORS.transition = '#383F69' // 383F69 5e5e5e

// BACK_COLORS = [COLORS.true_background, COLORS.crate1, COLORS.crate2, COLORS.crate3]
BACK_COLORS = [COLORS.true_background, COLORS.machine1, COLORS.machine2, COLORS.machine3]
UNDO_PLAYER_COLORS = [COLORS.player, COLORS.machine1, COLORS.machine2, COLORS.machine3]


PintarJS.Sprite.defaults.smoothingEnabled = false
let player_texture = new PintarJS.Texture("imgs/zelda.png", () => {
  let _4x4 = new PintarJS.Point(4, 4)
  raw_player_sprites = [];
  for (let k=0; k<16; k++) {
    let cur = new PintarJS.Sprite(player_texture)
    cur.setSourceFromSpritesheet(new PintarJS.Point(k%4, Math.floor(k/4)), _4x4);
    raw_player_sprites.push(cur)
  }
  //raw_player_sprites[0].setSourceFromSpritesheet(new PintarJS.Point(2, 0), _4x4);
  player_sprite = raw_player_sprites[0]
});
let world_texture = new PintarJS.Texture("imgs/world.png", () => {
  //wall_sprites = [];
  geo_sprites = {};
  let geoData = {
    '#': [0,0],
    //',': [1,0], //[3,10],
    '.': [0,9],
    'A': [0,6],
    'B': [1,6],
    'C': [2,6],
    'D': [3,6],
    'E': [0,3],
    'F': [1,3],
    'G': [2,3],
    'H': [3,3],
    'e': [2,5],
    'f': [3,5],
    'g': [0,5],
    'h': [1,5],
    'I': [0,4],
    'J': [1,4],
    'K': [2,4],
    'L': [3,4],
    'M': [0,7],
    'N': [2,7],
    'm': [2,8],
    'P': [3,0],
    'X': [0,10]
  }
  let _4x10 = new PintarJS.Point(4, 11)
  Object.entries(geoData).forEach(([k,v]) => {
    let spr = new PintarJS.Sprite(world_texture)
    spr.setSourceFromSpritesheet(new PintarJS.Point(v[0], v[1]), _4x10);
    geo_sprites[k] = spr
  })
  //wall_sprites[0].setSourceFromSpritesheet(new PintarJS.Point(0, 0), new PintarJS.Point(4, 10));
  floor_sprite = new PintarJS.Sprite(world_texture)
  //floor_sprite.setSourceFromSpritesheet(new PintarJS.Point(0, 9), new PintarJS.Point(4, 10));
  floor_sprite.setSourceFromSpritesheet(new PintarJS.Point(0, 10), new PintarJS.Point(4, 10));
  //crate_sprite = new PintarJS.Sprite(world_texture)
  //crate_sprite.setSourceFromSpritesheet(new PintarJS.Point(2, 9), new PintarJS.Point(4, 10));
  crate_sprites = []
  crate_hole_sprites = []
  for (let k=0; k<3; k++) {
    let curSpr = new PintarJS.Sprite(world_texture)
    curSpr.setSourceFromSpritesheet(new PintarJS.Point(2, 9), _4x10);
    curSpr.color = new PintarJS.Color.fromHex(COLORS.crates[k]);
    crate_sprites.push(curSpr)

    curSpr = curSpr.clone()
    curSpr.brightness = 0.4
    crate_hole_sprites.push(curSpr)
  }
  /*for (let k=0; k<3; k++) {
    let curSpr = new PintarJS.Sprite(world_texture)
    curSpr.setSourceFromSpritesheet(new PintarJS.Point(2, 9), new PintarJS.Point(4, 10));
    curSpr.color = new PintarJS.Color.fromHex(COLORS.holeCrates[k]);
    crate_hole_sprites.push(curSpr)
  }*/
  hole_sprite  = new PintarJS.Sprite(world_texture)
  hole_sprite.setSourceFromSpritesheet(new PintarJS.Point(1, 9), _4x10);

  black_sprite  = new PintarJS.Sprite(world_texture)
  black_sprite.setSourceFromSpritesheet(new PintarJS.Point(3, 9), _4x10);
});
let gradients_texture = new PintarJS.Texture("imgs/gradients.png", () => {
  //let _4x4 = new PintarJS.Point(4, 4)
  raw_gradient_sprites = [];


  //for (let k=0; k<16; k++) {
  let cur = new PintarJS.Sprite(gradients_texture)
  cur.sourceRectangle = new PintarJS.Rectangle(0, 0, 48, 32);
  cur.size = new PintarJS.Point(48, 32);
  raw_gradient_sprites.push(cur)

  cur = cur.clone()
  cur.sourceRectangle = new PintarJS.Rectangle(48, 0, 32, 48);
  cur.size = new PintarJS.Point(32, 48);
  raw_gradient_sprites.push(cur)

  cur = cur.clone()
  cur.sourceRectangle = new PintarJS.Rectangle(0, 32, 32, 48);
  cur.size = new PintarJS.Point(32, 48);
  raw_gradient_sprites.push(cur)

  cur = cur.clone()
  cur.sourceRectangle = new PintarJS.Rectangle(32, 48, 48, 32);
  cur.size = new PintarJS.Point(48, 32);
  raw_gradient_sprites.push(cur)
  //}
  //raw_player_sprites[0].setSourceFromSpritesheet(new PintarJS.Point(2, 0), _4x4);
  //player_sprite = raw_player_sprites[0]
});

let texto_1_texture = new PintarJS.Texture("imgs/texts_1.png", () => {
  texto_1_sprite = new PintarJS.Sprite(texto_1_texture)
  texto_1_sprite.size = new PintarJS.Point(896, 576)
});
let texto_2a_texture = new PintarJS.Texture("imgs/Text_2_a.png", () => {
  texto_2a_sprite = new PintarJS.Sprite(texto_2a_texture)
  texto_2a_sprite.size = new PintarJS.Point(640, 448)
});
let texto_2b_texture = new PintarJS.Texture("imgs/Text_2_b.png", () => {
  texto_2b_sprite = new PintarJS.Sprite(texto_2b_texture)
  texto_2b_sprite.size = new PintarJS.Point(640, 448)
});
let texto_3_texture = new PintarJS.Texture("imgs/texts_3.png", () => {
  texto_3_sprite = new PintarJS.Sprite(texto_3_texture)
  texto_3_sprite.size = new PintarJS.Point(640, 640)
});
let texto_r_texture = new PintarJS.Texture("imgs/texts_r.png", () => {
  texto_r_sprite = new PintarJS.Sprite(texto_r_texture)
  texto_r_sprite.size = new PintarJS.Point(640, 640)
});
let texto_recap_texture = new PintarJS.Texture("imgs/texts_recap.png", () => {
  texto_recap_sprite = new PintarJS.Sprite(texto_recap_texture)
  texto_recap_sprite.size = new PintarJS.Point(448, 640)
});
let texto_NM_texture = new PintarJS.Texture("imgs/texts_select.png", () => {
  texto_NM_sprite = new PintarJS.Sprite(texto_NM_texture)
  texto_NM_sprite.size = new PintarJS.Point(832, 448)
  texto_NM_sprite.color = PintarJS.Color.fromHex('#7988c0')
});
let texto_credits_texture = new PintarJS.Texture("imgs/texts_credits.png", () => {
  texto_credits_sprite = new PintarJS.Sprite(texto_credits_texture)
  texto_credits_sprite.size = new PintarJS.Point(896, 576)
  //texto_credits_sprite.color = PintarJS.Color.fromHex('#4f69ba')
});
/*let raw_player_sprites = [
  new PintarJS.Sprite(player_texture)
]
*/



//wall_sprites[0].sourceRectangle = new PintarJS.Rectangle(0, 0, 16, 16);

pintar.makePixelatedScaling();
pintar.makeFullscreen();

function drawSpr(spr, i,j) {
  spr.position = new PintarJS.Point(OFFX + i*TILE, OFFY + j*TILE)
  spr.scale = new PintarJS.Point(TILE/16, TILE/16)
  pintar.drawSprite(spr);
}

function drawLevel (level) {
  if (in_last_level) {
    if (level.extraDrawCode) level.extraDrawCode()
    return
  }
  //let is_won = isWon(level)
  let geo = level.geo
  /*if (ALLOW_EDITOR) {
    ctx.strokeRect(OFFX - 0.1 * TILE, OFFY - 0.1 * TILE, (level.w + 0.2) * TILE, (level.h + 0.2) * TILE)
  }*/
  // ctx.fillStyle = COLORS.wall
  // ctx.fillStyle = BACKGROUND_IS_WALL ? COLORS.floor : COLORS.wall
  for (let j = 0; j < geo.length; j++) {
    for (let i = 0; i < geo[0].length; i++) {
      let cur_spr = geo_sprites[geo[j][i]]
      if (!cur_spr) continue
      cur_spr.position = new PintarJS.Point(OFFX + i*TILE, OFFY + j*TILE)
      cur_spr.scale = new PintarJS.Point(TILE/16, TILE/16)
      pintar.drawSprite(cur_spr);
    }
  }
  // console.log("hola?");
  // return;

  let sortedCrates = _.orderBy(
    level.crates,
    function (crate) {
      return -crate.inmune_history.at(-1)
    }
  )
  // let crateSprsA = [crateSpr1_a, crateSpr2_a, crateSpr3_b]
  // let crateSprsB = [crateSpr1_b, crateSpr2_b, crateSpr3_a]

  let forwardsT = Math.pow(1 - turn_time, 1 / 1)
  let backwardsT = Math.pow(1 - turn_time, 1)

  // draw black pit of holes
  level.holes.forEach(([i, j]) => {
    black_sprite.position = new PintarJS.Point(OFFX + i*TILE, OFFY + j*TILE)
    black_sprite.scale = new PintarJS.Point(TILE/16, TILE/16)
    pintar.drawSprite(black_sprite);
  })

  // only draw crates in holes
  sortedCrates.forEach(crate => {
    if (!crate.inHole.get()) return
    if (!crate.inHole.value.at(-2) && turn_time > 0) return
    let state = crate.history.at(-1)
    let prevState = crate.history.at(-2)
    if (prevState === undefined) prevState = state
    let inmune = crate.inmune_history.at(-1)
    let crate_forward = get_times_directions(crate.history.length - 2)[inmune] == 1
    let ci = lerp(prevState[0], state[0], crate_forward ? forwardsT : backwardsT)
    let cj = lerp(prevState[1], state[1], crate_forward ? forwardsT : backwardsT)
    drawSpr(crate_hole_sprites[inmune], ci, cj)
  })
  sortedCrates.reverse()
  pintar._renderer.setShader(wobblyShader);
  sortedCrates.forEach(crate => {
    if (!crate.inHole.get()) return
    if (!crate.inHole.value.at(-2) && turn_time > 0) return
    let state = crate.history.at(-1)
    let prevState = crate.history.at(-2)
    if (prevState === undefined) prevState = state
    let inmune = crate.inmune_history.at(-1)
    let crate_forward = get_times_directions(crate.history.length - 2)[inmune] == 1
    let ci = lerp(prevState[0], state[0], crate_forward ? forwardsT : backwardsT)
    let cj = lerp(prevState[1], state[1], crate_forward ? forwardsT : backwardsT)
    drawSpr(crate_hole_sprites[inmune], ci, cj)
  })
  sortedCrates.reverse()
  pintar._renderer.setShader(null);

  // draw holes
  level.holes.forEach(([i, j]) => {
    hole_sprite.position = new PintarJS.Point(OFFX + i*TILE, OFFY + j*TILE)
    hole_sprite.scale = new PintarJS.Point(TILE/16, TILE/16)
    pintar.drawSprite(hole_sprite);
  })
  /*ctx.globalAlpha = 0.2
  ctx.fillStyle = 'black'
  level.holes.forEach(([i, j]) => {
    ctx.fillRect(i * TILE + OFFX, j * TILE + OFFY, TILE, TILE)
    // drawSpr(holeSpr, i, j);
  })
  ctx.globalAlpha = 1*/

  let playerState = level.player.history.at(-1)
  let prevPlayerState = level.player.history.at(-2)
  if (prevPlayerState === undefined) {
    // prevPlayerState = playerState
    prevPlayerState = [playerState[0] - level.enter[0], playerState[1] - level.enter[1]]
    // backwardsT = 1 - turn_time;
    forwardsT = level_transition_time <= 0.5 ? Math.pow(1 - level_transition_time * 2, 1 / 2) : 1
    //forwardsT = Math.pow(1 - level_transition_time * 2, 1 / 2)
    // forwardsT = 1 - level_transition_time * 2
  }
  let player_forward = get_times_directions(level.player.history.length - 2)[0] == 1
  // console.log(player_forward);

  let pt = player_forward ? forwardsT : backwardsT

  if (level_transition_time > 0.5 && won_cur_level) {
    pt = (1-level_transition_time) * 4
    //pt += 1
    //console.log(1-level_transition_time);
  }

  let pi = lerp(prevPlayerState[0], playerState[0], pt)
  let pj = lerp(prevPlayerState[1], playerState[1], pt)
  // drawSpr(playerSpr, pi, pj);

  sortedCrates.forEach(crate => {
    if (crate.inHole.get()) {
      if (crate.inHole.value.at(-2) || turn_time == 0) {
        return
      }
    }
    let state = crate.history.at(-1)
    let prevState = crate.history.at(-2)
    if (prevState === undefined) prevState = state
    let inmune = crate.inmune_history.at(-1)
    // let crate_forward = get_times_directions(true_timeline_undos.length - 1)[inmune] == 1
    let crate_forward = get_times_directions(crate.history.length - 2)[inmune] == 1
    let ci = lerp(prevState[0], state[0], crate_forward ? forwardsT : backwardsT)
    let cj = lerp(prevState[1], state[1], crate_forward ? forwardsT : backwardsT)
    let crate_sprite = crate_sprites[inmune]
    crate_sprite.position = new PintarJS.Point(OFFX + ci*TILE, OFFY + cj*TILE)
    crate_sprite.scale = new PintarJS.Point(TILE/16, TILE/16)
    pintar.drawSprite(crate_sprite);
    //drawSpr(crateSprs[inmune], ci, cj)
    // drawSpr(crateSprsA[inmune], ci, cj);
    // drawSpr(crateSpr, state[0], state[1]);
    // ctx.fillText((inmune+1).toString(), state[0]*TILE+OFFX, state[1]*TILE+OFFY);
    // result[state[1]][state[0]] += (inmune + 1).toString();
  })

  // drawSpr(playerSpr, playerState[0], playerState[1]);
  // ctx.fillText("@", playerState[0]*TILE+OFFX, playerState[1]*TILE+OFFY);
  // result[playerState[1]][playerState[0]] = '@' + level.player.inmune_history.at(-1);
  // level.crates.forEach(crate => {
  /*sortedCrates.forEach(crate => {
    if (crate.inHole.get()) return
    let state = crate.history.at(-1)
    let prevState = crate.history.at(-2)
    if (prevState === undefined) prevState = state
    let inmune = crate.inmune_history.at(-1)
    // let crate_forward = get_times_directions(true_timeline_undos.length - 1)[inmune] == 1
    let crate_forward = get_times_directions(crate.history.length - 2)[inmune] == 1
    let ci = lerp(prevState[0], state[0], crate_forward ? forwardsT : backwardsT)
    let cj = lerp(prevState[1], state[1], crate_forward ? forwardsT : backwardsT)
    drawSpr(crate_sprites[inmune], ci, cj)
    // drawSpr(crateSprsA[inmune], ci, cj);
    // drawSpr(crateSpr, state[0], state[1]);
    // ctx.fillText((inmune+1).toString(), state[0]*TILE+OFFX, state[1]*TILE+OFFY);
    // result[state[1]][state[0]] += (inmune + 1).toString();
  })*/

  // let player_scale_x = player_forward ? (1 - turn_time) * .7 + .35 : (turn_time) * .7 + .35;
  // if (turn_time == 0) player_scale_x = 1;
  // player_scale_x = 1 - 6.66*player_scale_x + 15*player_scale_x*player_scale_x - 8.3*player_scale_x*player_scale_x*player_scale_x
  // drawSprScaled(playerSpr, pi, pj, player_scale_x, 1);
  //drawSpr(playerSpr, pi, pj)
  //let sprOffset = Math.floor(pt * 2) % 2;
  //if (globalT === undefined) globalT = 0
  //globalT += TURN_SPEED / 10
  //let sprOffset = 1 - (Math.floor(globalT * 1.99) % 2);
  //let sprOffset = 1 - (Math.floor(turn_time * 1.99) % 2);
  let sprOffset = level_transition_time > 0.5 && won_cur_level ? 1 : 0
  let odd = level.player.inHole.value.at(-1) % 2 == 1
  if (odd) sprOffset = -sprOffset
  let player_spr_n = level.player.inHole.value.at(-1) + sprOffset
  /*if (player_spr_n >= 8 && turn_time == 0) {
    // edge case: pushed into a hole
    player_spr_n -= 8
  }*/
  //if (!player_forward) {
  if (true_timeline_undos.at(-1) > 0 && turn_time > 0.0) {
    //let opts = [1.0, 0.8, 0.6, 0.4, 0.2]
    //let opts = [1.0, 0.6, 0.2]
    //let opts = [0.0]
    let opts = [1.0]
    for (var i = 0; i < opts.length; i++) {
      let opt = opts[i]
      //if (1 - turn_time < opt && 1) {// - turn_time > opt - 0.66) {
        let opi = lerp(prevPlayerState[0], playerState[0], opt)
        let opj = lerp(prevPlayerState[1], playerState[1], opt)
        player_sprite = raw_player_sprites[player_spr_n]
        player_sprite.position = new PintarJS.Point(OFFX + opi*TILE, OFFY + opj*TILE)
        player_sprite.color = PintarJS.Color.fromHex(COLORS.crates[true_timeline_undos.at(-1) - 1])
        player_sprite.color.a = 0.4
        pintar.drawSprite(player_sprite);
      //}
    }
    player_sprite.color = PintarJS.Color.white()
  }
  player_sprite = raw_player_sprites[player_spr_n]
  player_sprite.position = new PintarJS.Point(OFFX + pi*TILE, OFFY + pj*TILE)
  player_sprite.scale = new PintarJS.Point(TILE/16, TILE/16)
  pintar.drawSprite(player_sprite);
  //sortedCrates.reverse()

  pintar._renderer.setShader(wobblyShader);
  sortedCrates.forEach(crate => {
    if (crate.inHole.get()) {
      if (crate.inHole.value.at(-2) || turn_time == 0) {
        return
      }
    }
    let state = crate.history.at(-1)
    let prevState = crate.history.at(-2)
    if (prevState === undefined) prevState = state
    let inmune = crate.inmune_history.at(-1)
    let crate_forward = get_times_directions(crate.history.length - 2)[inmune] == 1
    let ci = lerp(prevState[0], state[0], crate_forward ? forwardsT : backwardsT)
    let cj = lerp(prevState[1], state[1], crate_forward ? forwardsT : backwardsT)
    drawSpr(crate_sprites[inmune], ci, cj)
    // drawSpr(crateSpr, state[0], state[1]);
    // ctx.fillText((inmune+1).toString(), state[0]*TILE+OFFX, state[1]*TILE+OFFY);
    // result[state[1]][state[0]] += (inmune + 1).toString();
  })

  /*drawEntranceGradient(level)
  drawExitGradient(level)*/

  pintar._renderer.setShader(null);
  /*let entrance_spr = geo_sprites['X']
  //console.log(level.enter);
  entrance_spr.position = new PintarJS.Point(OFFX + 2*TILE, OFFY + 5*TILE)
  entrance_spr.scale = new PintarJS.Point(TILE/16, TILE/16)
  pintar.drawSprite(entrance_spr);
  entrance_spr.position = new PintarJS.Point(OFFX + 8*TILE, OFFY + 5*TILE)
  pintar.drawSprite(entrance_spr);*/

  drawEntranceGradient(level)
  drawExitGradient(level)

  if (level.extraDrawCode) level.extraDrawCode()
}


function drawEntranceGradient (level) {
  let [ei, ej] = level.player.history[0]
  let [di, dj] = level.enter

  let gradSpr = raw_gradient_sprites[dir2gradSpr(di, dj)]
  //gradSpr.color = PintarJS.Color.red()
  gradSpr.scale = new PintarJS.Point(TILE / 16, TILE / 16)
  if (di == 0) {
    if (dj > 0) {
      ei -= 1
      ej -= 2
    } else {
      ei -= 1
      ej += 1
    }
  } else {
    if (di > 0) {
      ei -= 2
      ej -= 1
    } else {
      ei += 1
      ej -= 1
    }
  }
  gradSpr.position = new PintarJS.Point(
    OFFX + ei*TILE,
    OFFY + ej*TILE
  )
  pintar.drawSprite(gradSpr)
}

function dir2gradSpr(di,dj) {
  return dj == 0 ?
    (di > 0 ? 1 : 2) :
    (dj > 0 ? 3 : 0)
}

function drawExitGradient (level) {
  let [ei, ej] = level.targets[0]
  let [di, dj] = level.exit
  di *= -1
  dj *= -1

  let gradSpr = raw_gradient_sprites[dir2gradSpr(di, dj)]
  //gradSpr.color = PintarJS.Color.red()
  gradSpr.scale = new PintarJS.Point(TILE / 16, TILE / 16)
  if (di == 0) {
    if (dj > 0) {
      ei -= 1
      ej -= 2
    } else {
      ei -= 1
      ej += 1
    }
  } else {
    if (di > 0) {
    } else {
      ei += 1
      ej -= 1
    }
  }
  gradSpr.position = new PintarJS.Point(
    OFFX + ei*TILE,
    OFFY + ej*TILE
  )
  pintar.drawSprite(gradSpr)
}

/*let text_logo_sprite = new PintarJS.TextSprite("Tres\nUndos")
text_logo_sprite.font = "Helvetica"
text_logo_sprite.color = PintarJS.Color.white();
text_logo_sprite.strokeWidth = 2;
text_logo_sprite.strokeColor = PintarJS.Color.black();
text_logo_sprite.fontSize = 128;
text_logo_sprite.position = new PintarJS.Point(20, 100);*/

function drawIntroText () {
  texto_1_sprite.scale = new PintarJS.Point(TILE / 64, TILE / 64)
  texto_1_sprite.position = new PintarJS.Point(OFFX, OFFY)
  pintar.drawSprite(texto_1_sprite)
}

function drawSecondText () {
  if (ENABLE_RESTART) {
    texto_2b_sprite.scale = new PintarJS.Point(TILE / 64, TILE / 64)
    texto_2b_sprite.position = new PintarJS.Point(OFFX, OFFY)
    pintar.drawSprite(texto_2b_sprite)
  } else {
    texto_2a_sprite.scale = new PintarJS.Point(TILE / 64, TILE / 64)
    texto_2a_sprite.position = new PintarJS.Point(OFFX, OFFY)
    pintar.drawSprite(texto_2a_sprite)
    let moved_orange = levels[1].crates[1].history.findIndex(([i, j]) => i != 4 || j != 2)
    if (moved_orange == -1) return
    let balance = 0
    for (let k = moved_orange; k < true_timeline_undos.length; k++) {
      if (true_timeline_undos[k] == 0) {
        balance += 1
      } else {
        balance -= 1
      }
    }
    if (balance < -2) {
      setTimeout(function () { ENABLE_RESTART = true }, 1000)
    }
  }
}

function drawEndScreen () {
  texto_credits_sprite.scale = new PintarJS.Point(TILE / 64, TILE / 64)
  texto_credits_sprite.position = new PintarJS.Point(OFFX, OFFY)
  pintar.drawSprite(texto_credits_sprite)
}

function drawXtoReallyText () {
  texto_3_sprite.scale = new PintarJS.Point(TILE / 64, TILE / 64)
  texto_3_sprite.position = new PintarJS.Point(OFFX, OFFY)
  pintar.drawSprite(texto_3_sprite)
}

function drawCtoRRText () {
  texto_r_sprite.scale = new PintarJS.Point(TILE / 64, TILE / 64)
  texto_r_sprite.position = new PintarJS.Point(OFFX, OFFY)
  pintar.drawSprite(texto_r_sprite)
}

function drawSkipText () {
  texto_NM_sprite.scale = new PintarJS.Point(TILE / 64, TILE / 64)
  texto_NM_sprite.position = new PintarJS.Point(OFFX, OFFY)
  pintar.drawSprite(texto_NM_sprite)
}

function drawRecapText () {
  texto_recap_sprite.scale = new PintarJS.Point(TILE / 64, TILE / 64)
  texto_recap_sprite.position = new PintarJS.Point(OFFX, OFFY)
  pintar.drawSprite(texto_recap_sprite)
}

function hexToRGB (hex, alpha) {
  var r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16)

  if (alpha !== undefined) {
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')'
  } else {
    return 'rgb(' + r + ', ' + g + ', ' + b + ')'
  }
}


function drawScreen () {
  pintar.startFrame();
  if (level_transition_time > 0.5) {
    let t = (level_transition_time - 0.5) * 2
    let cur_level = levels[cur_level_n]
    drawLevel(cur_level)
    //ctx.fillStyle = COLORS.transition // ctx.fillStyle = COLORS.background; // 'black' floorWin

    let di = levels[next_level].enter[0]
    let dj = levels[next_level].enter[1]
    let x_start = di < 0 ? canvas.width * t : 0
    let x_end = di > 0 ? canvas.width * (1 - t) : canvas.width
    let y_start = dj < 0 ? canvas.height * t : 0
    let y_end = dj > 0 ? canvas.height * (1 - t) : canvas.height
    //ctx.fillRect(x_start, y_start, x_end - x_start, y_end - y_start)

    pintar.drawRectangle(
      new PintarJS.ColoredRectangle(
        new PintarJS.Point(x_start, y_start),
        new PintarJS.Point(x_end - x_start, y_end - y_start),
        PintarJS.Color.fromHex(COLORS.transition), null, true));


  } else if (level_transition_time > 0) {
    turn_time = 1
    let t = level_transition_time * 2
    let cur_level = levels[cur_level_n]
    drawLevel(cur_level)
    //ctx.fillStyle = COLORS.transition // ctx.fillStyle = COLORS.background; // 'black'
    let di = cur_level.enter[0]
    let dj = cur_level.enter[1]
    let x_start = di > 0 ? canvas.width * (1 - t) : 0
    let x_end = di < 0 ? canvas.width * t : canvas.width
    let y_start = dj > 0 ? canvas.height * (1 - t) : 0
    let y_end = dj < 0 ? canvas.height * t : canvas.height

    //ctx.fillRect(x_start, y_start, x_end - x_start, y_end - y_start)
    pintar.drawRectangle(
      new PintarJS.ColoredRectangle(
        new PintarJS.Point(x_start, y_start),
        new PintarJS.Point(x_end - x_start, y_end - y_start),
        PintarJS.Color.fromHex(COLORS.transition), null, true));
  } else {
    let cur_level = levels[cur_level_n]
    drawLevel(cur_level)
  }

  //drawLevel(levels[cur_level_n])
  pintar.endFrame();
}

function drawScreen2 () {
  // ctx.fillStyle = BACKGROUND_IS_WALL ? COLORS.wall : COLORS.floor

  /*entranceGradient = undefined
  entranceGradient2 = undefined
  exitGradient = undefined
  exitGradient2 = undefined*/

  //COLORS.true_background = BACK_COLORS[true_timeline_undos.at(-1) || 0]
  //COLORS.floor = BACK_COLORS[true_timeline_undos.at(-1) || 0]
  playerSpr.colors[0] = UNDO_PLAYER_COLORS[true_timeline_undos.at(-1) || 0]

  ctx.fillStyle = COLORS.true_background
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  if (level_transition_time > 0.5) {
    let t = (level_transition_time - 0.5) * 2
    let cur_level = levels[cur_level_n]
    /* ctx.save()
    ctx.beginPath()
    ctx.rect(OFFX, OFFY, cur_level.w * TILE, cur_level.h * TILE)
    ctx.clip() */
    drawLevel(cur_level)
    // ctx.restore()
    ctx.fillStyle = COLORS.transition // ctx.fillStyle = COLORS.background; // 'black' floorWin

    /*let di = cur_level.exit[0]
    let dj = cur_level.exit[1]*/
    let di = levels[next_level].enter[0]
    let dj = levels[next_level].enter[1]
    let x_start = di < 0 ? canvas.width * t : 0
    let x_end = di > 0 ? canvas.width * (1 - t) : canvas.width
    let y_start = dj < 0 ? canvas.height * t : 0
    let y_end = dj > 0 ? canvas.height * (1 - t) : canvas.height
    ctx.fillRect(x_start, y_start, x_end - x_start, y_end - y_start)
  } else if (level_transition_time > 0) {
    turn_time = 1
    let t = level_transition_time * 2
    let cur_level = levels[cur_level_n]
    /* ctx.save()
    ctx.beginPath()
    ctx.rect(OFFX, OFFY, cur_level.w * TILE, cur_level.h * TILE)
    ctx.clip() */
    drawLevel(cur_level)
    // ctx.restore()
    ctx.fillStyle = COLORS.transition // ctx.fillStyle = COLORS.background; // 'black'
    // console.log("intermediate")
    let di = cur_level.enter[0]
    let dj = cur_level.enter[1]
    let x_start = di > 0 ? canvas.width * (1 - t) : 0
    // let x_end = di < 0 ? canvas.width * (1 - t) : canvas.width;
    let x_end = di < 0 ? canvas.width * t : canvas.width
    let y_start = dj > 0 ? canvas.height * (1 - t) : 0
    let y_end = dj < 0 ? canvas.height * t : canvas.height

    ctx.fillRect(x_start, y_start, x_end - x_start, y_end - y_start)
  } else {
    let cur_level = levels[cur_level_n]
    /* ctx.save()
    ctx.beginPath()
    ctx.rect(OFFX, OFFY, cur_level.w * TILE, cur_level.h * TILE)
    ctx.clip() */
    drawLevel(cur_level)
    // ctx.restore()
    // drawLevel(cur_level)
  }
}

function isDoorOpen (level, chr) {
  let playerState = level.player.history[level.player.history.length - 1]
  let pi = playerState[0]
  let pj = playerState[1]
  return level.buttons.some(([bi, bj, c]) => {
    return c == chr.toLowerCase() && ((pi == bi && pj == bj) || level.crates.some(crate => {
      let state = crate.history[crate.history.length - 1]
      return state[0] == bi && state[1] == bj
    }))
  })
}

function closedDoorAt (level, i, j) {
  let doors = level.doors.filter(([di, dj, c]) => {
    return i == di && j == dj
  })
  return !doors.every(([di, dj, c]) => isDoorOpen(level, c))
}

function openHoleAt (level, i, j) {
  return level.holes.some(([hi, hj]) => {
    return hi == i && hj == j
  }) && !level.crates.some(crate => {
    [ci, cj] = crate.history.at(-1)
    return ci == i && cj == j && crate.inHole.get()
  })
}

function machineAt (level, i, j) {
  return level.machines.find(([mi, mj, c]) => {
    return i == mi && j == mj
  })
}

function neutralTurn (level) {
  [pi, pj] = level.player.history.at(-1)
  level.player.history.push([pi, pj])
  level.player.inmune_history.push(level.player.inmune_history.at(-1))
  level.player.inHole.add()
  player_parity = 1 - player_parity
  /*let last_spr = level.player.inHole.value.at(-1)
  if (last_spr % 2 == 0) {
    last_spr +=1
  } else {
    last_spr -=1
  }
  level.player.inHole.value.push(last_spr)*/
  level.crates.forEach(crate => {
    [ci, cj] = crate.history.at(-1)
    crate.history.push([ci, cj])
    crate.inmune_history.push(crate.inmune_history.at(-1)) // unchecked
    crate.inHole.add()
  })

  fallFlying(level)
}

function isWon (level) {
  /* level.crates.forEach(crate => {

    //drawSpr(crateSpr, state[0], state[1]);
    //ctx.fillText((crate.inmune+1).toString(), state[0]*TILE+OFFX, state[1]*TILE+OFFY);
    result[state[1]][state[0]] += (crate.inmune+1).toString();
    }); */
  /* let crate_positions = level.crates.map(crate => {
    return crate.history[crate.history.length - 1]
  })
  let target_positions = level.targets

  return target_positions.every(([ti, tj]) => {
    return crate_positions.some(([ci, cj]) => {
      return ti == ci && tj == cj
    })
  }) && crate_positions.every(([ci, cj]) => {
    return target_positions.some(([ti, tj]) => {
      return ti == ci && tj == cj
    })
  }) */

  let [pi, pj] = level.player.history.at(-1)
  let [ti, tj] = level.targets[0]
  return pi == ti && pj == tj
}

function getCoveredGoals (level) {
  let crate_positions = level.crates.map(crate => {
    return crate.history[crate.history.length - 1]
  })
  let target_positions = level.targets

  return target_positions.filter(([ti, tj]) => {
    return crate_positions.some(([ci, cj]) => {
      return ti == ci && tj == cj
    })
  })
}

levels = hole_levels_raw.map(([str, enter, exit]) => str2level(str, enter, exit))
levels[0].extraDrawCode = drawIntroText
levels[1].extraDrawCode = drawSecondText
levels[3].extraDrawCode = drawXtoReallyText
levels[5].extraDrawCode = drawSkipText
levels[6].extraDrawCode = drawRecapText
levels[7].extraDrawCode = drawCtoRRText
levels.at(-1).extraDrawCode = drawEndScreen

let cur_level_n = 0
let solved_levels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]

function Movable (i, j, inmune, extra = 0, superSolid = DEFAULT_FORBID_OVERLAP) {
  this.history = [[i, j]]
  this.inmune_history = [inmune]
  this.superSolid = superSolid
  for (let k = 0; k < extra; k++) {
    this.history.push([i, j])
    this.inmune_history.push(inmune)
  }
  this.inHole = new PropertyHistory(false, this.inmune_history, extra)
  // this.inmune = inmune;
}

function geoMapChar(chr) {
  if ('#,.'.indexOf(chr) != -1) return chr
  return '.'
}

function str2level (str, enter, exit) {
  str = str.split('\n')
  let w = str[0].length
  let h = str.length
  let geo = []
  let player
  let crates = []
  let targets = []
  let buttons = []
  let doors = []
  let player_target = null
  let machines = []
  let holes = []
  for (let j = 0; j < h; j++) {
    let row = []
    for (let i = 0; i < w; i++) {
      let chr = str[j][i] // .toUpperCase();
      // row.push(chr == '#')
      /*if (chr == '#') {
        row.push(1)
        continue
      } else if (chr == ',') {
        row.push(2)
        continue
      } else if ('┌────┐┌┘│├─╷│'.indexOf(chr) != -1) {
        row.push(chr)
      }
      else {
        row.push(0)
      }*/
      let geoChar = chr

      if (chr == '.' || chr == '#' || chr == ',') {

      } else if (chr == 'O' || chr == '@') {
        player = new Movable(i, j, DEFAULT_PLAYER_INMUNE_LEVEL)
        if (chr == '@') targets.push([i, j])
        geoChar = '.'
      } else if (chr == '*') {
        targets.push([i, j])
        geoChar = '.'
      } else if (chr >= '1' && chr <= '9') {
        crates.push(new Movable(i, j, chr - '1'))
        geoChar = '.'
      /*} else if (chr >= 'A' && chr <= 'I') {
        crates.push(new Movable(i, j, chr.charCodeAt(0) - 'A'.charCodeAt(0)))
        targets.push([i, j])
        geoChar = '.'
      } else if (chr >= 'p' && chr <= 'z') {
        buttons.push([i, j, chr])
        geoChar = '.'
      } else if (chr >= 'P' && chr <= 'Z') {
        doors.push([i, j, chr])
        geoChar = '.'
      } else if (chr == '!') {
        player_target = [i, j]
        geoChar = '.'
      } else if ('JKLMN'.indexOf(chr) != -1) {
        machines.push([i, j, 'JKLMN'.indexOf(chr) + 1])
        geoChar = '.'*/
      } else if (chr == '_') {
        holes.push([i, j])
        geoChar = '.'
      } else if (chr == '-') {
        holes.push([i, j])
        targets.push([i, j])
        geoChar = '.'
      }

      row.push(geoChar)
    }
    geo.push(row)
  }
  let level = { geo: geo, player: player, crates: crates, targets: targets, buttons: buttons, doors: doors, player_target: player_target, machines: machines, holes: holes, w: w, h: h, enter: enter, exit: exit }
  /* neutralTurn(level);
  level.player.history[0][0] -= enter[0];
  level.player.history[0][1] -= enter[1]; */

  /* level.crates.forEach(crate => {
    crate.history.splice(1)
    crate.inmune_history.splice(1)
    crate.inHole.value.splice(1)
  })
  level.player.history.splice(1)
  level.player.inmune_history.splice(1) */
  level.player.inHole.value[0] = dir2spr(level.enter[0], level.enter[1], false)
  return level
}

function dir2spr(di, dj, pushing) {
  if (di == 0) {
    return 1 + dj + (pushing ? 8 : 0)
  } else {
    return 5 + di + (pushing ? 8 : 0)
  }
}

let true_timeline_undos = []

let HALT = false

window.addEventListener('resize', e => {
  //canvas.width = innerWidth
  //canvas.height = innerHeight
  //pintar.resizeAndCenter(64, 64);
  setTimeout(recalcTileSize, 100);
  //if (in_last_level) drawScreen()
})

window.addEventListener('load', e => {
  loadLevel(0) // 152 159 60
  window.dispatchEvent(new Event('resize'))
  setTimeout(function(){ window.dispatchEvent(new Event('resize')) }, 100);
  window.requestAnimationFrame(draw)
})

function get_times_directions (tick) {
  tick += 1
  // console.log("trying to get tick: ", tick)
  let res = [1, 1, 1, 1, 1]
  if (tick <= 0) {
    // console.log("that's before time!");
    // return res;
  } else if (tick > true_timeline_undos.length) {
    // console.log("that's the far future!")
    // return res;
  } else if (true_timeline_undos[tick - 1] == 0) {
    // console.log("that's a good-ol-regular tick.")
    // return res;
  } else {
    let cur_depth = true_timeline_undos[tick - 1]
    for (let k = 0; k < cur_depth; k++) {
      res[k] = -1
    }
    let destination = do_local_travel(tick)
    let destination_directions = get_times_directions(destination)
    for (let k = 0; k < 5; k++) {
      res[k] *= destination_directions[k]
    }
  } return res
}

function get_timeline_length (tick, max_inmune_to) {
  // extremely wrong, lol
  let res = 1
  for (let i = 0; i < tick; i++) {
    // console.log("iteration i: ", i);
    let dirs = get_times_directions(i)
    res += dirs[max_inmune_to]
    /* if (true_timeline_undos[i] > max_inmune_to) {
      res -= 1;
    } else {
      res += 1;
    } */
  }
  return res
}

function do_local_travel (tick) {
  let travel_depth = true_timeline_undos[tick - 1]
  if (travel_depth === 0 || travel_depth === undefined) {
    return tick
  }
  let counter = 1
  let res = tick - 1
  while (counter > 0) {
    let cur_depth = true_timeline_undos[res - 1]
    if (cur_depth == travel_depth) {
      counter += 1
      res -= 1
    } else if (cur_depth < travel_depth || cur_depth === undefined) {
      counter -= 1
      res -= 1
    } else {
      // higher level travel over here!
      res = do_local_travel(res)
    }
  }
  return res
}

function get_original_tick (tick, max_inmune_to) {
  // for an object inmune to max_inmune levels of time travel,
  // when the real time is "tick", get the last real tick where
  // their free will was executed. Without time travel, it would
  // always be cur_tick itself; in Braid, for green objects, which
  // have max_inmune = 1, it will always be cur_tick (if there hasn't
  // been a "real undo") (or level 2, at least)

  if (tick <= 0) {
    // console.log("that's before time!");
    return tick
  } else if (tick > true_timeline_undos.length) {
    // console.log("that's the far future!")
    return tick
  } else if (true_timeline_undos[tick - 1] <= max_inmune_to) {
    // console.log("that's a good-ol-regular tick.")
    return tick
  } else {
    let travel_depth = true_timeline_undos[tick - 1]
    let counter = 1
    let res = tick - 1
    while (counter > 0 && res > 0) {
      let cur_depth = true_timeline_undos[res - 1]
      if (cur_depth == travel_depth) {
        counter += 1
        res -= 1
      } else if (cur_depth < travel_depth) {
        counter -= 1
        res -= 1
      } else {
        // higher level travel over here!
        res = get_original_tick(res, max_inmune_to)
      }
    }
    // console.log("time traveling to: ", res)
    return res
  }
}

function get_original_tick_2 (tick, inmune_history) {
  return get_original_tick(tick, inmune_history.at(-1))
}

function level2str (level) {
  let res = []
  let [pi, pj] = level.player.history.at(-1)
  for (let j = 0; j < level.h; j++) {
    let row = []
    for (let i = 0; i < level.w; i++) {
      if (level.geo[j][i]) {
        row.push('#')
      } else if (openHoleAt(level, i, j)) {
        row.push('_')
      } else {
        let isPlayer = i == pi && j == pj
        let isTarget = level.targets.some(([ti, tj]) => {
          return ti == i && tj == j
        })
        let cur = isPlayer ? (isTarget ? '@' : 'O') : (isTarget ? '*' : '.')
        row.push(cur)
      }
    }
    res.push(row)
  }
  level.machines.forEach(([i, j, l]) => {
    res[j][i] = 'JKLMN'[l - 1]
  })

  level.crates.forEach(crate => {
    let [ci, cj] = crate.history.at(-1)
    let n = crate.inmune_history.at(-1)
    let cur = res[cj][ci]
    res[cj][ci] = cur == '.' ? '123456789'[n] : 'ABCDEFGHI'[n]
  })
  return res.map(x => x.join('')).join('\n')
}

function loadFromText () {
  levels[cur_level_n] = str2level(document.getElementById('inText').value)
  loadLevel(cur_level_n)
}
function exportToText () {
  document.getElementById('inText').value = level2str(levels[cur_level_n])
}

function resizeLevel (a, b, c, d) {
  exportToText()
  let w = levels[cur_level_n].w
  let h = levels[cur_level_n].h
  let text = document.getElementById('inText').value
  let rows = text.split('\n')
  if (a > 0) {
    rows.unshift('.'.repeat(w))
  } else if (a < 0) {
    rows.shift()
  }
  if (b > 0) {
    rows = rows.map(row => '.' + row)
  } else if (b < 0) {
    rows = rows.map(row => row.slice(1))
  }
  if (c > 0) {
    rows.push('.'.repeat(w))
  } else if (c < 0) {
    rows.pop()
  }
  if (d > 0) {
    rows = rows.map(row => row + '.')
  } else if (d < 0) {
    rows = rows.map(row => row.slice(0, -1))
  }
  text = rows.join('\n')
  document.getElementById('inText').value = text
  loadFromText()
}

function resetLevel () {
  restartSound.play()
  loadLevel(cur_level_n)
}

function prevLevel () {
  if (cur_level_n > 0) {
    cur_level_n -= 1
    loadLevel(cur_level_n)
  }
}

function nextLevel () {
  if (cur_level_n < levels.length - 1) {
    cur_level_n += 1
    loadLevel(cur_level_n)
  } /*else {
    in_last_level = true
    recalcTileSize()
  }*/
}

function initTransitionToNextLevel () {
  if (cur_level_n < levels.length - 1) {
    level_transition_time = 1
    transitionSound.play()
    screen_transition_turn = true
    next_level = cur_level_n + 1
  }
}

function initTransitionToPrevLevel () {
  if (cur_level_n > 0) {
    level_transition_time = 1
    transitionSound.play()
    screen_transition_turn = true
    next_level = cur_level_n - 1
  }
}

function loadLevel (n) {
  won_cur_level = false
  in_last_level = n == levels.length - 1
  cur_level_n = n
  true_timeline_undos = []
  input_queue = []
  let cur_level = levels[cur_level_n]
  cur_level.crates.forEach(crate => {
    crate.history.splice(1)
    crate.inmune_history.splice(1)
    crate.inHole.value.splice(1)
  })
  cur_level.player.history.splice(1)
  cur_level.player.inmune_history.splice(1)
  cur_level.player.inHole.value.splice(1)
  cur_level.player.inHole.value[0] = dir2spr(cur_level.enter[0], cur_level.enter[1], false) + player_parity
  recalcTileSize()
  turn_time = 1
  /* let undoButtons = document.getElementById("footer").children;
  if (n == 1) {
    undoButtons[1].style.display = '';
  } else if (n == 4) {
    undoButtons[2].style.display = '';
  } */

  if (n >= 2) ENABLE_RESTART = true
  if (n >= 3) ENABLE_UNDO_2 = true
  if (n >= 7) ENABLE_UNDO_3 = true
}

function recalcTileSize (level) {
  /*if (in_last_level) {
    let tile_w = Math.min(canvas.width / (12), 60)
    let tile_h = Math.min(canvas.height / (12), 60)
    TILE = Math.floor(Math.min(tile_h, tile_w))
    OFFX = Math.floor((canvas.width - (TILE * 12)) / 2)
    OFFY = Math.floor((canvas.height - (TILE * 12)) / 2)
    return
  }*/
  if (!level) level = levels[cur_level_n]
  // let tile_w = Math.min(canvas.width / (level.w), 64)
  // let tile_h = Math.min(canvas.height / (level.h), 64)
  let tile_w = Math.floor(canvas.width / (level.w * 1)) * 1
  let tile_h = Math.floor(canvas.height / (level.h * 1)) * 1
  // let tile_w = Math.floor(canvas.width / (level.w * 16)) * 16
  // let tile_h = Math.floor(canvas.height / (level.h * 16)) * 16

  //console.log(tile_w, tile_h);
  // tile_w = Math.min(tile_w, 64)
  // tile_h = Math.min(tile_h, 64)
  // let tile_w = 32
  // let tile_h = 32
  TILE = Math.floor(Math.min(tile_h, tile_w))
  OFFX = Math.floor((canvas.width - (TILE * level.w)) / 2)
  OFFY = Math.floor((canvas.height - (TILE * level.h)) / 2)
  entranceGradient = undefined
  entranceGradient2 = undefined
  exitGradient = undefined
  exitGradient2 = undefined
}

function doUndo (n) {
  input_queue.push(n.toString())
}

function getKeyRetriggerTime (key) {
  if ('123456789'.indexOf(key) != -1) return first_undo_press ? KEY_RETRIGGER_TIME * 1.2 : KEY_RETRIGGER_TIME / 2
  // if ('wasd'.indexOf(key) != -1) return TURN_SPEED * 1000;
  if (key == 'z' || key == 'x' || key == 'c') return first_undo_press ? KEY_RETRIGGER_TIME * 1.2 : KEY_RETRIGGER_TIME / 2
  //return first_key_press ? KEY_RETRIGGER_TIME * 1.2 : KEY_RETRIGGER_TIME / 2
  return Infinity
}

function fallFlying (level) {
  // drop crates over holes
  let flying_crates = level.crates.filter(crate => {
    let [ci, cj] = crate.history.at(-1)
    return openHoleAt(level, ci, cj)
    // return !crate.inHole.get() &&
  })
  // console.log('flying crates: ', flying_crates);
  flying_crates.forEach(crate => {
    crate.inHole.value[crate.inHole.value.length - 1] = true
  })
  if (flying_crates.length > 0) holeSound.play()
}

function movesBackToEntrance (level, pi, pj, cur_di, cur_dj) {
  let [si, sj] = level.player.history[0]
  return pi == si && pj == sj && cur_di == -level.enter[0] && cur_dj == -level.enter[1]
}

function draw (timestamp) {
  if (!last_t) last_t = timestamp
  globalT += timestamp - last_t
  last_t = timestamp
  // ctx.clearRect(0, 0, canvas.width, canvas.height);
  // ctx.fillStyle = ALLOW_EDITOR ? COLORS.floorWin : COLORS.background // #75366D
  // ctx.fillStyle = COLORS.background // #75366D
  // ctx.fillRect(0, 0, canvas.width, canvas.height)

  /*if (in_last_level) {
    level_transition_time -= TURN_SPEED * 0.1
    level_transition_time = Math.max(level_transition_time, 0)
    drawScreen()
    // console.log();
    // return
    if (level_transition_time > 0) {
      window.requestAnimationFrame(draw)
    } else {
      // console.log("done");
    }
    return
  }*/

  let now = Date.now()
  Object.keys(keyboard_last_pressed).forEach(key => {
    if (keyboard_last_pressed[key] === null) return
    // if (now - keyboard_last_pressed[key] > KEY_RETRIGGER_TIME) {
    if (now - keyboard_last_pressed[key] > getKeyRetriggerTime(key)) {
      input_queue.push(key)
      keyboard_last_pressed[key] = now
      first_undo_press = false
    }
  })

  //console.log(first_undo_press)

  let cur_level = levels[cur_level_n]

  let starts_won = isWon(cur_level)
  // console.log(turn_time);
  if (turn_time > 0) {
    turn_time -= TURN_SPEED
    if (turn_time <= 0 && screen_transition_turn) {
      // time to end the level transition
      screen_transition_turn = false
      // level_transition_time = 1
      // nextLevel()
    }
    turn_time = Math.max(turn_time, 0)
  }
  if (level_transition_time > 0) {
    // console.log("in transition");
    let starts_above_half = level_transition_time > 0.5
    level_transition_time -= TRANSITION_SPEED //TURN_SPEED * 0.1
    let ends_below_half = level_transition_time <= 0.5
    if (starts_above_half && ends_below_half) {
      //nextLevel()
      //console.log("gonna load: ", next_level);
      loadLevel(next_level)
    }
    // if (level_transition_time <= 0) nextLevel();
    level_transition_time = Math.max(level_transition_time, 0)
  }
  if (intro_time > 0 && true_timeline_undos.length > 0) {
    intro_time -= TRANSITION_SPEED //TURN_SPEED * 0.1
    intro_time = Math.max(intro_time, 0)
  }
  if (turn_time == 0 && !in_last_level) {
    /* let cur_undo = 0;
    for (let i = 1; i < 10; i++) {
      if (isKeyDown(i.toString())) cur_undo = i;
    } */

    // if (input_queue.length == 0 && cur_undo == 0) {
    if (input_queue.length == 0) {
    // if (cur_undo == 0 && cur_di == 0 && cur_dj == 0 && !magic_stuff_input && !machine_input) {
      // nothing happened
    } else {
      let pressed_key = input_queue.shift()
      let cur_undo = 0
      for (let i = 1; i < 10; i++) {
        if (pressed_key == i.toString()) cur_undo = i
      }
      let cur_di = 0
      let cur_dj = 0
      if (pressed_key == ('a')) cur_di -= 1
      if (pressed_key == ('d')) cur_di += 1
      if (pressed_key == ('w')) cur_dj -= 1
      if (pressed_key == ('s')) cur_dj += 1

      let magic_stuff_input = pressed_key == 'e' && ALLOW_MAGIC_INPUT
      let machine_input_back = pressed_key == 'z' && ALLOW_MACHINES
      let machine_input_front = pressed_key == 'x' && ALLOW_MACHINES
      let machine_input = machine_input_back || machine_input_front

      let SKIP_TURN = false
      let SKIPPED_TURN = false

      let covered_goals = getCoveredGoals(cur_level)

      if (machine_input) {
        console.log('machine input')
        if (using_machine_type === null) {
          [pi, pj] = cur_level.player.history.at(-1)
          let machine = machineAt(cur_level, pi, pj)
          if (machine === undefined || machine_input_front) {
            // ignore this turn
            SKIP_TURN = true
          } else {
            console.log('using a machine')
            using_machine_type = machine[2]
            cur_undo = machine_input_back ? using_machine_type : 9
          }
        } else {
          cur_undo = machine_input_back ? using_machine_type : 9
        }
      } else {
        using_machine_type = null
      }

      true_timeline_undos.push(cur_undo)
      turn_time = 1

      let real_tick = true_timeline_undos.length

      let stuff = get_timeline_length(real_tick, 0)
      // console.log("stuff is ", stuff)
      if (stuff < 1 || SKIP_TURN) {
        true_timeline_undos.pop() // undo this turn
        turn_time = 0
        SKIPPED_TURN = true
      } else {
        // console.log("doing a turn");
        // travels = generate_travels(true_timeline_undos);

        player_tick = get_original_tick_2(real_tick, cur_level.player.inmune_history) // player isn't inmune to any undo level
        // console.log(player_tick);
        if (player_tick < 0) {
          console.log('NEVER HAPPENS')
          true_timeline_undos.pop() // undo this turn
          turn_time = 0
          SKIPPED_TURN = true
        } else {
          // if (cur_level.player.history[player_tick] !== undefined) { // player is undoing
          if (cur_undo > 0) {
            if (undoSounds[cur_undo - 1]) undoSounds[cur_undo - 1].play()
            if (cur_level.player.history[player_tick] !== undefined) { // player is being undoed
              [i, j] = cur_level.player.history[player_tick]
              cur_level.player.history[real_tick] = [i, j]
              cur_level.player.inmune_history[real_tick] = cur_level.player.inmune_history[player_tick]
              cur_level.player.inHole.value[real_tick] = cur_level.player.inHole.value[player_tick]
              player_parity = 1 - player_parity
            } else { // player is inmune to this undo level
              [i, j] = cur_level.player.history[real_tick - 1]
              cur_level.player.history[real_tick] = [i, j]
              cur_level.player.inmune_history[real_tick] = cur_level.player.inmune_history[real_tick - 1]
              cur_level.player.inHole.value[real_tick] = cur_level.player.inHole.value[real_tick - 1]
              player_parity = 1 - player_parity
            }
            cur_level.crates.forEach(crate => {
              let crate_tick = get_original_tick_2(real_tick, crate.inmune_history)
              if (crate.history[crate_tick] !== undefined) {
                [i, j] = crate.history[crate_tick]
                crate.history[real_tick] = [i, j]
                crate.inmune_history[real_tick] = crate.inmune_history[crate_tick] // unchecked
                crate.inHole.value[real_tick] = crate.inHole.value[crate_tick] // unchecked
              } else {
                [i, j] = crate.history[real_tick - 1]
                crate.history[real_tick] = [i, j]
                crate.inmune_history[real_tick] = crate.inmune_history[real_tick - 1] // unchecked
                crate.inHole.value[real_tick] = crate.inHole.value[real_tick - 1]
              }
            })
            if (KEEP_UNDOING_UNTIL_CRATE_MOVE) {
              let boxes_moved = cur_level.crates.some(crate => {
                let [ci1, cj1] = crate.history.at(-1)
                let [ci2, cj2] = crate.history.at(-2)
                return ci1 != ci2 || cj1 != cj2
              })
              if (!boxes_moved) input_queue.push(cur_undo.toString())
            }
          } else if (magic_stuff_input) {
            neutralTurn(cur_level)
            cur_level.player.inmune_history[real_tick] = 2 // magic!
          } else if (starts_won && cur_di == cur_level.exit[0] && cur_dj == cur_level.exit[1]) {
            // player exited the level
            // nextLevel();
            initTransitionToNextLevel()
            won_cur_level = true
            /* transitionSound.play();
            screen_transition_turn = true
            level_transition_time = 1 */
            turn_time = 1
            neutralTurn(cur_level);
            [pi, pj] = cur_level.player.history.at(-1)
            cur_level.player.history[real_tick] = [pi + cur_di, pj + cur_dj]
            //cur_level.player.history[real_tick] = [pi + cur_di*2, pj + cur_dj*2]
          } else { // player did an original move
            [pi, pj] = cur_level.player.history[real_tick - 1]
            let bad_move = (pi + cur_di < 0) || (pi + cur_di >= cur_level.w) ||
              (pj + cur_dj < 0) || (pj + cur_dj >= cur_level.h) ||
              (cur_level.geo[pj + cur_dj][pi + cur_di] != '.') ||
              closedDoorAt(cur_level, pi + cur_di, pj + cur_dj) ||
              openHoleAt(cur_level, pi + cur_di, pj + cur_dj) ||
              movesBackToEntrance(cur_level, pi, pj, cur_di, cur_dj)
            // console.log(bad_move);
            if (bad_move) { // ignore this move
              wallSound.play()
              true_timeline_undos.pop()
              turn_time = 0
              SKIPPED_TURN = true
            } else {
              /* let pushing_crate = cur_level.crates.findIndex(crate => {
                [ci, cj] = crate.history[crate.history.length - 1];
                return ci == pi + cur_di && cj == pj + cur_dj && !crate.inHole.get();
              }); */
      			  let pushing_crates = cur_level.crates.reduce((acc, crate, index) => {
                [ci, cj] = crate.history[crate.history.length - 1]
                if (ci == pi + cur_di && cj == pj + cur_dj && !crate.inHole.get()) acc.push(index)
                        				return acc
              }, [])
			  // console.log(pushing_crates);
              if (pushing_crates.length > 0) { // trying to push a crate
                let next_space_i = pi + cur_di * 2
                let next_space_j = pj + cur_dj * 2
                let occupied_by_wall = (cur_level.geo[next_space_j][next_space_i] != '.') || closedDoorAt(cur_level, next_space_i, next_space_j)
                if (!ALLOW_CRATE_ON_TOP_OF_MACHINE) {
                  occupied_by_wall = occupied_by_wall || machineAt(cur_level, next_space_i, next_space_j)
                }
                if (occupied_by_wall) { // ignore this move
                  if (ALLOW_CHANGE_PLAYER) {
                    // Change inmunity of player!!
					          // arbitrary choice when pushing several crates, oops.
                    let pushing_inmune = cur_level.crates[pushing_crates[0]].inmune_history[real_tick - 1]
                    let player_inmune = cur_level.player.inmune_history[real_tick - 1]
                    if (player_inmune != pushing_inmune) {
                      neutralTurn(cur_level)
                      cur_level.player.inmune_history[real_tick] = pushing_inmune
                    } else { // ignore this move
                      true_timeline_undos.pop()
                      turn_time = 0
                      SKIPPED_TURN = true
                    }
                  } else {
                    wallSound.play()
                    true_timeline_undos.pop()
                    turn_time = 0
                    SKIPPED_TURN = true
                  }
                } else {
                  let occupied_by_hole = openHoleAt(cur_level, next_space_i, next_space_j)

                  if (occupied_by_hole) {
                    holeSound.play()
                    neutralTurn(cur_level)
                    cur_level.player.history[real_tick] = [pi + cur_di, pj + cur_dj]
                    //let parity = 1 - cur_level.player.inHole.value[real_tick-1] % 2
                    cur_level.player.inHole.value[real_tick] = dir2spr(cur_di, cur_dj, true) + player_parity
                    pushing_crates.forEach(pushing_crate => {
          						cur_level.crates[pushing_crate].history[real_tick] = [next_space_i, next_space_j]
          						cur_level.crates[pushing_crate].inHole.value[real_tick] = true
          					})
                  } else {
                    let occupied_by_crate = cur_level.crates.findIndex(crate => {
                      [ci, cj] = crate.history[crate.history.length - 1]
                      return ci == next_space_i && cj == next_space_j && !crate.inHole.get()
                    })
                    if (occupied_by_crate != -1) {
                      if (ALLOW_CHANGE_CRATES) {
                        // Change inmunity of pushed crate!!
                        // arbitrary choice when pushing several crates, oops.
                        let pushing_inmune = cur_level.crates[pushing_crates[0]].inmune_history[real_tick - 1]
                        let pushed_inmune = cur_level.crates[occupied_by_crate].inmune_history[real_tick - 1]
                        if (pushing_inmune != pushed_inmune) {
                          // but first, the neutral turn stuff
                          neutralTurn(cur_level)
                          cur_level.crates[occupied_by_crate].inmune_history[real_tick] = pushing_inmune
                        } else { // ignore this move
                          true_timeline_undos.pop()
                          turn_time = 0
                          SKIPPED_TURN = true
                        }
                      } else {
                        wallSound.play()
                        true_timeline_undos.pop() // ignore this move
                        turn_time = 0
                        SKIPPED_TURN = true
                      }
                    } else {
                      pushSound.play()
                      neutralTurn(cur_level)
                      cur_level.player.history[real_tick] = [pi + cur_di, pj + cur_dj]
                      //let parity = 1 - cur_level.player.inHole.value[real_tick-1] % 2
                      cur_level.player.inHole.value[real_tick] = dir2spr(cur_di, cur_dj, true) + player_parity
          					  pushing_crates.forEach(pushing_crate => {
  						          cur_level.crates[pushing_crate].history[real_tick] = [next_space_i, next_space_j]
          					  })
          					  //console.log(pushing_crates)
                    }
                  }
                }
              } else {
                stepSound.play()
                neutralTurn(cur_level)
                cur_level.player.history[real_tick] = [pi + cur_di, pj + cur_dj]
                //let parity = 1 - cur_level.player.inHole.value[real_tick-1] % 2
                cur_level.player.inHole.value[real_tick] = dir2spr(cur_di, cur_dj, false) + player_parity
              }
            }
          }
        }
      }

      let covered_goals_late = getCoveredGoals(cur_level)
      if (covered_goals_late.some(n => {
        return covered_goals.indexOf(n) == -1
      })) goalSound.play();

      // forbidden_overlap stuff
      [pi, pj] = cur_level.player.history.at(-1)
      let forbidden_overlap = cur_level.crates.some((crate, i) => {
        // TODO: add hole support ?? already done, maybe
        if (crate.superSolid) {
          if (crate.inHole.get()) {
            // overlaps with a crate outside the hole?
            let [c1i, c1j] = crate.history.at(-1)
            return cur_level.crates.some((crate2, j) => {
              if (i == j) return false
              let [c2i, c2j] = crate2.history.at(-1)
              return c2i == c1i && c2j == c1j && crate2.inHole.get()
            })
          } else {
            // overlaps with a crate outside a hole?
            let [c1i, c1j] = crate.history.at(-1)
            return (c1i == pi && c1j == pj) || cur_level.crates.some((crate2, j) => {
              if (i == j) return false
              let [c2i, c2j] = crate2.history.at(-1)
              return c2i == c1i && c2j == c1j && !crate2.inHole.get()
            })
          }
        } else {
          return false
        }
      })

      if (forbidden_overlap) {
        // TODO: add hole support
        // forget last move
        true_timeline_undos.pop()
        turn_time = 0
        SKIPPED_TURN = true
        cur_level.player.history.pop()
        cur_level.player.inmune_history.pop()
        cur_level.crates.forEach(crate => {
          crate.history.pop()
          crate.inmune_history.pop()
          crate.inHole.value.pop()
        })
      }

      /* if (!SKIPPED_TURN && cur_undo == 0) {
        // drop crates over holes
        let flying_crates = cur_level.crates.filter(crate => {
          let [ci, cj] = crate.history.at(-1)
          return openHoleAt(cur_level, ci, cj)
          // return !crate.inHole.get() &&
        })
        // console.log('flying crates: ', flying_crates);
        flying_crates.forEach(crate => {
          crate.inHole.value[crate.inHole.value.length - 1] = true
        })
        if (flying_crates.length > 0) holeSound.play()
      } */
    }
  }

  if (ALLOW_EDITOR) {
    // EDITOR
    let mi = Math.round((mouse.x - OFFX) / TILE - 0.5)
    let mj = Math.round((mouse.y - OFFY) / TILE - 0.5)
    if (mi >= 0 && mi < cur_level.w && mj >= 0 && mj < cur_level.h) {
      if (isButtonDown(0)) {
        cur_level.geo[mj][mi] = true
      } else if (isButtonDown(1)) {
        cur_level.geo[mj][mi] = false
        cur_level.holes = cur_level.holes.filter(([i, j]) =>	i != mi || j != mj)
        cur_level.targets = cur_level.targets.filter(([i, j]) =>	i != mi || j != mj)
        cur_level.crates = cur_level.crates.filter(crate =>	{
          let [i, j] = crate.history.at(-1)
          return i != mi || j != mj
        })
        cur_level.machines = cur_level.machines.filter(([i, j, t]) =>	i != mi || j != mj)
      } else if (wasKeyPressed('f')) {
        cur_level.crates.push(new Movable(mi, mj, 0, extra = true_timeline_undos.length))
      } else if (wasKeyPressed('g')) {
        cur_level.crates.push(new Movable(mi, mj, 1, extra = true_timeline_undos.length))
      } else if (wasKeyPressed('c')) {
        cur_level.crates.push(new Movable(mi, mj, 2, extra = true_timeline_undos.length))
      } else if (wasKeyPressed('v')) {
        cur_level.crates.push(new Movable(mi, mj, 3, extra = true_timeline_undos.length))
      } else if (wasKeyPressed('p')) {
        cur_level.buttons.push([mi, mj, 'p'])
      } else if (wasKeyPressed('P')) {
        cur_level.doors.push([mi, mj, 'P'])
      } else if (wasKeyPressed('q')) {
        cur_level.targets.push([mi, mj])
      } else if (wasKeyPressed('e')) {
        cur_level.holes.push([mi, mj])
      } else if (wasKeyPressed('i')) { // level sizing (smaller)
        resizeLevel(1, 0, 0, 0)
      } else if (wasKeyPressed('j')) {
        resizeLevel(0, 1, 0, 0)
      } else if (wasKeyPressed('k')) {
        resizeLevel(0, 0, 1, 0)
      } else if (wasKeyPressed('l')) {
        resizeLevel(0, 0, 0, 1)
      } else if (wasKeyPressed('I')) { // level sizing (bigger)
        resizeLevel(-1, 0, 0, 0)
      } else if (wasKeyPressed('J')) {
        resizeLevel(0, -1, 0, 0)
      } else if (wasKeyPressed('K')) {
        resizeLevel(0, 0, -1, 0)
      } else if (wasKeyPressed('L')) {
        resizeLevel(0, 0, 0, -1)
      } else if (wasKeyPressed('b')) { // undo machines
        cur_level.machines.push([mi, mj, 1])
      } else if (wasKeyPressed('n')) {
        cur_level.machines.push([mi, mj, 2])
      } else if (wasKeyPressed('m')) {
        cur_level.machines.push([mi, mj, 3])
      }
    }
  }

  let is_won = isWon(cur_level)
  if (is_won) {
    if (solved_levels.indexOf(cur_level_n) == -1) solved_levels.push(cur_level_n)

    /* ctx.fillStyle = COLORS.floorWin // "#437737";
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'black' */

    // if (!starts_won) winSound.play()

    /* if (wasKeyPressed(' ') && cur_level_n < levels.length - 1) {
      // loadLevel(cur_level_n + 1);
      nextLevel()
      cur_level = levels[cur_level_n]
    } */
  }

  if (wasKeyPressed('r') && !in_last_level) {
    resetLevel()
    // loadLevel(cur_level_n);
    cur_level = levels[cur_level_n]
  }

  // cheat
  if (wasKeyPressed('m') && cur_level_n < levels.length - 1) {
    //nextLevel()
    //cur_level = levels[cur_level_n]
    if (level_transition_time == 0) {
      initTransitionToNextLevel()
    }
  }
  if (wasKeyPressed('n') && cur_level_n > 0) {
    //prevLevel()
    //cur_level = levels[cur_level_n]
    if (level_transition_time == 0) {
      initTransitionToPrevLevel()
    }
  }

  // drawLevel(cur_level)
  drawScreen()

  /* if (wasButtonPressed(0)) console.log("0 pressed");
  if (isButtonDown(0)) console.log("0 down");
  if (wasButtonReleased(0)) console.log("0 unpressed");

  if (wasKeyPressed('a')) console.log("a pressed");
  if (isKeyDown('a')) console.log("a down");
  if (wasKeyReleased('a')) console.log("a unpressed"); */
  // if (wasKeyPressed('q')) HALT = true;

  mouse_prev = Object.assign({}, mouse)
  mouse.wheel = 0
  keyboard_prev = Object.assign({}, keyboard)
  if (!HALT) window.requestAnimationFrame(draw)
}

/*window.addEventListener('mousemove', e => _mouseEvent(e))
window.addEventListener('mousedown', e => _mouseEvent(e))
window.addEventListener('mouseup', e => _mouseEvent(e))*/
// document.onContextMenu = e => e.preventDefault();

function _mouseEvent (e) {
  mouse.x = e.clientX
  mouse.y = e.clientY
  mouse.buttons = e.buttons
  if (!ALLOW_EDITOR) e.preventDefault()
  return false
}

/*window.addEventListener('wheel', e => {
  let d = e.deltaY > 0 ? 1 : -1
  return mouse.wheel = d
})*/

let mouse = { x: 0, y: 0, buttons: 0, wheel: 0 }
let mouse_prev = Object.assign({}, mouse)

function isButtonDown (b) {
  return (mouse.buttons & (1 << b)) != 0
}

function wasButtonPressed (b) {
  return ((mouse.buttons & (1 << b)) !== 0) && ((mouse_prev.buttons & (1 << b)) === 0)
}

function wasButtonReleased (b) {
  return ((mouse.buttons & (1 << b)) === 0) && ((mouse_prev.buttons & (1 << b)) !== 0)
}

let keyboard = {}
let keyboard_prev = {}
let keyboard_last_pressed = {}

function keyMap (e) {
  // use key.code if key location is important
  if (e.metaKey) return '.'
  if (ALLOW_EDITOR) return e.key
  if (e.key == 'ArrowLeft') return 'a'
  if (e.key == 'ArrowRight') return 'd'
  if (e.key == 'ArrowDown') return 's'
  if (e.key == 'ArrowUp') return 'w'
  if (e.key == 'z') return '1'
  if (e.key == 'x') return ENABLE_UNDO_2 ? '2' : '.'
  if (e.key == 'c') return ENABLE_UNDO_3 ? '3' : '.'
  if (e.key == 'r') return ENABLE_RESTART ? 'r' : '.'
  // return '.'
  return e.key.toLowerCase()
}

window.addEventListener('keydown', e => {
  if (e.repeat) return

  let k = keyMap(e)
  if ('wasdzx123456789'.indexOf(k) != -1) input_queue.push(k)
  keyboard[k] = true
  keyboard_last_pressed[k] = Date.now()
  if (k == '1' || k == '2' || k == '3') first_undo_press = true
  first_key_press = true

  e.preventDefault()
  return false;
})

window.addEventListener('keyup', e => {
  let k = keyMap(e)
  keyboard[k] = false
  keyboard_last_pressed[k] = null
  first_undo_press = false
  first_key_press = false

  e.preventDefault()
  return false;
})

function isKeyDown (k) {
  return keyboard[k] || false
}

function wasKeyPressed (k) {
  let queue_pos = input_queue.findIndex(n => n == k)
  if (queue_pos == -1) return (keyboard[k] || false) && (!keyboard_prev[k] || false)
  input_queue.splice(queue_pos, 1)
  return true
}

function wasKeyReleased (k) {
  return (!keyboard[k] || false) && (keyboard_prev[k] || false)
}

document.addEventListener('swiped', function (e) {
  let dir2key = { 'left': 'a', 'right': 'd', 'up': 'w', 'down': 's' }
  let key = dir2key[e.detail.dir]
  input_queue.push(key)
  // alert(e.detail.dir); // swipe direction
})

// utility functions
function mod (n, m) {
  return ((n % m) + m) % m
}

function lerp (a, b, t) {
  return a * (1 - t) + b * t
}
