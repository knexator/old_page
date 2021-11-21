// Array of 16 elements, column order
// 0 4 8  12
// 1 5 9  13
// 2 6 10 14
// 3 7 11 15
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
    exports.multMatMat = exports.multMatVec = exports.projMat = exports.identity = exports.pureRot = void 0;
    function getMat(mat, row, col) {
        return mat[row + col * 4];
    }
    function setMat(mat, row, col, value) {
        mat[row + col * 4] = value;
    }
    function pureRot(dist, axis_from, axis_to) {
        let res = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
        let cos = Math.cos(dist);
        let sin = Math.sin(dist);
        setMat(res, axis_from, axis_from, cos);
        setMat(res, axis_to, axis_to, cos);
        setMat(res, axis_from, axis_to, -sin);
        setMat(res, axis_to, axis_from, sin);
        return res;
    }
    exports.pureRot = pureRot;
    function identity() {
        let res = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
        return res;
    }
    exports.identity = identity;
    function projMat(z0, near) {
        let res = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, near ? 0.5 : -.5, -1,
            0, 0, -z0 / 2, 0
        ]);
        return res;
    }
    exports.projMat = projMat;
    // 0 4 8  12
    // 1 5 9  13
    // 2 6 10 14
    // 3 7 11 15
    // 1 = a_{10} = (i = 1, j = 0)
    function multMatVec(mat, vec) {
        let res = new Float32Array(4);
        for (let row = 0; row < 4; row++) {
            let cur_res = 0;
            for (let col = 0; col < 4; col++) {
                cur_res += getMat(mat, row, col) * vec[col];
            }
            res[row] = cur_res;
        }
        return res;
    }
    exports.multMatVec = multMatVec;
    function multMatMat(mat1, mat2) {
        let res = new Float32Array(16);
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                let cur_res = 0;
                for (let k = 0; k < 4; k++) {
                    cur_res += getMat(mat1, row, k) * getMat(mat2, k, col);
                }
                setMat(res, row, col, cur_res);
            }
        }
        return res;
    }
    exports.multMatMat = multMatMat;
});
