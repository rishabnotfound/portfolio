import React, { useEffect, useRef } from "react";

interface Props {
  color1?: string;
  color2?: string;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
}

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor1;
uniform vec3 uColor2;
varying vec2 vUv;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float bayer2(vec2 a){
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}
float bayer4(vec2 a){
  return bayer2(0.5 * a) * 0.25 + bayer2(a);
}

void main() {
  vec2 uv = vUv;
  vec2 coord = gl_FragCoord.xy;

  float noise = snoise(uv * 1.6 + vec2(uTime * 0.05, uTime * 0.03)) * 0.25;
  float diagonal = (uv.x + uv.y) * 0.5;
  float gradient = diagonal * 1.2 + noise;

  vec3 base = vec3(0.0);
  vec3 c1 = uColor1;
  vec3 c2 = uColor2;
  vec3 midA = mix(base, c1, 0.85);
  vec3 midB = mix(base, c2, 0.85);

  vec3 color;
  if (gradient < 0.3) {
    color = base;
  } else if (gradient < 0.55) {
    color = midA;
  } else if (gradient < 0.8) {
    color = midB;
  } else {
    color = mix(c1, c2, 0.5);
  }

  float dither = bayer4(coord);
  float threshold = fract(gradient * 4.0);
  if (gradient < 0.3 && threshold > dither * 0.5) color = midA;
  else if (gradient >= 0.3 && gradient < 0.55 && threshold > dither * 0.5) color = midB;
  else if (gradient >= 0.55 && gradient < 0.8 && threshold > dither * 0.5) color = mix(c1, c2, 0.5);

  float vignette = smoothstep(1.2, 0.3, length(uv - 0.5));
  color = mix(color, color * 0.75, (1.0 - vignette) * 0.5);

  gl_FragColor = vec4(color, 1.0);
}
`;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error("[ShaderBackground] shader error", gl.getShaderInfoLog(s), src);
    return null;
  }
  return s;
}

export function ShaderBackground({
  color1 = "#ff3c3c",
  color2 = "#39e8ff",
  speed = 1,
  className,
  style,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = (canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true })
      || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) { console.warn("[ShaderBackground] WebGL not available"); return; }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("program link error", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "uTime");
    const uRes = gl.getUniformLocation(prog, "uResolution");
    const uC1 = gl.getUniformLocation(prog, "uColor1");
    const uC2 = gl.getUniformLocation(prog, "uColor2");

    const [r1, g1, b1] = hexToRgb(color1);
    const [r2, g2, b2] = hexToRgb(color2);
    gl.uniform3f(uC1, r1, g1, b1);
    gl.uniform3f(uC2, r2, g2, b2);

    let raf = 0;
    const start = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, rect.width || canvas.parentElement?.clientWidth || window.innerWidth);
      const h = Math.max(1, rect.height || canvas.parentElement?.clientHeight || window.innerHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const render = () => {
      gl.uniform1f(uTime, ((performance.now() - start) / 1000) * speed);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [color1, color2, speed]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ display: "block", width: "100%", height: "100%", ...style }}
    />
  );
}
