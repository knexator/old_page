declare let PintarJS: any;

export let pintar = new PintarJS();

export type Color = [number, number, number]

export let CONFIG = {
  N_BALLS: 3, // 11 // 16
  N_WORLDS: 512,
  BALL_R: 0.03, // 0.025
  EXTRA_MARGIN: 0.1,
  BORDER_R: 0.05,
  OPACITY: 0.10,
  /*export let BALL_R_SQ = BALL_R * BALL_R
  export let
  export let BORDER_R_SQ = BORDER_R * BORDER_R
  export let FORCE_SCALER = 2
  export let CHAOS_AMOUNT = 0.001
  export let PICK_TOLERANCE = 0.0005
  export let ALLOW_NO_PICK = true
  export let INITIAL_SPACING = 0.1
  export let OPAQUE_BALLS = false
  export let DEBUG_TRUE_OPACITY = false;*/
}

export let pos_data: Float32Array = new Float32Array(CONFIG.N_BALLS * CONFIG.N_WORLDS * 2)
export let vel_data: Float32Array = new Float32Array(CONFIG.N_BALLS * CONFIG.N_WORLDS * 2)
export let won_data: Int8Array = new Int8Array(CONFIG.N_BALLS * CONFIG.N_WORLDS)

export let ball_colors: Color[] = [
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
].map(hex => {
  let r = parseInt(hex.slice(0,2), 16) / 255;
  let g = parseInt(hex.slice(2,4), 16) / 255;
  let b = parseInt(hex.slice(4,6), 16) / 255;
  return [r,g,b]
})
