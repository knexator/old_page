export const vs = `\
uniform mat4 u_projection;
uniform mat4 u_viewInverse;

attribute vec4 a_position;
attribute vec4 a_normal;
attribute vec2 a_texcoord;

varying vec3 v_color;

void main() {
  gl_Position = u_projection * u_viewInverse * a_position;
  v_color = vec3(a_texcoord, 0.0);
}`;

export const fs = `\
precision mediump float;

varying vec3 v_color;

void main() {
  // gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
  gl_FragColor = vec4( v_color, 1.0 );
}`;
