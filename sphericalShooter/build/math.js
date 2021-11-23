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
    exports.multMatVec = exports.multMatMat = exports.inverse = exports.transpose = exports.identity = exports.copyMat = exports.negateMat = exports.projMat = exports.pureRot = void 0;
    function getMat(mat, row, col) {
        return mat[row + col * 4];
    }
    function setMat(mat, row, col, value) {
        mat[row + col * 4] = value;
    }
    function pureRot(dist, axis_from, axis_to, dst) {
        dst = identity(dst);
        let cos = Math.cos(dist);
        let sin = Math.sin(dist);
        setMat(dst, axis_from, axis_from, cos);
        setMat(dst, axis_to, axis_to, cos);
        setMat(dst, axis_from, axis_to, -sin);
        setMat(dst, axis_to, axis_from, sin);
        return dst;
    }
    exports.pureRot = pureRot;
    /*export function identity(): Matrix4 {
      let res = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
      ]);
      return res
    }*/
    function projMat(z0, near, dst) {
        dst = identity(dst);
        /*[
          1, 0, 0, 0,                     // zero row
          0, 1, 0, 0,                     // one row
          0, 0, near ? 0.5 : -.5, -z0/2,  // two row
          0, 0, -1, 0                     // three row
        ]*/
        setMat(dst, 2, 2, near ? 0.5 : -.5);
        setMat(dst, 2, 3, -z0 / 2);
        setMat(dst, 3, 2, -1);
        setMat(dst, 3, 3, 0);
        if (!near)
            negateMat(dst, dst);
        return dst;
    }
    exports.projMat = projMat;
    // from https://github.com/greggman/twgl.js/blob/master/src/m4.js
    /**
     * Negates a matrix.
     * @param {Matrix4} m The matrix.
     * @param {Matrix4} [dst] matrix to hold result. If not passed a new one is created.
     * @return {Matrix4} -m.
     */
    function negateMat(m, dst) {
        dst = dst || new Float32Array(16);
        dst[0] = -m[0];
        dst[1] = -m[1];
        dst[2] = -m[2];
        dst[3] = -m[3];
        dst[4] = -m[4];
        dst[5] = -m[5];
        dst[6] = -m[6];
        dst[7] = -m[7];
        dst[8] = -m[8];
        dst[9] = -m[9];
        dst[10] = -m[10];
        dst[11] = -m[11];
        dst[12] = -m[12];
        dst[13] = -m[13];
        dst[14] = -m[14];
        dst[15] = -m[15];
        return dst;
    }
    exports.negateMat = negateMat;
    /**
     * Copies a matrix.
     * @param {Matrix4} m The matrix.
     * @param {Matrix4} [dst] The matrix. If not passed a new one is created.
     * @return {Matrix4} A copy of m.
     */
    function copyMat(m, dst) {
        dst = dst || new Float32Array(16);
        dst[0] = m[0];
        dst[1] = m[1];
        dst[2] = m[2];
        dst[3] = m[3];
        dst[4] = m[4];
        dst[5] = m[5];
        dst[6] = m[6];
        dst[7] = m[7];
        dst[8] = m[8];
        dst[9] = m[9];
        dst[10] = m[10];
        dst[11] = m[11];
        dst[12] = m[12];
        dst[13] = m[13];
        dst[14] = m[14];
        dst[15] = m[15];
        return dst;
    }
    exports.copyMat = copyMat;
    /**
     * Creates an n-by-n identity matrix.
     *
     * @param {Matrix4} [dst] matrix to hold result. If not passed a new one is created.
     * @return {Matrix4} An n-by-n identity matrix.
     */
    function identity(dst) {
        dst = dst || new Float32Array(16);
        dst[0] = 1;
        dst[1] = 0;
        dst[2] = 0;
        dst[3] = 0;
        dst[4] = 0;
        dst[5] = 1;
        dst[6] = 0;
        dst[7] = 0;
        dst[8] = 0;
        dst[9] = 0;
        dst[10] = 1;
        dst[11] = 0;
        dst[12] = 0;
        dst[13] = 0;
        dst[14] = 0;
        dst[15] = 1;
        return dst;
    }
    exports.identity = identity;
    /**
     * Takes the transpose of a matrix.
     * @param {Matrix4} m The matrix.
     * @param {Matrix4} [dst] matrix to hold result. If not passed a new one is created.
     * @return {Matrix4} The transpose of m.
     * @memberOf module:twgl/m4
     */
    function transpose(m, dst) {
        dst = dst || new Float32Array(16);
        if (dst === m) {
            let t;
            t = m[1];
            m[1] = m[4];
            m[4] = t;
            t = m[2];
            m[2] = m[8];
            m[8] = t;
            t = m[3];
            m[3] = m[12];
            m[12] = t;
            t = m[6];
            m[6] = m[9];
            m[9] = t;
            t = m[7];
            m[7] = m[13];
            m[13] = t;
            t = m[11];
            m[11] = m[14];
            m[14] = t;
            return dst;
        }
        const m00 = m[0 * 4 + 0];
        const m01 = m[0 * 4 + 1];
        const m02 = m[0 * 4 + 2];
        const m03 = m[0 * 4 + 3];
        const m10 = m[1 * 4 + 0];
        const m11 = m[1 * 4 + 1];
        const m12 = m[1 * 4 + 2];
        const m13 = m[1 * 4 + 3];
        const m20 = m[2 * 4 + 0];
        const m21 = m[2 * 4 + 1];
        const m22 = m[2 * 4 + 2];
        const m23 = m[2 * 4 + 3];
        const m30 = m[3 * 4 + 0];
        const m31 = m[3 * 4 + 1];
        const m32 = m[3 * 4 + 2];
        const m33 = m[3 * 4 + 3];
        dst[0] = m00;
        dst[1] = m10;
        dst[2] = m20;
        dst[3] = m30;
        dst[4] = m01;
        dst[5] = m11;
        dst[6] = m21;
        dst[7] = m31;
        dst[8] = m02;
        dst[9] = m12;
        dst[10] = m22;
        dst[11] = m32;
        dst[12] = m03;
        dst[13] = m13;
        dst[14] = m23;
        dst[15] = m33;
        return dst;
    }
    exports.transpose = transpose;
    /**
     * Computes the inverse of a 4-by-4 matrix.
     * @param {Matrix4} m The matrix.
     * @param {Matrix4} [dst] matrix to hold result. If not passed a new one is created.
     * @return {Matrix4} The inverse of m.
     */
    function inverse(m, dst) {
        dst = dst || new Float32Array(16);
        const m00 = m[0 * 4 + 0];
        const m01 = m[0 * 4 + 1];
        const m02 = m[0 * 4 + 2];
        const m03 = m[0 * 4 + 3];
        const m10 = m[1 * 4 + 0];
        const m11 = m[1 * 4 + 1];
        const m12 = m[1 * 4 + 2];
        const m13 = m[1 * 4 + 3];
        const m20 = m[2 * 4 + 0];
        const m21 = m[2 * 4 + 1];
        const m22 = m[2 * 4 + 2];
        const m23 = m[2 * 4 + 3];
        const m30 = m[3 * 4 + 0];
        const m31 = m[3 * 4 + 1];
        const m32 = m[3 * 4 + 2];
        const m33 = m[3 * 4 + 3];
        const tmp_0 = m22 * m33;
        const tmp_1 = m32 * m23;
        const tmp_2 = m12 * m33;
        const tmp_3 = m32 * m13;
        const tmp_4 = m12 * m23;
        const tmp_5 = m22 * m13;
        const tmp_6 = m02 * m33;
        const tmp_7 = m32 * m03;
        const tmp_8 = m02 * m23;
        const tmp_9 = m22 * m03;
        const tmp_10 = m02 * m13;
        const tmp_11 = m12 * m03;
        const tmp_12 = m20 * m31;
        const tmp_13 = m30 * m21;
        const tmp_14 = m10 * m31;
        const tmp_15 = m30 * m11;
        const tmp_16 = m10 * m21;
        const tmp_17 = m20 * m11;
        const tmp_18 = m00 * m31;
        const tmp_19 = m30 * m01;
        const tmp_20 = m00 * m21;
        const tmp_21 = m20 * m01;
        const tmp_22 = m00 * m11;
        const tmp_23 = m10 * m01;
        const t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
            (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
        const t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
            (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
        const t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
            (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
        const t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
            (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);
        const d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
        dst[0] = d * t0;
        dst[1] = d * t1;
        dst[2] = d * t2;
        dst[3] = d * t3;
        dst[4] = d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
            (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
        dst[5] = d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
            (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
        dst[6] = d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
            (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
        dst[7] = d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
            (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));
        dst[8] = d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
            (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
        dst[9] = d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
            (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
        dst[10] = d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
            (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
        dst[11] = d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
            (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));
        dst[12] = d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
            (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
        dst[13] = d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
            (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
        dst[14] = d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
            (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
        dst[15] = d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
            (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02));
        return dst;
    }
    exports.inverse = inverse;
    /**
     * Multiplies two 4-by-4 matrices with a on the left and b on the right
     * @param {Matrix4} a The matrix on the left.
     * @param {Matrix4} b The matrix on the right.
     * @param {Matrix4} [dst] matrix to hold result. If not passed a new one is created.
     * @return {Matrix4} The matrix product of a and b.
     */
    function multMatMat(a, b, dst) {
        dst = dst || new Float32Array(16);
        const a00 = a[0];
        const a01 = a[1];
        const a02 = a[2];
        const a03 = a[3];
        const a10 = a[4 + 0];
        const a11 = a[4 + 1];
        const a12 = a[4 + 2];
        const a13 = a[4 + 3];
        const a20 = a[8 + 0];
        const a21 = a[8 + 1];
        const a22 = a[8 + 2];
        const a23 = a[8 + 3];
        const a30 = a[12 + 0];
        const a31 = a[12 + 1];
        const a32 = a[12 + 2];
        const a33 = a[12 + 3];
        const b00 = b[0];
        const b01 = b[1];
        const b02 = b[2];
        const b03 = b[3];
        const b10 = b[4 + 0];
        const b11 = b[4 + 1];
        const b12 = b[4 + 2];
        const b13 = b[4 + 3];
        const b20 = b[8 + 0];
        const b21 = b[8 + 1];
        const b22 = b[8 + 2];
        const b23 = b[8 + 3];
        const b30 = b[12 + 0];
        const b31 = b[12 + 1];
        const b32 = b[12 + 2];
        const b33 = b[12 + 3];
        dst[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
        dst[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
        dst[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
        dst[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
        dst[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
        dst[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
        dst[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
        dst[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
        dst[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
        dst[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
        dst[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
        dst[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
        dst[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
        dst[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
        dst[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
        dst[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
        return dst;
    }
    exports.multMatMat = multMatMat;
    /**
     * Multiplies two 4-by-4 matrices with a on the left and b on the right
     * @param {Matrix4} a The matrix on the left.
     * @param {Vec4} b The vector on the right.
     * @param {Vec4} [dst] vector to hold result. If not passed a new one is created.
     * @return {Vec4} The matrix product of a and b.
     */
    function multMatVec(a, b, dst) {
        dst = dst || new Float32Array(4);
        const a00 = a[0];
        const a01 = a[1];
        const a02 = a[2];
        const a03 = a[3];
        const a10 = a[4 + 0];
        const a11 = a[4 + 1];
        const a12 = a[4 + 2];
        const a13 = a[4 + 3];
        const a20 = a[8 + 0];
        const a21 = a[8 + 1];
        const a22 = a[8 + 2];
        const a23 = a[8 + 3];
        const a30 = a[12 + 0];
        const a31 = a[12 + 1];
        const a32 = a[12 + 2];
        const a33 = a[12 + 3];
        const b0 = b[0];
        const b1 = b[1];
        const b2 = b[2];
        const b3 = b[3];
        dst[0] = a00 * b0 + a10 * b1 + a20 * b2 + a30 * b3;
        dst[1] = a01 * b0 + a11 * b1 + a21 * b2 + a31 * b3;
        dst[2] = a02 * b0 + a12 * b1 + a22 * b2 + a32 * b3;
        dst[3] = a03 * b0 + a13 * b1 + a23 * b2 + a33 * b3;
        return dst;
    }
    exports.multMatVec = multMatVec;
});
