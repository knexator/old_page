declare let PintarJS: any;
export let pintar = new PintarJS();
export type Color = [number, number, number]

export let CONFIG = {
  N_BALLS: 8, // 11 // 16
  N_WORLDS: 512,
  BALL_R: 0.03, // 0.025
  EXTRA_MARGIN: 0.1,
  BORDER_R: 0.05,
  OPACITY: 0.10,
  INITIAL_SPACING: 0.1,
  FORCE_SCALER: 1,
  CHAOS_AMOUNT: 0.001,
  ALWAYS_PICK: false,
  ANIM_DURATION: 0.3,

  PERMANENT_HOLES: true,
  COLLAPSE_EXTENT: "ball", // ball, world
  COLLAPSE_TARGET: "mean", // mean, selected
  AUTOCOLLAPSE_WHITE: true,
  /*export let BALL_R_SQ = BALL_R * BALL_R
  export let BORDER_R_SQ = BORDER_R * BORDER_R
  export let CHAOS_AMOUNT = 0.001
  export let PICK_TOLERANCE = 0.0005
  export let ALLOW_NO_PICK = true
  export let INITIAL_SPACING = 0.1
  export let OPAQUE_BALLS = false
  export let DEBUG_TRUE_OPACITY = false;*/
}

export let VARS = {
  anim_time: 0 as number,
}
export let selected = {
  ball: null as number | null,
  world: null as number | null
}
export let pos_data: Float32Array = new Float32Array(CONFIG.N_BALLS * CONFIG.N_WORLDS * 2)
export let vel_data: Float32Array = new Float32Array(CONFIG.N_BALLS * CONFIG.N_WORLDS * 2)
export let won_data: Int8Array = new Int8Array(CONFIG.N_BALLS * CONFIG.N_WORLDS)

export let original_pos_data: Float32Array = new Float32Array(CONFIG.N_BALLS * CONFIG.N_WORLDS * 2)
export let original_vel_data: Float32Array = new Float32Array(CONFIG.N_BALLS * CONFIG.N_WORLDS * 2)
export let original_won_data: Int8Array = new Int8Array(CONFIG.N_BALLS * CONFIG.N_WORLDS)

// ball i, world j corresponds to won_data[ball_i, world_j]
export function IJ2K(ball_i: number, world_j: number, xy_data: boolean) {
  // Chunk by color, that is, ball_j
  // p_11, p_21, p_31 ... p_12, p_22, ...
  // For x/y, multiply by 2:
  // p_11x, p_11y, p_21x, p_21y ... p_12x, p_12y ...
  let res = world_j + ball_i * CONFIG.N_WORLDS
  if (xy_data) return res * 2
  return res
}

export let ball_hex_colors = [
  "FFFFFF",
  "F7DE1B",
  "4C8AF0",
  "ED4A44",
  "D246EE",
  // "14110F",
  "2E8943",
  "DD7933",
  // "BB4B23",
  "04E762",
  "17BEBB",  //64B6AC
];

export let ball_colors: Color[] = ball_hex_colors.map(hex => {
  let r = parseInt(hex.slice(0,2), 16) / 255;
  let g = parseInt(hex.slice(2,4), 16) / 255;
  let b = parseInt(hex.slice(4,6), 16) / 255;
  return [r,g,b]
})
