// @ts-nocheck

// let canvasTxt = window.canvasTxt.default

function at(n) {
	// ToInteger() abstract op
	n = Math.trunc(n) || 0;
	// Allow negative indexing from the end
	if (n < 0) n += this.length;
	// OOB access is guaranteed to return undefined
	if (n < 0 || n >= this.length) return undefined;
	// Otherwise, this is just normal property access
	return this[n];
}

const TypedArray = Reflect.getPrototypeOf(Int8Array);
for (const C of [Array, String, TypedArray]) {
    Object.defineProperty(C.prototype, "at",
                          { value: at,
                            writable: true,
                            enumerable: false,
                            configurable: true });
}

let pintar = new PintarJS()
pintar.clearColor = PintarJS.Color.fromHex('4e4e4e') // F7A36B B7B4E2 5e5e5e 4e4e4e
// pintar.clearColor = PintarJS.Color.fromHex('F7A36B');

let canvas = document.getElementById('canvas')
//
// let menuCanvas = document.getElementById('levelSelectCanvas')
// let ctx = canvas.getContext('2d')

let menuDiv = document.getElementById('levelSelectMenuContainer')
let levelSelectButtons = menuDiv?.querySelectorAll('.levelSelectButton')
let mainPackContainer = document.getElementById('mainPack')
let playerPackContainer = document.getElementById('playerPack')

function openPlayerPack() {
	mainPackContainer.animate([
    // keyframes
    { transform: "translate(0vw, 0vh)" },
    { transform: "translate(0vw, -100vh)" }
  ], {
    duration: 500,
    fill: 'both',
    easing: 'ease-in',
  });
	playerPackContainer.animate([
    // keyframes
    { transform: "translate(0vw, 100vh)" },
    { transform: "translate(0vw, 0vh)" }
  ], {
    duration: 500,
    fill: 'both',
    easing: 'ease-out',
  });
}

function openMainPack() {
	mainPackContainer.animate([
    // keyframes
    { transform: "translate(0vw, -100vh)" },
    { transform: "translate(0vw, 0vh)" }
  ], {
    duration: 500,
    fill: 'both',
    easing: 'ease-out',
  });
	playerPackContainer.animate([
    // keyframes
    { transform: "translate(0vw, 0vh)" },
    { transform: "translate(0vw, 100vh)" }
  ], {
    duration: 500,
    fill: 'both',
    easing: 'ease-in',
  });
}

let globalT = 0.0
let last_t = null
let last_t_undo_sound = null

let true_timeline_undos = []

let HALT = false

let main_container = document.getElementById("container")
let transitionElement = document.getElementById('transition')


class WobblyShader extends PintarJS.DefaultShader
  {
  get fragmentShaderTextureCode () {
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
        `
  }

  get uniformNames () {
    return super.uniformNames.concat(['u_deltaTime'])
  }

  get fragmentShaderAdditionalUniforms () {
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
     `
  }

  prepare (renderable, viewport) {
    super.prepare(renderable, viewport)
    this.setUniformf(this.uniforms.u_deltaTime, globalT)
      // deltaTime += 0.1;
  }
  }

let wobblyShader = new WobblyShader()

let TILE = null
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
let real_times = [0,0,0]
let in_menu = false

let DEFAULT_PLAYER_INMUNE_LEVEL = 0
let TURN_SPEED = 0.15 // 0.3
let TRANSITION_SPEED = 0.03
let ALLOW_CHANGE_PLAYER = false
let ALLOW_CHANGE_CRATES = false
let ALLOW_EDITOR = false
let ALLOW_MACHINES = false
let ALLOW_CRATE_ON_TOP_OF_MACHINE = true
let ALLOW_MAGIC_INPUT = false
let KEEP_UNDOING_UNTIL_CRATE_MOVE = false
let DEFAULT_FORBID_OVERLAP = false
let KEY_RETRIGGER_TIME = 200
let BACKGROUND_IS_WALL = true
let ENABLE_RESTART = false
let ENABLE_UNDO_2 = false
let ENABLE_UNDO_3 = false
let ENABLE_UNDO_4 = false
let HATS_ENABLED = true
let DRAW_TIMEBARS = false
let ALLOW_CHEATS = false

