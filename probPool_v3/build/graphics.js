(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "base"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.drawBallAt = void 0;
    // import { PintarJS, BALL_R, EXTRA_MARGIN, DEBUG_TRUE_OPACITY, N_WORLDS, OPAQUE_BALLS } from 'base'
    // declare let PintarJS: any;
    const base_1 = require("base");
    /*export let graphics_config = {
      ball_r: .03,
      opacity: .1,
      extra_margin: .1,
    }*/
    let ball_shader = null;
    function drawBallAt(pos_x, pos_y, color) {
        if (!ball_shader) {
            ball_shader = new BallShader();
            base_1.pintar._renderer.setShader(ball_shader);
        }
        ball_shader.setUniform3f(ball_shader.uniforms.u_color, ...color);
        ball_shader.setUniform2f(ball_shader.uniforms.u_pos, pos_x, pos_y);
    }
    exports.drawBallAt = drawBallAt;
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
        vec2 res = u_pos + (a_position - .5) * ${base_1.CONFIG.BALL_R * 2};
        vec2 clip_pos = vec2(res.x / (1.0 + ${base_1.CONFIG.EXTRA_MARGIN}), res.y / (0.5 + ${base_1.CONFIG.EXTRA_MARGIN}));
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
      float weight = smoothstep(0.25, .23, distSq) * ${base_1.CONFIG.OPACITY};
      gl_FragColor = vec4(u_color * weight, weight);
    }
      `;
        }
        get haveTexture() {
            return false;
        }
        prepare(_renderable, _viewport) {
            /*this._gl.uniform3f(this.uniforms.u_color, ...colors[cur_drawing]);
            this._gl.uniform2f(
              this.uniforms.u_pos,
              balls_pos[cur_drawing][cur_selected * 2],
              balls_pos[cur_drawing][cur_selected * 2 + 1]
            );
            this._gl.uniform1f(this.uniforms.u_transparent, OPAQUE_BALLS ? 1.0 : 0.0)*/
        }
    }
});
