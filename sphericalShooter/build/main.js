var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./engine", "./twgl", "./shaders"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // ES6:
    const engine_1 = require("./engine");
    const twgl = __importStar(require("./twgl"));
    const shaders_1 = require("./shaders");
    const canvas = document.querySelector('canvas');
    const gl = canvas.getContext("webgl");
    const programInfo = twgl.createProgramInfo(gl, [shaders_1.vs, shaders_1.fs]);
    const arrays = {
        position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
    };
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
    // Called when loading the page
    function initOnce() {
        init();
        window.requestAnimationFrame(update);
    }
    // Called when game is reset
    function init() {
    }
    // Called every frame
    function update(curTime) {
        (0, engine_1.engine_pre_update)(curTime);
        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        const uniforms = {
            time: engine_1.game_time * 0.001,
            resolution: [gl.canvas.width, gl.canvas.height],
        };
        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        twgl.setUniforms(programInfo, uniforms);
        twgl.drawBufferInfo(gl, bufferInfo);
        (0, engine_1.engine_post_update)();
        window.requestAnimationFrame(update);
    }
    initOnce();
});
