(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fs = exports.vs = void 0;
    exports.vs = `\
uniform mat4 u_projection;
uniform mat4 u_viewInverse;

attribute vec4 a_position;
attribute vec3 a_color;

varying vec3 v_color;

void main() {
  gl_Position = u_projection * u_viewInverse * a_position;
  v_color = a_color;
}`;
    exports.fs = `\
precision mediump float;

varying vec3 v_color;

void main() {
  gl_FragColor = vec4( v_color, 1.0 );
}`;
});