function PropertyHistory (initial_value, inmune, extra = 0) {
  this.value = [initial_value]
  if (typeof inmune === 'number') inmune = [inmune]
  this.inmune = inmune
  for (let k = 0; k < extra; k++) {
    this.value.push(initial_value)
    this.inmune.push(inmune[0])
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
  src: ['sounds/goal.wav']
})
let wallSound = new Howl({
  src: ['sounds/wall.wav']
})
let stepSound = new Howl({
  src: ['sounds/step.wav']
})
let pushSound = new Howl({
  src: ['sounds/push.wav']
})
let winSound = new Howl({
  src: ['sounds/win.wav']
})
let holeSound = new Howl({
  src: ['sounds/hole.wav']
})
let undoSounds = [
  new Howl({
    src: ['sounds/undo1.wav']
  }),
  new Howl({
    src: ['sounds/undo2.wav']
  }),
  new Howl({
    src: ['sounds/undo3.wav']
  }),
  new Howl({
    src: ['sounds/undo4.wav']
  })
]
undoSounds[8] = undoSounds[0]
let restartSound = new Howl({
  src: ['sounds/restart.wav'],
  volume: 0.4
})
let transitionSound = new Howl({
  src: ['sounds/transition.wav']
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
  'crate1': '#CFCFCF', // '#F8CB58' EBD7FE
  'crate2': '#FF9500', // '#F8984E' 62FF42
  'crate3': '#E74059', // '#F8643F' FF3838
  'crate4': '#9D15EC', // '#F8643F' FF3838
  'machine1': '#F5B512',  // E9C46A D2BA7F E9A90A
  'machine2': '#F46F0A', // E89A5E D09D76 E26709
  'machine3': '#EC3609' // E76F51 CD7E6A D83208
}
COLORS.background = COLORS.floor // #75366D
COLORS.true_background = '#5e5e5e' // COLORS.wall // #75366D
// COLORS.transition = COLORS.floor // COLORS.wall // #75366D
COLORS.floor = COLORS.true_background
COLORS.crates = [
  COLORS.crate1,
  COLORS.crate2,
  COLORS.crate3,
  COLORS.crate4, '#F8643F', '#F8643F', '#F8643F', '#F8643F', '#F8643F', '#F8643F', '#F8643F'
]

COLORS.transition =  '383F69' // '#383F69' // 383F69 5e5e5e

// BACK_COLORS = [COLORS.true_background, COLORS.crate1, COLORS.crate2, COLORS.crate3]
BACK_COLORS = [COLORS.true_background, COLORS.machine1, COLORS.machine2, COLORS.machine3]
UNDO_PLAYER_COLORS = [COLORS.player, COLORS.machine1, COLORS.machine2, COLORS.machine3]

PintarJS.Sprite.defaults.smoothingEnabled = false
// let player_texture = new PintarJS.Texture('imgs/zelda_new_2_1.png', () => {
let player_texture = new PintarJS.Texture('imgs/zelda_new_13.png', () => {
// let player_texture = new PintarJS.Texture('imgs/zelda_new_2_1.png', () => {
  let _4x4 = new PintarJS.Point(4, 4)
  raw_player_sprites = []
  for (let k = 0; k < 16; k++) {
    let cur = new PintarJS.Sprite(player_texture)
    cur.setSourceFromSpritesheet(new PintarJS.Point(k % 4, Math.floor(k / 4)), _4x4)
    raw_player_sprites.push(cur)
  }
  // raw_player_sprites[0].setSourceFromSpritesheet(new PintarJS.Point(2, 0), _4x4);
  player_sprite = raw_player_sprites[0]
})

let hats_texture = new PintarJS.Texture('imgs/onlyhats.png', () => {
  let _4x4 = new PintarJS.Point(4, 4)
  raw_hat_sprites = []
  for (let k = 0; k < 16; k++) {
    let cur = new PintarJS.Sprite(hats_texture)
    cur.setSourceFromSpritesheet(new PintarJS.Point(k % 4, Math.floor(k / 4)), _4x4)
    raw_hat_sprites.push(cur)
  }
})
/*let gearBox_texture = new PintarJS.Texture('imgs/gearBox.png', () => {
  let _4x4 = new PintarJS.Point(20, 1)
  raw_gearBox_sprites = []
  for (let k = 0; k < 3; k++) {
    let cur = new PintarJS.Sprite(gearBox_texture)
    cur.setSourceFromSpritesheet(new PintarJS.Point(0, 0), _4x4)
    cur.color = new PintarJS.Color.fromHex(COLORS.crates[k])
    raw_gearBox_sprites.push(cur)
  }
})*/
/*let animBlock_texture = new PintarJS.Texture('imgs/animBlock.png', () => {
  let _4x4 = new PintarJS.Point(4, 1)
  raw_animBlock_sprites = []
  for (let k = 0; k < 3; k++) {
    let cur = new PintarJS.Sprite(animBlock_texture)
    cur.setSourceFromSpritesheet(new PintarJS.Point(0, 0), _4x4)
    cur.color = new PintarJS.Color.fromHex(COLORS.crates[k])
    raw_animBlock_sprites.push(cur)
  }
})*/
/*let rotatingBlock_texture = new PintarJS.Texture('imgs/rotationBlock.png', () => {
  rotatingBlock_sprites = []
  for (let k = 0; k < 3; k++) {
    let cur = new PintarJS.Sprite(rotatingBlock_texture)
    cur.color = new PintarJS.Color.fromHex(COLORS.crates[k])
    cur.origin = PintarJS.Point.half()
    rotatingBlock_sprites.push(cur)
  }
})*/

let world_texture = new PintarJS.Texture('imgs/world_new_2.png', () => {
  floor_sprite = new PintarJS.Sprite(world_texture)
  setSourceFromSheet(floor_sprite, 0, 0, 3, 5, 2, setSize=true)

  crate_sprites = []
  crate_hole_sprites = []
  let crate_spr_data = [[0, 2], [1, 2], [2, 2], [2, 0]]
  for (let k = 0; k < 4; k++) {
    let curSpr = new PintarJS.Sprite(world_texture)
    setSourceFromSheet(curSpr, crate_spr_data[k][0], crate_spr_data[k][1], 3, 5, 2, setSize=true)
    curSpr.color = new PintarJS.Color.fromHex(COLORS.crates[k])
    crate_sprites.push(curSpr)

    curSpr = curSpr.clone()
    curSpr.brightness = 0.4
    crate_hole_sprites.push(curSpr)
  }

  hole_sprite = new PintarJS.Sprite(world_texture)
  setSourceFromSheet(hole_sprite, 1, 0, 3, 5, 2, setSize=true)

  black_sprite = new PintarJS.Sprite(world_texture)
  setSourceFromSheet(black_sprite, 0, 1, 3, 5, 2, setSize=true)

  holeCover_sprite = new PintarJS.Sprite(world_texture)
  setSourceFromSheet(holeCover_sprite, 0, 3, 3, 5, 2, setSize=true)

  holeCoverBroken_sprite = new PintarJS.Sprite(world_texture)
  setSourceFromSheet(holeCoverBroken_sprite, 1, 3, 3, 5, 2, setSize=true)

	holeCoverAbove_sprite = new PintarJS.Sprite(world_texture)
  setSourceFromSheet(holeCoverAbove_sprite, 0, 4, 3, 5, 2, setSize=true)

  holeCoverBrokenAbove_sprite = new PintarJS.Sprite(world_texture)
  setSourceFromSheet(holeCoverBrokenAbove_sprite, 1, 4, 3, 5, 2, setSize=true)

  paintBlob_sprite = new PintarJS.Sprite(world_texture)
  setSourceFromSheet(paintBlob_sprite, 1, 1, 3, 5, 2, setSize=true)

  paintBlobBroken_sprite = new PintarJS.Sprite(world_texture)
  setSourceFromSheet(paintBlobBroken_sprite, 2, 1, 3, 5, 2, setSize=true)

	floorHat_sprite = new PintarJS.Sprite(world_texture)
  setSourceFromSheet(floorHat_sprite, 2, 3, 3, 5, 2, setSize=true)
})
/*let gradients_texture = new PintarJS.Texture('imgs/gradients.png', () => {
  // let _4x4 = new PintarJS.Point(4, 4)
  raw_gradient_sprites = []

  // for (let k=0; k<16; k++) {
  let cur = new PintarJS.Sprite(gradients_texture)
  cur.sourceRectangle = new PintarJS.Rectangle(0, 0, 48, 32)
  cur.size = new PintarJS.Point(48, 32)
  raw_gradient_sprites.push(cur)

  cur = cur.clone()
  cur.sourceRectangle = new PintarJS.Rectangle(48, 0, 32, 48)
  cur.size = new PintarJS.Point(32, 48)
  raw_gradient_sprites.push(cur)

  cur = cur.clone()
  cur.sourceRectangle = new PintarJS.Rectangle(0, 32, 32, 48)
  cur.size = new PintarJS.Point(32, 48)
  raw_gradient_sprites.push(cur)

  cur = cur.clone()
  cur.sourceRectangle = new PintarJS.Rectangle(32, 48, 48, 32)
  cur.size = new PintarJS.Point(48, 32)
  raw_gradient_sprites.push(cur)
  // }
  // raw_player_sprites[0].setSourceFromSpritesheet(new PintarJS.Point(2, 0), _4x4);
  // player_sprite = raw_player_sprites[0]
})*/

let modular_texture = new PintarJS.Texture('imgs/wall_modular_margin.png', () => {
  // wall_sprites = [];
  geoModularSprite = new PintarJS.Sprite(modular_texture)
})


// let zPicker = document.getElementById('zPicker')
// let xPicker = document.getElementById('xPicker')
// let cPicker = document.getElementById('cPicker')
//
// if (zPicker) zPicker.value = COLORS.crate1;
// if (xPicker) xPicker.value = COLORS.crate2;
// if (cPicker) cPicker.value = COLORS.crate3;
//
// zPicker?.addEventListener('input', e => {
//   crate_sprites[0].color = new PintarJS.Color.fromHex(e.target.value);
//   crate_hole_sprites[0].color = new PintarJS.Color.fromHex(e.target.value);
//   COLORS.crates[0] = e.target.value
// })
//
// xPicker?.addEventListener('input', e => {
//   crate_sprites[1].color = new PintarJS.Color.fromHex(e.target.value);
//   crate_hole_sprites[1].color = new PintarJS.Color.fromHex(e.target.value);
//   COLORS.crates[1] = e.target.value
// })
//
// cPicker?.addEventListener('input', e => {
//   crate_sprites[2].color = new PintarJS.Color.fromHex(e.target.value);
//   crate_hole_sprites[2].color = new PintarJS.Color.fromHex(e.target.value);
//   COLORS.crates[2] = e.target.value
// })

/*let texto_1_texture = new PintarJS.Texture('imgs/texts_1.png', () => {
  texto_1_sprite = new PintarJS.Sprite(texto_1_texture)
  texto_1_sprite.size = new PintarJS.Point(896, 576)
})*/
/*let texto_2a_texture = new PintarJS.Texture('imgs/Text_2_a.png', () => {
  texto_2a_sprite = new PintarJS.Sprite(texto_2a_texture)
  texto_2a_sprite.size = new PintarJS.Point(640, 448)
})
let texto_2b_texture = new PintarJS.Texture('imgs/Text_2_b.png', () => {
  texto_2b_sprite = new PintarJS.Sprite(texto_2b_texture)
  texto_2b_sprite.size = new PintarJS.Point(640, 448)
})
let texto_3_texture = new PintarJS.Texture('imgs/texts_3.png', () => {
  texto_3_sprite = new PintarJS.Sprite(texto_3_texture)
  texto_3_sprite.size = new PintarJS.Point(640, 640)
})
let texto_r_texture = new PintarJS.Texture('imgs/texts_r.png', () => {
  texto_r_sprite = new PintarJS.Sprite(texto_r_texture)
  texto_r_sprite.size = new PintarJS.Point(640, 640)
})
let texto_recap_texture = new PintarJS.Texture('imgs/texts_recap.png', () => {
  texto_recap_sprite = new PintarJS.Sprite(texto_recap_texture)
  texto_recap_sprite.size = new PintarJS.Point(448, 640)
})
let texto_NM_texture = new PintarJS.Texture('imgs/texts_select.png', () => {
  texto_NM_sprite = new PintarJS.Sprite(texto_NM_texture)
  texto_NM_sprite.size = new PintarJS.Point(832, 448)
  texto_NM_sprite.color = PintarJS.Color.fromHex('#7988c0')
})
let texto_credits_texture = new PintarJS.Texture('imgs/texts_credits.png', () => {
  texto_credits_sprite = new PintarJS.Sprite(texto_credits_texture)
  texto_credits_sprite.size = new PintarJS.Point(896, 576)
  // texto_credits_sprite.color = PintarJS.Color.fromHex('#4f69ba')
})*/
/* let raw_player_sprites = [
  new PintarJS.Sprite(player_texture)
]
*/

// wall_sprites[0].sourceRectangle = new PintarJS.Rectangle(0, 0, 16, 16);

// pintar.makePixelatedScaling()
// pintar.makeFullscreen()

/*
let GEO_DATA = [
  ['*,*##*.*', 0, 6],
  ['*.*##*,*', 2, 6],
  ['*#*,.*#*', 1, 6],
  ['*#*.,*#*', 3, 6],

  ['*#*#.*.*', 2, 5],
  ['*#*.#*.*', 1, 5],
  ['*.*#.*#*', 3, 5],
  ['*.*.#*#*', 0, 5],

  ['*,*#,.#*', 1, 3],
  ['.#*#,*,*', 0, 3],
  ['*#.,#*,*', 3, 3],
  ['*,*,#*#.', 2, 3],

  ['*.*..*#*', 2, 4],
  ['*#*..*.*', 0, 4],
  ['*.*#.*.*', 1, 4],
  ['*.*.#*.*', 3, 4],

  ['*#*.#*#*', 3, 1],
  ['*#*#.*#*', 1, 1],
  ['*.*##*#*', 2, 1],
  ['*#*##*.*', 0, 1],

  ['********', 1, 0],
]

function matchGeo(pattern, data) {
  for (let k=0; k<8; k++) {
    if (pattern[k]==='*') continue
    if (data[k]!==pattern[k]) return false
  }
  return true
}

function findMatching(data) {
  for (let k=0; k<GEO_DATA.length; k++) {
    if (matchGeo(GEO_DATA[k][0], data)) {
      return [GEO_DATA[k][1], GEO_DATA[k][2]]
    }
  }
  throw new Error("nothing matched data: " + data)
}

function drawGeoSpr(geoChar, i, j) {
  // geoGlobalSprite.setSourceFromSpritesheet(new PintarJS.Point(v[0], v[1]), _4x10)
  if (geoChar === ',') {
    return
  } else if (geoChar === '.') {
    floor_sprite.position = new PintarJS.Point(OFFX + i * TILE, OFFY + j * TILE)
    // console.log("drawing floor")
    pintar.drawSprite(floor_sprite)
  } else {
    let [si, sj] = findMatching(geoChar)
    geoGlobalSprite.setSourceFromSpritesheet(new PintarJS.Point(si,sj), _4x10)
    geoGlobalSprite.position = new PintarJS.Point(OFFX + i * TILE, OFFY + j * TILE)
    pintar.drawSprite(geoGlobalSprite)
  }
}
*/

let MODULAR_GEO_DATA = {
  '#.#.': [3, 1],
  '.#.#': [2, 0],
  '..##': [3, 0],
  '##..': [2, 1],

  '#...': [1, 3],
  '.#..': [0, 3],
  '..#.': [1, 2],
  '...#': [0, 2],

  '.###': [1, 1],
  '#.##': [0, 1],
  '##.#': [1, 0],
  '###.': [0, 0],

  '#..#': [2, 2],
  '.##.': [3, 2],

  '#.,,': [0, 4],
  '.#,,': [1, 4],
  ',,#.': [0, 5],
  ',,.#': [1, 5],

  ',#,.': [3, 4],
  ',.,#': [3, 5],
  '.,#,': [2, 5],
  '#,.,': [2, 4],

  '..,,': [0, 6],
  ',,..': [1, 6],
  '.,.,': [2, 6],
  ',.,.': [3, 6],

  // '.,,,': [2, 3],
  // ',.,,': [2, 3],
  // ',,.,': [2, 3],
  // ',,,.': [2, 3],
}
function drawModularGeoSpr (level,i,j) {
  let tl = getGeo(level,i-1,j-1)
  let tr = getGeo(level,i,j-1)
  let bl = getGeo(level,i-1,j)
  let br = getGeo(level,i,j)
  let res = tl + tr + bl + br
  if (res === '....' || res.indexOf('.') === -1) return
  // if (res === '....' || res === ',,,,' || res === '####') return
  // console.log(res)
  let [si, sj] = MODULAR_GEO_DATA[res] || [-1, -1]
  // if (i <= 0 || i >= level.w || j <= 0 || j >= level.h) {
  //   // partly outside
  //   // console.log(res)
  //   if (res.indexOf('.') !== -1) {
  //     // floor touching the outside
  //     return
  //     // if (!ALLOW_EDITOR) return
  //   } else {
  //     return
  //   }
  // }
  if (i === 0 || i === level.w || j === 0 || j === level.h) {
    setSourceFromSheet(geoModularSprite, 2, 3, 4, 7, 2)
    let ti = i - .5
    let tj = j - .5
    if (i === 0 && j > 0 && j < level.h) ti = i - 1
    if (i === level.w && j > 0 && j < level.h) ti = i
    if (j === 0 && i > 0 && i < level.w) tj = j - 1
    if (j === level.h && i > 0 && i < level.w) tj = j
    // let ti = (i === 0) ? i - 1 : (i === level.w) ? i : i - .5;
    // let tj = (j === 0) ? j - 1 : (j === level.h) ? j : j - .5;
    geoModularSprite.position = new PintarJS.Point(OFFX + ti * TILE, OFFY + tj * TILE)
    // geoModularSprite.position = new PintarJS.Point(OFFX + (i-.5) * TILE, OFFY + (j-.5) * TILE)
    pintar.drawSprite(geoModularSprite)
  }
  if (si === -1) return
  if (bl === ',' && br === ',') {
    j -= .5
  } else if (tr === ',' && tl === ',') {
    j += .5
  } else if (tr === ',' && br === ',') {
    i -= .5
  } else if (tl === ',' && bl === ',') {
    i += .5
  }
  globalSI = si
  globalSJ = sj

  setSourceFromSheet(geoModularSprite, si, sj, 4, 7, 2)
  // geoModularSprite.setSourceFromSpritesheet(new PintarJS.Point(si,sj), new PintarJS.Point(4,7))
  geoModularSprite.position = new PintarJS.Point(OFFX + (i-.5) * TILE, OFFY + (j-.5) * TILE)
  // geoModularSprite.position = new PintarJS.Point(Math.floor(OFFX + (i-.5) * TILE), Math.floor(OFFY + (j-.5) * TILE))
  pintar.drawSprite(geoModularSprite)
}

function setSourceFromSheet (spr, i, j, ni, nj, margin, setSize=true) {
  let w = (spr.texture.width - ni * margin * 2) / ni;
  var h = (spr.texture.height - nj * margin * 2) / nj;
  var x = (w + 2 * margin) * i + margin;
  var y = (h + 2 * margin) * j + margin;
  if (setSize || setSize === undefined) {
      spr.width = w;
      spr.height = h;
  }
  spr.sourceRectangle.set(x, y, w, h);
}


function getGeo(level,i,j) {
  if (i < 0 || i >= level.w || j < 0 || j >= level.h) return ','
  let chr = level.geo[j][i]
  if (chr === ',') return '#'
  return chr
}

function drawSpr (spr, i, j) {
  spr.position = new PintarJS.Point(OFFX + i * TILE, OFFY + j * TILE)
  // spr.scale = new PintarJS.Point(TILE / 16, TILE / 16)
  pintar.drawSprite(spr)
}

function drawLevel (level) {
  if (in_last_level) {
    if (level.extraDrawCode) level.extraDrawCode()
    return
  }
  // let is_won = isWon(level)
  let geo = level.geo
  /* if (ALLOW_EDITOR) {
    ctx.strokeRect(OFFX - 0.1 * TILE, OFFY - 0.1 * TILE, (level.w + 0.2) * TILE, (level.h + 0.2) * TILE)
  } */
  // ctx.fillStyle = COLORS.wall
  // ctx.fillStyle = BACKGROUND_IS_WALL ? COLORS.floor : COLORS.wall
  for (let j = 0; j < geo.length; j++) {
    for (let i = 0; i < geo[0].length; i++) {
      if (geo[j][i] === '.') {
        floor_sprite.position = new PintarJS.Point(OFFX + i * TILE, OFFY + j * TILE)
        pintar.drawSprite(floor_sprite)
      }
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
    black_sprite.position = new PintarJS.Point(OFFX + i * TILE, OFFY + j * TILE)
    // black_sprite.scale = new PintarJS.Point(TILE / 16, TILE / 16)
    pintar.drawSprite(black_sprite)
  })

  let any_overlap = false;
  let overlapping_player = false;
  let overlapping = new Array(sortedCrates.length).fill(false)
  let [pi2, pj2] = level.player.history.at(-1)
  for (let i = 0; i < sortedCrates.length; i++) {
    if (overlapping[i]) continue;
    let [i1,j1] = sortedCrates[i].history.at(-1)
    if (i1 === pi2 && j1 === pj2) {
      overlapping_player = true;
      overlapping[i] = true;
      any_overlap = true;
      continue;
    }
    for (let j = i + 1; j < sortedCrates.length; j++) {
      let [i2,j2] = sortedCrates[j].history.at(-1)
      if (i1 === i2 && j1 === j2) {
        overlapping[i] = true
        overlapping[j] = true
        any_overlap = true
      }
    }
  }

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

	let playerState = level.player.history.at(-1)
  let prevPlayerState = level.player.history.at(-2)
  if (prevPlayerState === undefined) {
    // prevPlayerState = playerState
    prevPlayerState = [playerState[0] - level.enter[0], playerState[1] - level.enter[1]]
    // backwardsT = 1 - turn_time;
    forwardsT = level_transition_time <= 0.5 ? Math.pow(1 - level_transition_time * 2, 1 / 2) : 1
    // forwardsT = Math.pow(1 - level_transition_time * 2, 1 / 2)
    // forwardsT = 1 - level_transition_time * 2
  }
  let player_forward = get_times_directions(level.player.history.length - 2)[0] == 1
  // console.log(player_forward);

  let pt = player_forward ? forwardsT : backwardsT

  if (level_transition_time > 0.5 && won_cur_level) {
    pt = (1 - level_transition_time) * 4
    // pt += 1
    // console.log(1-level_transition_time);
  }

  let pi = lerp(prevPlayerState[0], playerState[0], pt)
  let pj = lerp(prevPlayerState[1], playerState[1], pt)
  // drawSpr(playerSpr, pi, pj);

	let player_inHole = level.player.inHole.value.at(-1);
	let sprOffset = level_transition_time > 0.5 && won_cur_level ? 1 : 0
  let odd = mod(player_inHole, 2) == 1
  if (odd) sprOffset = -sprOffset
  let player_spr_n = player_inHole + sprOffset
	let player_inmune = level.player.inmune_history.at(-1)

	if (player_inHole < 0) {
		// player is in hole
		player_spr_n += 16
		player_sprite = raw_player_sprites[player_spr_n]
		if (!player_sprite) {
			console.log("bad stuff is happening.")
			console.log(player_spr_n)
		}
		player_sprite.position = new PintarJS.Point(OFFX + pi * TILE, OFFY + pj * TILE)
		player_sprite.brightness = 0.4
	  // player_sprite.scale = new PintarJS.Point(TILE / 16, TILE / 16)
	  pintar.drawSprite(player_sprite)
		player_sprite.brightness = 1.0
		if (HATS_ENABLED) {
			hat_sprite = raw_hat_sprites[player_spr_n]
			hat_sprite.position = new PintarJS.Point(OFFX + pi * TILE, OFFY + pj * TILE)
			hat_sprite.color = PintarJS.Color.fromHex(COLORS.crates[player_inmune])
			hat_sprite.brightness = 0.4
			pintar.drawSprite(hat_sprite)
			hat_sprite.brightness = 1.0
		}
	} else {
		player_sprite = raw_player_sprites[player_spr_n]
	}

  if (any_overlap) {
    pintar._renderer.setShader(wobblyShader)
    for (var k = sortedCrates.length - 1; k>=0; k--) {
      let crate = sortedCrates[k]
      if (!overlapping[k]) continue;
      if (!crate.inHole.get()) continue;
      if (!crate.inHole.value.at(-2) && turn_time > 0) continue;
      let state = crate.history.at(-1)
      let prevState = crate.history.at(-2)
      if (prevState === undefined) prevState = state
      let inmune = crate.inmune_history.at(-1)
      let crate_forward = get_times_directions(crate.history.length - 2)[inmune] == 1
      let ci = lerp(prevState[0], state[0], crate_forward ? forwardsT : backwardsT)
      let cj = lerp(prevState[1], state[1], crate_forward ? forwardsT : backwardsT)
      drawSpr(crate_hole_sprites[inmune], ci, cj)
    }
    pintar._renderer.setShader(null)
  }

  // draw holes
  level.holes.forEach(([i, j]) => {
    hole_sprite.position = new PintarJS.Point(OFFX + i * TILE, OFFY + j * TILE)
    // hole_sprite.scale = new PintarJS.Point(TILE / 16, TILE / 16)
    pintar.drawSprite(hole_sprite)
  })

  // draw hole covers
  level.holeCovers.forEach(holeCover => {
    let spr = holeCover.value.at(-1) ? holeCover_sprite : holeCoverBroken_sprite
    let [hi, hj] = holeCover.position
    spr.position = new PintarJS.Point(OFFX + hi * TILE, OFFY + hj * TILE)
    // spr.scale = new PintarJS.Point(TILE / 16, TILE / 16)
    spr.color = PintarJS.Color.fromHex(COLORS.crates[holeCover.inmune.at(-1)])
    pintar.drawSprite(spr)
  })

  // draw paint blobs
  level.paintBlobs.forEach(paintBlob => {
    let curVal = paintBlob.value.at(-1);
    let prevVal = paintBlob.value.at(-2);
    if (prevVal === undefined) prevVal = curVal
    let relevantVal = (turn_time > 0.5) ? prevVal : curVal
    let spr = relevantVal ? paintBlob_sprite : paintBlobBroken_sprite
    let [hi, hj] = paintBlob.position
    spr.position = new PintarJS.Point(OFFX + hi * TILE, OFFY + hj * TILE)
    // spr.scale = new PintarJS.Point(TILE / 16, TILE / 16)
    spr.color = PintarJS.Color.fromHex(COLORS.crates[paintBlob.inmune.at(-1)])
    // console.log("hola");
    pintar.drawSprite(spr)
  })

	// draw floor hats
  level.hats.forEach(hat => {
		if (!hat.value.at(-1)) return
    let [hi, hj] = hat.position
		floorHat_sprite.position = new PintarJS.Point(OFFX + hi * TILE, OFFY + hj * TILE)
    // spr.scale = new PintarJS.Point(TILE / 16, TILE / 16)
    floorHat_sprite.color = PintarJS.Color.fromHex(COLORS.crates[hat.inmune.at(-1)])
    pintar.drawSprite(floorHat_sprite)
  })

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
    // console.log(raw_gearBox_sprites[inmune])
    /*let crate_sprite = raw_gearBox_sprites[inmune]
    let spr_n = mod(Math.floor(real_times[inmune]) + 9, 20)
    crate_sprite.setSourceFromSpritesheet(new PintarJS.Point(spr_n, 0), new PintarJS.Point(20, 1))
    crate_sprite.scale = new PintarJS.Point(TILE / 64, TILE / 64)*/

    let crate_sprite = crate_sprites[inmune]
    // crate_sprite.scale = new PintarJS.Point(TILE / 16, TILE / 16)

    /*let crate_sprite = raw_animBlock_sprites[inmune]
    let spr_n = mod(get_timeline_length(crate.history.length - 1, inmune), 4)
    crate_sprite.setSourceFromSpritesheet(new PintarJS.Point(spr_n, 0), new PintarJS.Point(4, 1))
    crate_sprite.scale = new PintarJS.Point(TILE / 64, TILE / 64)*/

    /*let crate_sprite = rotatingBlock_sprites[inmune]
    let spr_n = mod(get_timeline_length(crate.history.length - 1, inmune), 4)
    crate_sprite.rotation = get_timeline_length(crate.history.length - 1, inmune) * 60
    ci += .5
    cj += .5*/

    crate_sprite.position = new PintarJS.Point(OFFX + ci * TILE, OFFY + cj * TILE)
    pintar.drawSprite(crate_sprite)
    // drawSpr(crateSprs[inmune], ci, cj)
    // drawSpr(crateSprsA[inmune], ci, cj);
    // drawSpr(crateSpr, state[0], state[1]);
    // ctx.fillText((inmune+1).toString(), state[0]*TILE+OFFX, state[1]*TILE+OFFY);
    // result[state[1]][state[0]] += (inmune + 1).toString();
  })

  /* if (player_spr_n >= 8 && turn_time == 0) {
    // edge case: pushed into a hole
    player_spr_n -= 8
  } */
  // if (!player_forward) {
  if (true_timeline_undos.at(-1) > player_inmune && turn_time > 0.0 && player_inHole >= 0) {
		// player is undoing
    // let opts = [1.0, 0.8, 0.6, 0.4, 0.2]
    // let opts = [1.0, 0.6, 0.2]
    // let opts = [0.0]
    let opts = [1.0]
    for (var i = 0; i < opts.length; i++) {
      let opt = opts[i]
      // if (1 - turn_time < opt && 1) {// - turn_time > opt - 0.66) {
      let opi = lerp(prevPlayerState[0], playerState[0], opt)
      let opj = lerp(prevPlayerState[1], playerState[1], opt)
      player_sprite = raw_player_sprites[player_spr_n]
      player_sprite.position = new PintarJS.Point(OFFX + opi * TILE, OFFY + opj * TILE)
      player_sprite.color = PintarJS.Color.fromHex(COLORS.crates[true_timeline_undos.at(-1) - 1])
      player_sprite.color.a = 0.4
			// TODO: DRAW COOL HAT
      pintar.drawSprite(player_sprite)
      // }
    }
    player_sprite.color = PintarJS.Color.white()
  }
	if (player_inHole >= 0) {
		player_sprite.position = new PintarJS.Point(OFFX + pi * TILE, OFFY + pj * TILE)
	  // player_sprite.scale = new PintarJS.Point(TILE / 16, TILE / 16)
	  pintar.drawSprite(player_sprite)
		if (HATS_ENABLED) {
			hat_sprite = raw_hat_sprites[player_spr_n]
			hat_sprite.position = new PintarJS.Point(OFFX + pi * TILE, OFFY + pj * TILE)
			hat_sprite.color = PintarJS.Color.fromHex(COLORS.crates[player_inmune])
			pintar.drawSprite(hat_sprite)
		}
	}
  // sortedCrates.reverse()

  if (any_overlap) {
    pintar._renderer.setShader(wobblyShader)
    for (var k = 0; k<sortedCrates.length; k++) {
      let crate = sortedCrates[k]
      if (crate.inHole.get()) {
        if (crate.inHole.value.at(-2) || turn_time == 0) {
          continue;
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
    }
    pintar._renderer.setShader(null)
  }

	// draw hole covers, top part
  level.holeCovers.forEach(holeCover => {
    let spr = holeCover.value.at(-1) ? holeCoverAbove_sprite : holeCoverBrokenAbove_sprite
    let [hi, hj] = holeCover.position
    spr.position = new PintarJS.Point(OFFX + hi * TILE, OFFY + hj * TILE)
    // spr.scale = new PintarJS.Point(TILE / 16, TILE / 16)
    spr.color = PintarJS.Color.fromHex(COLORS.crates[holeCover.inmune.at(-1)])
    pintar.drawSprite(spr)
  })

	// Draw walls
  for (let j = 0; j <= geo.length; j++) {
    for (let i = 0; i <= geo[0].length; i++) {
      drawModularGeoSpr(level, i, j)
    }
  }
  // setSourceFromSheet(geoModularSprite, 2, 3, 4, 7, 2)
  //
  // for (let j = 0; j < geo.length; j++) {
  //   geoModularSprite.position = new PintarJS.Point(OFFX + (-1.0) * TILE, OFFY + (j-.5) * TILE)
  //   pintar.drawSprite(geoModularSprite)
  // }

  if (level.extraDrawCode) level.extraDrawCode()
}

function deleteDraft (button) {
  button.parentElement.parentElement.remove()
}

function playDraft (button) {
	let new_level = str2level(button.parentElement.previousElementSibling.value.trim(), [1,0], [1,0], "Your Level", "You")
	if (new_level) {
		levels['editor'] = new_level
		// levels[cur_level_n] = new_level
	  true_timeline_undos = []
	}
}

function saveDraft (str) {
  let curDiv = document.createElement('div');
  /*<div class="draftText">

  </div>*/ //rows="18" cols="32" rows="${levels[cur_level_n].h + 4}"
  curDiv.innerHTML = `<div class="levelDraftContainer"><textarea rows="12"></textarea>
    <div class="levelDraftBar">
      <button type="button" name="deleteDraft" onclick="deleteDraft(this)">delete</button><button type="button" name="playDraft" onclick="playDraft(this)">play</button>
    </div>
  </div>`.trim();
  // Get the last <li> element ("Milk") of <ul> with id="myList2"
  // let itm = editorSidebar.lastElementChild;
  // Copy the <li> element and its child nodes
  // let cln = itm.cloneNode(true);
  let curElement = curDiv.firstChild

  curElement.firstElementChild.value = level2str(levels[cur_level_n])
  // curElement.firstElementChild.innerText = level2str(levels[cur_level_n])

  // Append the cloned <li> element to <ul> with id="myList1"
  editorSidebar.prepend(curElement);
  // editorSidebar.appendChild(curElement);
  // console.log(cln)
}

let editorSidebar = document.getElementById("leftCol");
let editorTopbar = document.getElementById("topArea");
let canvasContainer = document.getElementById("canvasContainer");
function enterEditor () {
	if (cur_level_n !== 'editor') {
		levels["editor"] = levels[cur_level_n]
		levels[cur_level_n] = str2level(...levels_named[cur_level_n])
		levels[cur_level_n].unmodified = true
		levels["editor"].author = "You"
		levels["editor"].name = "Your Level"
		levels["editor"].unmodified = false
		cur_level_n = "editor"
		// just in case:
		levels[0].extraDrawCode = drawIntroText
		levels[1].extraDrawCode = drawSecondText
		levels[3].extraDrawCode = drawXtoReallyText
		levels[5].extraDrawCode = drawSkipText
		levels[6].extraDrawCode = drawRecapText
		levels[7].extraDrawCode = drawCtoRRText
	}
	if (ALLOW_EDITOR) {
		editorSidebar.hidden = false
	  editorTopbar.hidden = false
		canvasContainer.className = "openEditor_canvasContainer_class"
	}
  setExtraDisplay("editor")
  ENABLE_RESTART = true
  ENABLE_UNDO_2 = true
  ENABLE_UNDO_3 = true
	if (editorSidebar.childElementCount < 1) saveDraft()
	updateMenuButtons()
}

function exitEditor () {
  //setTimeout(() => {
  editorSidebar.hidden = true
  editorTopbar.hidden = true
  //}, 500)
  setExtraDisplay(cur_level_n)
  canvasContainer.className = "closeEditor_canvasContainer_class"
}

function toggleEditor () {
	ALLOW_EDITOR = !ALLOW_EDITOR
  if (!ALLOW_EDITOR) {
    exitEditor();
		ALLOW_CHEATS = false
    updateMenuButtons()
  } else {
    enterEditor();
    ALLOW_CHEATS = true
    updateMenuButtons()
  }
}

let creditsUI = document.getElementById('creditsUI')

let text_0 = document.querySelectorAll('._0')
let text_1 = document.querySelector('._1')
let text_1a = document.querySelector('._1a')
let text_3 = document.querySelector('._3')
let text_5 = document.querySelector('._5')
let text_6 = document.querySelector('._6')
let text_7 = document.querySelector('._7')
let text_end = document.querySelectorAll('._end')
function setExtraDisplay (n) {
  // if (ALLOW_EDITOR) return
	let ultraHide = !levels[n]?.unmodified || ALLOW_EDITOR
  text_0.forEach(item => {
    item.hidden = ultraHide || (n !== 0)
  });
  text_1.hidden = ultraHide || n !== 1
  text_1a.hidden = ultraHide || (n !== 1) || !ENABLE_RESTART
  drawSecondText()
  text_3.hidden = ultraHide || n !== 3
  text_5.hidden = ultraHide || n !== 5
  text_6.hidden = ultraHide || n !== 6
  text_7.hidden = ultraHide || n !== 7
  text_end.forEach(item => {
    item.hidden = ultraHide || (n !== 18 && n !== 33)
  });
	let level = levels[n];
	if (level && level.author !== "knexator") {
		creditsUI.innerHTML = `${level.name} by ${level.author}`
		creditsUI.hidden = false
	} else {
		creditsUI.hidden = true
	}

}

function drawIntroText () {
  // texto_1_sprite.scale = new PintarJS.Point(TILE / 64, TILE / 64)
  // texto_1_sprite.position = new PintarJS.Point(OFFX, OFFY)
  // pintar.drawSprite(texto_1_sprite)
}

function drawSecondText () {
  if (!ENABLE_RESTART) {
    // texto_2a_sprite.scale = new PintarJS.Point(TILE / 64, TILE / 64)
    // texto_2a_sprite.position = new PintarJS.Point(OFFX, OFFY)
    // pintar.drawSprite(texto_2a_sprite)
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
      setTimeout(function () {
        ENABLE_RESTART = true;
        text_1a.hidden = false;
      }, 1000)
    }
  }
}

