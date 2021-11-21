export const vs = `\
uniform mat4 u_projection;
uniform mat4 u_viewInverse;

attribute vec4 a_position;
attribute vec3 a_color;

varying vec3 v_color;

void main() {
  gl_Position = u_projection * u_viewInverse * a_position;
  v_color = a_color;
}`;

export const fs = `\
precision mediump float;

varying vec3 v_color;

void main() {
  gl_FragColor = vec4( v_color, 1.0 );
}`;
