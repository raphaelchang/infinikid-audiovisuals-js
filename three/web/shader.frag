precision highp float;
varying vec2 vTexCoord;
uniform int count;
uniform sampler2D positions;
uniform sampler2D colors;
uniform sampler2D sizes;
void main() {
    vec2 st = vTexCoord;
    vec4 res = vec4(0.);
    for (int i = 0; i < 1000; i++) {
        vec2 coord = vec2((float(i) + 0.5) / float(count), 0.5);
        vec4 pos = texture2D(positions, coord);
        vec4 col = texture2D(colors, coord);
        vec4 size = texture2D(sizes, coord);
        float radiusSq = size.x * size.x / 4.;
        vec2 dist = st - pos.xy;
        vec4 colMasked = vec4(col.rgb, col.a * (1. - smoothstep(radiusSq * 0.9, radiusSq, dot(dist, dist))));
        //res = vec4(mix(res.rgb * res.a, col.rgb, col.a), col.a + (res.a * (1. - col.a)));
        res.rgb = res.rgb + vec3(0.1, 0.1, 0.1);
    }
    gl_FragColor = res;
}
