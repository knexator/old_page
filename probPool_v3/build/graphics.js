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
    exports.drawBallOutlineAt = exports.drawBallAt = exports.outline_ball_shader = exports.ball_shader = void 0;
    // import { PintarJS, BALL_R, EXTRA_MARGIN, DEBUG_TRUE_OPACITY, N_WORLDS, OPAQUE_BALLS } from 'base'
    // declare let PintarJS: any;
    const base_1 = require("base");
    /*export let graphics_config = {
      ball_r: .03,
      opacity: .1,
      extra_margin: .1,
    }*/
    exports.ball_shader = null;
    exports.outline_ball_shader = null;
    function drawBallAt(pos_x, pos_y, color) {
        if (!exports.ball_shader) {
            exports.ball_shader = new BallShader();
            base_1.pintar._renderer.setShader(exports.ball_shader);
        }
        exports.ball_shader.setUniform3f(exports.ball_shader.uniforms.u_color, ...color);
        exports.ball_shader.setUniform2f(exports.ball_shader.uniforms.u_pos, pos_x, pos_y);
        exports.ball_shader.draw();
    }
    exports.drawBallAt = drawBallAt;
    function drawBallOutlineAt(pos_x, pos_y, color) {
        if (!exports.outline_ball_shader) {
            exports.outline_ball_shader = new OutlineBallShader();
            base_1.pintar._renderer.setShader(exports.outline_ball_shader);
        }
        exports.outline_ball_shader.setUniform3f(exports.outline_ball_shader.uniforms.u_color, ...color);
        exports.outline_ball_shader.setUniform2f(exports.outline_ball_shader.uniforms.u_pos, pos_x, pos_y);
        exports.outline_ball_shader.draw();
    }
    exports.drawBallOutlineAt = drawBallOutlineAt;
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
      float weight = smoothstep(0.25, .23, distSq);
      float outline = smoothstep(0.05, 0.04, abs(distSq - .24));
      vec3 outline_color = vec3(0.0);
      gl_FragColor = vec4((u_color * (1.0 - outline) + outline * outline_color) * weight, weight);
    }
      `;
        }
        get haveTexture() {
            return false;
        }
        prepare(_renderable, _viewport) {
        }
    }
});
