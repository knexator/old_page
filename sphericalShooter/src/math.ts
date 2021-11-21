// Array of 16 elements, column order
// 0 4 8  12
// 1 5 9  13
// 2 6 10 14
// 3 7 11 15

// 1 = a_{10} = (i = 1, j = 0)
export type Matrix4 = Float32Array;
export type Vec4 = Float32Array;

function getMat(mat: Matrix4, row: number, col: number) {
  return mat[row + col * 4]
}

function setMat(mat: Matrix4, row: number, col: number, value: number) {
  mat[row + col * 4] = value
}

export function pureRot(dist: number, axis_from: number, axis_to: number) {
  let res = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ]);
  let cos = Math.cos(dist)
  let sin = Math.sin(dist)
  setMat(res, axis_from, axis_from, cos)
  setMat(res, axis_to, axis_to, cos)
  setMat(res, axis_from, axis_to, -sin)
  setMat(res, axis_to, axis_from, sin)
  return res
}

export function identity(): Matrix4 {
  let res = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ]);
  return res
}

export function projMat(z0: number, near: boolean): Matrix4 {
  let res = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, near ? 0.5 : -.5, -1,
    0, 0, -z0/2, 0
  ]);
  return res
}

// 0 4 8  12
// 1 5 9  13
// 2 6 10 14
// 3 7 11 15

// 1 = a_{10} = (i = 1, j = 0)
export function multMatVec(mat: Matrix4, vec: Vec4): Vec4 {
  let res = new Float32Array(4);
  for (let row=0; row<4; row++) {
    let cur_res = 0;
    for (let col=0; col<4; col++) {
      cur_res += getMat(mat, row, col) * vec[col]
    }
    res[row] = cur_res
  }
  return res
}

export function multMatMat(mat1: Matrix4, mat2: Matrix4): Matrix4 {
  let res = new Float32Array(16);
  for (let row=0; row<4; row++) {
    for (let col=0; col<4; col++) {
      let cur_res = 0
      for (let k=0; k<4; k++) {
        cur_res += getMat(mat1, row, k) * getMat(mat2, k, col)
      }
      setMat(res, row, col, cur_res)
    }
  }
  return res;
}
