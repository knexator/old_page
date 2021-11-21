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
        define(["require", "exports", "./engine", "./twgl", "./shaders", "./math"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // ES6:
    const engine_1 = require("./engine");
    const twgl = __importStar(require("./twgl"));
    const shaders_1 = require("./shaders");
    const math_1 = require("./math");
    const gl = document.querySelector('canvas').getContext("webgl2");
    // Passing in attribute names binds attribute location by index
    // In WebGL 2 we can also assign locations in GLSL (not sure which is better. This is global)
    //
    // We need to do this to make sure attirbute locations are consistent across
    // programs of else we'd need one vertex array object per program+bufferInfo combination
    const attributes = [
        "a_position",
        "a_color",
        // "a_normal",
        // "a_texcoord",
    ];
    const debugUnlitProgramInfo = twgl.createProgramInfo(gl, [shaders_1.vs, shaders_1.fs], attributes);
    const programInfos = [debugUnlitProgramInfo];
    const arrays = {
        a_position: {
            numComponents: 4,
            data: [
                -.1, -.1, -1, 0,
                .1, -.1, -1, 0,
                -.1, .1, -1, 0,
                -.1, .1, -1, 0,
                .1, -.1, -1, 0,
                .1, .1, -1, 0,
            ],
        },
        a_color: {
            numComponents: 3,
            type: Uint8Array,
            data: [
                0, 0, 0,
                255, 0, 0,
                0, 255, 0,
                0, 255, 0,
                255, 0, 0,
                255, 255, 0,
            ],
        }
    };
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
    const vertexArrayInfo = twgl.createVertexArrayInfo(gl, programInfos, bufferInfo);
    const z0 = 0.01;
    const projNear = (0, math_1.projMat)(z0, true);
    const projFar = (0, math_1.projMat)(z0, false);
    let viewInverse = (0, math_1.identity)();
    let farviewInverse = (0, math_1.identity)();
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
        // rotate -z into w, a positive distance (go forward)
        if ((0, engine_1.isKeyDown)('w'))
            (0, math_1.multMatMat)((0, math_1.pureRot)(-0.001 * engine_1.delta_time, 2, 3), viewInverse, viewInverse);
        // rotate z into w, a positive distance (go backward)
        if ((0, engine_1.isKeyDown)('s'))
            (0, math_1.multMatMat)((0, math_1.pureRot)(0.001 * engine_1.delta_time, 2, 3), viewInverse, viewInverse);
        // rotate x into w, a positive distance (go right)
        if ((0, engine_1.isKeyDown)('d'))
            (0, math_1.multMatMat)((0, math_1.pureRot)(0.001 * engine_1.delta_time, 0, 3), viewInverse, viewInverse);
        // rotate -x into w, a positive distance (go left)
        if ((0, engine_1.isKeyDown)('a'))
            (0, math_1.multMatMat)((0, math_1.pureRot)(-0.001 * engine_1.delta_time, 0, 3), viewInverse, viewInverse);
        // rotate y into w, a positive distance (go up)
        if ((0, engine_1.isKeyDown)('e'))
            (0, math_1.multMatMat)((0, math_1.pureRot)(0.001 * engine_1.delta_time, 1, 3), viewInverse, viewInverse);
        // rotate -y into w, a positive distance (go up)
        if ((0, engine_1.isKeyDown)('q'))
            (0, math_1.multMatMat)((0, math_1.pureRot)(-0.001 * engine_1.delta_time, 1, 3), viewInverse, viewInverse);
        // rotate y into -z, a positive distance (look up)
        if ((0, engine_1.isKeyDown)('i'))
            (0, math_1.multMatMat)((0, math_1.pureRot)(-0.001 * engine_1.delta_time, 1, 2), viewInverse, viewInverse);
        // rotate y into z, a positive distance (look down)
        if ((0, engine_1.isKeyDown)('k'))
            (0, math_1.multMatMat)((0, math_1.pureRot)(0.001 * engine_1.delta_time, 1, 2), viewInverse, viewInverse);
        // rotate x into -z, a positive distance (look right)
        if ((0, engine_1.isKeyDown)('l'))
            (0, math_1.multMatMat)((0, math_1.pureRot)(-0.001 * engine_1.delta_time, 0, 2), viewInverse, viewInverse);
        // rotate x into z, a positive distance (look left)
        if ((0, engine_1.isKeyDown)('j'))
            (0, math_1.multMatMat)((0, math_1.pureRot)(0.001 * engine_1.delta_time, 0, 2), viewInverse, viewInverse);
        // rotate y into x, a positive distance (roll left)
        if ((0, engine_1.isKeyDown)('u'))
            (0, math_1.multMatMat)((0, math_1.pureRot)(0.001 * engine_1.delta_time, 1, 0), viewInverse, viewInverse);
        // rotate x into y, a positive distance (roll right)
        if ((0, engine_1.isKeyDown)('o'))
            (0, math_1.multMatMat)((0, math_1.pureRot)(0.001 * engine_1.delta_time, 0, 1), viewInverse, viewInverse);
        (0, math_1.multMatMat)((0, math_1.pureRot)(Math.PI, 2, 3), viewInverse, farviewInverse);
        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        const commonUniforms = {
            time: engine_1.game_time * 0.001,
            resolution: [gl.canvas.width, gl.canvas.height],
        };
        gl.useProgram(debugUnlitProgramInfo.program);
        twgl.setBuffersAndAttributes(gl, debugUnlitProgramInfo, vertexArrayInfo);
        twgl.setUniforms(debugUnlitProgramInfo, commonUniforms);
        // Draw near hemisphere
        twgl.setUniforms(debugUnlitProgramInfo, {
            u_projection: projFar,
            u_viewInverse: viewInverse,
        });
        twgl.drawBufferInfo(gl, bufferInfo);
        // Draw far hemisphere
        twgl.setUniforms(debugUnlitProgramInfo, {
            u_projection: projFar,
            u_viewInverse: farviewInverse,
        });
        twgl.drawBufferInfo(gl, bufferInfo);
        (0, engine_1.engine_post_update)();
        window.requestAnimationFrame(update);
    }
    initOnce();
});