function drawEndScreen () {
  /*texto_credits_sprite.scale = new PintarJS.Point(TILE / 64, TILE / 64)
  texto_credits_sprite.position = new PintarJS.Point(OFFX, OFFY)
  pintar.drawSprite(texto_credits_sprite)*/
}

function drawXtoReallyText () {
  /*texto_3_sprite.scale = new PintarJS.Point(TILE / 64, TILE / 64)
  texto_3_sprite.position = new PintarJS.Point(OFFX, OFFY)
  pintar.drawSprite(texto_3_sprite)*/
}

function drawCtoRRText () {
  /*texto_r_sprite.scale = new PintarJS.Point(TILE / 64, TILE / 64)
  texto_r_sprite.position = new PintarJS.Point(OFFX, OFFY)
  pintar.drawSprite(texto_r_sprite)*/
}

function drawSkipText () {
  /*texto_NM_sprite.scale = new PintarJS.Point(TILE / 64, TILE / 64)
  texto_NM_sprite.position = new PintarJS.Point(OFFX, OFFY)
  pintar.drawSprite(texto_NM_sprite)*/
}

function drawRecapText () {
  /*texto_recap_sprite.scale = new PintarJS.Point(TILE / 64, TILE / 64)
  texto_recap_sprite.position = new PintarJS.Point(OFFX, OFFY)
  pintar.drawSprite(texto_recap_sprite)*/
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
  pintar.startFrame()
  if (level_transition_time > 0.5) {
    let t = (level_transition_time - 0.5) * 2
    let cur_level = levels[cur_level_n]
    drawLevel(cur_level)
    // ctx.fillStyle = COLORS.transition // ctx.fillStyle = COLORS.background; // 'black' floorWin

    let di = levels[next_level].enter[0]
    let dj = levels[next_level].enter[1]
    let x_start = di < 0 ? canvas.width * t : 0
    let x_end = di > 0 ? canvas.width * (1 - t) : canvas.width
    let y_start = dj < 0 ? canvas.height * t : 0
    let y_end = dj > 0 ? canvas.height * (1 - t) : canvas.height
    // ctx.fillRect(x_start, y_start, x_end - x_start, y_end - y_start)

    // pintar.drawRectangle(
    //   new PintarJS.ColoredRectangle(
    //     new PintarJS.Point(x_start, y_start),
    //     new PintarJS.Point(x_end - x_start, y_end - y_start),
    //     PintarJS.Color.fromHex(COLORS.transition), null, true))
  } else if (level_transition_time > 0) {
    turn_time = 1
    let t = level_transition_time * 2
    let cur_level = levels[cur_level_n]
    drawLevel(cur_level)
    // ctx.fillStyle = COLORS.transition // ctx.fillStyle = COLORS.background; // 'black'
    let di = cur_level.enter[0]
    let dj = cur_level.enter[1]
    let x_start = di > 0 ? canvas.width * (1 - t) : 0
    let x_end = di < 0 ? canvas.width * t : canvas.width
    let y_start = dj > 0 ? canvas.height * (1 - t) : 0
    let y_end = dj < 0 ? canvas.height * t : canvas.height

    // ctx.fillRect(x_start, y_start, x_end - x_start, y_end - y_start)
    // pintar.drawRectangle(
    //   new PintarJS.ColoredRectangle(
    //     new PintarJS.Point(x_start, y_start),
    //     new PintarJS.Point(x_end - x_start, y_end - y_start),
    //     PintarJS.Color.fromHex(COLORS.transition), null, true))
  } else {
    let cur_level = levels[cur_level_n]
    drawLevel(cur_level)
  }

  if (DRAW_TIMEBARS) {
    for (let k=0; k<3; k++) {
      let time = get_timeline_length(true_timeline_undos.length, k)
      pintar.drawRectangle(
        new PintarJS.ColoredRectangle(
          new PintarJS.Point(10, k * 10),
          new PintarJS.Point(time * 10, 10),
          PintarJS.Color.fromHex(COLORS.crates[k]), null, true))
    }
  }


  if (in_menu) {
    if (wasKeyPressed("Escape")) {
      in_menu = false
      menuDiv.hidden = true
    }
  } else {
    if (wasKeyPressed("Escape")) {
      in_menu = true
      menuDiv.hidden = false
    }
  }
  pintar.endFrame()
}

