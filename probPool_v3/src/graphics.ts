// import { PintarJS, BALL_R, EXTRA_MARGIN, DEBUG_TRUE_OPACITY, N_WORLDS, OPAQUE_BALLS } from 'base'
// declare let PintarJS: any;
import { pintar, Color, CONFIG } from 'base'

declare let PintarJS: any;
/*export let graphics_config = {
  ball_r: .03,
  opacity: .1,
  extra_margin: .1,
}*/

export let ball_shader: BallShader | null = null;
export let outline_ball_shader: OutlineBallShader | null = null;
export let taco_shader: TacoShader | null = null;

export function drawBallAt(pos_x: number, pos_y: number, color: Color) {
  if (!ball_shader) {
    ball_shader = new BallShader();
    pintar._renderer.setShader(ball_shader);
  }
  ball_shader.setUniform3f(ball_shader.uniforms.u_color, ...color)
  ball_shader.setUniform2f(ball_shader.uniforms.u_pos, pos_x, pos_y)
  ball_shader.draw()
}

export function drawBallOutlineAt(pos_x: number, pos_y: number, color: Color) {
  if (!outline_ball_shader) {
    outline_ball_shader = new OutlineBallShader();
    pintar._renderer.setShader(outline_ball_shader);
  }
  outline_ball_shader.setUniform3f(outline_ball_shader.uniforms.u_color, ...color)
  outline_ball_shader.setUniform2f(outline_ball_shader.uniforms.u_pos, pos_x, pos_y)
  outline_ball_shader.draw()
}

export function drawTaco(head: { x: number; y: number; }, tail: { x: number; y: number; }) {
  if (!taco_shader) {
    taco_shader = new TacoShader();
    pintar._renderer.setShader(taco_shader);
  }
  taco_shader.setUniform2f(taco_shader.uniforms.u_head, head.x, head.y)
  taco_shader.setUniform2f(taco_shader.uniforms.u_tail, tail.x, tail.y)
  taco_shader.draw()
}

class BallShader extends PintarJS.ShaderBase {
  get uniformNames() {
    return ["u_pos", "u_color"];
  }

  get vertexShaderCode() {
    return `
      attribute vec2 a_position;
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

class OutlineBallShader extends PintarJS.ShaderBase {
  get uniformNames() {
    return ["u_pos", "u_color"];
  }

  get vertexShaderCode() {
    return `
      attribute vec2 a_position;
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
      float weight = smoothstep(0.25, .23, distSq);
      float outline = smoothstep(0.05, 0.04, abs(distSq - .24));
      vec3 outline_color = vec3(0.0);
      gl_FragColor = vec4((u_color * (1.0 - outline) + outline * outline_color) * weight, weight);
    }
      `
  }

  get haveTexture() {
    return false;
  }

  prepare(_renderable: any, _viewport: any) {

  }
}

class TacoShader extends PintarJS.ShaderBase {
  get uniformNames() {
    return ["u_head", "u_tail"];
  }

  get vertexShaderCode() {
    return `
      attribute vec2 a_position;

      // screen resolution to project quad
      // uniform vec2 u_resolution;

      uniform vec2 u_head;
      uniform vec2 u_tail;

      // output texture coord
      varying vec2 v_texCoord;

      // main vertex shader func
      void main()
      {
        vec2 delta = u_tail - u_head;
        // vec2 perp = normalize(vec2(delta.y, -delta.x));
        vec2 perp = vec2(delta.y, -delta.x);

        // vec2 res = (a_position - .5);
        // vec2 coords = vec2(a_position.y, (a_position.x - .5) * 0.05 * (a_position.y + 0.6));
        vec2 coords = vec2(a_position.y, (a_position.x - .5) * 0.125);
        // res = delta * (res.y + .5) + perp * res.x * 0.05 * (res.y + 1.1);
        vec2 res = delta * coords.x + perp * coords.y + u_head;

        vec2 clip_pos = vec2(res.x / (1.0 + ${CONFIG.EXTRA_MARGIN}), res.y / (0.5 + ${CONFIG.EXTRA_MARGIN}));

        gl_Position = vec4(clip_pos, 0, 1);

        float l = length(delta);
        v_texCoord = vec2((a_position.x - .5) * l, a_position.y * l * 0.5);
      }
      `;
  }

  /**
   * Return fragment shader code.
   */
  get fragmentShaderCode() {
    return `
    precision mediump float;

    // the texCoords passed in from the vertex shader.
    varying vec2 v_texCoord;

    // main fragment shader func
    void main()
    {
      float d = abs(v_texCoord.x - v_texCoord.y * sign(v_texCoord.x));
      d = smoothstep(0.04, 0.03, d);
      vec3 color = vec3(1.0);
      gl_FragColor = vec4(color * d, d);
    }
      `
  }

  get haveTexture() {
    return false;
  }

  prepare(_renderable: any, _viewport: any) {
    /*this._gl.uniform2f(
      this.uniforms.u_head,
      cur_taco_head[0],
      cur_taco_head[1],
    );
    this._gl.uniform2f(
      this.uniforms.u_tail,
      cur_taco_tail[0],
      cur_taco_tail[1],
    );*/
  }
}
