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
    const base_1 = require("base");
    //declare let PintarJS: any;
    class BallShader extends base_1.PintarJS.ShaderBase {
        get uniformNames() {
            return ["u_pos", "u_color", "u_transparent"];
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
        vec2 res = u_pos + (a_position - .5) * ${base_1.BALL_R * 2};
        vec2 clip_pos = vec2(res.x / (1.0 + ${base_1.EXTRA_MARGIN}), res.y / (0.5 + ${base_1.EXTRA_MARGIN}));
        // vec2 clip_pos = vec2(res.x / (1.0 + ${base_1.EXTRA_MARGIN * 2}), res.y / (0.5 + ${base_1.EXTRA_MARGIN * 2}));
        gl_Position = vec4(clip_pos, 0, 1);
        v_texCoord = a_position - .5;
      }
      `;
        }
        /**
         * Return fragment shader code.
         */
        get fragmentShaderCode() {
            return `
    precision mediump float;

    uniform vec3 u_color;
    uniform float u_transparent;

    // the texCoords passed in from the vertex shader.
    varying vec2 v_texCoord;

    // main fragment shader func
    void main()
    {
      float distSq = dot(v_texCoord, v_texCoord);
      float weight = smoothstep(0.25, .23, distSq);
      // gl_FragColor = vec4(u_color.xy * 0.0 + v_texCoord, 0.0, 1.0);
      if (u_transparent < 0.5) {
        weight *= ${base_1.DEBUG_TRUE_OPACITY ? 1.0 / base_1.N_WORLDS : 0.05};
      }
      gl_FragColor = vec4(u_color * weight, weight);
    }
      `;
        }
        get haveTexture() {
            return false;
        }
        prepare(_renderable, _viewport) {
            this._gl.uniform3f(this.uniforms.u_color, ...colors[cur_drawing]);
            this._gl.uniform2f(this.uniforms.u_pos, balls_pos[cur_drawing][cur_selected * 2], balls_pos[cur_drawing][cur_selected * 2 + 1]);
            this._gl.uniform1f(this.uniforms.u_transparent, base_1.OPAQUE_BALLS ? 1.0 : 0.0);
        }
    }
});
