// import { PintarJS, BALL_R, EXTRA_MARGIN, DEBUG_TRUE_OPACITY, N_WORLDS, OPAQUE_BALLS } from 'base'
// declare let PintarJS: any;
import { pintar, Color, CONFIG } from 'base'

declare let PintarJS: any;
/*export let graphics_config = {
  ball_r: .03,
  opacity: .1,
  extra_margin: .1,
}*/

let ball_shader: BallShader | null = null;

export function drawBallAt(pos_x: number, pos_y: number, color: Color) {
  if (!ball_shader) {
    ball_shader = new BallShader();
    pintar._renderer.setShader(ball_shader);
  }
  ball_shader.setUniform3f(ball_shader.uniforms.u_color, ...color)
  ball_shader.setUniform2f(ball_shader.uniforms.u_pos, pos_x, pos_y)
}

class BallShader extends PintarJS.ShaderBase {
  get uniformNames() {
    return ["u_pos", "u_color"];
  }

  get vertexShaderCode() {
    return `
      attribute vec2 a_position;

      // screen resolution to project quad
      // uniform vec2 u_resolution;

      uniform vec2 u_pos;

      // output texture coord
      varying vec2 v_texCoord;

      // main vertex shader func
      void main()
      {
        vec2 res = u_pos + (a_position - .5) * ${CONFIG.BALL_R * 2};
        vec2 clip_pos = vec2(res.x / (1.0 + ${CONFIG.EXTRA_MARGIN}), res.y / (0.5 + ${CONFIG.EXTRA_MARGIN}));
        gl_Position = vec4(clip_pos, 0, 1);
        v_texCoord = a_position - .5;
      }
      `;
  }

  get fragmentShaderCode() {
    return `
    precision mediump float;

    uniform vec3 u_color;

    // the texCoords passed in from the vertex shader.
    varying vec2 v_texCoord;

    // main fragment shader func
    void main()
    {
      float distSq = dot(v_texCoord, v_texCoord);
      float weight = smoothstep(0.25, .23, distSq) * ${CONFIG.OPACITY};
      gl_FragColor = vec4(u_color * weight, weight);
    }
      `
  }

  get haveTexture() {
    return false;
  }

  prepare(_renderable: any, _viewport: any) {
    /*this._gl.uniform3f(this.uniforms.u_color, ...colors[cur_drawing]);
    this._gl.uniform2f(
      this.uniforms.u_pos,
      balls_pos[cur_drawing][cur_selected * 2],
      balls_pos[cur_drawing][cur_selected * 2 + 1]
    );
    this._gl.uniform1f(this.uniforms.u_transparent, OPAQUE_BALLS ? 1.0 : 0.0)*/
  }
}
