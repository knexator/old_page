export const vs = `\
uniform mat4 u_projection;
uniform mat4 u_viewInverse;
uniform mat4 u_transform;

attribute vec4 a_position;
attribute vec4 a_normal;
attribute vec2 a_texcoord;

varying vec3 v_color;

void main() {
  gl_Position = u_projection * u_viewInverse * u_transform * a_position;
  v_color = vec3(1.0, a_texcoord.y, 0.0);
}`;

export const fs = `\
precision mediump float;

varying vec3 v_color;

void main() {
  // gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
  gl_FragColor = vec4( v_color * (1.0 - gl_FragCoord.z), 1.0 );
}`;