function drawScreen2 () {
  // ctx.fillStyle = BACKGROUND_IS_WALL ? COLORS.wall : COLORS.floor

  /* entranceGradient = undefined
  entranceGradient2 = undefined
  exitGradient = undefined
  exitGradient2 = undefined */

  // COLORS.true_background = BACK_COLORS[true_timeline_undos.at(-1) || 0]
  // COLORS.floor = BACK_COLORS[true_timeline_undos.at(-1) || 0]
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

    /* let di = cur_level.exit[0]
    let dj = cur_level.exit[1] */
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
  // hijacking this function, lol
  return i <= 0 || i + 1 >= level.w || j <= 0 || j + 1 >= level.h

  // let doors = level.doors.filter(([di, dj, c]) => {
  //   return i == di && j == dj
  // })
  // return !doors.every(([di, dj, c]) => isDoorOpen(level, c))
}

function openHoleAt (level, i, j) {
  return level.holes.some(([hi, hj]) => {
    return hi == i && hj == j
  }) && !level.crates.some(crate => {
    [ci, cj] = crate.history.at(-1)
    return ci == i && cj == j && crate.inHole.get()
  }) && !level.holeCovers.some(cover => {
    [ci, cj] = cover.position
    return ci == i && cj == j && cover.get()
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
  /* let last_spr = level.player.inHole.value.at(-1)
  if (last_spr % 2 == 0) {
    last_spr +=1
  } else {
    last_spr -=1
  }
  level.player.inHole.value.push(last_spr) */
  level.crates.forEach(crate => {
    [ci, cj] = crate.history.at(-1)
    crate.history.push([ci, cj])
    crate.inmune_history.push(crate.inmune_history.at(-1)) // unchecked
    crate.inHole.add()
  })

  level.holeCovers.forEach((holeCover, i) => {
    holeCover.add()
    holeCover.inmune.push(holeCover.inmune.at(-1))
  });

  level.paintBlobs.forEach((paintBlob, i) => {
    paintBlob.add()
    paintBlob.inmune.push(paintBlob.inmune.at(-1))
  });

	level.hats.forEach((hat, i) => {
    hat.add()
    hat.inmune.push(hat.inmune.at(-1))
  });

  // fallFlying(level, 0)
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
  if (ALLOW_EDITOR) return false;
  if (level.targets.length === 0) return false;
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

levels = levels_named.map(([str, enter, exit, name, author]) => str2level(str, enter, exit, name, author))
levels.forEach(level => level.unmodified = true);

levels[0].extraDrawCode = drawIntroText
levels[1].extraDrawCode = drawSecondText
levels[3].extraDrawCode = drawXtoReallyText
levels[5].extraDrawCode = drawSkipText
levels[6].extraDrawCode = drawRecapText
levels[7].extraDrawCode = drawCtoRRText
levels.at(-1).extraDrawCode = drawEndScreen

let cur_level_n = 0
let localStorageWorks = true
let solved_levels = []
try {
  solved_levels = JSON.parse(localStorage.getItem("solved_levels") || '[]')
	for (let k=0; k<levels_named.length; k++) {
		if (JSON.parse(localStorage.getItem(levels_named[k]) || 'false')) {
			solved_levels.push(k)
		}
	}
} catch (err) {
  localStorageWorks = false
}
updateMenuButtons()

function Movable (i, j, inmune, extra = 0, superSolid = DEFAULT_FORBID_OVERLAP) {
  this.history = [[i, j]]
  if (typeof inmune === 'number') inmune = [inmune]
  this.inmune_history = inmune
  this.superSolid = superSolid
  for (let k = 0; k < extra; k++) {
    this.history.push([i, j])
  }
  this.inHole = new PropertyHistory(false, this.inmune_history, extra)
  // this.inmune = inmune;
}

function geoMapChar (chr) {
  if ('#,.'.indexOf(chr) != -1) return chr
  return '.'
}

function str2level (str, enter, exit, name, author) {
  str = str.split('\n')
  let w = str[0].length
  let h = str.length
  let geo = []
  let player = null;
  let crates = []
  let targets = []
  let buttons = []
  let doors = []
  let player_target = null
  let machines = []
  let holes = []
  let holeCovers = []
  let paintBlobs = []
	let hats = []
  for (let j = 0; j < h; j++) {
    let row = []
    for (let i = 0; i < w; i++) {
      let chr = str[j][i]
			if (chr === '*') {
				targets.push([i, j])
        row.push('.')
				continue;
			}
			let tileData = str2tile(chr);
      let [_geo, _player, _crates, _paint, _cover, _hole, _hat] = tileData;
			if (_player) {
				player = new Movable(i, j, DEFAULT_PLAYER_INMUNE_LEVEL)
			}
			_crates.forEach(n => {
				crates.push(new Movable(i, j, n))
				if (n > 2) ENABLE_UNDO_4 = true
			});
			if (_hole) {
				holes.push([i, j])
			}
			if (_cover > 0) {
				holeCovers.push(new PropertyHistory(true, _cover - 1))
				holeCovers.at(-1).position = [i, j]
				if (_cover > 2) ENABLE_UNDO_4 = true
			}
			if (_paint > 0) {
				paintBlobs.push(new PropertyHistory(true, _paint - 1))
				paintBlobs.at(-1).position = [i, j]
				if (_paint > 2) ENABLE_UNDO_4 = true
			}
			if (_hat > 0) {
				hats.push(new PropertyHistory(true, _hat - 1))
				hats.at(-1).position = [i, j]
				if (_hat > 2) ENABLE_UNDO_4 = true
			}
      row.push(_geo)
    }
    geo.push(row)
  }
  if (player === null) return false
  /*if (targets.length === 0) {
    targets.push([0,0])
  }*/
  let level = { geo: geo, player: player, crates: crates, targets: targets,
    buttons: buttons, doors: doors, player_target: player_target,
    machines: machines, holes: holes, holeCovers: holeCovers, paintBlobs: paintBlobs, hats: hats,
    w: w, h: h, enter: enter, exit: exit, unmodified: false, name: name, author: author }
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
  real_times = [0,0,0]
  won_cur_level = false
  // true_timeline_undos = []
  input_queue = []
	fallFlying (level, 0, true)
  return level
}

function dir2spr (di, dj, pushing) {
  if (di == 0) {
    return 1 + dj + (pushing ? 8 : 0)
  } else {
    return 5 + di + (pushing ? 8 : 0)
  }
}

// window.addEventListener('resize', e => {
  // canvas.width = innerWidth
  // canvas.height = innerHeight
  // pintar.resizeAndCenter(64, 64);
  // setTimeout(recalcTileSize, 100)
  // if (in_last_level) drawScreen()

  // let width  = canvas.clientWidth;
  // var height = canvas.clientHeight;
  // const dpr = window.devicePixelRatio;
  // const {width2, height2} = canvas.getBoundingClientRect();
  // const width  = Math.floor(width2 * dpr);
  // const height = Math.floor(height2 * dpr);
  //
  // if (canvas.width !== width ||  canvas.height !== height) {
  //   // canvas.width = width;
  //   // canvas.height = height;
  //   // main_container.style.fontSize = (width / 40)  + 'px';
  // }
// })

window.addEventListener('load', e => {
	window.focus();
  main_container = document.getElementById("container")
  loadLevel(0) // 152 159 60
  // window.dispatchEvent(new Event('resize'))
  // setTimeout(function () { window.dispatchEvent(new Event('resize')) }, 100)
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

function tile2str ([geo, player, crates, paint, cover, hole, hat]) {
	if (geo === '#') return '#'
	if (player) return 'O'
	if (crates.length > 0) {
		if (crates.length > 1) throw new Error("can't save level: several statues on the same tile")
		if (cover > 0) throw new Error("can't save level: statue and hole cover on the same tile")
		if (paint > 0) throw new Error("can't save level: statue and circle on the same tile")
		if (hat > 0) throw new Error("can't save level: statue and hat on the same tile")
		if (hole) {
			return 'ABCD'[crates[0]]
		} else {
			return '1234'[crates[0]]
		}
	} else {
		// no crates
		if (cover > 0) {
			if (paint > 0) throw new Error("can't save level: hole cover and circle on the same tile")
			if (hat > 0) throw new Error("can't save level: hole cover and hat on the same tile")
			return 'jkl;'[cover - 1]
		} else {
			if (paint > 0) {
				if (hat > 0) throw new Error("can't save level: circle and hat on the same tile")
				return 'uiop'[paint - 1]
			} else {
				if (hat > 0) {
					HATS_ENABLED = true
					return 'abcd'[hat - 1]
				} else {
					return hole ? '_' : '.'
				}
			}
		}
	}
}

function str2tile (char) {
	switch (char) {
		case '#':
			return ['#', false, [], 0, 0, false,0]
		case '.':
			return ['.', false, [], 0, 0, false,0]
		case 'O':
			return ['.', true, [], 0, 0, false, 0]
		case '_':
			return ['.', false, [], 0, 0, true, 0]
		case '1':
		case '2':
		case '3':
		case '4':
			return ['.', false, ['1234'.indexOf(char)], 0, 0, false, 0]
		case 'A':
		case 'B':
		case 'C':
		case 'D':
			return ['.', false, ['ABCD'.indexOf(char)], 0, 0, true, 0]
		case 'j':
		case 'k':
		case 'l':
		case ';':
			return ['.', false, [], 0, 'jkl;'.indexOf(char) + 1, true, 0]
		case 'u':
		case 'i':
		case 'o':
		case 'p':
			return ['.', false, [], 'uiop'.indexOf(char) + 1, 0, false, 0]
		case 'a':
		case 'b':
		case 'c':
		case 'd':
			HATS_ENABLED = true
			return ['.', false, [], 0, 0, false, 'abcd'.indexOf(char) + 1]
		default:
			throw new Error("Unexpected char: " + char)
	}
	// return [geo, player, crate, paint, cover, hole, hat]
}

function level2str (level) {
  let res = []
  let [pi, pj] = level.player.history.at(-1)
  for (let j = 0; j < level.h; j++) {
    let row = []
    for (let i = 0; i < level.w; i++) {
			let cur = [level.geo[j][i], false, [], 0, 0, false, 0]
			row.push(cur)
    }
    res.push(row)
  }

	res[pj][pi][1] = true

	level.holes.forEach(([hi, hj]) => {
		res[hj][hi][5] = true
	})

	level.holeCovers.forEach(cover => {
		let [hi, hj] = cover.position;
		res[hj][hi][4] = cover.inmune.at(-1) + 1
	})

	level.paintBlobs.forEach(blob => {
		let [hi, hj] = blob.position;
		res[hj][hi][3] = blob.inmune.at(-1) + 1
	})

	level.hats.forEach(hat => {
		let [hi, hj] = hat.position;
		res[hj][hi][6] = hat.inmune.at(-1) + 1
	})

  level.crates.forEach(crate => {
    let [ci, cj] = crate.history.at(-1)
    let n = crate.inmune_history.at(-1)
    res[cj][ci][2].push(n)
  })

  return res.map(x => x.map(tile2str).join('')).join('\n')
}

function level2strOld (level) {
  let res = []
  let [pi, pj] = level.player.history.at(-1)
  for (let j = 0; j < level.h; j++) {
    let row = []
    for (let i = 0; i < level.w; i++) {
      let over_paint = level.paintBlobs.findIndex(paintBlob => {
        let [hi, hj] = paintBlob.position;
        return hi == i && hj == j;
      });

      if (!(level.geo[j][i] === '.')) {
        row.push('#')
      } else if (openHoleAt(level, i, j)) {
        row.push('_')
      } else if (over_paint != -1) {
        row.push('uiop'[level.paintBlobs[over_paint].inmune.at(-1)])
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
	level.holeCovers.forEach(cover => {
		let [hi, hj] = cover.position;
		res[hj][hi] = 'jkl;'[cover.inmune.at(-1)]
	})

  level.crates.forEach(crate => {
    let [ci, cj] = crate.history.at(-1)
    let n = crate.inmune_history.at(-1)
    let cur = res[cj][ci]
    res[cj][ci] = cur == '.' ? '123456789'[n] : 'ABCDEFGHI'[n]
  })
  return res.map(x => x.join('')).join('\n')
}

function exportToText () {
  document.getElementById('inText').value = level2str(levels[cur_level_n])
}

function rotateLevel (ccw) {
	let level = levels[cur_level_n]
	let h = level.h
	let w = level.w
	let new_geo = [];
	for (let j=0; j<w; j++) {
		let new_row = [];
		for (let i=0; i<h; i++) {
			if (ccw) {
				new_row.push(level.geo[i][w - 1 - j])
			} else {
				new_row.push(level.geo[h - 1 - i][j])
			}
		}
		new_geo.push(new_row)
	}
	if (ccw) {
		transformEverything(level, ([i, j]) => [j, w - 1 - i])
	} else {
		transformEverything(level, ([i, j]) => [h - 1 - j, i])
	}
	level.geo = new_geo
	level.h = w
	level.w = h
	if (ccw) {
		level.player.inHole.value = level.player.inHole.value.map(k => {
			return [4, 5, 6, 7, 2, 3, 0, 1, 12, 13, 14, 15, 10, 11, 8, 9][k]
		})
	} else {
		level.player.inHole.value = level.player.inHole.value.map(k => {
			return [6, 7, 4, 5, 0, 1, 2, 3, 14, 15, 12, 13, 8, 9, 10, 11][k]
		})
	}
}
function flipHorizontalLevel () {
	let level = levels[cur_level_n]
	let w = level.w
	level.geo.forEach(row => row.reverse());

	transformEverything(level, ([i, j]) => [w - i - 1, j])
	level.player.inHole.value = level.player.inHole.value.map(k => {
		let j = Math.floor(k / 4)
		if (j !== 1 && j !== 3) return k
		let i = k % 4
		return (i + 2) % 4 + j * 4
	})
}

function flipVerticalLevel () {
	let level = levels[cur_level_n]
	let h = level.h
	level.geo.reverse();

	transformEverything(level, ([i, j]) => [i, h - j - 1])
	level.player.inHole.value = level.player.inHole.value.map(k => {
		let j = Math.floor(k / 4)
		if (j !== 0 && j !== 2) return k
		let i = k % 4
		return (i + 2) % 4 + j * 4
	})
}

function resizeLevel (a, b, c, d, level) {
	level = level || levels[cur_level_n]
	let w = level.w
	let h = level.h
	let [pi, pj] = level.player.history.at(-1)

	if (a > 0) {
		moveEverything(level, 0, 1)
		level.geo.unshift(Array(w).fill('#'))
		h += 1
	} else if (a < 0 && pj > 1) {
		for (let k=0; k<w; k++) {
			deleteStuffAt(level, k, 0)
		}
		moveEverything(level, 0, -1)
		level.geo.shift()
		h -= 1
	}

	if (c > 0) {
		level.geo.push(Array(w).fill('#'))
		h += 1
	} else if (c < 0 && pj < h - 2) {
		for (let k=0; k<w; k++) {
			deleteStuffAt(level, k, h - 1)
		}
		level.geo.pop()
		h -= 1
	}

	if (b > 0) {
		moveEverything(level, 1, 0)
		level.geo.forEach(row => row.unshift('#'))
		w += 1
	} else if (b < 0 && pi > 1) {
		for (let k=0; k<h; k++) {
			deleteStuffAt(level, 0, k)
		}
		moveEverything(level, -1, 0)
		level.geo.forEach(row => row.shift())
		w -= 1
	}

	if (d > 0) {
		level.geo.forEach(row => row.push('#'))
		w += 1
	} else if (d < 0 && pi < w - 2) {
		level.geo.forEach(row => row.pop())
		for (let k=0; k<h; k++) {
			deleteStuffAt(level, w - 1, k)
		}
		w -= 1
	}

	level.h = h
	level.w = w
}

function deleteStuffAt (cur_level, mi, mj) {
	cur_level.holes = cur_level.holes.filter(([i, j]) =>	i != mi || j != mj)
	cur_level.targets = cur_level.targets.filter(([i, j]) =>	i != mi || j != mj)
	cur_level.crates = cur_level.crates.filter(crate =>	{
		let [i, j] = crate.history.at(-1)
		return i != mi || j != mj
	})
	cur_level.paintBlobs = cur_level.paintBlobs.filter(blob =>	{
		let [i, j] = blob.position
		return i != mi || j != mj
	})
	cur_level.hats = cur_level.hats.filter(hat =>	{
		let [i, j] = hat.position
		return i != mi || j != mj
	})
	cur_level.holeCovers = cur_level.holeCovers.filter(cover =>	{
		let [i, j] = cover.position
		return i != mi || j != mj
	})
	cur_level.machines = cur_level.machines.filter(([i, j, t]) =>	i != mi || j != mj)
	if (cur_level.player.inHole.value.at(-1) < 0) {
		let [pi, pj] = cur_level.player.history.at(-1);
		if (pi === mi && pj === mj) {
			cur_level.player.inHole.value[cur_level.player.inHole.value.length - 1] += 16;
		}
	}
}

function deleteCustomStuffAt (cur_level, mi, mj, holes, crates, blobs, covers) {
	if (holes) cur_level.holes = cur_level.holes.filter(([i, j]) =>	i != mi || j != mj)
	cur_level.targets = cur_level.targets.filter(([i, j]) =>	i != mi || j != mj)
	if (crates) cur_level.crates = cur_level.crates.filter(crate =>	{
		let [i, j] = crate.history.at(-1)
		return i != mi || j != mj
	})
	if (blobs) cur_level.paintBlobs = cur_level.paintBlobs.filter(blob =>	{
		let [i, j] = blob.position
		return i != mi || j != mj
	})
	if (covers) cur_level.holeCovers = cur_level.holeCovers.filter(cover =>	{
		let [i, j] = cover.position
		return i != mi || j != mj
	})
	cur_level.machines = cur_level.machines.filter(([i, j, t]) =>	i != mi || j != mj)
	cur_level.hats = cur_level.hats.filter(hat =>	{
		let [i, j] = hat.position
		return i != mi || j != mj
	})
}

function moveEverything (cur_level, di, dj) {
	transformEverything(cur_level, ([i,j]) => [i+di,j+dj])
}

function transformEverything (cur_level, f) {
	cur_level.holes = cur_level.holes.map(f)
	cur_level.targets = cur_level.targets.map(f)
	cur_level.holeCovers.forEach(cover => cover.position = f(cover.position));
	cur_level.paintBlobs.forEach(cover => cover.position = f(cover.position));
	cur_level.hats.forEach(cover => cover.position = f(cover.position));
	cur_level.crates.forEach(crate =>	{
		crate.history = crate.history.map(f)
	})
	cur_level.player.history = cur_level.player.history.map(f)
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
  } /* else {
    in_last_level = true
    recalcTileSize()
  } */
}

/*transitionElement.style.animation="openUp 4s linear 0 infinite forwards both";*/

function initTransitionToLevel (n,extra) {
	if (extra) n += 19
  if (n >= 0 && n < levels.length - 1) {
    // transitionElement.style.animation="flashUp .5s linear";
    let di = levels[n].enter[0]
    let dj = levels[n].enter[1]
    if (di ===  1 && dj === 0) transitionElement.className = "flashRightClass"
    if (di === -1 && dj === 0) transitionElement.className = "flashLeftClass"
    if (di === 0 && dj ===  1) transitionElement.className = "flashDownClass"
    if (di === 0 && dj === -1) transitionElement.className = "flashUpClass"
    setTimeout(() => transitionElement.className = "", 500)
    setTimeout(() => {
      menuDiv.hidden = true;
      in_menu = false;
    }, 250)
    level_transition_time = 1
    transitionSound.play()
    screen_transition_turn = true
    next_level = n
  }
}

function initTransitionToNextLevel () {
  if (cur_level_n < levels.length - 1) {
    // transitionElement.style.animation="flashUp .5s linear";

    let di = levels[cur_level_n + 1].enter[0]
    let dj = levels[cur_level_n + 1].enter[1]
    if (di ===  1 && dj === 0) transitionElement.className = "flashRightClass"
    if (di === -1 && dj === 0) transitionElement.className = "flashLeftClass"
    if (di === 0 && dj ===  1) transitionElement.className = "flashDownClass"
    if (di === 0 && dj === -1) transitionElement.className = "flashUpClass"
    setTimeout(() => transitionElement.className = "", 500)
    level_transition_time = 1
    transitionSound.play()
    screen_transition_turn = true
    next_level = cur_level_n + 1
  }
}

function initTransitionToPrevLevel () {
  if (cur_level_n > 0) {
    let di = levels[cur_level_n - 1].enter[0]
    let dj = levels[cur_level_n - 1].enter[1]
    if (di ===  1 && dj === 0) transitionElement.className = "flashRightClass"
    if (di === -1 && dj === 0) transitionElement.className = "flashLeftClass"
    if (di === 0 && dj ===  1) transitionElement.className = "flashDownClass"
    if (di === 0 && dj === -1) transitionElement.className = "flashUpClass"
    setTimeout(() => transitionElement.className = "", 500)
    level_transition_time = 1
    transitionSound.play()
    screen_transition_turn = true
    next_level = cur_level_n - 1
  }
}

function updateMenuButtons () {
  if (!levelSelectButtons) return
  let total_solved = solved_levels.length
  let unlock_n = [1, 3, 5, 6, 7, 9, 10, 12, 13, 15, 17, 18];
  let n_unlocked = unlock_n[total_solved] || 18;
  for (let k = 0; k < levels.length - 1; k++) {
		if (k > 18) {
			levelSelectButtons[k - 1].className = (solved_levels.indexOf(k) === -1) ? "levelSelectButton" : "solvedSelectButton"
			levelSelectButtons[k - 1].disabled = false
		} else {
    	if (solved_levels.indexOf(k) === -1) {
	      levelSelectButtons[k].className = (ALLOW_CHEATS || n_unlocked > k) ? "levelSelectButton" : "lockedSelectButton"
	      // levelSelectButtons[k].disabled = n_unlocked <= k
	    } else {
	      levelSelectButtons[k].className = "solvedSelectButton"
	      levelSelectButtons[k].disabled = false
	    }
		}
  }
	if (cur_level_n !== 18) {
	  let curButton = levelSelectButtons[cur_level_n > 18 ? cur_level_n - 1 : cur_level_n]
	  if (!curButton) return
	  curButton.className += (solved_levels.indexOf(cur_level_n) === -1) ? " curLevelSelectButton" : " curLevelSelectWonButton"
	  curButton.disabled = false
	}
}

function loadLevel (n) {
	let from_editor = ALLOW_EDITOR //cur_level_n === "editor"
  real_times = [0,0,0]
  won_cur_level = false
  in_last_level = n == 18 || n == 33
  cur_level_n = n
  true_timeline_undos = []
  input_queue = []
  let cur_level = levels[cur_level_n]
  cur_level.crates.forEach(crate => {
    crate.history.splice(1)
    crate.inmune_history.splice(1)
    crate.inHole.value.splice(1)
  })
  cur_level.paintBlobs.forEach(paintBlob => {
    paintBlob.value.splice(1)
    paintBlob.inmune.splice(1)
  })
	cur_level.holeCovers.forEach(holeCover => {
    holeCover.value.splice(1)
    holeCover.inmune.splice(1)
  })
	cur_level.hats.forEach(hat => {
    hat.value.splice(1)
    hat.inmune.splice(1)
  })
  cur_level.player.history.splice(1)
  cur_level.player.inmune_history.splice(1)
  cur_level.player.inHole.value.splice(1)
  cur_level.player.inHole.value[0] = dir2spr(cur_level.enter[0], cur_level.enter[1], false) + player_parity
	fixPlayerOutsideBounds(cur_level)
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
  if (ALLOW_EDITOR) {
    ENABLE_RESTART = true
    ENABLE_UNDO_2 = true
    ENABLE_UNDO_3 = true
  }
  setExtraDisplay(ALLOW_EDITOR ? "editor" : n)
  updateMenuButtons()
	if (from_editor) enterEditor()
}

function maybeBreakHoleCovers (level, real_tick) {
	level.holeCovers.forEach(holeCover => {
		if (holeCover.value[real_tick - 1]) {
			//console.log("might break!")
			// hole might break
			let [hi, hj] = holeCover.position
			if (weightOnTile(level, real_tick-1, hi, hj) && !weightOnTile(level, real_tick, hi, hj)) {
				// hole broke!
				//console.log("broke!")
				holeCover.value[real_tick] = false
			} else {
				//console.log("didn't break!")
				holeCover.value[real_tick] = true
			}
		} else { // hole is already broken
			holeCover.value[real_tick] = false
		}
	})
}

function fixPlayerOutsideBounds (level) {
	let [pi, pj] = level.player.history.at(-1)
	while (pi < 1) {
		resizeLevel(0,1,0,0, level)
		let temp = level.player.history.at(-1)
		pi = temp[0]
		pj = temp[1]
	}
	while (pi > level.w - 2) {
		resizeLevel(0,0,0,1, level)
		let temp = level.player.history.at(-1)
		pi = temp[0]
		pj = temp[1]
	}
	while (pj < 1) {
		resizeLevel(1,0,0,0, level)
		let temp = level.player.history.at(-1)
		pi = temp[0]
		pj = temp[1]
	}
	while (pj > level.h - 2) {
		resizeLevel(0,0,1,0, level)
		let temp = level.player.history.at(-1)
		pi = temp[0]
		pj = temp[1]
	}
	level.geo[pj][pi] = '.'
}

function playUndoSound(cur_undo) {
	if (!last_t_undo_sound || last_t - last_t_undo_sound > 220) {
		// console.log(last_t - last_t_undo_sound)
		if (undoSounds[cur_undo - 1]) undoSounds[cur_undo - 1].play()
		last_t_undo_sound = last_t
	}
}


function recalcTileSize (level) {
  /* if (in_last_level) {
    let tile_w = Math.min(canvas.width / (12), 60)
    let tile_h = Math.min(canvas.height / (12), 60)
    TILE = Math.floor(Math.min(tile_h, tile_w))
    OFFX = Math.floor((canvas.width - (TILE * 12)) / 2)
    OFFY = Math.floor((canvas.height - (TILE * 12)) / 2)
    return
  } */
  if (!level) level = levels[cur_level_n]

  // let width  = canvas.clientWidth;
  // var height = canvas.clientHeight;
  // if (canvas.width !== width ||  canvas.height !== height) {
  //   canvas.width  = width;
  //   canvas.height = height;
  //   main_container.style.fontSize = (width / 40)  + 'px';
  // }
  const dpr = window.devicePixelRatio;
  const {width, height} = canvas.getBoundingClientRect();
  const displayWidth  = Math.round(width * dpr);
  const displayHeight = Math.round(height * dpr);

  // Check if the canvas is not the same size.
  if (canvas.width !== displayWidth ||  canvas.height !== displayHeight) {
    canvas.width = width;
    canvas.height = height;
    main_container.style.fontSize = (width / 40)  + 'px';
  }

  // let tile_w = Math.min(canvas.width / (level.w), 64)
  // let tile_h = Math.min(canvas.height / (level.h), 64)
  let tile_w = (canvas.width / (level.w))
  let tile_h = (canvas.height / (level.h))
  // let tile_w = Math.floor(canvas.width / (level.w))
  // let tile_h = Math.floor(canvas.height / (level.h))
  // let tile_w = Math.floor(canvas.width / (level.w * 16)) * 16
  // let tile_h = Math.floor(canvas.height / (level.h * 16)) * 16

  // console.log(tile_w, tile_h);
  // tile_w = Math.min(tile_w, 64)
  // tile_h = Math.min(tile_h, 64)
  // let tile_w = 32
  // let tile_h = 32
  let prev_tile = TILE
  // if (ALLOW_EDITOR) {
  //   TILE = Math.floor(Math.min(tile_h, tile_w) * 0.8)
  // } else {
  // TILE = Math.ceil(Math.min(tile_h, tile_w))
  TILE = Math.min(tile_h, tile_w)
  // TILE = Math.floor(Math.min(tile_h, tile_w))
  // TILE = Math.floor(Math.min(tile_h, tile_w) / 16) * 16
  // }
  OFFX = Math.floor((canvas.width - (TILE * level.w)) / 2)
  OFFY = Math.floor((canvas.height - (TILE * level.h)) / 2)
  if (prev_tile !== TILE) {
    floor_sprite.scale = new PintarJS.Point(TILE / 16, TILE / 16)
    black_sprite.scale = new PintarJS.Point(TILE / 16, TILE / 16)
    hole_sprite.scale = new PintarJS.Point(TILE / 16, TILE / 16)
    holeCover_sprite.scale = new PintarJS.Point(TILE / 16, TILE / 16)
    holeCoverBroken_sprite.scale = new PintarJS.Point(TILE / 16, TILE / 16)
		holeCoverAbove_sprite.scale = new PintarJS.Point(TILE / 16, TILE / 16)
		holeCoverBrokenAbove_sprite.scale = new PintarJS.Point(TILE / 16, TILE / 16)
    paintBlob_sprite.scale = new PintarJS.Point(TILE / 16, TILE / 16)
    paintBlobBroken_sprite.scale = new PintarJS.Point(TILE / 16, TILE / 16)
		floorHat_sprite.scale = new PintarJS.Point(TILE / 16, TILE / 16)
    geoModularSprite.scale = new PintarJS.Point(TILE / 16, TILE / 16)
		crate_sprites.forEach(spr => spr.scale = new PintarJS.Point(TILE / 16, TILE / 16))
		crate_hole_sprites.forEach(spr => spr.scale = new PintarJS.Point(TILE / 16, TILE / 16))
		raw_player_sprites.forEach(spr => spr.scale = new PintarJS.Point(TILE / 16, TILE / 16))
		raw_hat_sprites.forEach(spr => spr.scale = new PintarJS.Point(TILE / 16, TILE / 16))
  }
}

function doUndo (n) {
  input_queue.push(n.toString())
}

function movableChangedLastTurn (movable) {
	let [ci1, cj1] = movable.history.at(-1)
	let [ci2, cj2] = movable.history.at(-2)
	if (movable.inmune_history.at(-1) != movable.inmune_history.at(-2)) return true
	if (movable.inHole.value.at(-1) != movable.inHole.value.at(-2)) return true
	return ci1 != ci2 || cj1 != cj2
}

function thingyChangedStateLastTurn (thingy) {
	return thingy.value.at(-1) != thingy.value.at(-2)
}

function anyChangesLastTurn (level) {
	return movableChangedLastTurn(level.player) || level.crates.some(movableChangedLastTurn)
		|| level.holeCovers.some(thingyChangedStateLastTurn)
		|| level.paintBlobs.some(thingyChangedStateLastTurn)
		|| level.hats.some(thingyChangedStateLastTurn)
}

function getKeyRetriggerTime (key) {
  // if ('123456789'.indexOf(key) != -1) return first_undo_press ? KEY_RETRIGGER_TIME * 1.2 : KEY_RETRIGGER_TIME / 2
  // if ('wasd'.indexOf(key) != -1) return TURN_SPEED * 1000;
  if (key == 'z' || key == 'x' || key == 'c' || key == 'v') return first_undo_press ? KEY_RETRIGGER_TIME * 1.2 : KEY_RETRIGGER_TIME / 2
  // return first_key_press ? KEY_RETRIGGER_TIME * 1.2 : KEY_RETRIGGER_TIME / 2
  if ('wasdnm'.indexOf(key) != -1) return KEY_RETRIGGER_TIME
  return Infinity
}

function fallFlying (level, undo_level, soundless=false) {
  // drop crates over holes
  let flying_crates = level.crates.filter(crate => {
    let [ci, cj] = crate.history.at(-1)
		let inmunity = crate.inmune_history.at(-1)
    return openHoleAt(level, ci, cj) && inmunity >= undo_level
    // return !crate.inHole.get() &&
  })
  // console.log('flying crates: ', flying_crates);
  flying_crates.forEach(crate => {
    crate.inHole.value[crate.inHole.value.length - 1] = true
  });

	let flying_player = false;
	if (level.player.inmune_history.at(-1) >= undo_level && level.player.inHole.value.at(-1) >= 0) {
		let [pi, pj] = level.player.history.at(-1)
		flying_player = openHoleAt(level, pi, pj)
		if (flying_player) {
			level.player.inHole.value[level.player.inHole.value.length - 1] -= 16;
		}
	}
  if ((flying_crates.length || flying_player) > 0 && !soundless) holeSound.play()
}

function movesBackToEntrance (level, pi, pj, cur_di, cur_dj) {
  let [si, sj] = level.player.history[0]
  return pi == si && pj == sj && cur_di == -level.enter[0] && cur_dj == -level.enter[1]
}

function weightOnTile (level, tick, i, j) {
	let [pi, pj] = level.player.history[tick]
	if (pi === i && pj === j) return true;
	return level.crates.some(crate => {
		let [ci, cj] = crate.history[tick];
		return ci === i && cj === j;
	})
}

function draw (timestamp) {
  if (!last_t) last_t = timestamp
  globalT += timestamp - last_t
  last_t = timestamp
  // ctx.clearRect(0, 0, canvas.width, canvas.height);
  // ctx.fillStyle = ALLOW_EDITOR ? COLORS.floorWin : COLORS.background // #75366D
  // ctx.fillStyle = COLORS.background // #75366D
  // ctx.fillRect(0, 0, canvas.width, canvas.height)

  /* if (in_last_level) {
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
  } */

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

  // console.log(first_undo_press)

  if (wasKeyPressed("editor") && (cur_level_n === 'editor' || (cur_level_n !== 18 && cur_level_n !== 33))) {
    toggleEditor()
  }

  let cur_level = levels[cur_level_n]
  recalcTileSize(cur_level)

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
    let dirs = get_times_directions(true_timeline_undos.length - 1)
    for (let k=0; k<real_times.length; k++) {
      real_times[k] += dirs[k] * 20 / 11
    }
  }/* else {
    let dirs = get_times_directions(true_timeline_undos.length - 1)
    for (let k=0; k<real_times.length; k++) {
      real_times[k] += dirs[k]
    }
  }*/

  if (level_transition_time > 0) {
    // console.log("in transition");
    let starts_above_half = level_transition_time > 0.5
    level_transition_time -= TRANSITION_SPEED // TURN_SPEED * 0.1
    let ends_below_half = level_transition_time <= 0.5
    if (starts_above_half && ends_below_half) {
      // nextLevel()
      // console.log("gonna load: ", next_level);
      loadLevel(next_level)
    }
    // if (level_transition_time <= 0) nextLevel();
    level_transition_time = Math.max(level_transition_time, 0)
  }
  if (intro_time > 0 && true_timeline_undos.length > 0) {
    intro_time -= TRANSITION_SPEED // TURN_SPEED * 0.1
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
			doMainTurnLogic(cur_level)
		}
  }

  if (ALLOW_EDITOR) {
    // EDITOR
    let mi = Math.round((mouse.x - OFFX) / TILE - 0.5)
    let mj = Math.round((mouse.y - OFFY) / TILE - 0.5)
    if (mi >= 0 && mi < cur_level.w && mj >= 0 && mj < cur_level.h) {
      if (isButtonDown(0)) {
        let [pi, pj] = cur_level.player.history.at(-1)
        if (pi !== mi || pj !== mj) {
          cur_level.geo[mj][mi] = '#'
					cur_level.unmodified = false
					deleteStuffAt(cur_level, mi, mj)
          /*cur_level.holes = cur_level.holes.filter(([i, j]) =>	i != mi || j != mj)
          cur_level.targets = cur_level.targets.filter(([i, j]) =>	i != mi || j != mj)
          cur_level.crates = cur_level.crates.filter(crate =>	{
            let [i, j] = crate.history.at(-1)
            return i != mi || j != mj
          })
          cur_level.paintBlobs = cur_level.paintBlobs.filter(blob =>	{
            let [i, j] = blob.position
            return i != mi || j != mj
          })
					cur_level.holeCovers = cur_level.holeCovers.filter(cover =>	{
            let [i, j] = cover.position
            return i != mi || j != mj
          })
          cur_level.machines = cur_level.machines.filter(([i, j, t]) =>	i != mi || j != mj)*/
        }
      } else if (isButtonDown(1)) {
        cur_level.geo[mj][mi] = '.'
				cur_level.unmodified = false
				deleteStuffAt(cur_level, mi, mj)
        /*cur_level.holes = cur_level.holes.filter(([i, j]) =>	i != mi || j != mj)
        cur_level.targets = cur_level.targets.filter(([i, j]) =>	i != mi || j != mj)
        cur_level.crates = cur_level.crates.filter(crate =>	{
          let [i, j] = crate.history.at(-1)
          return i != mi || j != mj
        })
        cur_level.paintBlobs = cur_level.paintBlobs.filter(blob =>	{
          let [i, j] = blob.position
          return i != mi || j != mj
        })
				cur_level.holeCovers = cur_level.holeCovers.filter(cover =>	{
					let [i, j] = cover.position
					return i != mi || j != mj
				})
        cur_level.machines = cur_level.machines.filter(([i, j, t]) =>	i != mi || j != mj)*/
      } else if (mi > 0 && mi + 1 < cur_level.w && mj > 0 && mj + 1 < cur_level.h) {
        if (wasKeyPressed('1')) {
          cur_level.geo[mj][mi] = '.'
          cur_level.crates.push(new Movable(mi, mj, 0, extra = true_timeline_undos.length))
					fallFlying(cur_level)
        } else if (wasKeyPressed('2')) {
          cur_level.geo[mj][mi] = '.'
          cur_level.crates.push(new Movable(mi, mj, 1, extra = true_timeline_undos.length))
					fallFlying(cur_level)
        } else if (wasKeyPressed('3')) {
          cur_level.geo[mj][mi] = '.'
          cur_level.crates.push(new Movable(mi, mj, 2, extra = true_timeline_undos.length))
					fallFlying(cur_level)
        } else if (wasKeyPressed('4')) {
          cur_level.geo[mj][mi] = '.'
          cur_level.crates.push(new Movable(mi, mj, 3, extra = true_timeline_undos.length))
					fallFlying(cur_level)
          ENABLE_UNDO_4 = true
        } else if (wasKeyPressed('e')) {
          cur_level.geo[mj][mi] = '.'
					deleteCustomStuffAt(cur_level, mi, mj, true, false, true, true)
          cur_level.holes.push([mi, mj])
					fallFlying(cur_level)
        } else if (wasKeyPressed('B1')) { // paint blobs
          cur_level.geo[mj][mi] = '.'
					deleteCustomStuffAt(cur_level, mi, mj, true, false, true, true)
          cur_level.paintBlobs.push(new PropertyHistory(true, 0, extra = true_timeline_undos.length))
          cur_level.paintBlobs.at(-1).position = [mi, mj]
        } else if (wasKeyPressed('B2')) {
          cur_level.geo[mj][mi] = '.'
					deleteCustomStuffAt(cur_level, mi, mj, true, false, true, true)
          cur_level.paintBlobs.push(new PropertyHistory(true, 1, extra = true_timeline_undos.length))
          cur_level.paintBlobs.at(-1).position = [mi, mj]
        } else if (wasKeyPressed('B3')) {
          cur_level.geo[mj][mi] = '.'
					deleteCustomStuffAt(cur_level, mi, mj, true, false, true, true)
          cur_level.paintBlobs.push(new PropertyHistory(true, 2, extra = true_timeline_undos.length))
          cur_level.paintBlobs.at(-1).position = [mi, mj]
        } else if (wasKeyPressed('B4')) {
          cur_level.geo[mj][mi] = '.'
					deleteCustomStuffAt(cur_level, mi, mj, true, false, true, true)
          cur_level.paintBlobs.push(new PropertyHistory(true, 3, extra = true_timeline_undos.length))
          cur_level.paintBlobs.at(-1).position = [mi, mj]
        } else if (wasKeyPressed('C1')) { // hole covers
          cur_level.geo[mj][mi] = '.'
					deleteCustomStuffAt(cur_level, mi, mj, true, false, true, true)
					cur_level.holes.push([mi, mj])
          cur_level.holeCovers.push(new PropertyHistory(true, 0, extra = true_timeline_undos.length))
          cur_level.holeCovers.at(-1).position = [mi, mj]
        } else if (wasKeyPressed('C2')) {
          cur_level.geo[mj][mi] = '.'
					deleteCustomStuffAt(cur_level, mi, mj, true, false, true, true)
					cur_level.holes.push([mi, mj])
          cur_level.holeCovers.push(new PropertyHistory(true, 1, extra = true_timeline_undos.length))
          cur_level.holeCovers.at(-1).position = [mi, mj]
        } else if (wasKeyPressed('C3')) {
          cur_level.geo[mj][mi] = '.'
					deleteCustomStuffAt(cur_level, mi, mj, true, false, true, true)
					cur_level.holes.push([mi, mj])
          cur_level.holeCovers.push(new PropertyHistory(true, 2, extra = true_timeline_undos.length))
          cur_level.holeCovers.at(-1).position = [mi, mj]
        } else if (wasKeyPressed('C4')) {
          cur_level.geo[mj][mi] = '.'
					deleteCustomStuffAt(cur_level, mi, mj, true, false, true, true)
					cur_level.holes.push([mi, mj])
          cur_level.holeCovers.push(new PropertyHistory(true, 3, extra = true_timeline_undos.length))
          cur_level.holeCovers.at(-1).position = [mi, mj]
        } else if (wasKeyPressed('D1')) { // hats
          cur_level.geo[mj][mi] = '.'
					deleteCustomStuffAt(cur_level, mi, mj, true, false, true, true)
          cur_level.hats.push(new PropertyHistory(true, 0, extra = true_timeline_undos.length))
          cur_level.hats.at(-1).position = [mi, mj]
					HATS_ENABLED = true
        } else if (wasKeyPressed('D2')) {
          cur_level.geo[mj][mi] = '.'
					deleteCustomStuffAt(cur_level, mi, mj, true, false, true, true)
          cur_level.hats.push(new PropertyHistory(true, 1, extra = true_timeline_undos.length))
          cur_level.hats.at(-1).position = [mi, mj]
					HATS_ENABLED = true
        } else if (wasKeyPressed('D3')) {
          cur_level.geo[mj][mi] = '.'
					deleteCustomStuffAt(cur_level, mi, mj, true, false, true, true)
          cur_level.hats.push(new PropertyHistory(true, 2, extra = true_timeline_undos.length))
          cur_level.hats.at(-1).position = [mi, mj]
					HATS_ENABLED = true
        } else if (wasKeyPressed('D4')) {
          cur_level.geo[mj][mi] = '.'
					deleteCustomStuffAt(cur_level, mi, mj, true, false, true, true)
          cur_level.hats.push(new PropertyHistory(true, 3, extra = true_timeline_undos.length))
          cur_level.hats.at(-1).position = [mi, mj]
					HATS_ENABLED = true
        }
      }
    }
  }

  let is_won = isWon(cur_level)
  if (is_won) {
    if (solved_levels.indexOf(cur_level_n) === -1) {
      solved_levels.push(cur_level_n)
      if (localStorageWorks) {
				// localStorage.setItem("solved_levels", JSON.stringify(solved_levels))
				localStorage.setItem(levels_named[cur_level_n], "true")
			}
      updateMenuButtons()
    }

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
  /*if (ALLOW_CHEATS && wasKeyPressed('m') && cur_level_n < levels.length - 1) {
    // nextLevel()
    // cur_level = levels[cur_level_n]
    if (level_transition_time == 0) {
      initTransitionToNextLevel()
    }
  }
  if (ALLOW_CHEATS && wasKeyPressed('n') && cur_level_n > 0) {
    // prevLevel()
    // cur_level = levels[cur_level_n]
    if (level_transition_time == 0) {
      initTransitionToPrevLevel()
    }
  }*/

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

function doMainTurnLogic (cur_level) {
	let starts_won = isWon(cur_level)
	let pressed_key = input_queue.shift()
	let cur_undo = 0
	for (let i = 0; i < 4; i++) {
		if (pressed_key == 'zxcv'[i]) cur_undo = i + 1
	}
	let cur_di = 0
	let cur_dj = 0
	if (pressed_key == ('a')) cur_di -= 1
	if (pressed_key == ('d')) cur_di += 1
	if (pressed_key == ('w')) cur_dj -= 1
	if (pressed_key == ('s')) cur_dj += 1

	/*let magic_stuff_input = pressed_key == 'e' && ALLOW_MAGIC_INPUT
	let machine_input_back = pressed_key == 'z' && ALLOW_MACHINES
	let machine_input_front = pressed_key == 'x' && ALLOW_MACHINES
	let machine_input = machine_input_back || machine_input_front*/
	let machine_input = false
	let magic_stuff_input = false

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
				console.log('usingd a machine')
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
				let player_resisted = false
				playUndoSound(cur_undo)
				if (cur_level.player.history[player_tick] !== undefined) { // player is being undoed
					[i, j] = cur_level.player.history[player_tick]
					cur_level.player.history[real_tick] = [i, j]
					cur_level.player.inmune_history[real_tick] = cur_level.player.inmune_history[player_tick]
					cur_level.player.inHole.value[real_tick] = cur_level.player.inHole.value[player_tick]
					player_parity = 1 - player_parity
				} else { // player is inmune to this undo level
					player_resisted = true;
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

				cur_level.holeCovers.forEach(holeCover => {
					let holeCover_tick = get_original_tick_2(real_tick, holeCover.inmune)
					if (holeCover.value[holeCover_tick] !== undefined) {
						holeCover.inmune[real_tick] = holeCover.inmune[holeCover_tick] // unchecked
						holeCover.value[real_tick] = holeCover.value[holeCover_tick] // unchecked
					} else {
						// original move for the hole
						holeCover.inmune[real_tick] = holeCover.inmune[real_tick - 1] // unchecked
						if (holeCover.value[real_tick - 1]) {
							// hole might break
							let [hi, hj] = holeCover.position
							if (weightOnTile(cur_level, real_tick-1, hi, hj) && !weightOnTile(cur_level, real_tick, hi, hj)) {
								// hole broke!
								holeCover.value[real_tick] = false
							} else {
								holeCover.value[real_tick] = true
							}
						} else { // hole is already broken
							holeCover.value[real_tick] = false
						}
					}
				})

				cur_level.paintBlobs.forEach(paintBlob => {
					let paintBlob_tick = get_original_tick_2(real_tick, paintBlob.inmune)
					if (paintBlob.value[paintBlob_tick] !== undefined) {
						paintBlob.inmune[real_tick] = paintBlob.inmune[paintBlob_tick] // unchecked
						paintBlob.value[real_tick] = paintBlob.value[paintBlob_tick] // unchecked
					} else {
						paintBlob.inmune[real_tick] = paintBlob.inmune[real_tick - 1] // unchecked
						paintBlob.value[real_tick] = paintBlob.value[real_tick - 1]
					}
				})

				cur_level.hats.forEach(hat => {
					let hat_tick = get_original_tick_2(real_tick, hat.inmune)
					if (hat.value[hat_tick] !== undefined) {
						hat.inmune[real_tick] = hat.inmune[hat_tick] // unchecked
						hat.value[real_tick] = hat.value[hat_tick] // unchecked
					} else {
						hat.inmune[real_tick] = hat.inmune[real_tick - 1] // unchecked
						hat.value[real_tick] = hat.value[real_tick - 1]
					}
				})

				fallFlying(cur_level, cur_undo)

				// if (KEEP_UNDOING_UNTIL_CRATE_MOVE) {
				// if (player_resisted) {
				if (!anyChangesLastTurn(cur_level)) {
					input_queue.push('zxcv'[cur_undo-1])
					turn_time = 0.0
					doMainTurnLogic(cur_level)
				}
				// }
			} else if (cur_level.player.inHole.value.at(-1) < 0) {
				wallSound.play()
				true_timeline_undos.pop()
				turn_time = 0
				SKIPPED_TURN = true
			}	else if (magic_stuff_input) {
				neutralTurn(cur_level)
				cur_level.player.inmune_history[real_tick] = 2 // magic!
				fallFlying(cur_level, 0)
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
				fallFlying(cur_level, 0)
				// cur_level.player.history[real_tick] = [pi + cur_di*2, pj + cur_dj*2]
			} else { // player did an original move
				[pi, pj] = cur_level.player.history[real_tick - 1]
				let bad_move = (pi + cur_di < 0) || (pi + cur_di >= cur_level.w) ||
					(pj + cur_dj < 0) || (pj + cur_dj >= cur_level.h) ||
					(cur_level.geo[pj + cur_dj][pi + cur_di] != '.') ||
					closedDoorAt(cur_level, pi + cur_di, pj + cur_dj) ||
					openHoleAt(cur_level, pi + cur_di, pj + cur_dj)// ||
					// movesBackToEntrance(cur_level, pi, pj, cur_di, cur_dj)
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
									fallFlying(cur_level, 0)
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
								// let parity = 1 - cur_level.player.inHole.value[real_tick-1] % 2
								cur_level.player.inHole.value[real_tick] = dir2spr(cur_di, cur_dj, true) + player_parity
								pushing_crates.forEach(pushing_crate => {
									cur_level.crates[pushing_crate].history[real_tick] = [next_space_i, next_space_j]
									cur_level.crates[pushing_crate].inHole.value[real_tick] = true
								})

								let over_hat = cur_level.hats.findIndex(hat => {
									let [hi, hj] = hat.position;
									return hat.get() && hi == pi + cur_di && hj == pj + cur_dj
								})

								if (over_hat != -1) {
									cur_level.hats[over_hat].value[real_tick] = false
									cur_level.player.inmune_history[real_tick] = cur_level.hats[over_hat].inmune[real_tick]
								}

								maybeBreakHoleCovers(cur_level, real_tick)
								fallFlying(cur_level, 0)
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
											fallFlying(cur_level, 0)
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
									// let parity = 1 - cur_level.player.inHole.value[real_tick-1] % 2
									cur_level.player.inHole.value[real_tick] = dir2spr(cur_di, cur_dj, true) + player_parity
									pushing_crates.forEach(pushing_crate => {
										cur_level.crates[pushing_crate].history[real_tick] = [next_space_i, next_space_j]
									})

									let over_hat = cur_level.hats.findIndex(hat => {
										let [hi, hj] = hat.position;
										return hat.get() && hi == pi + cur_di && hj == pj + cur_dj
									})

									if (over_hat != -1) {
										cur_level.hats[over_hat].value[real_tick] = false
										cur_level.player.inmune_history[real_tick] = cur_level.hats[over_hat].inmune[real_tick]
									}

									maybeBreakHoleCovers(cur_level, real_tick)

									let over_paint = cur_level.paintBlobs.findIndex(paintBlob => {
										let [hi, hj] = paintBlob.position;
										return paintBlob.get() && hi == next_space_i && hj == next_space_j
									})
									if (over_paint != -1) {
										cur_level.paintBlobs[over_paint].value[real_tick] = false
										let inmunity = cur_level.paintBlobs[over_paint].inmune.at(-1)
										pushing_crates.forEach(pushing_crate => {
											cur_level.crates[pushing_crate].inmune_history[real_tick] = inmunity
										})
									}
									fallFlying(cur_level, 0)
									// console.log("over_paint: ", over_paint)
									// console.log(pushing_crates)
								}
							}
						}
					} else {
						stepSound.play()
						neutralTurn(cur_level)
						cur_level.player.history[real_tick] = [pi + cur_di, pj + cur_dj]
						// let parity = 1 - cur_level.player.inHole.value[real_tick-1] % 2
						cur_level.player.inHole.value[real_tick] = dir2spr(cur_di, cur_dj, false) + player_parity

						let over_hat = cur_level.hats.findIndex(hat => {
							let [hi, hj] = hat.position;
							return hat.get() && hi == pi + cur_di && hj == pj + cur_dj
						})

						if (over_hat != -1) {
							cur_level.hats[over_hat].value[real_tick] = false
							cur_level.player.inmune_history[real_tick] = cur_level.hats[over_hat].inmune[real_tick]
						}

						maybeBreakHoleCovers(cur_level, real_tick)
						fallFlying(cur_level, 0)
					}
				}
			}
			if (!won_cur_level) fixPlayerOutsideBounds(cur_level)
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

canvas.addEventListener('mousemove', e => _mouseEvent(e))
canvas.addEventListener('mousedown', e => _mouseEvent(e))
canvas.addEventListener('mouseup', e => _mouseEvent(e))
// document.onContextMenu = e => e.preventDefault();

function _mouseEvent (e) {
	window.focus()
  mouse.x = e.offsetX
  mouse.y = e.offsetY
  mouse.buttons = e.buttons
  if (!ALLOW_EDITOR) e.preventDefault()
  return false
}

/* window.addEventListener('wheel', e => {
  let d = e.deltaY > 0 ? 1 : -1
  return mouse.wheel = d
}) */

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
	if (e.shiftKey && e.altKey && e.code === 'Digit1') return 'D1'
  if (e.shiftKey && e.altKey && e.code === 'Digit2') return 'D2'
  if (e.shiftKey && e.altKey && e.code === 'Digit3') return 'D3'
  if (e.shiftKey && e.altKey && e.code === 'Digit4') return 'D4'
  if (e.shiftKey && e.code === 'Digit1') return 'B1'
  if (e.shiftKey && e.code === 'Digit2') return 'B2'
  if (e.shiftKey && e.code === 'Digit3') return 'B3'
  if (e.shiftKey && e.code === 'Digit4') return 'B4'
	if (e.altKey && e.code === 'Digit1') return 'C1'
  if (e.altKey && e.code === 'Digit2') return 'C2'
  if (e.altKey && e.code === 'Digit3') return 'C3'
  if (e.altKey && e.code === 'Digit4') return 'C4'
	if (e.ctrlKey || e.altKey || e.shiftKey) return '.'
  // use key.code if key location is important
  if (e.key === "Escape") return 'Escape'
  if (e.code === 'Backquote') return 'editor'
  if (e.metaKey) return '.'
  // if (ALLOW_EDITOR) return e.key
  if (e.key == 'ArrowLeft') return 'a'
  if (e.key == 'ArrowRight') return 'd'
  if (e.key == 'ArrowDown') return 's'
  if (e.key == 'ArrowUp') return 'w'
  let key = e.key.toLowerCase();
  if (key === 'p') return 'Escape'
  if (key == 'z') return 'z'
  if (key == 'x') return ENABLE_UNDO_2 ? 'x' : '.'
  if (key == 'c') return ENABLE_UNDO_3 ? 'c' : '.'
  if (key == 'v') return ENABLE_UNDO_4 ? 'v' : '.'
  if (key == 'r') return ENABLE_RESTART ? 'r' : '.'
  // return '.'
  return e.key.toLowerCase()
}

window.addEventListener('keydown', e => {
	if (document.activeElement.tagName === 'TEXTAREA') {
		if (e.key.startsWith('Arrow') || '1234pmnuiopjkl;abcdABCD'.indexOf(e.key) !== -1) {
			return
		}
	}
	let k = keyMap(e)
  if (!e.repeat) {
    /*if (e.key == 'p') {
      solved_levels.push(cur_level_n)
      updateMenuButtons()
    } else if (e.key == 'o') {
      DRAW_TIMEBARS = !DRAW_TIMEBARS
      ALLOW_CHEATS = !ALLOW_CHEATS
      updateMenuButtons()
    }*/

    if ('wasdzxcv'.indexOf(k) != -1) input_queue.push(k)
    keyboard[k] = true
    keyboard_last_pressed[k] = Date.now()
    if (k == 'z' || k == 'x' || k == 'c' || k == 'v') first_undo_press = true
    first_key_press = true
  }
	if ('wasdrzxcver1234'.indexOf(k) != -1) e.preventDefault()
	if (['B1', 'B2', 'B3', 'B4', 'editor'].indexOf(k) != -1) e.preventDefault()
  /*if (e.key == 'ArrowLeft') e.preventDefault()
  if (e.key == 'ArrowRight') e.preventDefault()
  if (e.key == 'ArrowDown') e.preventDefault()
  if (e.key == 'ArrowUp') e.preventDefault()*/
  //e.preventDefault()
  //return false
})

window.addEventListener('keyup', e => {
  let k = keyMap(e)
  keyboard[k] = false
  keyboard_last_pressed[k] = null
  first_undo_press = false
  first_key_press = false

	if ('wasdrzxcver1234'.indexOf(k) != -1) e.preventDefault()
	if (['B1', 'B2', 'B3', 'B4', 'editor'].indexOf(k) != -1) e.preventDefault()
  // e.preventDefault()
  // return false
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
