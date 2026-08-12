import{A as e,B as t,C as n,D as r,E as i,F as a,G as o,H as s,I as c,J as l,K as u,L as d,M as f,N as p,O as m,P as h,R as g,S as _,T as v,U as ee,V as y,W as b,Y as x,_ as S,a as te,b as ne,c as C,d as w,f as T,g as E,h as D,i as re,j as O,k,l as ie,m as ae,n as A,o as j,p as oe,q as M,r as se,s as ce,t as N,u as le,v as ue,w as de,x as fe,y as P,z as F}from"./three-B9zdnfoS.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var pe={LOW:0,MED:1,HIGH:2};function me(e){try{let t=e.getExtension(`WEBGL_debug_renderer_info`);return t?(e.getParameter(t.UNMASKED_RENDERER_WEBGL)||``).toLowerCase():``}catch{return``}}function he(e){let t=matchMedia(`(hover: none) and (pointer: coarse)`).matches,n=navigator.hardwareConcurrency||4,r=navigator.deviceMemory||(t?4:8),i=me(e),a=0;return a+=t?0:3,a+=n>=8?2:+(n>=6),a+=r>=8?2:+(r>=4),/apple\s*(a1[4-9]|a[2-9]\d|m[1-9])/.test(i)?a+=3:/apple/.test(i)&&(a+=2),/adreno\s*(7\d\d|6[5-9]\d)/.test(i)&&(a+=2),/mali-g(7[1-9]|[89]\d)/.test(i)&&(a+=1),/(rtx|radeon rx|geforce)/.test(i)&&(a+=3),/(swiftshader|llvmpipe|software)/.test(i)&&(a-=6),{tier:a>=7?pe.HIGH:a>=4?pe.MED:pe.LOW,touch:t,cores:n,mem:r,renderer:i}}var ge=[{maxDpr:1.5,msaa:0,bloomLevels:4,shadows:!0,shadowSize:768,sparks:260,orbLights:1,envSize:128,grain:!0,aberration:.55,floorDetail:.55,starCount:900,trailSegments:14},{maxDpr:2,msaa:4,bloomLevels:5,shadows:!0,shadowSize:1024,sparks:520,orbLights:2,envSize:256,grain:!0,aberration:.8,floorDetail:.8,starCount:1600,trailSegments:20},{maxDpr:2,msaa:4,bloomLevels:6,shadows:!0,shadowSize:2048,sparks:900,orbLights:4,envSize:256,grain:!0,aberration:1,floorDetail:1,starCount:2600,trailSegments:26}],_e=class{constructor(e=.62){this.scale=1,this.min=e,this.avg=16.7,this.acc=0,this.dirty=!1}update(e){return e>120?!1:(this.avg+=(e-this.avg)*.045,this.avg>20.5?this.acc+=1:this.avg<13.2?--this.acc:this.acc*=.9,this.acc>70&&this.scale>this.min?(this.scale=Math.max(this.min,this.scale-.09),this.acc=0,!0):this.acc<-140&&this.scale<1&&(this.scale=Math.min(1,this.scale+.06),this.acc=0,!0))}},I=`models/space/`,L=`models/station/`,ve=[[`craft_speederA`,I],[`craft_speederB`,I],[`craft_speederC`,I],[`craft_speederD`,I],[`structure`,I],[`structure_detailed`,I],[`structure_diagonal`,I],[`supports_high`,I],[`supports_low`,I],[`platform_large`,I],[`platform_long`,I],[`platform_high`,I],[`rail_middle`,I],[`rail_end`,I],[`pipe_straight`,I],[`pipe_ring`,I],[`pipe_ringHigh`,I],[`pipe_supportHigh`,I],[`pipe_corner`,I],[`machine_generator`,I],[`machine_generatorLarge`,I],[`machine_wireless`,I],[`satelliteDish`,I],[`satelliteDish_large`,I],[`turret_single`,I],[`turret_double`,I],[`hangar_roundA`,I],[`hangar_smallB`,I],[`barrels`,I],[`barrels_rail`,I],[`rocket_baseA`,I],[`rocket_fuelA`,I],[`monorail_trackStraight`,I],[`monorail_trackSupport`,I],[`rock_crystals`,I],[`rock_crystalsLargeA`,I],[`meteor`,I],[`meteor_detailed`,I],[`rock_largeA`,I],[`container`,L],[`container-tall`,L],[`structure-barrier-high`,L],[`structure-panel`,L],[`display-wall`,L],[`computer-wide`,L]],ye=class{constructor(){this.models=new Map,this.loader=new N}async loadAll(e){let t=ve.length,n=0,r=ve.slice();await Promise.all(Array.from({length:6},async()=>{for(;;){let i=r.shift();if(!i)return;let[a,o]=i;try{let e=await this.loader.loadAsync(`${o}${a}.glb`);this.models.set(a,this._prepare(e.scene,a))}catch(e){console.warn(`[assets] failed: ${a}`,e),this.models.set(a,new P)}n++,e?.(n,t,a)}}));try{let e=await new b().loadAsync(`${L}Textures/colormap.png`);e.colorSpace=d,e.flipY=!1,e.anisotropy=4,this.colormap=e}catch(e){console.warn(`[assets] colormap missing`,e)}return this.models}_prepare(e,t){e.updateMatrixWorld(!0);let n=new P;e.traverse(e=>{if(!e.isMesh||!e.geometry)return;let t=e.geometry.clone();t.applyMatrix4(e.matrixWorld),t.attributes.normal||t.computeVertexNormals();let r=new i(t,e.material);r.name=e.name,r.userData.srcMat=e.material?.name||`default`,r.castShadow=!0,r.receiveShadow=!0,n.add(r)});let r=new j().setFromObject(n);r.isEmpty()&&r.set(new M,new M);let a=(r.min.x+r.max.x)*.5,o=(r.min.z+r.max.z)*.5,s=r.min.y;for(let e of n.children)e.geometry.translate(-a,-s,-o),e.geometry.computeBoundingSphere(),e.geometry.computeBoundingBox();return n.userData.modelName=t,n.userData._bounds=new j().setFromObject(n),n}clone(e){let t=this.models.get(e);if(!t)return console.warn(`[assets] missing model: ${e}`),new P;let n=t.clone(!0);return n.traverse(e=>{e.isMesh&&(e.userData.srcMat=e.userData.srcMat)}),n}bounds(e){let t=this.models.get(e);return t?(t.userData._bounds||(t.userData._bounds=new j().setFromObject(t)),t.userData._bounds):new j(new M,new M(1,1,1))}},be=new Map;function R(e,t){if(be.has(e))return be.get(e);let n=new m(t);return be.set(e,n),n}var xe=null;function Se(e){xe=e;let t=be.get(`f.colormap`);t&&(t.map=e,t.needsUpdate=!0)}function Ce(){return{colormap:R(`f.colormap`,{map:xe,color:6451327,metalness:.55,roughness:.66,envMapIntensity:.45}),metal:R(`f.metal`,{color:5464954,metalness:.9,roughness:.5,envMapIntensity:.5}),metalDark:R(`f.metalDark`,{color:3358543,metalness:.86,roughness:.6,envMapIntensity:.45}),dark:R(`f.dark`,{color:856603,metalness:.42,roughness:.6,envMapIntensity:.45}),metalRed:R(`f.accent`,{color:928312,metalness:.55,roughness:.38,emissive:2009544,emissiveIntensity:.28,envMapIntensity:.9}),_defaultMat:R(`f.default`,{color:4871781,metalness:.72,roughness:.55,envMapIntensity:.5}),rock:R(`f.rock`,{color:1909034,metalness:.06,roughness:.92,envMapIntensity:.4}),rockTrack:R(`f.rockTrack`,{color:1579811,metalness:.05,roughness:.95,envMapIntensity:.38}),crystal:R(`f.crystal`,{color:866890,metalness:.1,roughness:.12,emissive:3596543,emissiveIntensity:1.5,envMapIntensity:1.2,transparent:!0,opacity:.9})}}function we(e,t){let n=new T(e),r=new T(t),i={h:0,s:0,l:0};n.getHSL(i);let a=new T().setHSL(i.h,.58,.64),o=new T().setHSL(i.h,.62,.3),s=new T().setHSL(i.h,.55,.14);return{metal:new m({color:a,metalness:.62,roughness:.33,envMapIntensity:1.8}),metalDark:new m({color:o,metalness:.58,roughness:.46,envMapIntensity:1.5}),dark:new m({color:s,metalness:.5,roughness:.45,envMapIntensity:1}),metalRed:new m({color:r.clone().multiplyScalar(.35),metalness:.4,roughness:.3,emissive:n,emissiveIntensity:3.4,envMapIntensity:1}),_defaultMat:new m({color:a,metalness:.85,roughness:.38,envMapIntensity:1.2})}}function Te(e,t,n=`metal`){return e.traverse(e=>{e.isMesh&&(e.material=t[e.userData.srcMat]||t[n]||t._defaultMat)}),e}var Ee=`
precision highp float;
varying vec3 vDir;
uniform vec3 uHorizon;
uniform vec3 uZenith;
uniform vec3 uNebulaA;
uniform vec3 uNebulaB;
uniform vec3 uSunDir;
uniform vec3 uSunColor;

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float vnoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i + vec3(0,0,0)), n100 = hash13(i + vec3(1,0,0));
  float n010 = hash13(i + vec3(0,1,0)), n110 = hash13(i + vec3(1,1,0));
  float n001 = hash13(i + vec3(0,0,1)), n101 = hash13(i + vec3(1,0,1));
  float n011 = hash13(i + vec3(0,1,1)), n111 = hash13(i + vec3(1,1,1));
  return mix(mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
             mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y), f.z);
}
float fbm(vec3 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 6; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return s;
}

void main() {
  vec3 d = normalize(vDir);

  // Base vertical gradient — cold void above, a faint warm floor below.
  float up = d.y * 0.5 + 0.5;
  vec3 col = mix(uHorizon, uZenith, pow(up, 0.75));

  // Two nebula layers at different scales, warped by a third for filament
  // structure. Ridged (1 - |n|) gives the wispy edges rather than blobs.
  vec3 w = vec3(fbm(d * 1.6 + 11.0), fbm(d * 1.6 + 27.0), fbm(d * 1.6 + 43.0));
  float n1 = fbm(d * 2.4 + w * 1.8);
  n1 = pow(smoothstep(0.34, 0.86, n1), 1.7);
  float n2 = fbm(d * 5.1 - w * 1.1);
  n2 = pow(smoothstep(0.46, 0.95, n2), 2.6);

  col += uNebulaA * n1 * 1.7;
  col += uNebulaB * n2 * 1.1;
  // A third, tighter layer picks out bright filament cores.
  float n3 = fbm(d * 9.0 + w * 0.6);
  col += (uNebulaA + uNebulaB) * pow(smoothstep(0.58, 0.96, n3), 3.0) * 0.55;

  // A distant blue-white star acting as the key light, so IBL specular has a
  // believable dominant direction that matches the scene's directional light.
  float sd = max(dot(d, normalize(uSunDir)), 0.0);
  col += uSunColor * pow(sd, 900.0) * 42.0;
  col += uSunColor * pow(sd, 14.0) * 0.75;
  col += uSunColor * pow(sd, 3.0) * 0.13;

  // Broad warm bounce from the direction of the gas giant so metal picks it up.
  float gd = max(dot(d, normalize(vec3(-0.55, 0.12, -0.82))), 0.0);
  col += vec3(0.42, 0.20, 0.34) * pow(gd, 3.5) * 0.5;

  gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
}`,De=`
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,Oe=`
attribute float aSize;
attribute float aPhase;
attribute vec3 aTint;
uniform float uTime;
uniform float uPixelRatio;
varying float vAlpha;
varying vec3 vTint;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  // Slow, per-star scintillation — two detuned sines never visibly loop.
  float tw = 0.62 + 0.38 * sin(uTime * 1.5 + aPhase) * sin(uTime * 0.41 + aPhase * 2.3);
  vAlpha = tw;
  vTint = aTint;
  gl_PointSize = aSize * uPixelRatio * (0.55 + tw * 0.65);
}`,ke=`
precision mediump float;
varying float vAlpha;
varying vec3 vTint;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float r = length(p);
  float core = exp(-r * r * 34.0);
  // Cross-shaped diffraction spikes: cheap, and instantly reads as "lens".
  float spike = exp(-abs(p.x) * 46.0) * exp(-abs(p.y) * 7.0)
              + exp(-abs(p.y) * 46.0) * exp(-abs(p.x) * 7.0);
  float a = core + spike * 0.34;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vTint * a * vAlpha * 3.2, 1.0);
}`,Ae=`
varying vec3 vN;
varying vec3 vPos;
void main() {
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vPos = mv.xyz;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * mv;
}`,je=`
precision highp float;
varying vec3 vN;
varying vec3 vPos;
varying vec3 vWorld;
uniform vec3 uSunDir;
uniform float uTime;

float hash11(float p){ p = fract(p*0.1031); p *= p+33.33; return fract(p*(p+p)); }
float n1d(float x){ float i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f); return mix(hash11(i),hash11(i+1.0),f); }
float bands(float y){
  float s = 0.0, a = 0.6, fq = 5.0;
  for (int i=0;i<5;i++){ s += a * n1d(y*fq + float(i)*17.0); fq *= 2.1; a *= 0.5; }
  return s;
}

void main() {
  vec3 n = normalize(vN);
  vec3 L = normalize(uSunDir);
  vec3 V = normalize(-vPos);

  // Latitude banding, sheared slowly to imply rotation.
  vec3 op = normalize(vWorld);
  float lat = op.y;
  float b = bands(lat * 3.1 + sin(lat * 9.0 + uTime * 0.012) * 0.06 + uTime * 0.004);

  vec3 warm = vec3(0.62, 0.24, 0.30);
  vec3 cool = vec3(0.20, 0.13, 0.32);
  vec3 pale = vec3(0.78, 0.55, 0.48);
  vec3 albedo = mix(cool, warm, smoothstep(0.28, 0.76, b));
  albedo = mix(albedo, pale, smoothstep(0.72, 0.98, b) * 0.6);

  // Wrapped diffuse — a planet-sized body has no hard terminator at this range.
  float ndl = dot(n, L);
  float wrap = clamp((ndl + 0.35) / 1.35, 0.0, 1.0);
  vec3 col = albedo * wrap * 1.75;
  col += albedo * 0.045;                                   // ambient fill

  // Atmospheric limb: forward-scattered light hugging the silhouette.
  float fres = pow(1.0 - max(dot(n, V), 0.0), 3.2);
  float lit  = smoothstep(-0.55, 0.6, ndl);
  col += vec3(0.72, 0.42, 0.92) * fres * (0.18 + lit * 1.35);

  gl_FragColor = vec4(col, 1.0);
}`,Me=new M(.42,.76,.5).normalize();function Ne(e,t,r){let a=new P;a.name=`environment`;let o=new F({vertexShader:De,fragmentShader:Ee,side:1,depthWrite:!1,uniforms:{uHorizon:{value:new T(1186360).convertSRGBToLinear()},uZenith:{value:new T(329749).convertSRGBToLinear()},uNebulaA:{value:new T(3810448).convertSRGBToLinear().multiplyScalar(2.1)},uNebulaB:{value:new T(1410488).convertSRGBToLinear().multiplyScalar(1.7)},uSunDir:{value:Me.clone()},uSunColor:{value:new T(12575999).convertSRGBToLinear()}}}),l=new g,u=new i(new ce(2,2,2),o);l.add(u);let d=new re(r.envSize,{type:ne,format:h,generateMipmaps:!0,minFilter:de,magFilter:n}),f=new ae(.1,10,d),m=e.getRenderTarget();f.update(e,l),e.setRenderTarget(m);let _=new se(e);_.compileCubemapShader();let v=_.fromCubemap(d.texture);t.environment=v.texture,t.background=d.texture,t.backgroundIntensity=1.25,t.environmentIntensity=2.1,_.dispose(),u.geometry.dispose(),o.dispose();let y=r.starCount,b=new Float32Array(y*3),x=new Float32Array(y),S=new Float32Array(y),te=new Float32Array(y*3),w=new T;for(let e=0;e<y;e++){let t=Math.random()*2-1,n=Math.random()*Math.PI*2,r=Math.sqrt(1-t*t);b[e*3]=Math.cos(n)*r*620,b[e*3+1]=Math.max(-.18,t)*620*.9+40,b[e*3+2]=Math.sin(n)*r*620,x[e]=1.4+Math.random()**3.2*8.2,S[e]=Math.random()*100;let i=Math.random();i>.9?w.setHSL(.08,.55,.72):i>.76?w.setHSL(.11,.3,.84):i>.34?w.setHSL(.58,.18,.92):w.setHSL(.6,.42,.86),te[e*3]=w.r,te[e*3+1]=w.g,te[e*3+2]=w.b}let E=new ie;E.setAttribute(`position`,new C(b,3)),E.setAttribute(`aSize`,new C(x,1)),E.setAttribute(`aPhase`,new C(S,1)),E.setAttribute(`aTint`,new C(te,3)),E.boundingSphere=new s(new M,868);let D=new F({vertexShader:Oe,fragmentShader:ke,uniforms:{uTime:{value:0},uPixelRatio:{value:Math.min(e.getPixelRatio(),2)}},transparent:!0,blending:2,depthWrite:!1,depthTest:!1}),O=new p(E,D);O.renderOrder=-900,O.frustumCulled=!1,a.add(O);let k=new F({vertexShader:`varying vec3 vWorld;
`+Ae,fragmentShader:je,uniforms:{uSunDir:{value:Me.clone()},uTime:{value:0}},depthWrite:!1}),A=new i(new ee(1,64,48),k);A.scale.setScalar(95),A.position.set(-390,105,-640),A.renderOrder=-880,A.frustumCulled=!1,a.add(A);let j=new c(1.42,2.35,128,1),oe=new F({transparent:!0,blending:2,depthWrite:!1,side:2,uniforms:{uSunDir:{value:Me.clone()}},vertexShader:`
      varying vec2 vUvR; varying vec3 vW;
      void main(){
        vUvR = uv;
        vec4 wp = modelMatrix * vec4(position,1.0); vW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,fragmentShader:`
      precision mediump float;
      varying vec2 vUvR; varying vec3 vW;
      float h(float x){ x=fract(x*0.1031); x*=x+33.33; return fract(x*(x+x)); }
      void main(){
        float r = vUvR.y;
        // Concentric density gaps, plus a soft falloff at both edges.
        float d = 0.0, f = 7.0, a = 0.6;
        for (int i=0;i<4;i++){ d += a*h(floor(r*f)); f*=2.3; a*=0.55; }
        d *= smoothstep(0.0,0.13,r) * (1.0 - smoothstep(0.72,1.0,r));
        vec3 col = mix(vec3(0.42,0.30,0.26), vec3(0.62,0.52,0.58), d);
        gl_FragColor = vec4(col * d * 0.42, 1.0);
      }`}),N=new i(j,oe);return N.scale.setScalar(95),N.position.copy(A.position),N.rotation.set(-Math.PI/2+.3,.22,.5),N.renderOrder=-870,N.frustumCulled=!1,a.add(N),t.add(a),{group:a,envTexture:v.texture,update(e){D.uniforms.uTime.value=e,k.uniforms.uTime.value=e},setPixelRatio(e){D.uniforms.uPixelRatio.value=Math.min(e,2)},dispose(){E.dispose(),D.dispose(),A.geometry.dispose(),k.dispose(),j.dispose(),oe.dispose(),d.dispose(),v.dispose()}}}var Pe=`
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`,Fe=`
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2  uTexel;
uniform float uThreshold;
uniform float uKnee;
out vec4 fragColor;

float karis(vec3 c) { return 1.0 / (1.0 + max(c.r, max(c.g, c.b))); }

void main() {
  vec2 t = uTexel;
  vec3 a = texture(uTex, vUv + vec2(-t.x, -t.y)).rgb;
  vec3 b = texture(uTex, vUv + vec2( t.x, -t.y)).rgb;
  vec3 c = texture(uTex, vUv + vec2(-t.x,  t.y)).rgb;
  vec3 d = texture(uTex, vUv + vec2( t.x,  t.y)).rgb;

  // Weighting each tap by inverse luma kills single-pixel fireflies before
  // they get smeared across the screen by the blur chain.
  float wa = karis(a), wb = karis(b), wc = karis(c), wd = karis(d);
  vec3 col = (a * wa + b * wb + c * wc + d * wd) / max(wa + wb + wc + wd, 1e-4);

  float br = max(col.r, max(col.g, col.b));
  float soft = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee);
  soft = soft * soft / (4.0 * uKnee + 1e-4);
  col *= max(soft, br - uThreshold) / max(br, 1e-4);

  fragColor = vec4(min(col, vec3(48.0)), 1.0);
}`,Ie=`
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uTexel;
out vec4 fragColor;

void main() {
  vec2 t = uTexel;
  vec3 a = texture(uTex, vUv + t * vec2(-2.0,  2.0)).rgb;
  vec3 b = texture(uTex, vUv + t * vec2( 0.0,  2.0)).rgb;
  vec3 c = texture(uTex, vUv + t * vec2( 2.0,  2.0)).rgb;
  vec3 d = texture(uTex, vUv + t * vec2(-2.0,  0.0)).rgb;
  vec3 e = texture(uTex, vUv                        ).rgb;
  vec3 f = texture(uTex, vUv + t * vec2( 2.0,  0.0)).rgb;
  vec3 g = texture(uTex, vUv + t * vec2(-2.0, -2.0)).rgb;
  vec3 h = texture(uTex, vUv + t * vec2( 0.0, -2.0)).rgb;
  vec3 i = texture(uTex, vUv + t * vec2( 2.0, -2.0)).rgb;
  vec3 j = texture(uTex, vUv + t * vec2(-1.0,  1.0)).rgb;
  vec3 k = texture(uTex, vUv + t * vec2( 1.0,  1.0)).rgb;
  vec3 l = texture(uTex, vUv + t * vec2(-1.0, -1.0)).rgb;
  vec3 m = texture(uTex, vUv + t * vec2( 1.0, -1.0)).rgb;

  vec3 col = e * 0.125;
  col += (a + c + g + i) * 0.03125;
  col += (b + d + f + h) * 0.0625;
  col += (j + k + l + m) * 0.125;
  fragColor = vec4(col, 1.0);
}`,Le=`
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2  uTexel;
uniform float uRadius;
uniform float uStretch;   // >1 widens the kernel horizontally: anamorphic streak
out vec4 fragColor;

void main() {
  vec2 t = uTexel * uRadius * vec2(uStretch, 1.0);
  vec3 col = texture(uTex, vUv + vec2(-t.x,  t.y)).rgb * 1.0;
  col += texture(uTex, vUv + vec2( 0.0,  t.y)).rgb * 2.0;
  col += texture(uTex, vUv + vec2( t.x,  t.y)).rgb * 1.0;
  col += texture(uTex, vUv + vec2(-t.x,  0.0)).rgb * 2.0;
  col += texture(uTex, vUv                    ).rgb * 4.0;
  col += texture(uTex, vUv + vec2( t.x,  0.0)).rgb * 2.0;
  col += texture(uTex, vUv + vec2(-t.x, -t.y)).rgb * 1.0;
  col += texture(uTex, vUv + vec2( 0.0, -t.y)).rgb * 2.0;
  col += texture(uTex, vUv + vec2( t.x, -t.y)).rgb * 1.0;
  fragColor = vec4(col * (1.0 / 16.0), 1.0);
}`,Re=`
precision highp float;
in vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform vec2  uRes;
uniform float uTime;
uniform float uExposure;
uniform float uBloomStrength;
uniform float uAberration;
uniform float uVignette;
uniform float uGrain;
uniform float uRadial;      // radial blur pulse (0 = off)
uniform float uFlash;       // full-screen white flash
uniform vec3  uFlashTint;
uniform float uDesat;       // hit-stop drains colour momentarily
out vec4 fragColor;

// ACES fitted (Stephen Hill). Punchy highlight rolloff, keeps neons saturated
// right up to the clip point, which is the entire point of this art direction.
const mat3 ACES_IN = mat3(
  0.59719, 0.07600, 0.02840,
  0.35458, 0.90834, 0.13383,
  0.04823, 0.01566, 0.83777);
const mat3 ACES_OUT = mat3(
   1.60475, -0.10208, -0.00327,
  -0.53108,  1.10813, -0.07276,
  -0.07367, -0.00605,  1.07602);

vec3 rrtOdt(vec3 v) {
  vec3 a = v * (v + 0.0245786) - 0.000090537;
  vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
  return a / b;
}
vec3 aces(vec3 c) {
  c = ACES_IN * c;
  c = rrtOdt(c);
  return clamp(ACES_OUT * c, 0.0, 1.0);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 uv = vUv;
  vec2 cen = uv - 0.5;
  float r2 = dot(cen, cen);

  // --- barrel-ish lens pinch, very slight, sells a physical optic ----------
  uv = 0.5 + cen * (1.0 + r2 * 0.011);

  // --- radial blur pulse ---------------------------------------------------
  vec3 scene;
  if (uRadial > 0.001) {
    vec2 dir = (uv - 0.5) * uRadial * 0.055;
    scene  = texture(uScene, uv).rgb                * 0.30;
    scene += texture(uScene, uv - dir * 0.35).rgb   * 0.24;
    scene += texture(uScene, uv - dir * 0.70).rgb   * 0.20;
    scene += texture(uScene, uv - dir * 1.05).rgb   * 0.15;
    scene += texture(uScene, uv - dir * 1.45).rgb   * 0.11;
  } else {
    scene = texture(uScene, uv).rgb;
  }

  // --- chromatic aberration, scaled by distance from centre ---------------
  float ca = uAberration * (0.00042 + r2 * 0.0019);
  if (ca > 0.00002) {
    vec2 off = normalize(cen + 1e-6) * ca;
    scene.r = texture(uScene, uv + off).r;
    scene.b = texture(uScene, uv - off).b;
  }

  vec3 bloom = texture(uBloom, uv).rgb;
  // Bloom gets its own, stronger aberration — that's what reads as "lens".
  if (ca > 0.00002) {
    vec2 off2 = normalize(cen + 1e-6) * ca * 1.9;
    bloom.r = texture(uBloom, uv + off2).r;
    bloom.b = texture(uBloom, uv - off2).b;
  }

  vec3 col = scene + bloom * uBloomStrength;
  col += uFlashTint * uFlash;
  col *= uExposure;

  col = aces(col);

  // --- grade: cool shadows, warm speculars, gentle S-curve ----------------
  col = mix(col, col * vec3(0.90, 0.97, 1.12), 0.42 * (1.0 - smoothstep(0.0, 0.45, dot(col, vec3(0.333)))));
  col = mix(col, col * vec3(1.06, 1.01, 0.94), 0.30 * smoothstep(0.55, 1.0, dot(col, vec3(0.333))));
  col = clamp(col, 0.0, 1.0);
  col = col * col * (3.0 - 2.0 * col) * 0.16 + col * 0.84;

  float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(col, vec3(luma), uDesat);

  // --- vignette ------------------------------------------------------------
  float vig = 1.0 - uVignette * smoothstep(0.16, 0.82, r2);
  col *= vig;

  // --- grain, tuned to sit just at the edge of perception -----------------
  if (uGrain > 0.0) {
    float n = hash12(gl_FragCoord.xy + fract(uTime) * 431.7);
    col += (n - 0.5) * uGrain * (1.08 - luma * 0.72);
  }

  // sRGB encode
  col = max(col, vec3(0.0));
  vec3 lo = col * 12.92;
  vec3 hi = 1.055 * pow(col, vec3(1.0 / 2.4)) - 0.055;
  fragColor = vec4(mix(hi, lo, step(col, vec3(0.0031308))), 1.0);
}`;function ze(e,t){return new a({glslVersion:ue,vertexShader:`in vec3 position;
in vec2 uv;
`+Pe,fragmentShader:e,uniforms:t,depthTest:!1,depthWrite:!1})}var Be=class{constructor(e,t){this.renderer=e,this.levels=t.bloomLevels,this.preset=t,this.scene=new g,this.cam=new k(-1,1,1,-1,0,1);let r=new ie;r.setAttribute(`position`,new C(new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),3)),r.setAttribute(`uv`,new C(new Float32Array([0,0,2,0,0,2]),2)),this.quad=new i(r,null),this.quad.frustumCulled=!1,this.scene.add(this.quad);let a={type:ne,format:h,minFilter:n,magFilter:n,wrapS:w,wrapT:w,depthBuffer:!0,generateMipmaps:!1,colorSpace:v};this.hdr=new x(2,2,{...a,samples:t.msaa|0}),this.mips=[],this.mPre=ze(Fe,{uTex:{value:null},uTexel:{value:new u},uThreshold:{value:1.28},uKnee:{value:.55}}),this.mDown=ze(Ie,{uTex:{value:null},uTexel:{value:new u}}),this.mUp=ze(Le,{uTex:{value:null},uTexel:{value:new u},uRadius:{value:1},uStretch:{value:1.42}}),this.mUp.blending=2,this.mComp=ze(Re,{uScene:{value:null},uBloom:{value:null},uRes:{value:new u},uTime:{value:0},uExposure:{value:1},uBloomStrength:{value:.42},uAberration:{value:t.aberration},uVignette:{value:.44},uGrain:{value:t.grain?.011:0},uRadial:{value:0},uFlash:{value:0},uFlashTint:{value:new T(1,1,1)},uDesat:{value:0}}),this.u=this.mComp.uniforms}setSize(e,t){e=Math.max(2,e|0),t=Math.max(2,t|0),this.w=e,this.h=t,this.hdr.setSize(e,t),this.u.uRes.value.set(e,t);for(let e of this.mips)e.dispose();this.mips=[];let r=e,i=t;for(let e=0;e<this.levels;e++){r=Math.max(1,r>>1),i=Math.max(1,i>>1);let t=new x(r,i,{type:ne,format:h,minFilter:n,magFilter:n,wrapS:w,wrapT:w,depthBuffer:!1,generateMipmaps:!1,colorSpace:v});if(this.mips.push(t),r<=2||i<=2){this.activeLevels=e+1;break}this.activeLevels=e+1}}_pass(e,t){this.quad.material=e,this.renderer.setRenderTarget(t),this.renderer.render(this.scene,this.cam)}renderScene(e,t){this.renderer.setRenderTarget(this.hdr),this.renderer.clear(!0,!0,!0),this.renderer.render(e,t)}present(e){let t=this.activeLevels;this.mPre.uniforms.uTex.value=this.hdr.texture,this.mPre.uniforms.uTexel.value.set(1/this.w,1/this.h),this._pass(this.mPre,this.mips[0]);for(let e=1;e<t;e++){let t=this.mips[e-1];this.mDown.uniforms.uTex.value=t.texture,this.mDown.uniforms.uTexel.value.set(1/t.width,1/t.height),this._pass(this.mDown,this.mips[e])}for(let e=t-1;e>0;e--){let t=this.mips[e];this.mUp.uniforms.uTex.value=t.texture,this.mUp.uniforms.uTexel.value.set(1/t.width,1/t.height),this._pass(this.mUp,this.mips[e-1])}this.u.uScene.value=this.hdr.texture,this.u.uBloom.value=this.mips[0].texture,this.u.uTime.value=e,this.renderer.setRenderTarget(null),this._pass(this.mComp,null)}dispose(){this.hdr.dispose();for(let e of this.mips)e.dispose();this.mPre.dispose(),this.mDown.dispose(),this.mUp.dispose(),this.mComp.dispose(),this.quad.geometry.dispose()}},z={half:13.6,chamfer:5,wallH:2.9,floorY:0,playY:.92},Ve=[{key:`S`,nx:0,nz:1,ang:0},{key:`W`,nx:-1,nz:0,ang:Math.PI*.5},{key:`N`,nx:0,nz:-1,ang:Math.PI},{key:`E`,nx:1,nz:0,ang:Math.PI*1.5}],B=[{id:0,name:`YOU`,color:2417407,deep:688022,css:`#24e2ff`,craft:`craft_speederC`,human:!0},{id:1,name:`VEX`,color:16723880,deep:9573214,css:`#ff2fa8`,craft:`craft_speederB`,human:!1},{id:2,name:`KORR`,color:16756768,deep:9395205,css:`#ffb020`,craft:`craft_speederA`,human:!1},{id:3,name:`SABLE`,color:8847165,deep:4427802,css:`#86ff3d`,craft:`craft_speederD`,human:!1}],V={startPoints:5,orbSchedule:[{t:0,n:1},{t:24,n:2},{t:56,n:3},{t:92,n:4}],orbCapMobile:3,respawnDelay:1.05,serveDelay:1.5},H={halfLen:2.4,halfThick:.46,standoff:2.45,maxSpeed:40,accel:320,damp:13,recenterRate:7,bankMax:.62,hover:.16},U={radius:.52,baseSpeed:14.5,maxSpeed:33,rallyGain:.34,paddleBoost:1.05,spinInfluence:.26,angleInfluence:.78,minAngle:.3},He=[{name:`ROOKIE`,react:.34,err:3.6,speed:.51,aggression:.25},{name:`PILOT`,react:.22,err:2.3,speed:.66,aggression:.45},{name:`ACE`,react:.13,err:1.2,speed:.82,aggression:.7}],W=(e,t,n)=>e<t?t:e>n?n:e,G=(e,t,n)=>e+(t-e)*n,Ue=e=>e*e*(3-2*e),K=(e,t,n,r)=>G(e,t,1-Math.exp(-n*r)),q=(e,t)=>e+Math.random()*(t-e),We=(e,t)=>e+Math.random()*(t-e+1)|0,Ge=e=>e[Math.random()*e.length|0];function Ke(e){let t=Math.floor(e),n=e-t,r=n*n*(3-2*n),i=e=>{let t=Math.sin(e*127.1)*43758.5453;return(t-Math.floor(t))*2-1};return G(i(t),i(t+1),r)}var qe=(()=>{let{half:e,chamfer:t,wallH:n}=z,r=e-t,i=1.9,a=[[-r,e],[r,e],[e,r],[e,-r],[r,-e],[-r,-e],[-e,-r],[-e,r]],o=[];for(let[e,t]of a){let r=Math.hypot(e,t),a=e+e/r*i,s=t+t/r*i;o.push(new M(a,0,s)),o.push(new M(a,n+.5,s))}return o})(),Je=class{constructor(t){this.cam=new e(50,t,.5,1400),this.trauma=0,this.traumaTime=0,this.fovPunch=0,this.leanX=0,this.leanZ=0,this.targetLeanX=0,this.targetLeanZ=0,this.zoom=1,this.targetZoom=1,this.intro=0,this.introActive=!1,this.kickX=0,this.kickY=0,this._base=new M,this._look=new M,this.resize(t)}resize(e){this.aspect=e,this.cam.aspect=e;let t=W((1.35-e)/(1.35-.52),0,1);this.portraitness=Ue(t),this.elevation=G(40,66,this.portraitness)*Math.PI/180,this.baseFov=G(48,62,this.portraitness),this.cam.fov=this.baseFov,this.lookLift=G(-1.2,-3.4,this.portraitness),this._solveDistance(),this.cam.updateProjectionMatrix()}_solveDistance(){let e=this.baseFov*Math.PI/180,t=2*Math.atan(Math.tan(e/2)*this.aspect),n=G(.94,.99,this.portraitness),r=G(.86,.8,this.portraitness),i=z.half*1.2/Math.sin(Math.min(e,t)/2),a=Qe;a.fov=this.baseFov,a.aspect=this.aspect,a.updateProjectionMatrix();for(let e=0;e<8;e++){let e=Math.cos(this.elevation),t=Math.sin(this.elevation);a.position.set(0,t*i,e*i),a.lookAt(0,this.lookLift,this.lookLift*.15),a.updateMatrixWorld(!0);let o=0,s=0;for(let e of qe)Ze.copy(e).project(a),o=Math.max(o,Math.abs(Ze.x)),s=Math.max(s,Math.abs(Ze.y));let c=Math.max(o/n,s/r);if(Math.abs(c-1)<.004)break;i*=c}this.distance=i}shake(e){this.trauma=Math.min(1,this.trauma+e)}kick(e,t,n){this.kickX+=e*n,this.kickY+=t*n}punch(e){this.fovPunch=Math.min(9,this.fovPunch+e)}lookToward(e,t,n=1){this.targetLeanX=W(e*.055,-1.4,1.4)*n,this.targetLeanZ=W(t*.045,-1.2,1.2)*n}startIntro(){this.intro=0,this.introActive=!0}update(e,t){this.trauma=Math.max(0,this.trauma-e*1.55),this.traumaTime+=e*(28+this.trauma*26),this.fovPunch=K(this.fovPunch,0,6.5,e),this.kickX=K(this.kickX,0,8,e),this.kickY=K(this.kickY,0,8,e),this.leanX=K(this.leanX,this.targetLeanX,2.6,e),this.leanZ=K(this.leanZ,this.targetLeanZ,2.6,e),this.zoom=K(this.zoom,this.targetZoom,3.2,e);let n=this.distance*this.zoom,r=this.elevation,i=0;if(this.introActive){this.intro+=e;let t=W(this.intro/3.4,0,1),a=1-(1-t)**3;n*=G(.55,1,a),r=G(11*Math.PI/180,r,a),i=G(-.85,0,a),t>=1&&(this.introActive=!1)}i+=Math.sin(t*.13)*.019,r+=Math.sin(t*.097+1.3)*.012;let a=Math.cos(r),o=Math.sin(r);this._base.set(Math.sin(i)*a*n+this.leanX,o*n,Math.cos(i)*a*n+this.leanZ),this._look.set(this.leanX*1.7,this.lookLift,this.leanZ*1.7+this.lookLift*.15),this.cam.position.copy(this._base),this.cam.lookAt(this._look);let s=this.trauma*this.trauma;if(s>1e-4){let e=this.traumaTime,t=Ke(e)*s*1.35,n=Ke(e+47.3)*s*1.15,r=Ke(e+91.7)*s*.055;this.cam.translateX(t+this.kickX*.5),this.cam.translateY(n+this.kickY*.35),this.cam.rotateZ(r)}else(this.kickX||this.kickY)&&(this.cam.translateX(this.kickX*.5),this.cam.translateY(this.kickY*.35));let c=this.baseFov+this.fovPunch+s*1.6;Math.abs(c-this.cam.fov)>.005&&(this.cam.fov=c,this.cam.updateProjectionMatrix()),this.cam.updateMatrixWorld()}makeMapper(e,t,n,r){let i=z.half-H.standoff;Ye.set(e.nx*i+e.tx*-t,z.playY,e.nz*i+e.tz*-t),Xe.set(e.nx*i+e.tx*t,z.playY,e.nz*i+e.tz*t),Ye.project(this.cam),Xe.project(this.cam);let a=(Ye.x*.5+.5)*r,o=(Xe.x*.5+.5)*r,s=(a+o)*.5;a=s+(a-s)/n,o=s+(o-s)/n;let c=o-a;return Math.abs(c)<1?{map:()=>0,sign:1}:{map:e=>(e-a)/c*2*t-t,sign:c>0?1:-1}}},Ye=new M,Xe=new M,Ze=new M,Qe=new e(50,1,.5,1400),J=8,$e=`
varying vec3 vWPos;
uniform float uTime;
uniform vec4  uWaves[${J}];      // xz = origin, z = age, w = strength
uniform vec3  uWaveTint[${J}];
uniform vec3  uTerritory[4];             // per-pilot colour
uniform vec4  uTerrState;                // per-pilot health 0..1, packed xyzw
uniform float uRadius;
uniform float uDetail;
uniform float uCharge;                   // 0..1 pre-serve build-up

float hexDist(vec2 p) {
  p = abs(p);
  return max(dot(p, normalize(vec2(1.0, 1.732))), p.x);
}

// Returns .x = distance to the nearest cell edge, .yz = cell id
vec3 hexGrid(vec2 uv) {
  vec2 r = vec2(1.0, 1.732);
  vec2 h = r * 0.5;
  vec2 a = mod(uv, r) - h;
  vec2 b = mod(uv - h, r) - h;
  vec2 gv = dot(a, a) < dot(b, b) ? a : b;
  return vec3(0.5 - hexDist(gv), uv - gv);
}

float hash21(vec2 p) {
  p = fract(p * vec2(233.34, 851.73));
  p += dot(p, p + 23.45);
  return fract(p.x * p.y);
}
`,et=`
  vec2 P = vWPos.xz;
  float dist = length(P);
  float rn = dist / uRadius;

  // ---- hex lattice -------------------------------------------------------
  vec3 hg = hexGrid(P * 0.62);
  float edge = smoothstep(0.045, 0.006, hg.x);
  float cellRand = hash21(hg.yz);
  vec3 hgFine = hexGrid(P * 2.35);
  float fine = smoothstep(0.035, 0.004, hgFine.x);

  // A slow wave of illumination crawling outward keeps the deck breathing.
  float breathe = 0.5 + 0.5 * sin(uTime * 0.7 - dist * 0.26 + cellRand * 6.28);
  float cellGlow = smoothstep(0.55, 1.0, breathe) * 0.10 * step(0.55, cellRand);

  vec3 energy = vec3(0.05, 0.34, 0.52) * edge * (0.16 + breathe * 0.16);
  energy += vec3(0.04, 0.24, 0.40) * cellGlow;
  energy += vec3(0.03, 0.16, 0.26) * fine * 0.16;

  // ---- territory washes --------------------------------------------------
  // Each pilot's colour bleeds inward from their wall and dims as they lose
  // points, so peripheral vision alone tells you who is nearly out.
  float terr[4];
  terr[0] = clamp( P.y / uRadius, 0.0, 1.0);
  terr[1] = clamp(-P.x / uRadius, 0.0, 1.0);
  terr[2] = clamp(-P.y / uRadius, 0.0, 1.0);
  terr[3] = clamp( P.x / uRadius, 0.0, 1.0);
  float health[4];
  health[0] = uTerrState.x; health[1] = uTerrState.y;
  health[2] = uTerrState.z; health[3] = uTerrState.w;

  for (int i = 0; i < 4; i++) {
    float m = pow(terr[i], 2.6) * health[i];
    // Bright leading line just inside the wall, soft falloff behind it.
    float band = smoothstep(0.66, 0.99, terr[i]) * health[i];
    float pulse = 0.75 + 0.25 * sin(uTime * 2.0 + float(i));
    energy += uTerritory[i] * (m * 0.035 + band * (0.10 + edge * 0.85) * pulse * 0.55);
  }

  // ---- impact shock rings ------------------------------------------------
  for (int i = 0; i < ${J}; i++) {
    vec4 w = uWaves[i];
    if (w.w <= 0.001) continue;
    float d = length(P - w.xy);
    float rad = w.z * 13.0;
    float ring = exp(-pow((d - rad) * 1.9, 2.0));
    float fade = w.w * exp(-w.z * 3.4);
    energy += uWaveTint[i] * ring * fade * 1.05;
    // Trailing inner fill gives the ring some body instead of a bare line.
    energy += uWaveTint[i] * smoothstep(rad, rad - 2.0, d) * fade * 0.07;
  }

  // ---- serve charge-up ----------------------------------------------------
  if (uCharge > 0.001) {
    float ring = exp(-pow((dist - (1.0 - uCharge) * 11.0) * 1.4, 2.0));
    energy += vec3(0.6, 0.95, 1.0) * ring * uCharge * 1.8;
  }

  // ---- centre emblem ------------------------------------------------------
  float core = exp(-dist * dist * 0.075);
  float coreRing = exp(-pow((dist - 3.1) * 3.4, 2.0));
  energy += vec3(0.10, 0.44, 0.66) * (core * 0.16 + coreRing * 0.26 * (0.65 + 0.35 * sin(uTime * 1.4)));

  // ---- rim ----------------------------------------------------------------
  energy += vec3(0.22, 0.68, 0.95) * smoothstep(0.955, 1.0, rn) * 0.30;

  // Radial vignette so the middle of the deck stays readable under the orbs.
  energy *= mix(1.0, 0.62, smoothstep(0.0, 0.55, rn));

  totalEmissiveRadiance += energy * uDetail;
`;function tt(e,n,r){let a=new t;a.moveTo(e[0].x,e[0].y);for(let t=1;t<e.length;t++)a.lineTo(e[t].x,e[t].y);a.closePath();let o=new y(a,1);o.rotateX(-Math.PI/2),o.computeVertexNormals();let s={uTime:{value:0},uWaves:{value:Array.from({length:J},()=>new l(0,0,0,0))},uWaveTint:{value:Array.from({length:J},()=>new T(0,0,0))},uTerritory:{value:r.map(e=>new T(e.color).convertSRGBToLinear())},uTerrState:{value:new l(1,1,1,1)},uRadius:{value:z.half},uDetail:{value:n.floorDetail},uCharge:{value:0}},c=new m({color:1778738,metalness:.12,roughness:.72,emissive:0,envMapIntensity:.38});c.onBeforeCompile=e=>{Object.assign(e.uniforms,s),e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
varying vec3 vWPos;`).replace(`#include <begin_vertex>`,`#include <begin_vertex>
vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`),e.fragmentShader=e.fragmentShader.replace(`#include <common>`,`#include <common>
`+$e).replace(`#include <roughnessmap_fragment>`,`#include <roughnessmap_fragment>
        {
          vec3 hgR = hexGrid(vWPos.xz * 0.62);
          float e = smoothstep(0.05, 0.0, hgR.x);
          roughnessFactor = mix(roughnessFactor, 0.26, e * 0.7);
        }`).replace(`#include <emissivemap_fragment>`,`#include <emissivemap_fragment>
`+et)},c.customProgramCacheKey=()=>`arena-floor`;let u=new i(o,c);u.position.y=z.floorY,u.receiveShadow=!0,u.name=`deck`;let d=0,f=s.uWaves.value,p=s.uWaveTint.value,h=new T;return{mesh:u,uniforms:s,addWave(e,t,n=1,r=6742271){let i=-1,a=1e9;for(let e=0;e<J;e++){if(f[e].w<=.001){i=e;break}let t=f[e].w*Math.exp(-f[e].z*3.4);t<a&&(a=t,i=e)}i<0&&(i=d=(d+1)%J),f[i].set(e,t,0,n),h.set(r).convertSRGBToLinear(),p[i].copy(h)},setTerritory(e,t){let n=s.uTerrState.value;e===0?n.x=t:e===1?n.y=t:e===2?n.z=t:n.w=t},setCharge(e){s.uCharge.value=e},update(e,t){s.uTime.value=t;for(let t=0;t<J;t++){let n=f[t];n.w<=.001||(n.z+=e,n.z>1.5&&(n.w=0))}},dispose(){o.dispose(),c.dispose()}}}function nt(){let{half:e,chamfer:t}=z,n=e-t;return[new u(-n,e),new u(n,e),new u(e,n),new u(e,-n),new u(n,-e),new u(-n,-e),new u(-e,-n),new u(-e,n)]}function rt(){let{half:e,chamfer:t}=z,n=(2*e-t)/Math.SQRT2,r=Math.SQRT1_2,i=[];for(let n=0;n<4;n++){let r=Ve[n];i.push({nx:r.nx,nz:r.nz,d:e,goal:n,halfWidth:e-t})}return i.push({nx:r,nz:r,d:n,goal:-1}),i.push({nx:r,nz:-r,d:n,goal:-1}),i.push({nx:-r,nz:-r,d:n,goal:-1}),i.push({nx:-r,nz:r,d:n,goal:-1}),i}var it=`
varying vec2 vUv;
varying vec3 vWPos;
varying vec3 vViewDir;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWPos = wp.xyz;
  vViewDir = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,at=`
precision highp float;
varying vec2 vUv;
varying vec3 vWPos;
varying vec3 vViewDir;

uniform vec3  uColor;
uniform float uTime;
uniform float uHealth;    // 1 -> full, 0 -> eliminated
uniform float uHit;       // 0..1 impact envelope
uniform vec2  uHitPos;    // uv of the last impact
uniform float uSealed;    // 1 when the pilot is out and the wall is solid
uniform vec3  uNormal;

float hexDist(vec2 p) {
  p = abs(p);
  return max(dot(p, normalize(vec2(1.0, 1.732))), p.x);
}
vec3 hexGrid(vec2 uv) {
  vec2 r = vec2(1.0, 1.732);
  vec2 h = r * 0.5;
  vec2 a = mod(uv, r) - h;
  vec2 b = mod(uv - h, r) - h;
  vec2 gv = dot(a, a) < dot(b, b) ? a : b;
  return vec3(0.5 - hexDist(gv), uv - gv);
}
float hash21(vec2 p) {
  p = fract(p * vec2(233.34, 851.73));
  p += dot(p, p + 23.45);
  return fract(p.x * p.y);
}

void main() {
  vec2 uv = vUv;
  // Aspect-correct the lattice: the panel is wide and short.
  vec2 gp = vec2(uv.x * 15.0, uv.y * 3.4);
  vec3 hg = hexGrid(gp);
  float cellR = hash21(hg.yz);

  float edge = smoothstep(0.10, 0.015, hg.x);

  // Cells flicker in and out; fewer stay lit as health drops.
  float flick = step(1.0 - uHealth * 0.85, hash21(hg.yz + floor(uTime * 2.2) * 0.137));
  float cell = smoothstep(0.34, 0.5, hg.x) * flick * 0.10;

  // Grazing angles should light up — that's what makes it feel like a surface
  // of energy rather than a decal.
  float fres = pow(1.0 - abs(dot(normalize(uNormal), vViewDir)), 2.1);

  // Vertical containment: bright at the base, dissolving toward the top.
  float vFade = smoothstep(1.02, 0.18, uv.y);
  float base  = smoothstep(0.26, 0.0, uv.y);

  float scan = exp(-pow(fract(uv.y - uTime * 0.22) - 0.5, 2.0) * 42.0);

  float a = edge * 0.42 + cell + fres * 0.34 + scan * 0.22 + base * 0.5;
  a *= vFade;

  vec3 col = uColor * a;

  // ---- impact bloom --------------------------------------------------------
  if (uHit > 0.001) {
    float d = distance(uv * vec2(4.2, 1.0), uHitPos * vec2(4.2, 1.0));
    float ripple = exp(-pow((d - (1.0 - uHit) * 1.5) * 3.4, 2.0));
    float flash = exp(-d * 5.0) * uHit;
    col += (uColor * 2.0 + vec3(0.55)) * (ripple * uHit * 1.8 + flash * 2.2);
  }

  // ---- sealed: the wall goes cold and hard --------------------------------
  if (uSealed > 0.001) {
    vec3 dead = vec3(0.30, 0.36, 0.46) * (edge * 0.75 + 0.05) * vFade;
    // Slow diagonal hazard sweep so a sealed wall still reads as *active*.
    float bar = step(0.5, fract((uv.x * 9.0 + uv.y * 2.0) - uTime * 0.10));
    dead += vec3(0.42, 0.30, 0.10) * bar * edge * 0.5;
    col = mix(col, dead, uSealed);
  }

  float alpha = clamp(a * (0.35 + uHealth * 0.65) + uHit, 0.0, 1.0);
  gl_FragColor = vec4(col * (0.5 + uHealth * 0.9), alpha);
}`,ot=class{constructor(e,t,n){this.mat=new F({vertexShader:it,fragmentShader:at,transparent:!0,depthWrite:!1,blending:2,side:2,uniforms:{uColor:{value:new T(n).convertSRGBToLinear()},uTime:{value:0},uHealth:{value:1},uHit:{value:0},uHitPos:{value:new u(.5,.35)},uSealed:{value:0},uNormal:{value:new M(0,0,1)}}});let r=new O(e,t,1,1);this.mesh=new i(r,this.mat),this.mesh.renderOrder=6,this._hit=0,this._sealTarget=0}hit(e,t=.34,n=1){this.mat.uniforms.uHitPos.value.set(e,t),this._hit=Math.min(1.6,this._hit+n)}setHealth(e){this.mat.uniforms.uHealth.value=e}seal(){this._sealTarget=1}setNormal(e,t,n){this.mat.uniforms.uNormal.value.set(e,t,n)}update(e,t){let n=this.mat.uniforms;n.uTime.value=t,this._hit*=Math.exp(-e*4.2),this._hit<.002&&(this._hit=0),n.uHit.value=this._hit,n.uSealed.value+=(this._sealTarget-n.uSealed.value)*Math.min(1,e*3.2)}dispose(){this.mesh.geometry.dispose(),this.mat.dispose()}},st=class{constructor(e){this.set=e,this.groups=new Map,this.count=0}add(e){e.updateWorldMatrix(!0,!0),e.traverse(e=>{if(!e.isMesh||!e.geometry)return;let t=e.userData.srcMat||`metal`,n=e.geometry.clone();if(n.applyMatrix4(e.matrixWorld),!n.attributes.uv){let e=n.attributes.position.count;n.setAttribute(`uv`,new C(new Float32Array(e*2),2))}for(let e of Object.keys(n.attributes))e!==`position`&&e!==`normal`&&e!==`uv`&&n.deleteAttribute(e);n.morphAttributes={},this.groups.has(t)||this.groups.set(t,[]),this.groups.get(t).push(n),this.count++})}build(e,t={}){let n=[];for(let[r,a]of this.groups){if(!a.length)continue;let o=a.length===1?a[0]:A(a,!1);if(!o){console.warn(`[batch] merge failed for material "${r}"`);continue}if(a.length>1)for(let e of a)e.dispose();o.computeBoundingSphere();let s=this.set[r]||this.set.metal||this.set._defaultMat,c=new i(o,s);c.castShadow=t.castShadow??!0,c.receiveShadow=t.receiveShadow??!0,c.name=`${t.name||`batch`}:${r}`,e.add(c),n.push(c)}return this.groups.clear(),n}},ct=2*(z.half-z.chamfer),lt=z.chamfer*Math.SQRT2,Y=1.5,ut=class{constructor(e,t,n){this.scene=e,this.assets=t,this.preset=n,this.root=new P,this.root.name=`arena`,e.add(this.root),this.mats=Ce(),this.planes=rt(),this.outline=nt(),this._buildDeck(),this._buildWalls(),this._buildBarriers(),this._buildSubstructure(),this._buildDressing(),this._buildLights()}_buildDeck(){this.floor=tt(this.outline,this.preset,B),this.root.add(this.floor.mesh);let e=new i(new D(z.half*1.02,z.half*.94,1.1,8,1),new m({color:593173,metalness:.85,roughness:.55}));e.rotation.y=Math.PI/8,e.position.y=-.58,e.receiveShadow=!0,this.root.add(e)}_buildWalls(){let e=new P;this.root.add(e);let t=new m({color:1712687,metalness:.55,roughness:.62,envMapIntensity:.55}),n=new m({color:858658,metalness:.6,roughness:.25,emissive:2076888,emissiveIntensity:.85});this.railMat=n;let r=(r,a,o,s,c)=>{let l=Math.atan2(a,o),u=a*(s+Y*.5),d=o*(s+Y*.5),f=new i(new ce(r,z.wallH,Y),t);f.position.set(u,z.wallH*.5,d),f.rotation.y=l,f.castShadow=!0,f.receiveShadow=!0,e.add(f);let p=new i(new ce(r,.19,Y*.26),n);p.position.set(u-a*Y*.3,z.wallH+.04,d-o*Y*.3),p.rotation.y=l,e.add(p);let h=new i(new ce(r*.96,.1,.08),new m({color:528406,metalness:.3,roughness:.4,emissive:c,emissiveIntensity:1.15}));return h.position.set(a*(s-.06),.34,o*(s-.06)),h.rotation.y=l,e.add(h),f};for(let e=0;e<4;e++){let t=Ve[e];r(ct,t.nx,t.nz,z.half,B[e].color)}let a=(2*z.half-z.chamfer)/Math.SQRT2,o=Math.SQRT1_2;for(let[e,t]of[[o,o],[o,-o],[-o,-o],[-o,o]])r(lt,e,t,a,3596543)}_buildBarriers(){this.fields=[];for(let e=0;e<4;e++){let t=Ve[e],n=new ot(ct,z.wallH*1.15,B[e].color);n.mesh.position.set(t.nx*(z.half-.06),z.wallH*.575,t.nz*(z.half-.06)),n.mesh.rotation.y=Math.atan2(t.nx,t.nz),n.setNormal(t.nx,0,t.nz),this.root.add(n.mesh),this.fields.push(n)}}_buildSubstructure(){let e=this.assets,t=new st(this.mats),n=new P,r=(t,r,i,a,o=0,s=1,c=0)=>{let l=e.clone(t);return l.position.set(r,i,a),l.rotation.set(c,o,0),l.scale.setScalar(s),n.add(l),l},i=z.half+1.6;for(let e=0;e<40;e++){let t=e/40*Math.PI*2,n=i+q(-.4,.4),a=Math.cos(t)*n,o=Math.sin(t)*n;r(`platform_large`,a,-1.1+q(-.15,.15),o,t+Math.PI/2,1.6),e%3==0&&r(`supports_high`,a*1.06,-2.7,o*1.06,q(0,6.28),1.5),e%5==2&&r(`pipe_supportHigh`,a*1.13,-3.4,o*1.13,t,1.3)}for(let e=0;e<8;e++){let t=e/8*Math.PI*2+Math.PI/8;for(let e=2;e<13;e++)r(`platform_long`,Math.cos(t)*e*1.2,-2.2,Math.sin(t)*e*1.2,t+Math.PI/2,1.5);r(`machine_generatorLarge`,Math.cos(t)*8,-3,Math.sin(t)*8,t,1.6)}for(let e=0;e<22;e++){let e=q(0,Math.PI*2),t=q(3,z.half),n=q(-6.5,-3.2);r(`pipe_straight`,Math.cos(e)*t,n,Math.sin(e)*t,q(0,6.28),q(1.1,2))}t.add(n),t.build(this.root,{name:`substructure`,castShadow:!1,receiveShadow:!1})}_buildDressing(){let e=this.assets,t=new st(this.mats),n=new P,r=(t,r,i,a,o=0,s=1)=>{let c=e.clone(t);return c.position.set(r,i,a),c.rotation.y=o,c.scale.setScalar(s),n.add(c),c},i=(2*z.half-z.chamfer)/Math.SQRT2;for(let e=0;e<4;e++){let t=Ve[e],n=Math.atan2(t.nx,t.nz),i=-t.nz,a=t.nx,o=z.half+Y+.35;for(let e=0;e<9;e++){let s=(e/8-.5)*(ct-1.4),c=t.nx*o+i*s,l=t.nz*o+a*s;r(e%2?`structure`:`structure_detailed`,c,0,l,n,1.5),e%4==1&&r(`machine_wireless`,c+t.nx*1.3,1.5,l+t.nz*1.3,n,1.2)}let s=1.5,c=Math.ceil((ct+1)/s);for(let e=0;e<c;e++){let l=(e/(c-1)-.5)*(ct+1-s);r(`pipe_straight`,t.nx*(o+.5)+i*l,1.5,t.nz*(o+.5)+a*l,n+Math.PI/2,s)}}let a=Math.SQRT1_2;[[a,a],[a,-a],[-a,-a],[-a,a]].forEach(([e,t],n)=>{let a=Math.atan2(e,t),o=e*(i+Y+1.1),s=t*(i+Y+1.1);r(`pipe_ringHigh`,o,0,s,a,2.1),r(`supports_high`,o+e*1.4,0,s+t*1.4,a,2),r(`satelliteDish_large`,o+e*1.2,3,s+t*1.2,a+q(-.6,.6),2.4),r(`turret_double`,o-e*1.9,1.6,s-t*1.9,a+Math.PI,1.9),r(n%2?`barrels_rail`:`barrels`,o+e*2.6,0,s+t*2.6,q(0,6.28),1.7),r(`container-tall`,o-e*3.4+q(-1,1),0,s-t*3.4+q(-1,1),q(0,6.28),1.5)});let o=[[`hangar_roundA`,3.2],[`hangar_smallB`,3],[`rocket_baseA`,2.4],[`machine_generatorLarge`,3.4],[`hangar_roundA`,2.8],[`hangar_smallB`,3.4],[`machine_generatorLarge`,3],[`rocket_baseA`,2.2]],s=[`container`,`container-tall`,`display-wall`,`computer-wide`,`barrels`,`machine_generator`,`satelliteDish`];o.forEach(([e,t],n)=>{let i=n/o.length*Math.PI*2+Math.PI/8,a=z.half+13.5,c=Math.cos(i)*a,l=Math.sin(i)*a,u=Math.atan2(-c,-l);for(let e=-1;e<=1;e++)for(let t=-1;t<=1;t++){let n=Math.cos(u)*e*3.2-Math.sin(u)*t*3.2,i=Math.sin(u)*e*3.2+Math.cos(u)*t*3.2;r(`platform_large`,c+n,-1.2,l+i,u,1.6)}r(e,c,-1.0999999999999999,l,u,t);for(let e=0;e<5;e++){let t=u+q(-2.4,2.4),i=q(4.2,6.2);r(s[(n*3+e)%s.length],c+Math.cos(t)*i,-1.0999999999999999,l+Math.sin(t)*i,q(0,6.28),q(1.5,2.4))}r(`satelliteDish_large`,c+Math.cos(u+1.6)*5.4,-1.0999999999999999,l+Math.sin(u+1.6)*5.4,u+q(-.5,.5),2.6),r(`supports_high`,c,-3.8,l,u,3)});let c=z.half+26,l=Math.ceil(2*Math.PI*c/3);for(let e=0;e<l;e++){let t=e/l*Math.PI*2,n=Math.cos(t)*c,i=Math.sin(t)*c;r(`monorail_trackStraight`,n,-3,i,t+Math.PI/2,3),e%9==0&&r(`monorail_trackSupport`,n,-7.2,i,t+Math.PI/2,9)}let u=[`meteor`,`meteor_detailed`,`rock_largeA`,`rock_crystals`,`rock_crystalsLargeA`];for(let e=0;e<30;e++){let e=q(0,Math.PI*2),t=q(z.half+34,z.half+90);r(u[We(0,u.length-1)],Math.cos(e)*t,q(-26,-6),Math.sin(e)*t,q(0,6.28),q(3,9))}t.add(n),this.dressMeshes=t.build(this.root,{name:`dressing`,castShadow:!1,receiveShadow:!1});for(let e of this.dressMeshes)e.name.endsWith(`:crystal`)&&(e.castShadow=!1)}_buildLights(){let e=new E(12574975,1.75);if(e.position.set(16,30,14),e.target.position.set(0,0,0),this.preset.shadows){e.castShadow=!0;let t=z.half+4;e.shadow.mapSize.set(this.preset.shadowSize,this.preset.shadowSize),e.shadow.camera.left=-t,e.shadow.camera.right=t,e.shadow.camera.top=t,e.shadow.camera.bottom=-t,e.shadow.camera.near=8,e.shadow.camera.far=70,e.shadow.bias=-.0012,e.shadow.normalBias=.035,e.shadow.radius=2.2}this.root.add(e,e.target),this.keyLight=e;let t=new E(16743070,.5);t.position.set(-22,8,-26),this.root.add(t);let n=new fe(2779794,658968,.3);this.root.add(n);let r=new E(13624063,.75);r.castShadow=!1,this.root.add(r,r.target),this.fillLight=r}goalHalfWidth(){return z.half-z.chamfer}hitBarrier(e,t,n){this.fields[e].hit(t,.32,n)}sealBarrier(e){this.fields[e].seal()}setBarrierHealth(e,t){this.fields[e].setHealth(t),this.floor.setTerritory(e,t)}shock(e,t,n,r){this.floor.addWave(e,t,n,r)}setCharge(e){this.floor.setCharge(e)}aimFill(e){this.fillLight&&this.fillLight.position.set(e.x*.55,e.y*.45+6,e.z*.55)}update(e,t){this.floor.update(e,t);for(let n of this.fields)n.update(e,t);this.railMat.emissiveIntensity=.78+Math.sin(t*1.1)*.14}dispose(){this.floor.dispose();for(let e of this.fields)e.dispose();this.root.traverse(e=>{e.isMesh&&e.geometry?.dispose()}),this.scene.remove(this.root)}},dt=new M,ft=class{constructor(e,t,n,r){this.index=e,this.def=t,this.side=Ve[e],this.nx=this.side.nx,this.nz=this.side.nz,this.tx=-this.side.nz,this.tz=this.side.nx,this.yaw=Math.atan2(this.nx,this.nz),this.halfLen=H.halfLen,this.halfThick=H.halfThick,this.limit=z.half-z.chamfer-this.halfLen*.42,this.u=0,this.vu=0,this.targetU=0,this.alive=!0,this.throttle=0,this.surge=1,this.surgeActive=0,this.recoil=0,this.hitFlash=0,this.dying=0,this._dt=0,this.root=new P,this.root.name=`craft:${t.name}`,r.add(this.root),this._buildHull(n),this._buildDeflector(),this._buildThrusters(),this.sync(0)}_buildHull(e){this.mats=we(this.def.color,this.def.deep);let t=Te(e.clone(this.def.craft),this.mats),n=new j().setFromObject(t),r=Math.max(.001,n.max.x-n.min.x),i=this.halfLen*2*.95/r;t.scale.setScalar(i),t.position.set(0,0,.62),t.traverse(e=>{e.isMesh&&(e.castShadow=!1,e.receiveShadow=!0)}),this.hullPivot=new P,this.hullPivot.add(t),this.bobPivot=new P,this.bobPivot.add(this.hullPivot),this.root.add(this.bobPivot),this.hull=t}_buildDeflector(){let e=6.2,t=this.halfLen*2.06/e,n=new D(e,e,1.55,26,1,!0,Math.PI-t/2,t);n.translate(0,0,e),n.rotateY(0),this.defMat=new F({transparent:!0,depthWrite:!1,side:2,blending:2,uniforms:{uColor:{value:new T(this.def.color).convertSRGBToLinear()},uTime:{value:0},uHit:{value:0},uHitU:{value:.5},uSurge:{value:1},uAlive:{value:1}},vertexShader:`
        varying vec2 vUvD; varying vec3 vN; varying vec3 vV;
        void main(){
          vUvD = uv;
          vec4 wp = modelMatrix * vec4(position,1.0);
          vN = normalize(mat3(modelMatrix) * normal);
          vV = normalize(cameraPosition - wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,fragmentShader:`
        precision mediump float;
        varying vec2 vUvD; varying vec3 vN; varying vec3 vV;
        uniform vec3 uColor; uniform float uTime, uHit, uHitU, uSurge, uAlive;
        void main(){
          float u = vUvD.x, v = vUvD.y;
          // Vertical containment plus a bright rim top and bottom.
          float band = smoothstep(0.0,0.22,v) * smoothstep(1.0,0.72,v);
          float rim  = smoothstep(0.11,0.0,v) + smoothstep(0.90,1.0,v) * 0.6;
          // Ends taper so the field looks projected, not cut off.
          float ends = smoothstep(0.0,0.10,u) * smoothstep(1.0,0.90,u);
          float fres = pow(1.0 - abs(dot(normalize(vN), vV)), 1.7);

          float ripple = 0.5 + 0.5 * sin(u * 15.0 - uTime * 4.0);
          float a = (band * 0.30 + rim * 0.55 + fres * 0.45) * ends;
          a *= 0.78 + ripple * 0.22;

          // Impact: a bright bloom centred where the orb struck.
          float d = abs(u - uHitU);
          a += exp(-d * d * 46.0) * uHit * 2.4;

          vec3 col = uColor * a;
          // Charged and ready reads as white-hot; spent reads as team colour.
          col = mix(col, vec3(1.0) * a * 1.2, uSurge * 0.10);
          // Readiness reads as a bright hairline along the top edge.
          col += vec3(0.85, 0.95, 1.0) * smoothstep(0.95, 1.0, v) * ends * uSurge * 0.55;
          col += vec3(1.0) * exp(-d * d * 90.0) * uHit * 1.6;

          gl_FragColor = vec4(col * 2.6 * uAlive, clamp(a, 0.0, 1.0) * uAlive);
        }`}),this.deflector=new i(n,this.defMat),this.deflector.position.set(0,.62,-.5),this.deflector.renderOrder=7,this.deflectorPivot=new P,this.deflectorPivot.add(this.deflector),this.root.add(this.deflectorPivot)}_buildThrusters(){this.thrustMat=new r({color:new T(this.def.color),transparent:!0,opacity:.9,blending:2,depthWrite:!1});let e=new oe(.19,1.5,10,1,!0);e.rotateX(Math.PI/2),e.translate(0,0,.75),this.thrusters=[];let t=this.halfLen*.44;for(let n of[-t,t]){let t=new i(e,this.thrustMat);t.position.set(n,.24,1.45),t.renderOrder=7,this.bobPivot.add(t),this.thrusters.push(t)}let n=new i(new le(this.halfLen*.9,20),new r({color:new T(this.def.color),transparent:!0,opacity:.16,blending:2,depthWrite:!1}));n.rotation.x=-Math.PI/2,n.position.y=-.42,this.root.add(n),this.hoverGlow=n,this.glowMat=n.material}worldPos(e=dt){let t=z.half-H.standoff-this.recoil;return e.set(this.nx*t+this.tx*this.u,z.playY,this.nz*t+this.tz*this.u)}get standoffDist(){return z.half-H.standoff-this.recoil}get effHalfLen(){return this.halfLen*(1+this.surgeActive*.42)}steer(e){this.targetU=W(e,-this.limit,this.limit)}trySurge(){return!this.alive||this.surge<1?!1:(this.surge=0,this.surgeActive=.55,!0)}onDeflect(e,t){this.defMat.uniforms.uHitU.value=e,this.defMat.uniforms.uHit.value=Math.min(1.4,this.defMat.uniforms.uHit.value+t),this.recoil=Math.min(.85,this.recoil+t*.5),this.hitFlash=1}onConcede(){this.hitFlash=1.6}eliminate(){this.alive&&(this.alive=!1,this.dying=.001)}update(e,t){if(this._dt=e,this.alive){let t=W((this.targetU-this.u)*9,-H.maxSpeed,H.maxSpeed),n=this.vu;this.vu+=W(t-this.vu,-H.accel*e,H.accel*e),this.vu=K(this.vu,t,H.damp,e),this.u=W(this.u+this.vu*e,-this.limit,this.limit),Math.abs(this.u)>=this.limit-1e-4&&(this.vu*=.35),this.accel=(this.vu-n)/Math.max(e,1e-4),this.throttle=K(this.throttle,Math.min(1,Math.abs(this.vu)/H.maxSpeed),9,e),this.surge=Math.min(1,this.surge+e/4.2),this.surgeActive=Math.max(0,this.surgeActive-e)}else this.dying+=e,this.vu*=Math.exp(-e*2),this.u+=this.vu*e;this.recoil=K(this.recoil,0,7.5,e),this.hitFlash=K(this.hitFlash,0,5.5,e);let n=this.defMat.uniforms;n.uTime.value=t,n.uHit.value*=Math.exp(-e*6.5),n.uSurge.value=K(n.uSurge.value,this.alive?this.surge:0,8,e),n.uAlive.value=K(n.uAlive.value,+!!this.alive,3,e),this.sync(t)}sync(e){let t=this.standoffDist;if(this.root.position.set(this.nx*t+this.tx*this.u,z.playY,this.nz*t+this.tz*this.u),this.root.rotation.y=this.yaw,this.alive){let t=-W(this.vu/H.maxSpeed,-1,1)*H.bankMax,n=W((this.accel||0)/900,-.22,.22),r=this._dt;this.hullPivot.rotation.z=K(this.hullPivot.rotation.z,t,11,r),this.hullPivot.rotation.x=K(this.hullPivot.rotation.x,n,9,r);let i=Math.sin(e*2.4+this.index*1.7)*H.hover+Math.sin(e*3.9+this.index)*H.hover*.35;this.bobPivot.position.y=i,this.bobPivot.rotation.z=Math.sin(e*1.6+this.index*2.1)*.035;let a=.25+this.throttle*1.5+this.hitFlash*.8;for(let e of this.thrusters)e.scale.set(1+this.throttle*.35,1,a);this.thrustMat.opacity=.35+this.throttle*.55,this.hoverGlow.material.opacity=.1+this.throttle*.14;let o=this.mats.metalRed;o.emissiveIntensity=2.2+this.hitFlash*5+this.surge*.7}else{let e=this.dying,t=this._dt*60;this.hullPivot.rotation.z+=.055*t,this.hullPivot.rotation.x+=.031*t,this.bobPivot.position.y=-e*e*3.2;let n=Math.max(0,1-e*.85);this.thrustMat.opacity=n*.2,this.hoverGlow.material.opacity=n*.04,this.mats.metalRed.emissiveIntensity=n*1.2;for(let e of this.thrusters)e.scale.set(1,1,n*.4);e>2.4&&(this.root.visible=!1)}let n=1+this.surgeActive*.42;this.deflector.scale.set(n,1,n)}dispose(){this.root.traverse(e=>{e.isMesh&&e.geometry?.dispose()});for(let e of Object.values(this.mats))e.dispose();this.defMat.dispose(),this.thrustMat.dispose(),this.glowMat.dispose(),this.root.parent?.remove(this.root)}},pt=`
attribute vec3 aDir;
attribute float aSide;
attribute float aT;
uniform float uWidth;
varying float vT;
varying float vEdge;
void main() {
  vT = aT;
  vEdge = aSide;
  vec3 toCam = normalize(cameraPosition - position);
  vec3 side = cross(aDir, toCam);
  float len = length(side);
  side = len > 1e-4 ? side / len : vec3(1.0, 0.0, 0.0);

  // Tapered: full width at the head, pinched to nothing at the tail.
  float w = uWidth * pow(1.0 - aT, 0.62) * (1.0 - 0.35 * aT);
  vec3 p = position + side * aSide * w;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`,mt=`
precision mediump float;
varying float vT;
varying float vEdge;
uniform vec3 uColor;
uniform vec3 uHot;
uniform float uOpacity;
void main() {
  float across = 1.0 - abs(vEdge);            // 1 at the spine, 0 at the edges
  float body = pow(across, 1.6);
  float fade = pow(1.0 - vT, 2.1);
  // Hot core near the head cooling to the team colour down the tail.
  vec3 col = mix(uColor, uHot, body * (1.0 - vT * 0.75));
  float a = body * fade * uOpacity;
  if (a < 0.003) discard;
  gl_FragColor = vec4(col * a * 2.4, a);
}`,ht=class{constructor(e,t,n=16777215,r=.34){this.n=e;let a=e,o=new Float32Array(a*2*3),c=new Float32Array(a*2*3),l=new Float32Array(a*2),u=new Float32Array(a*2),d=new Uint16Array((a-1)*6);for(let e=0;e<a;e++){l[e*2]=-1,l[e*2+1]=1;let t=e/(a-1);u[e*2]=t,u[e*2+1]=t}for(let e=0;e<a-1;e++){let t=e*2,n=t+1,r=t+2,i=t+3;d.set([t,n,r,n,i,r],e*6)}let f=new ie;this.aPos=new C(o,3).setUsage(S),this.aDir=new C(c,3).setUsage(S),f.setAttribute(`position`,this.aPos),f.setAttribute(`aDir`,this.aDir),f.setAttribute(`aSide`,new C(l,1)),f.setAttribute(`aT`,new C(u,1)),f.setIndex(new C(d,1)),f.boundingSphere=new s(new M,1e4),this.mat=new F({vertexShader:pt,fragmentShader:mt,uniforms:{uWidth:{value:r},uColor:{value:new T(t).convertSRGBToLinear()},uHot:{value:new T(n).convertSRGBToLinear()},uOpacity:{value:1}},transparent:!0,depthWrite:!1,blending:2,side:2}),this.mesh=new i(f,this.mat),this.mesh.frustumCulled=!1,this.mesh.renderOrder=8,this._primed=!1}setColor(e,t){this.mat.uniforms.uColor.value.set(e).convertSRGBToLinear(),t!==void 0&&this.mat.uniforms.uHot.value.set(t).convertSRGBToLinear()}setWidth(e){this.mat.uniforms.uWidth.value=e}reset(e,t,n){let r=this.aPos.array,i=this.aDir.array;for(let a=0;a<this.n*2;a++)r[a*3]=e,r[a*3+1]=t,r[a*3+2]=n,i[a*3]=0,i[a*3+1]=0,i[a*3+2]=1;this.aPos.needsUpdate=!0,this.aDir.needsUpdate=!0,this._primed=!0}push(e,t,n){if(!this._primed)return this.reset(e,t,n);let r=this.aPos.array,i=this.aDir.array,a=this.n;r.copyWithin(6,0,(a-1)*6),r[0]=e,r[1]=t,r[2]=n,r[3]=e,r[4]=t,r[5]=n;for(let e=0;e<a;e++){let t=Math.max(0,e-1)*6,n=Math.min(a-1,e+1)*6,o=r[t]-r[n],s=r[t+1]-r[n+1],c=r[t+2]-r[n+2],l=Math.hypot(o,s,c);l>1e-5?(o/=l,s/=l,c/=l):(o=0,s=0,c=1);let u=e*6;i[u]=o,i[u+1]=s,i[u+2]=c,i[u+3]=o,i[u+4]=s,i[u+5]=c}this.aPos.needsUpdate=!0,this.aDir.needsUpdate=!0}dispose(){this.mesh.geometry.dispose(),this.mat.dispose()}},gt=`
varying vec3 vN; varying vec3 vV; varying vec3 vLocal;
void main() {
  vLocal = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,_t=`
precision highp float;
varying vec3 vN; varying vec3 vV; varying vec3 vLocal;
uniform vec3 uColor; uniform vec3 uHot; uniform float uTime; uniform float uEnergy;

float hash13(vec3 p){ p = fract(p*0.1031); p += dot(p,p.zyx+31.32); return fract((p.x+p.y)*p.z); }
float vn(vec3 p){
  vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash13(i),hash13(i+vec3(1,0,0)),f.x),
                 mix(hash13(i+vec3(0,1,0)),hash13(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash13(i+vec3(0,0,1)),hash13(i+vec3(1,0,1)),f.x),
                 mix(hash13(i+vec3(0,1,1)),hash13(i+vec3(1,1,1)),f.x),f.y),f.z);
}

void main() {
  // Convecting plasma cells crawling over the surface.
  vec3 q = normalize(vLocal) * 3.4;
  float n = vn(q + vec3(0.0, uTime * 0.9, uTime * 0.35));
  n = n * 0.65 + vn(q * 2.3 - uTime * 0.6) * 0.35;

  float fres = pow(1.0 - max(dot(normalize(vN), vV), 0.0), 2.4);

  vec3 col = mix(uColor, uHot, smoothstep(0.42, 0.86, n));
  col = mix(col, uHot * 1.6, fres * 0.75);
  col *= 1.1 + uEnergy * 1.5;
  gl_FragColor = vec4(col, 1.0);
}`,vt=`
precision mediump float;
varying vec3 vN; varying vec3 vV; varying vec3 vLocal;
uniform vec3 uColor; uniform float uTime; uniform float uEnergy;
void main() {
  float fres = pow(1.0 - max(dot(normalize(vN), vV), 0.0), 3.1);
  // Latitude bands drifting upward read as containment rings.
  float bands = 0.5 + 0.5 * sin(normalize(vLocal).y * 19.0 - uTime * 4.5);
  float a = fres * (0.55 + bands * 0.45);
  gl_FragColor = vec4(uColor * a * (1.6 + uEnergy * 2.2), a * 0.85);
}`,yt=`
uniform float uSize;
varying vec2 vP;
void main() {
  vP = position.xy;
  // Billboard: build the quad directly in view space.
  vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  c.xy += position.xy * uSize;
  gl_Position = projectionMatrix * c;
}`,bt=`
precision mediump float;
varying vec2 vP;
uniform vec3 uColor; uniform float uIntensity;
void main() {
  float r2 = dot(vP, vP);
  if (r2 > 1.0) discard;
  // Two lobes: a tight bright centre and a wide soft falloff.
  float a = exp(-r2 * 7.0) * 0.85 + exp(-r2 * 1.9) * 0.30;
  gl_FragColor = vec4(uColor * a * uIntensity * 2.4, a);
}`,xt=null;function St(){return xt||(xt={core:new _(U.radius*.82,3),shell:new _(U.radius*1.16,3),glow:new O(2,2)}),xt}var Ct=class{constructor(e,t,n){this.scene=e,this.active=!1,this.x=0,this.z=0,this.vx=0,this.vz=0,this.speed=U.baseSpeed,this.lastHitBy=-1,this.rally=0,this.age=0,this.impact=0,this.impactDirX=1,this.impactDirZ=0;let r=St();this.root=new P;let a=new T(7333631),o=new T(16777215);this.coreMat=new F({vertexShader:gt,fragmentShader:_t,uniforms:{uColor:{value:a.clone().convertSRGBToLinear()},uHot:{value:o.clone().convertSRGBToLinear()},uTime:{value:0},uEnergy:{value:0}}}),this.core=new i(r.core,this.coreMat),this.core.castShadow=!1,this.shellMat=new F({vertexShader:gt,fragmentShader:vt,uniforms:{uColor:{value:a.clone().convertSRGBToLinear()},uTime:{value:0},uEnergy:{value:0}},transparent:!0,depthWrite:!1,blending:2,side:2}),this.shell=new i(r.shell,this.shellMat),this.glowMat=new F({vertexShader:yt,fragmentShader:bt,uniforms:{uColor:{value:a.clone().convertSRGBToLinear()},uSize:{value:U.radius*4.6},uIntensity:{value:1}},transparent:!0,depthWrite:!1,blending:2}),this.glow=new i(r.glow,this.glowMat),this.glow.frustumCulled=!1,this.glow.renderOrder=10,this.squash=new P,this.squash.add(this.core,this.shell),this.root.add(this.squash,this.glow),this.trail=new ht(t.trailSegments,3066111,16777215,U.radius*.86),e.add(this.trail.mesh),n&&(this.light=new f(7333631,12,16,2),this.root.add(this.light)),this.blob=new i(new O(U.radius*6,U.radius*6),new F({transparent:!0,depthWrite:!1,blending:2,uniforms:{uColor:{value:a.clone().convertSRGBToLinear()}},vertexShader:`varying vec2 vU; void main(){ vU=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,fragmentShader:`precision mediump float; varying vec2 vU; uniform vec3 uColor;
          void main(){ vec2 p=(vU-0.5)*2.0; float r2=dot(p,p);
            if(r2>1.0) discard; float a=exp(-r2*4.5)*0.42;
            gl_FragColor=vec4(uColor*a,a); }`})),this.blob.rotation.x=-Math.PI/2,this.blob.renderOrder=3,this.root.add(this.blob),e.add(this.root),this.setVisible(!1)}setVisible(e){this.root.visible=e,this.trail.mesh.visible=e}setTint(e){let t=new T(e),n=t.clone().convertSRGBToLinear();this.coreMat.uniforms.uColor.value.copy(n),this.shellMat.uniforms.uColor.value.copy(n),this.glowMat.uniforms.uColor.value.copy(n),this.blob.material.uniforms.uColor.value.copy(n),this.trail.setColor(e,16777215),this.light&&this.light.color.copy(t)}spawn(e,t,n,r){this.active=!0,this.x=e,this.z=t,this.speed=r,this.vx=Math.sin(n)*r,this.vz=Math.cos(n)*r,this.lastHitBy=-1,this.rally=0,this.age=0,this.impact=0,this.setTint(7333631),this.root.position.set(e,z.playY,t),this.trail.reset(e,z.playY,t),this.setVisible(!0)}kill(){this.active=!1,this.setVisible(!1)}registerImpact(e,t,n=1){this.impact=Math.min(1.5,this.impact+n),this.impactDirX=e,this.impactDirZ=t}updateVisual(e,t){if(!this.active)return;this.age+=e;let n=W((this.speed-U.baseSpeed)/(U.maxSpeed-U.baseSpeed),0,1);this.impact=K(this.impact,0,9,e),this.root.position.set(this.x,z.playY,this.z);let r=1/Math.max(1e-4,Math.hypot(this.vx,this.vz)),i=this.vx*r,a=this.vz*r,o=1+n*.28+this.impact*.34,s=1/Math.sqrt(o);this.squash.quaternion.setFromUnitVectors(wt,Tt.set(i,0,a)),this.squash.scale.set(s,s,o);let c=n*.7+this.impact*.5;this.coreMat.uniforms.uTime.value=t,this.coreMat.uniforms.uEnergy.value=c,this.shellMat.uniforms.uTime.value=t,this.shellMat.uniforms.uEnergy.value=c,this.glowMat.uniforms.uIntensity.value=.85+n*.7+this.impact*1.1,this.glowMat.uniforms.uSize.value=U.radius*(4.4+n*1.5+this.impact*2.2),this.light&&(this.light.intensity=9+n*10+this.impact*22),this.blob.position.set(0,-z.playY+.035,0);let l=1+n*.35;this.blob.scale.set(l,l,1),this.trail.push(this.x,z.playY,this.z),this.trail.setWidth(U.radius*(.8+n*.5))}dispose(){this.coreMat.dispose(),this.shellMat.dispose(),this.glowMat.dispose(),this.blob.geometry.dispose(),this.blob.material.dispose(),this.trail.dispose(),this.scene.remove(this.root,this.trail.mesh)}},wt=new M(0,0,1),Tt=new M,Et=.22;function Dt(e,t,n,r,i){let a=e*-r+t*n,o=e*-n+t*-r,s=Math.sin(U.minAngle)*i;if(o>=s)return[e,t];let c=a>=0?1:-1,l=s,u=c*Math.sqrt(Math.max(0,i*i-l*l));return[-r*u+-n*l,n*u+-r*l]}function Ot(e,t,n){let{planes:r,crafts:i,events:a}=n,o=t,s=0;for(;o>1e-6&&s++<64;){let t=Math.hypot(e.vx,e.vz)||1e-4,n=Math.min(o,Et/t);o-=n,e.x+=e.vx*n,e.z+=e.vz*n;for(let n of i){if(!n.alive||e.vx*n.nx+e.vz*n.nz<=0)continue;let r=n.standoffDist,i=e.x-n.nx*r-n.tx*n.u,o=e.z-n.nz*r-n.tz*n.u,s=i*n.tx+o*n.tz,c=i*n.nx+o*n.nz;if(c>0)continue;let l=n.effHalfLen,u=W(s,-l,l),d=W(c,-n.halfThick,n.halfThick),f=s-u,p=c-d;if(f*f+p*p>U.radius*U.radius)continue;let m=W(s/l,-1,1),h=W(n.vu/H.maxSpeed,-1,1)*U.spinInfluence,g=m*U.angleInfluence+h;g=W(g,-1.35,1.35);let _=g,v=-1,ee=1/Math.hypot(_,v);_*=ee,v*=ee;let y=+(n.surgeActive>0),b=Math.min(U.maxSpeed,t+U.rallyGain+U.paddleBoost+y*3.4);e.vx=(n.tx*_+n.nx*v)*b,e.vz=(n.tz*_+n.nz*v)*b,e.speed=b,e.rally++,e.lastHitBy=n.index;let x=U.radius+n.halfThick+.02;e.x=n.nx*r+n.tx*n.u+n.tx*u-n.nx*x,e.z=n.nz*r+n.tz*n.u+n.tz*u-n.nz*x,e.registerImpact(-n.nx,-n.nz,.85+y*.5),a.push({type:`deflect`,orb:e,craft:n,u01:(m+1)*.5,power:.7+y*.6,speed:b,x:e.x,z:e.z});break}for(let t of r){let n=e.x*t.nx+e.z*t.nz;if(n+U.radius<=t.d)continue;if(t.goal>=0){let n=e.x*-t.nz+e.z*t.nx;if(i[t.goal].alive&&Math.abs(n)<=t.halfWidth){e.active=!1,a.push({type:`goal`,orb:e,victim:t.goal,x:e.x,z:e.z,u01:W(n/t.halfWidth,-1,1)*.5+.5});return}}let r=n+U.radius-t.d;e.x-=t.nx*r*1.02,e.z-=t.nz*r*1.02;let o=e.vx*t.nx+e.vz*t.nz;o>0&&(e.vx-=2*o*t.nx,e.vz-=2*o*t.nz);let s=Math.min(U.maxSpeed,Math.hypot(e.vx,e.vz)+U.rallyGain*.35),[c,l]=Dt(e.vx,e.vz,t.nx,t.nz,s),u=Math.hypot(c,l)||1;e.vx=c/u*s,e.vz=l/u*s,e.speed=s,e.registerImpact(-t.nx,-t.nz,.55),a.push({type:t.goal>=0?`sealed`:`wall`,orb:e,x:e.x,z:e.z,nx:t.nx,nz:t.nz,speed:s,goal:t.goal});break}}}function kt(e,t){let n=U.radius*2*(U.radius*2);for(let r=0;r<e.length;r++){let i=e[r];if(i.active)for(let a=r+1;a<e.length;a++){let r=e[a];if(!r.active)continue;let o=r.x-i.x,s=r.z-i.z,c=o*o+s*s;if(c>n||c<1e-8)continue;let l=Math.sqrt(c);o/=l,s/=l;let u=(r.vx-i.vx)*o+(r.vz-i.vz)*s;if(u<0){i.vx+=u*o,i.vz+=u*s,r.vx-=u*o,r.vz-=u*s;let e=Math.hypot(i.vx,i.vz)||1,n=Math.hypot(r.vx,r.vz)||1;i.vx=i.vx/e*i.speed,i.vz=i.vz/e*i.speed,r.vx=r.vx/n*r.speed,r.vz=r.vz/n*r.speed,i.registerImpact(-o,-s,.6),r.registerImpact(o,s,.6),t.push({type:`orbclash`,x:i.x+o*U.radius,z:i.z+s*U.radius,speed:Math.max(i.speed,r.speed)})}let d=(U.radius*2-l)*.5+.001;i.x-=o*d,i.z-=s*d,r.x+=o*d,r.z+=s*d}}}function At(e,t,n,r=4){let i=e.x,a=e.z,o=e.vx,s=e.vz,c=t[n],l=0;for(let e=0;e<10&&l<r;e++){let e=1/0,n=null;for(let r of t){let t=o*r.nx+s*r.nz;if(t<=1e-6)continue;let c=(r.d-U.radius-(i*r.nx+a*r.nz))/t;c>1e-5&&c<e&&(e=c,n=r)}if(!n||!isFinite(e))return null;if(l+=e,i+=o*e,a+=s*e,n===c)return{lateral:i*-c.nz+a*c.nx,time:l};let r=o*n.nx+s*n.nz;o-=2*r*n.nx,s-=2*r*n.nz}return null}var jt=class{constructor(e,t,n){this.craft=e,this.diff=t,this.planes=n,this.reactTimer=0,this.aimError=0,this.desiredU=0,this.threatId=-1,this.victim=-1,this.idlePhase=q(0,Math.PI*2),this.commitTime=0,this.panic=0}_pickVictim(e,t){let n=this.craft.index,r=[];for(let i=0;i<4;i++){if(i===n||!e[i].alive)continue;let a=1+(6-t[i])*.45;i===0&&(a*=1+this.diff.aggression*.15),i===this.victim&&(a*=.45),r.push([i,a])}if(!r.length)return-1;let i=0;for(let[,e]of r)i+=e;let a=Math.random()*i;for(let[e,t]of r)if(a-=t,a<=0)return e;return r[0][0]}_aimOffset(e,t){let n=this.craft;if(e<0)return 0;let r=Ve[e],i=q(-.55,.55)*(z.half-z.chamfer),a=-r.nz,o=r.nx,s=r.nx*z.half+a*i,c=r.nz*z.half+o*i,l=n.standoffDist,u=n.nx*l+n.tx*t,d=n.nz*l+n.tz*t,f=s-u,p=c-d,m=f*n.tx+p*n.tz,h=f*-n.nx+p*-n.nz;return h<=.5?0:W(W(m/h,-1.2,1.2)/U.angleInfluence,-.92,.92)}update(e,t,n,r){let i=this.craft;if(!i.alive)return;let a=null,o=null;for(let e of t){if(!e.active)continue;let t=At(e,this.planes,i.index,5);t&&(!a||t.time<a.time)&&(a=t,o=e)}if(this.reactTimer-=e,a){(o.id!==this.threatId||a.time>this.commitTime+.35)&&this.reactTimer<=0&&(this.threatId=o.id,this.reactTimer=this.diff.react*q(.7,1.35),this.victim=this._pickVictim(n,r),this.aimError=q(-1,1)*this.diff.err*q(.6,1.4)),this.commitTime=a.time;let t=this._aimOffset(this.victim,a.lateral)*i.halfLen,s=W(1-a.time/1.6,0,1),c=this.aimError*(1-s*.82);this.desiredU=a.lateral-t+c,this.panic=W(Math.abs(a.lateral-i.u)/8*(1-a.time/1.2),0,1),this.panic>.55&&a.time<.55&&i.surge>=1&&Math.random()<this.diff.aggression*e*22&&i.trySurge()}else{this.idlePhase+=e*.55;let t=Math.sin(this.idlePhase)*(z.half-z.chamfer)*.3;this.desiredU=G(this.desiredU,t,1-Math.exp(-e*1.6)),this.panic=0}let s=H.maxSpeed*this.diff.speed*(1+this.panic*.25),c=i.targetU,l=W(this.desiredU-c,-s*e,s*e);i.steer(c+l)}},Mt=`
attribute float aSize;
attribute vec3  aColor;
attribute float aLife;    // 1 -> just born, 0 -> dead
attribute float aAngle;
attribute float aStretch;
attribute float aKind;    // 0 glow, 1 streak, 2 shard
uniform float uPixelRatio;
uniform float uScale;
varying vec3  vColor;
varying float vLife;
varying float vAngle;
varying float vStretch;
varying float vKind;
void main() {
  vColor = aColor; vLife = aLife; vAngle = aAngle;
  vStretch = aStretch; vKind = aKind;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  // Perspective attenuation, clamped so distant sparks don't vanish entirely.
  float atten = uScale / max(-mv.z, 0.6);
  gl_PointSize = max(1.0, aSize * uPixelRatio * atten * (0.25 + vLife * 0.75));
}`,Nt=`
precision mediump float;
varying vec3  vColor;
varying float vLife;
varying float vAngle;
varying float vStretch;
varying float vKind;

void main() {
  vec2 p = gl_PointCoord - 0.5;

  // Rotate into the particle's own frame so streaks lie along their velocity.
  float s = sin(vAngle), c = cos(vAngle);
  p = mat2(c, -s, s, c) * p;

  float a;
  if (vKind < 0.5) {
    // Round ember: tight gaussian core with a soft halo.
    float r2 = dot(p, p);
    a = exp(-r2 * 22.0) + exp(-r2 * 5.5) * 0.35;
  } else if (vKind < 1.5) {
    // Streak: squeezed across, stretched along.
    p.x /= max(vStretch, 0.05);
    p.y *= 3.4;
    float r2 = dot(p, p);
    a = exp(-r2 * 26.0) * 1.25;
  } else {
    // Shard: a hard-edged sliver that tumbles.
    vec2 q = abs(p);
    float d = max(q.x * 2.6, q.y * 9.0);
    a = smoothstep(0.5, 0.16, d);
  }

  a *= vLife * vLife;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor * a * 2.6, a);
}`;new M;var Pt=class{constructor(e,t=1){this.cap=e;let n=e;this.pos=new Float32Array(n*3),this.vel=new Float32Array(n*3),this.col=new Float32Array(n*3),this.size=new Float32Array(n),this.life=new Float32Array(n),this.rate=new Float32Array(n),this.angle=new Float32Array(n),this.stretch=new Float32Array(n),this.kind=new Float32Array(n),this.drag=new Float32Array(n),this.grav=new Float32Array(n),this.spin=new Float32Array(n);let r=new ie;this.aPos=new C(this.pos,3).setUsage(S),this.aCol=new C(this.col,3).setUsage(S),this.aSize=new C(this.size,1).setUsage(S),this.aLife=new C(this.life,1).setUsage(S),this.aAngle=new C(this.angle,1).setUsage(S),this.aStretch=new C(this.stretch,1).setUsage(S),this.aKind=new C(this.kind,1).setUsage(S),r.setAttribute(`position`,this.aPos),r.setAttribute(`aColor`,this.aCol),r.setAttribute(`aSize`,this.aSize),r.setAttribute(`aLife`,this.aLife),r.setAttribute(`aAngle`,this.aAngle),r.setAttribute(`aStretch`,this.aStretch),r.setAttribute(`aKind`,this.aKind),r.boundingSphere=new s(new M,400),r.setDrawRange(0,0),this.mat=new F({vertexShader:Mt,fragmentShader:Nt,uniforms:{uPixelRatio:{value:t},uScale:{value:26}},transparent:!0,depthWrite:!1,blending:2}),this.points=new p(r,this.mat),this.points.frustumCulled=!1,this.points.renderOrder=9,this.cursor=0,this.high=0,this._c=new T}setPixelRatio(e){this.mat.uniforms.uPixelRatio.value=e}_alloc(){let e=this.cap;for(let t=0;t<e;t++){let n=(this.cursor+t)%e;if(this.life[n]<=0)return this.cursor=(n+1)%e,n+1>this.high&&(this.high=n+1),n}let t=this.cursor;return this.cursor=(t+1)%e,t}burst(e){let t=e.count|0,[n,r,i]=e.at,a=e.spread??1,o=e.speedMin??4,s=e.speedMax??12,c=e.lifeMin??.25,l=e.lifeMax??.7,u=e.sizeMin??6,d=e.sizeMax??16,f=e.kind??1,p=e.drag??2.4,m=e.grav??-9,h=e.jitter??0,g=this._c.set(e.color??16777215).convertSRGBToLinear(),_=g.r,v=g.g,ee=g.b,y=_,b=v,x=ee;if(e.color2!==void 0){let t=this._c.set(e.color2).convertSRGBToLinear();y=t.r,b=t.g,x=t.b}let S=!!e.dir,te=S?e.dir[0]:0,ne=S?e.dir[1]:0,C=S?e.dir[2]:0;for(let e=0;e<t;e++){let e=this._alloc(),t=Math.random()*2-1,g=Math.random()*Math.PI*2,w=Math.sqrt(Math.max(0,1-t*t)),T=Math.cos(g)*w,E=t,D=Math.sin(g)*w;if(S){let e=1-Math.min(a,1);T=T*(1-e)+te*e,E=E*(1-e)+ne*e,D=D*(1-e)+C*e;let t=Math.hypot(T,E,D)||1;T/=t,E/=t,D/=t}a<1&&!S&&(E=Math.abs(E));let re=o+Math.random()*(s-o),O=e*3;this.pos[O]=n+(Math.random()-.5)*h,this.pos[O+1]=r+(Math.random()-.5)*h,this.pos[O+2]=i+(Math.random()-.5)*h,this.vel[O]=T*re,this.vel[O+1]=E*re,this.vel[O+2]=D*re;let k=Math.random();this.col[O]=_+(y-_)*k,this.col[O+1]=v+(b-v)*k,this.col[O+2]=ee+(x-ee)*k,this.size[e]=u+Math.random()*(d-u),this.life[e]=1,this.rate[e]=1/(c+Math.random()*(l-c)),this.angle[e]=Math.random()*Math.PI*2,this.stretch[e]=.16+Math.random()*.2,this.kind[e]=f,this.drag[e]=p,this.grav[e]=m,this.spin[e]=f===2?(Math.random()-.5)*14:0}}update(e,t){let n=this.high;if(n===0)return;let r=0,i=t.matrixWorldInverse.elements;for(let t=0;t<n;t++){let n=this.life[t];if(n<=0)continue;if(n-=this.rate[t]*e,n<=0){this.life[t]=0;continue}this.life[t]=n,r=t+1;let a=t*3,o=Math.exp(-this.drag[t]*e),s=this.vel[a]*o,c=this.vel[a+1]*o+this.grav[t]*e,l=this.vel[a+2]*o,u=this.pos[a]+s*e,d=this.pos[a+1]+c*e,f=this.pos[a+2]+l*e;if(d<.08&&c<0&&(d=.08,c=-c*.34,s*=.7,l*=.7),this.vel[a]=s,this.vel[a+1]=c,this.vel[a+2]=l,this.pos[a]=u,this.pos[a+1]=d,this.pos[a+2]=f,this.kind[t]===1){let e=i[0]*s+i[4]*c+i[8]*l,n=i[1]*s+i[5]*c+i[9]*l;this.angle[t]=Math.atan2(n,e)}else this.spin[t]!==0&&(this.angle[t]+=this.spin[t]*e)}this.high=r;let a=r;if(this.points.geometry.setDrawRange(0,a),a!==0)for(let e of[this.aPos,this.aCol,this.aSize,this.aLife,this.aAngle,this.aStretch,this.aKind])e.updateRanges.length=0,e.addUpdateRange(0,a*e.itemSize),e.needsUpdate=!0}clear(){this.life.fill(0),this.high=0,this.points.geometry.setDrawRange(0,0)}dispose(){this.points.geometry.dispose(),this.mat.dispose()}},Ft=class{constructor(e,t=10){this.items=[];let n=new c(.78,1,48,1);n.rotateX(-Math.PI/2),this.geo=n;for(let r=0;r<t;r++){let t=new F({transparent:!0,depthWrite:!1,blending:2,side:2,uniforms:{uColor:{value:new T(1,1,1)},uFade:{value:0}},vertexShader:`varying vec2 vU; void main(){ vU=uv;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,fragmentShader:`precision mediump float; varying vec2 vU;
          uniform vec3 uColor; uniform float uFade;
          void main(){
            // Soft across the band, hard-ish on the leading edge.
            float a = smoothstep(0.0,0.35,vU.y) * smoothstep(1.0,0.55,vU.y);
            a *= uFade;
            gl_FragColor = vec4(uColor*a*2.2, a);
          }`}),r=new i(n,t);r.visible=!1,r.renderOrder=5,e.add(r),this.items.push({mesh:r,mat:t,life:0,dur:1,from:1,to:6,tilt:0})}this.cursor=0}spawn(e,t,n,r,i,a,o,s=0,c=0){let l=this.items.find(e=>e.life<=0);return l||(l=this.items[this.cursor],this.cursor=(this.cursor+1)%this.items.length),l.life=a,l.dur=a,l.from=r,l.to=i,l.tilt=s,l.mesh.position.set(e,t,n),l.mesh.rotation.set(s,c,0),l.mesh.visible=!0,l.mat.uniforms.uColor.value.set(o).convertSRGBToLinear(),l.mat.uniforms.uFade.value=1,l}update(e){for(let t of this.items){if(t.life<=0)continue;if(t.life-=e,t.life<=0){t.mesh.visible=!1;continue}let n=1-t.life/t.dur,r=1-(1-n)**2.6,i=G(t.from,t.to,r);t.mesh.scale.set(i,i,i),t.mat.uniforms.uFade.value=(1-n)**1.7}}dispose(){this.geo.dispose();for(let e of this.items)e.mat.dispose(),e.mesh.parent?.remove(e.mesh)}},It=class{constructor(e,t,n,r,i){this.scene=e,this.arena=t,this.cam=n,this.audio=r,this.preset=i,this.sparks=new Pt(i.sparks,Math.min(devicePixelRatio||1,2)),e.add(this.sparks.points),this.rings=new Ft(e,i.sparks>400?12:7),this.flash=0,this.flashColor=new T(1,1,1),this.radial=0}setPixelRatio(e){this.sparks.setPixelRatio(e)}update(e,t){this.sparks.update(e,t),this.rings.update(e),this.flash=Math.max(0,this.flash-e*4.2),this.radial=Math.max(0,this.radial-e*3.4)}deflect(e){let t=e.craft,n=B[t.index],r=W((e.speed-15)/25,0,1),i=-t.nx,a=-t.nz;this.sparks.burst({at:[e.x,z.playY,e.z],dir:[i,.35,a],spread:.62,count:Math.round(G(8,20,r)*(this.preset.sparks/520+.4)),speedMin:6,speedMax:16+r*14,lifeMin:.16,lifeMax:.42,sizeMin:5,sizeMax:13,color:n.color,color2:16777215,kind:1,drag:3.4,grav:-7,jitter:.3}),this.rings.spawn(e.x,z.playY-.75,e.z,.25,2.4+r*1.6,.42,n.color),this.arena.shock(e.x,e.z,.55+r*.5,n.color),this.arena.hitBarrier(t.index,e.u01,.18),t.onDeflect(e.u01,e.power),this.audio.deflect(r,.75+e.power*.35,t.index/3),t.index===0?(this.cam.shake(.09+r*.1),this.cam.punch(.7+r*.9)):this.cam.shake(.035+r*.03)}wall(e){let t=W((e.speed-15)/25,0,1),n=e.goal>=0?16754237:6281471;this.sparks.burst({at:[e.x,z.playY,e.z],dir:[-e.nx,.5,-e.nz],spread:.75,count:Math.round(G(4,11,t)*(this.preset.sparks/520+.4)),speedMin:4,speedMax:11+t*8,lifeMin:.12,lifeMax:.34,sizeMin:4,sizeMax:9,color:n,color2:16777215,kind:1,drag:4.2,grav:-8}),this.arena.shock(e.x,e.z,.28+t*.3,n),this.audio.wall(t),this.cam.shake(.02+t*.03)}orbClash(e){(e.speed-15)/25,this.sparks.burst({at:[e.x,z.playY,e.z],spread:2,count:Math.round(16*(this.preset.sparks/520+.4)),speedMin:5,speedMax:15,lifeMin:.2,lifeMax:.5,sizeMin:4,sizeMax:11,color:16777215,color2:8382719,kind:0,drag:3,grav:-6}),this.rings.spawn(e.x,z.playY,e.z,.2,2.6,.4,12578815,-Math.PI/2),this.arena.shock(e.x,e.z,.5,12578815),this.audio.clash(),this.cam.shake(.07)}goal(e,t){let n=B[e.victim],r=this.preset.sparks;this.sparks.burst({at:[e.x,z.playY,e.z],spread:2,count:Math.round(46*(r/520+.5)),speedMin:8,speedMax:30,lifeMin:.3,lifeMax:.95,sizeMin:6,sizeMax:20,color:n.color,color2:16777215,kind:1,drag:2.2,grav:-11,jitter:.6}),this.sparks.burst({at:[e.x,z.playY,e.z],spread:2,count:Math.round(22*(r/520+.5)),speedMin:3,speedMax:12,lifeMin:.5,lifeMax:1.4,sizeMin:10,sizeMax:26,color:n.color,color2:16747082,kind:0,drag:1.6,grav:-2.5});let i=this.arena.planes[e.victim];this.rings.spawn(e.x,z.playY,e.z,.4,7,.7,n.color,0,Math.atan2(i.nx,i.nz)),this.rings.spawn(e.x,z.playY-.8,e.z,.4,11,.85,n.color),this.arena.shock(e.x,e.z,2,n.color),this.arena.hitBarrier(e.victim,e.u01,1.4),this.flash=t?.42:.2,this.flashColor.set(n.color).convertSRGBToLinear().lerp(new T(1,1,1),.55),this.radial=t?1.5:.7,this.audio.goal(t),this.cam.shake(t?.62:.34),this.cam.punch(t?5.5:3),this.cam.kick(-i.nx,-i.nz,t?.55:.3)}eliminate(e){let t=B[e.index],n=e.worldPos(new M),r=this.preset.sparks;this.sparks.burst({at:[n.x,n.y,n.z],spread:2,count:Math.round(90*(r/520+.5)),speedMin:10,speedMax:42,lifeMin:.4,lifeMax:1.3,sizeMin:7,sizeMax:24,color:t.color,color2:16777215,kind:1,drag:1.8,grav:-13,jitter:1.2}),this.sparks.burst({at:[n.x,n.y,n.z],spread:2,count:Math.round(40*(r/520+.5)),speedMin:4,speedMax:18,lifeMin:.8,lifeMax:2.2,sizeMin:14,sizeMax:40,color:16742954,color2:4199946,kind:0,drag:1.1,grav:-1.4,jitter:1.4}),this.sparks.burst({at:[n.x,n.y,n.z],spread:2,count:Math.round(26*(r/520+.5)),speedMin:6,speedMax:26,lifeMin:.9,lifeMax:2,sizeMin:8,sizeMax:18,color:10466249,color2:t.color,kind:2,drag:.9,grav:-16,jitter:1}),this.rings.spawn(n.x,z.playY-.8,n.z,.5,17,1.15,t.color),this.rings.spawn(n.x,z.playY,n.z,.5,9,.8,16777215,0,Math.atan2(e.nx,e.nz)),this.arena.shock(n.x,n.z,3,t.color),this.arena.sealBarrier(e.index),this.flash=.62,this.flashColor.set(16765088).convertSRGBToLinear(),this.radial=2.2,this.audio.explode(),this.cam.shake(.95),this.cam.punch(7)}surge(e){let t=e.worldPos(new M),n=B[e.index];this.sparks.burst({at:[t.x,t.y,t.z],dir:[-e.nx,.2,-e.nz],spread:.5,count:Math.round(18*(this.preset.sparks/520+.4)),speedMin:6,speedMax:20,lifeMin:.2,lifeMax:.5,sizeMin:5,sizeMax:12,color:16777215,color2:n.color,kind:1,drag:3,grav:-4,jitter:1.4}),this.rings.spawn(t.x,z.playY-.8,t.z,.4,5.5,.5,16777215),this.audio.surge(),e.index===0&&this.cam.punch(1.6)}serveCharge(e){if(this.arena.setCharge(e),e>.02&&Math.random()<e*.5){let t=q(0,Math.PI*2),n=G(11,1.2,e);this.sparks.burst({at:[Math.cos(t)*n,z.playY,Math.sin(t)*n],dir:[-Math.cos(t),.1,-Math.sin(t)],spread:.25,count:2,speedMin:8,speedMax:18,lifeMin:.2,lifeMax:.45,sizeMin:4,sizeMax:9,color:10481663,color2:16777215,kind:1,drag:1.2,grav:0})}}serveBurst(e,t,n){this.sparks.burst({at:[e,z.playY,t],dir:[Math.sin(n),.2,Math.cos(n)],spread:.7,count:Math.round(26*(this.preset.sparks/520+.4)),speedMin:8,speedMax:24,lifeMin:.2,lifeMax:.55,sizeMin:5,sizeMax:14,color:9431295,color2:16777215,kind:1,drag:2.6,grav:-4}),this.rings.spawn(e,z.playY-.8,t,.3,8,.6,9431295),this.arena.shock(e,t,.8,9431295),this.cam.shake(.14),this.cam.punch(2)}clear(){this.sparks.clear()}dispose(){this.sparks.dispose(),this.rings.dispose()}},Lt=1.34,Rt=240,zt=12,Bt=class{constructor(e){this.canvas=e,this.active=!1,this.pointerId=null,this.screenX=0,this.touchMode=!1,this.keyLeft=!1,this.keyRight=!1,this.surgeRequested=!1,this.pauseRequested=!1,this.source=`none`,this._downT=0,this._downX=0,this._downY=0,this._moved=0,this._padIndex=null,this._bind()}_bind(){let e=this.canvas,t={passive:!1};this._onDown=t=>{if(this.pointerId===null||t.pointerId===this.pointerId){this.pointerId=t.pointerId,this.active=!0,this.source=`pointer`,this.touchMode=t.pointerType!==`mouse`,this.screenX=t.clientX,this._downT=performance.now(),this._downX=t.clientX,this._downY=t.clientY,this._moved=0;try{e.setPointerCapture?.(t.pointerId)}catch{}t.preventDefault()}},this._onMove=e=>{let t=Math.abs(e.clientX-this.screenX)>1;if(e.pointerType===`mouse`){t&&(this.source=`pointer`),this.screenX=e.clientX,this.touchMode=!1,this.active=!0,e.pointerId===this.pointerId&&(this._moved=Math.max(this._moved,Math.hypot(e.clientX-this._downX,e.clientY-this._downY)),e.preventDefault());return}e.pointerId===this.pointerId&&(t&&(this.source=`pointer`),this.screenX=e.clientX,this._moved=Math.max(this._moved,Math.hypot(e.clientX-this._downX,e.clientY-this._downY)),e.preventDefault())},this._onUp=t=>{if(t.pointerId===this.pointerId){performance.now()-this._downT<Rt&&this._moved<zt&&(this.surgeRequested=!0),this.pointerId=null,this.touchMode&&(this.active=!1);try{e.releasePointerCapture?.(t.pointerId)}catch{}}},e.addEventListener(`pointerdown`,this._onDown,t),window.addEventListener(`pointermove`,this._onMove,t),window.addEventListener(`pointerup`,this._onUp),window.addEventListener(`pointercancel`,this._onUp),this._onKeyDown=e=>{switch(e.code){case`ArrowLeft`:case`KeyA`:this.keyLeft=!0,this.source=`keys`,e.preventDefault();break;case`ArrowRight`:case`KeyD`:this.keyRight=!0,this.source=`keys`,e.preventDefault();break;case`Space`:case`ShiftLeft`:this.surgeRequested=!0,e.preventDefault();break;case`Escape`:case`KeyP`:this.pauseRequested=!0}},this._onKeyUp=e=>{(e.code===`ArrowLeft`||e.code===`KeyA`)&&(this.keyLeft=!1),(e.code===`ArrowRight`||e.code===`KeyD`)&&(this.keyRight=!1)},window.addEventListener(`keydown`,this._onKeyDown),window.addEventListener(`keyup`,this._onKeyUp),window.addEventListener(`gamepadconnected`,e=>{this._padIndex=e.gamepad.index}),window.addEventListener(`gamepaddisconnected`,()=>{this._padIndex=null}),e.addEventListener(`touchstart`,e=>e.preventDefault(),t),e.addEventListener(`gesturestart`,e=>e.preventDefault(),t),window.addEventListener(`contextmenu`,e=>e.preventDefault())}_pollPad(){if(this._padIndex===null||!navigator.getGamepads)return 0;let e=navigator.getGamepads()[this._padIndex];if(!e)return 0;let t=e.axes[0]||0;return Math.abs(t)<.14&&(t=0),e.buttons[14]?.pressed&&(t=-1),e.buttons[15]?.pressed&&(t=1),e.buttons[0]?.pressed&&!this._padA&&(this.surgeRequested=!0),this._padA=e.buttons[0]?.pressed,e.buttons[9]?.pressed&&!this._padStart&&(this.pauseRequested=!0),this._padStart=e.buttons[9]?.pressed,t}resolve(e,t,n,r,i=1){let a=this._pollPad(),o=0;return this.keyLeft&&--o,this.keyRight&&(o+=1),a!==0&&(o=a,this.source=`pad`),o===0?this.source===`pointer`?this.active?W(t(this.screenX),-n,n):r:this._recentre(r,e):W(r+o*i*n*2.2*e,-n,n)}_recentre(e,t){let n=H.recenterRate;if(n<=0||e===0)return e;let r=K(e,0,n,t),i=H.maxSpeed*t;return r=W(r,e-i,e+i),Math.abs(r)<.02?0:r}consumeSurge(){let e=this.surgeRequested;return this.surgeRequested=!1,e}consumePause(){let e=this.pauseRequested;return this.pauseRequested=!1,e}release(){this.active=!1,this.pointerId=null,this.keyLeft=this.keyRight=!1,this.surgeRequested=!1,this.source=`none`}dispose(){window.removeEventListener(`pointermove`,this._onMove),window.removeEventListener(`pointerup`,this._onUp),window.removeEventListener(`pointercancel`,this._onUp),window.removeEventListener(`keydown`,this._onKeyDown),window.removeEventListener(`keyup`,this._onKeyUp)}},Vt=1/120,Ht=.25,X={INTRO:`intro`,SERVE:`serve`,PLAY:`play`,KO:`ko`,OVER:`over`},Ut=class{constructor(e,t,n,r,i,a,o){this.scene=e,this.camera=t,this.assets=n,this.audio=r,this.hud=i,this.preset=a,this.input=o,this.arena=new ut(e,n,a),this.effects=new It(e,this.arena,t,r,a),this.crafts=[];for(let t=0;t<4;t++)this.crafts.push(new ft(t,B[t],n,e));this.maxOrbs=Math.min(4,a.sparks>400?4:V.orbCapMobile),this.orbs=[];for(let t=0;t<this.maxOrbs;t++){let n=new Ct(e,a,t<a.orbLights);n.id=t,this.orbs.push(n)}this.ais=[],this.state=X.INTRO,this.accum=0,this.timeScale=1,this._targetScale=1,this._freeze=0,this.events=[],this.paused=!1,this.attract=!0,this.startAttract()}startMatch(e=1){this.attract=!1,this.autoPlayer=this.autoPlayer||!1,this._resetCommon(e),this.state=X.INTRO,this.introTimer=0,this._introAnnounced=!1,this.camera.startIntro()}startAttract(){this.attract=!0,this._resetCommon(2),this.playTime=40,this.state=X.SERVE,this.serveTimer=0,this.serveDuration=.7,this.pendingServes=[0]}_resetCommon(e=1){let t=He[W(e,0,2)];this.difficulty=e,this.scores=B.map(()=>V.startPoints),this.alive=[!0,!0,!0,!0],this.eliminationOrder=[],this.stats={deflections:0,bestChain:0,knockouts:0,duration:0},this.chain=0,this.matchTime=0,this.playTime=0,this.serveTimer=0,this.koTimer=0,this.pendingServes=[],this.lastConceder=-1;for(let e of this.crafts)e.alive=!0,e.dying=0,e.u=0,e.vu=0,e.targetU=0,e.recoil=0,e.hitFlash=0,e.surge=1,e.surgeActive=0,e.root.visible=!0,e.bobPivot.position.y=0,e.hullPivot.rotation.set(0,0,0),e.defMat.uniforms.uAlive.value=1,e.sync(0);for(let e of this.orbs)e.kill();this.ais=[];for(let e=0;e<4;e++)this.ais[e]=new jt(this.crafts[e],t,this.arena.planes);for(let e=0;e<4;e++)this.arena.setBarrierHealth(e,1),this.hud.setScore(e,V.startPoints);this.hud.resetMatch(),this.hud.setOrbCount(0),this.hud.setCombo(0),this.effects.clear(),this.arena.setCharge(0),this.timeScale=1,this._targetScale=1,this._freeze=0,this._slowHold=0,this._resultShown=!1,this.overTimer=0}_slow(e,t){this._targetScale=e,this._slowHold=t}_say(e,t){this.attract||this.hud.announce(e,t)}get aliveCount(){return this.alive.reduce((e,t)=>e+ +!!t,0)}targetOrbCount(){let e=1;for(let t of V.orbSchedule)this.playTime>=t.t&&(e=t.n);return W(Math.min(e,this.maxOrbs),1,Math.max(2,this.aliveCount))}activeOrbs(){return this.orbs.filter(e=>e.active)}update(e){if(this.paused){this.arena.update(0,this.matchTime);return}this._slowHold>0&&(this._slowHold-=e,this._slowHold<=0&&(this._targetScale=1)),this._freeze>0?(this._freeze-=e,this.timeScale=0):this.timeScale=K(this.timeScale,this._targetScale,7,e);let t=e*this.timeScale;switch(this.matchTime+=e,this.state){case X.INTRO:this._updateIntro(e);break;case X.SERVE:this._updateServe(t,e);break;case X.PLAY:this._updatePlay(t);break;case X.KO:this._updateKO(t,e);break;case X.OVER:this._updateOver(e)}if(this.state!==X.INTRO){this.accum=Math.min(this.accum+t,Ht);let e=0;for(;this.accum>=Vt&&e++<40;)this._fixedStep(Vt),this.accum-=Vt}for(let e of this.crafts)e.update(t,this.matchTime);for(let e of this.orbs)e.updateVisual(t,this.matchTime);this.arena.aimFill(this.camera.cam.position),this.arena.update(t,this.matchTime),this.effects.update(e,this.camera.cam),this._updateCameraFocus(e),this._updateAudioIntensity()}_fixedStep(e){let t=this.events;if(t.length=0,this.state===X.PLAY||this.state===X.SERVE||this.state===X.KO){this.attract||this.autoPlayer?this.ais[0].update(e,this.orbs,this.crafts,this.scores):this._steerPlayer(e);for(let t=1;t<4;t++)this.alive[t]&&this.ais[t].update(e,this.orbs,this.crafts,this.scores)}let n={planes:this.arena.planes,crafts:this.crafts,events:t};for(let t of this.orbs)t.active&&Ot(t,e,n);kt(this.activeOrbs(),t);for(let e of t)this._handleEvent(e)}_steerPlayer(e){let t=this.crafts[0];if(!t.alive)return;let n=this._mapper;n&&t.steer(this.input.resolve(e,n.map,t.limit,t.targetU,n.sign)),this.input.consumeSurge()&&t.trySurge()&&this.effects.surge(t)}_handleEvent(e){switch(e.type){case`deflect`:this.effects.deflect(e),e.craft.index===0&&(this.chain++,this.stats.deflections++,this.stats.bestChain=Math.max(this.stats.bestChain,this.chain),this.hud.setCombo(this.chain)),e.orb.setTint(B[e.craft.index].color);break;case`wall`:case`sealed`:this.effects.wall(e);break;case`orbclash`:this.effects.orbClash(e);break;case`goal`:this._concede(e)}}_concede(e){let t=e.victim;if(!this.alive[t])return;if(e.orb.kill(),this.attract){this.effects.goal(e,!1),this.lastConceder=t,this._queueServe(.5);return}this.scores[t]=Math.max(0,this.scores[t]-1),this.hud.setScore(t,this.scores[t]),this.arena.setBarrierHealth(t,this.scores[t]/V.startPoints),this.crafts[t].onConcede(),this.lastConceder=t;let n=t===0;if(this.effects.goal(e,n),n?(this.chain=0,this.hud.setCombo(0)):e.orb.lastHitBy===0&&(this.stats.knockouts+=+(this.scores[t]===0)),this._freeze=n?.11:.06,this._slow(.34,n?.42:.26),this.scores[t]===0)this._eliminate(t);else{let e=n?this.scores[t]===1?`ONE LEFT`:`HIT`:`${B[t].name} HIT`;(n||this.scores[t]<=1)&&this._say(e,1100),this._queueServe(V.respawnDelay)}}_eliminate(e){if(this.alive[e]=!1,this.eliminationOrder.push(e),this.crafts[e].eliminate(),this.hud.markEliminated(e),this.effects.eliminate(this.crafts[e]),this._freeze=.2,this._slow(.25,.9),this.aliveCount<=1){this.state=X.OVER,this.overTimer=0;for(let e of this.orbs)e.kill();let e=this.alive.indexOf(!0);this._say(e===0?`YOU SURVIVE`:`${B[e].name}\nWINS`,2400),this.audio.stinger(e===0),this.audio.setIntensity(0);return}this.state=X.KO,this.koTimer=1.9,this._slow(.25,.7),this._say(e===0?`YOU ARE OUT`:`${B[e].name} DOWN`,1700);for(let e of this.orbs)e.active&&e.kill()}_queueServe(e){this.pendingServes.push(e),this.state===X.PLAY&&this.activeOrbs().length===0&&(this.state=X.SERVE,this.serveTimer=0,this.serveDuration=Math.max(e,V.serveDelay),this.audio.serve())}_serveOrb(){let e=this.orbs.find(e=>!e.active);if(!e)return;let t=q(0,Math.PI*2),n=this.lastConceder;for(let e=0;e<24;e++){t=q(0,Math.PI*2);let e=Math.sin(t),r=Math.cos(t);if(Math.abs(e)<.22||Math.abs(r)<.22)continue;if(n>=0){let t=this.arena.planes[n];if(e*t.nx+r*t.nz>.55)continue}let i=!0;for(let t=0;t<4;t++){if(this.alive[t])continue;let n=this.arena.planes[t];if(e*n.nx+r*n.nz>.8){i=!1;break}}if(i)break}let r=U.baseSpeed+Math.min(6,this.playTime*.05);e.spawn(0,0,t,r),this.effects.serveBurst(0,0,t),this.arena.setCharge(0),this.hud.setOrbCount(this.activeOrbs().length)}_updateIntro(e){this.introTimer+=e,this.introTimer>2&&!this._introAnnounced&&(this._introAnnounced=!0,this._say(`FIVE POINTS EACH
LAST ONE STANDING`,1900)),this.introTimer>=3.4&&(this._introAnnounced=!1,this.state=X.SERVE,this.serveTimer=0,this.serveDuration=1.4,this.pendingServes=[0],this.audio.serve())}_updateServe(e,t){this.serveTimer+=t;let n=W(this.serveTimer/this.serveDuration,0,1);this.effects.serveCharge(n),n>=1&&(this.pendingServes.shift(),this._serveOrb(),this.state=X.PLAY)}_updatePlay(e){this.playTime+=e,this.pendingServes.length&&(this.pendingServes[0]-=e,this.pendingServes[0]<=0&&(this.pendingServes.shift(),this._serveOrb()));let t=this.targetOrbCount();this.activeOrbs().length+this.pendingServes.length<t&&(this.pendingServes.push(.6),this._say(`ORB INBOUND`,900)),this.hud.setOrbCount(this.activeOrbs().length);for(let e of this.orbs)e.active&&Math.hypot(e.x,e.z)>z.half*1.9&&e.kill();this.activeOrbs().length===0&&this.pendingServes.length===0&&this._queueServe(V.respawnDelay)}_updateKO(e,t){this.hud.setOrbCount(0),this.koTimer-=t,this.koTimer<=0&&(this.state=X.SERVE,this.serveTimer=0,this.serveDuration=V.serveDelay,this.pendingServes=[0],this.lastConceder=-1,this.audio.serve())}_updateOver(e){this.overTimer+=e,!this._resultShown&&this.overTimer>2.2&&(this._resultShown=!0,this.onMatchEnd?.(this.buildResult()))}buildResult(){let e=[];for(let t=0;t<4;t++)this.alive[t]&&e.push(t);e.sort((e,t)=>this.scores[t]-this.scores[e]);let t=[...e,...this.eliminationOrder.slice().reverse()];return this.stats.duration=this.matchTime,{order:t,finalScores:this.scores.slice(),stats:this.stats}}_updateCameraFocus(e){let t=0,n=0,r=0;for(let e of this.orbs){if(!e.active)continue;let i=.4+e.speed/U.maxSpeed;t+=e.x*i,n+=e.z*i,r+=i}r>0?this.camera.lookToward(t/r,n/r,1):this.camera.lookToward(0,0,.2)}_updateAudioIntensity(){let e=0;for(let t of this.orbs){if(!t.active)continue;let n=W((t.speed-U.baseSpeed)/(U.maxSpeed-U.baseSpeed),0,1),r=W(t.vz/Math.max(.001,t.speed),0,1),i=W((t.z+z.half)/(z.half*2),0,1);e=Math.max(e,n*.55+r*i*.6)}let t=this.activeOrbs().length/this.maxOrbs,n=1-this.scores[0]/V.startPoints;this.audio.setIntensity(W(e*.5+t*.3+n*.35,0,1))}refreshMapper(e){let t=this.input.touchMode?Lt:1;this._mapper=this.camera.makeMapper(this.crafts[0],this.crafts[0].limit,t,e)}setPaused(e){this.paused=e,e&&this.input.release()}dispose(){this.effects.dispose();for(let e of this.crafts)e.dispose();for(let e of this.orbs)e.dispose();this.arena.dispose()}},Wt=440,Z=e=>Wt*2**(e/12),Gt=[0,3,5,7,10,12,15,17,19,22],Kt=class{constructor(){this.ctx=null,this.ready=!1,this.muted=!1,this.intensity=0,this._targetIntensity=0,this._nextBeat=0,this._beat=0,this._root=-5,this._duckUntil=0}async unlock(){if(this.ctx){this.ctx.state===`suspended`&&await this.ctx.resume();return}let e=window.AudioContext||window.webkitAudioContext;if(!e)return;let t=new e({latencyHint:`interactive`});this.ctx=t,this.master=t.createGain(),this.master.gain.value=.9,this.comp=t.createDynamicsCompressor(),this.comp.threshold.value=-14,this.comp.knee.value=22,this.comp.ratio.value=6,this.comp.attack.value=.004,this.comp.release.value=.16,this.sfx=t.createGain(),this.sfx.gain.value=.85,this.music=t.createGain(),this.music.gain.value=0,this.wide=t.createStereoPanner?t.createStereoPanner():null,this.sfx.connect(this.comp),this.music.connect(this.comp),this.comp.connect(this.master),this.master.connect(t.destination),this._buildNoise(),this._buildBed(),t.state===`suspended`&&await t.resume(),this.ready=!0,this._nextBeat=t.currentTime+.2}_buildNoise(){let e=this.ctx,t=e.sampleRate*2,n=e.createBuffer(1,t,e.sampleRate),r=n.getChannelData(0);for(let e=0;e<t;e++)r[e]=Math.random()*2-1;this.noiseBuf=n}_noise(e,t){let n=this.ctx.createBufferSource();return n.buffer=this.noiseBuf,n.loop=!0,n.start(t),n.stop(t+e+.05),n}_buildBed(){let e=this.ctx;this.droneGain=e.createGain(),this.droneGain.gain.value=.16,this.droneFilter=e.createBiquadFilter(),this.droneFilter.type=`lowpass`,this.droneFilter.frequency.value=340,this.droneFilter.Q.value=3.2,this.droneOscs=[];for(let t of[-9,0,7]){let n=e.createOscillator();n.type=`sawtooth`,n.frequency.value=Z(this._root-24),n.detune.value=t;let r=e.createGain();r.gain.value=t===0?.5:.3,n.connect(r),r.connect(this.droneFilter),n.start(),this.droneOscs.push({o:n,g:r})}this.droneFilter.connect(this.droneGain),this.droneGain.connect(this.music);let t=e.createOscillator();t.frequency.value=.055;let n=e.createGain();n.gain.value=190,t.connect(n),n.connect(this.droneFilter.frequency),t.start(),this._lfo=t,this.subGain=e.createGain(),this.subGain.gain.value=0;let r=e.createOscillator();r.type=`sine`,r.frequency.value=Z(this._root-36),r.connect(this.subGain),this.subGain.connect(this.music),r.start(),this.sub=r}setIntensity(e){this._targetIntensity=W(e,0,1)}setMusicLevel(e){this.ready&&(this.music.gain.cancelScheduledValues(this.ctx.currentTime),this.music.gain.linearRampToValueAtTime(e,this.ctx.currentTime+.8))}setMuted(e){this.muted=e,this.ready&&(this.master.gain.value=e?0:.9)}duck(e=.5,t=.35){if(!this.ready)return;let n=this.ctx.currentTime,r=this.music.gain,i=r.value;r.cancelScheduledValues(n),r.setValueAtTime(i,n),r.linearRampToValueAtTime(i*t,n+.04),r.linearRampToValueAtTime(i,n+e)}update(e){if(!this.ready)return;this.intensity+=(this._targetIntensity-this.intensity)*Math.min(1,e*.9);let t=this.intensity;this.droneFilter.Q.value=3+t*4,this.droneGain.gain.value=.13+t*.09,this.subGain.gain.value=t*t*.11;let n=60/G(78,122,t),r=this.ctx.currentTime,i=0;for(;this._nextBeat<r+.12&&i++<8;)this._sequence(this._nextBeat,this._beat,t),this._beat++,this._nextBeat+=n}_sequence(e,t,n){let r=t%4==0;if(this._pulse(e,r?.3:.14,r?54:78),Math.random()<.16+n*.42){let t=this._root+Ge(Gt)+(Math.random()<.25?12:0);this._pluck(e+q(0,.05),Z(t),.07+n*.05)}if(t%64==0&&t>0){this._root=Ge([-5,-3,-7,-10]);let t=Z(this._root-24);for(let{o:n}of this.droneOscs)n.frequency.cancelScheduledValues(e),n.frequency.linearRampToValueAtTime(t,e+2.2);this.sub.frequency.linearRampToValueAtTime(Z(this._root-36),e+2.2)}}_pulse(e,t,n){let r=this.ctx,i=r.createOscillator();i.type=`sine`,i.frequency.setValueAtTime(n*2.4,e),i.frequency.exponentialRampToValueAtTime(n,e+.06);let a=r.createGain();a.gain.setValueAtTime(0,e),a.gain.linearRampToValueAtTime(t,e+.006),a.gain.exponentialRampToValueAtTime(1e-4,e+.34),i.connect(a),a.connect(this.music),i.start(e),i.stop(e+.4)}_pluck(e,t,n){let r=this.ctx,i=r.createOscillator();i.type=`triangle`,i.frequency.value=t;let a=r.createBiquadFilter();a.type=`bandpass`,a.frequency.value=t*2.2,a.Q.value=5;let o=r.createGain();o.gain.setValueAtTime(0,e),o.gain.linearRampToValueAtTime(n,e+.004),o.gain.exponentialRampToValueAtTime(1e-4,e+.5),i.connect(a),a.connect(o),o.connect(this.music),i.start(e),i.stop(e+.55)}deflect(e=.5,t=1,n=.5){if(!this.ready||this.muted)return;let r=this.ctx,i=r.currentTime,a=G(180,340,e),o=r.createOscillator();o.type=`sine`,o.frequency.setValueAtTime(a*3.1,i),o.frequency.exponentialRampToValueAtTime(a*.75,i+.09);let s=r.createGain();s.gain.setValueAtTime(0,i),s.gain.linearRampToValueAtTime(.34*t,i+.003),s.gain.exponentialRampToValueAtTime(1e-4,i+.19),o.connect(s),s.connect(this.sfx),o.start(i),o.stop(i+.22);let c=r.createOscillator();c.type=`triangle`,c.frequency.setValueAtTime(a*G(4.2,7.4,n),i);let l=r.createGain();l.gain.setValueAtTime(0,i),l.gain.linearRampToValueAtTime(.11*t,i+.002),l.gain.exponentialRampToValueAtTime(1e-4,i+.28),c.connect(l),l.connect(this.sfx),c.start(i),c.stop(i+.3);let u=this._noise(.09,i),d=r.createBiquadFilter();d.type=`bandpass`,d.frequency.setValueAtTime(G(1400,3600,e),i),d.Q.value=1.4;let f=r.createGain();f.gain.setValueAtTime(.2*t,i),f.gain.exponentialRampToValueAtTime(1e-4,i+.085),u.connect(d),d.connect(f),f.connect(this.sfx)}wall(e=.5){if(!this.ready||this.muted)return;let t=this.ctx,n=t.currentTime,r=t.createOscillator();r.type=`sine`,r.frequency.setValueAtTime(G(120,210,e),n),r.frequency.exponentialRampToValueAtTime(G(62,96,e),n+.07);let i=t.createGain();i.gain.setValueAtTime(0,n),i.gain.linearRampToValueAtTime(.19,n+.003),i.gain.exponentialRampToValueAtTime(1e-4,n+.16),r.connect(i),i.connect(this.sfx),r.start(n),r.stop(n+.18);let a=this._noise(.06,n),o=t.createBiquadFilter();o.type=`lowpass`,o.frequency.value=900;let s=t.createGain();s.gain.setValueAtTime(.1,n),s.gain.exponentialRampToValueAtTime(1e-4,n+.06),a.connect(o),o.connect(s),s.connect(this.sfx)}clash(){if(!this.ready||this.muted)return;let e=this.ctx,t=e.currentTime;for(let[n,r]of[[1,.15],[2.76,.09],[5.4,.05]]){let i=e.createOscillator();i.type=`sine`,i.frequency.value=620*n*q(.94,1.06);let a=e.createGain();a.gain.setValueAtTime(0,t),a.gain.linearRampToValueAtTime(r,t+.002),a.gain.exponentialRampToValueAtTime(1e-4,t+.42),i.connect(a),a.connect(this.sfx),i.start(t),i.stop(t+.45)}}goal(e){if(!this.ready||this.muted)return;let t=this.ctx,n=t.currentTime;this.duck(.7,.3);let r=this._noise(.5,n),i=t.createBiquadFilter();i.type=`lowpass`,i.frequency.setValueAtTime(3200,n),i.frequency.exponentialRampToValueAtTime(180,n+.42);let a=t.createGain();a.gain.setValueAtTime(.42,n),a.gain.exponentialRampToValueAtTime(1e-4,n+.5),r.connect(i),i.connect(a),a.connect(this.sfx);let o=t.createOscillator();o.type=`sine`,o.frequency.setValueAtTime(150,n),o.frequency.exponentialRampToValueAtTime(34,n+.55);let s=t.createGain();s.gain.setValueAtTime(0,n),s.gain.linearRampToValueAtTime(.5,n+.008),s.gain.exponentialRampToValueAtTime(1e-4,n+.7),o.connect(s),s.connect(this.sfx),o.start(n),o.stop(n+.75),(e?[Z(4),Z(0)]:[Z(7),Z(12)]).forEach((e,r)=>{let i=t.createOscillator();i.type=`triangle`,i.frequency.value=e;let a=t.createGain(),o=n+.06+r*.11;a.gain.setValueAtTime(0,o),a.gain.linearRampToValueAtTime(.13,o+.01),a.gain.exponentialRampToValueAtTime(1e-4,o+.4),i.connect(a),a.connect(this.sfx),i.start(o),i.stop(o+.42)})}explode(){if(!this.ready||this.muted)return;let e=this.ctx,t=e.currentTime;this.duck(1.4,.22);let n=this._noise(1.4,t),r=e.createBiquadFilter();r.type=`lowpass`,r.frequency.setValueAtTime(5200,t),r.frequency.exponentialRampToValueAtTime(90,t+1.2);let i=e.createGain();i.gain.setValueAtTime(.62,t),i.gain.exponentialRampToValueAtTime(1e-4,t+1.35),n.connect(r),r.connect(i),i.connect(this.sfx);let a=e.createOscillator();a.type=`sine`,a.frequency.setValueAtTime(120,t),a.frequency.exponentialRampToValueAtTime(24,t+1);let o=e.createGain();o.gain.setValueAtTime(.6,t+.01),o.gain.exponentialRampToValueAtTime(1e-4,t+1.2),a.connect(o),o.connect(this.sfx),a.start(t),a.stop(t+1.25)}surge(){if(!this.ready||this.muted)return;let e=this.ctx,t=e.currentTime,n=e.createOscillator();n.type=`sawtooth`,n.frequency.setValueAtTime(180,t),n.frequency.exponentialRampToValueAtTime(1150,t+.26);let r=e.createBiquadFilter();r.type=`bandpass`,r.Q.value=7,r.frequency.setValueAtTime(400,t),r.frequency.exponentialRampToValueAtTime(2600,t+.26);let i=e.createGain();i.gain.setValueAtTime(0,t),i.gain.linearRampToValueAtTime(.2,t+.03),i.gain.exponentialRampToValueAtTime(1e-4,t+.32),n.connect(r),r.connect(i),i.connect(this.sfx),n.start(t),n.stop(t+.34)}serve(){if(!this.ready||this.muted)return;let e=this.ctx,t=e.currentTime,n=this._noise(1.1,t),r=e.createBiquadFilter();r.type=`bandpass`,r.Q.value=5,r.frequency.setValueAtTime(240,t),r.frequency.exponentialRampToValueAtTime(2400,t+1);let i=e.createGain();i.gain.setValueAtTime(.001,t),i.gain.exponentialRampToValueAtTime(.17,t+.95),i.gain.exponentialRampToValueAtTime(1e-4,t+1.12),n.connect(r),r.connect(i),i.connect(this.sfx);let a=e.createOscillator();a.type=`square`,a.frequency.setValueAtTime(880,t+1),a.frequency.exponentialRampToValueAtTime(220,t+1.16);let o=e.createGain();o.gain.setValueAtTime(0,t+1),o.gain.linearRampToValueAtTime(.16,t+1.01),o.gain.exponentialRampToValueAtTime(1e-4,t+1.2),a.connect(o),o.connect(this.sfx),a.start(t+1),a.stop(t+1.22)}ui(e=`tick`){if(!this.ready||this.muted)return;let t=this.ctx,n=t.currentTime,r=e===`confirm`?880:e===`back`?330:660,i=t.createOscillator();i.type=`square`,i.frequency.setValueAtTime(r,n),e===`confirm`&&i.frequency.exponentialRampToValueAtTime(r*1.5,n+.08);let a=t.createGain();a.gain.setValueAtTime(0,n),a.gain.linearRampToValueAtTime(.07,n+.004),a.gain.exponentialRampToValueAtTime(1e-4,n+.12);let o=t.createBiquadFilter();o.type=`lowpass`,o.frequency.value=3200,i.connect(o),o.connect(a),a.connect(this.sfx),i.start(n),i.stop(n+.14)}stinger(e){if(!this.ready||this.muted)return;let t=this.ctx,n=t.currentTime;(e?[0,7,12,19]:[0,-2,-5,-12]).forEach((r,i)=>{let a=n+i*.13;for(let[n,i]of[[1,.15],[2,.07]]){let o=t.createOscillator();o.type=e?`triangle`:`sawtooth`,o.frequency.value=Z(r)*n;let s=t.createGain();s.gain.setValueAtTime(0,a),s.gain.linearRampToValueAtTime(i,a+.012),s.gain.exponentialRampToValueAtTime(1e-4,a+1.1);let c=t.createBiquadFilter();c.type=`lowpass`,c.frequency.value=e?4200:1400,o.connect(c),c.connect(s),s.connect(this.sfx),o.start(a),o.stop(a+1.15)}})}},qt=2*Math.PI*42,Q=e=>document.getElementById(e),Jt=class{constructor(){this.dom={hud:Q(`hud`),rivals:Q(`rivals`),orbCount:Q(`orbCount`),selfArc:Q(`selfArc`),selfScore:Q(`selfScore`),selfPips:Q(`selfPips`),announce:Q(`announce`),announceText:Q(`announce`).querySelector(`span`),combo:Q(`combo`),comboNum:Q(`combo`).querySelector(`b`),boot:Q(`boot`),loadFill:Q(`loadFill`),loadText:Q(`loadText`),menu:Q(`menu`),pause:Q(`pause`),result:Q(`result`),resultBadge:Q(`resultBadge`),resultTitle:Q(`resultTitle`),standings:Q(`standings`),matchStats:Q(`matchStats`),ctrlHint:Q(`ctrlHint`),nowebgl:Q(`nowebgl`)},this.pods=[],this.pips=[],this._scores=[-1,-1,-1,-1],this._orbs=-1,this._combo=-1,this._announceTimer=null,this._buildPods(),this._setControlHint()}_buildPods(){let e=[1,2,3];this.dom.rivals.innerHTML=``;for(let t of e){let e=B[t],n=document.createElement(`div`);n.className=`pod`,n.style.setProperty(`--c`,e.css),n.innerHTML=`<div class="pod-name">${e.name}</div><div class="pips"></div>`;let r=n.querySelector(`.pips`),i=[];for(let e=0;e<V.startPoints;e++){let e=document.createElement(`i`);e.className=`pip`,r.appendChild(e),i.push(e)}this.dom.rivals.appendChild(n),this.pods[t]=n,this.pips[t]=i}this.dom.selfPips.innerHTML=``;let t=[];for(let e=0;e<V.startPoints;e++){let e=document.createElement(`i`);e.className=`pip`,this.dom.selfPips.appendChild(e),t.push(e)}this.pips[0]=t,this.pods[0]=Q(`selfPod`)}_setControlHint(){let e=matchMedia(`(hover: none) and (pointer: coarse)`).matches;this.dom.ctrlHint.innerHTML=e?`Slide to steer &nbsp;·&nbsp; Tap to surge`:`Move mouse or A / D to steer &nbsp;·&nbsp; Space to surge`}showGame(e){this.dom.hud.style.opacity=e?`1`:`0`,this.dom.hud.style.transition=`opacity .4s cubic-bezier(.16,1,.3,1)`,this.dom.hud.classList.toggle(`inert`,!e)}hideScreen(e){return new Promise(t=>{if(e.classList.contains(`hidden`))return t();e.classList.add(`leaving`),setTimeout(()=>{e.classList.add(`hidden`),e.classList.remove(`leaving`),t()},320)})}showScreen(e){e.classList.remove(`hidden`,`leaving`),e.style.animation=`none`,e.offsetWidth,e.style.animation=``}setLoadProgress(e,t){this.dom.loadFill.style.width=`${Math.round(e*100)}%`,t&&(this.dom.loadText.textContent=t)}setScore(e,t,n=V.startPoints){if(this._scores[e]===t)return;let r=t<this._scores[e]&&this._scores[e]>=0;this._scores[e]=t;let i=this.pips[e];for(let e=0;e<i.length;e++)i[e].classList.toggle(`spent`,e>=t);e===0&&(this.dom.selfScore.textContent=String(t),this.dom.selfArc.style.strokeDashoffset=String(qt*(1-t/n)),this.dom.selfArc.style.stroke=t<=1?`var(--danger)`:`var(--p0)`,r&&this._replay(this.dom.selfScore,`hit`)),r&&this._replay(this.pods[e],`hit`)}markEliminated(e){this.pods[e]?.classList.add(`dead`)}setOrbCount(e){if(this._orbs===e)return;let t=e>this._orbs&&this._orbs>=0;this._orbs=e,this.dom.orbCount.textContent=String(e),t&&this._replay(this.dom.orbCount,`bump`)}setCombo(e){if(this._combo!==e){if(this._combo=e,e<3){this.dom.combo.classList.remove(`show`);return}this.dom.comboNum.textContent=String(e),this.dom.combo.classList.add(`show`),this._replay(this.dom.combo,`tick`)}}announce(e,t=1500){this.dom.announceText.textContent=e,this.dom.announce.classList.remove(`show`),this.dom.announce.offsetWidth,this.dom.announce.classList.add(`show`),clearTimeout(this._announceTimer),this._announceTimer=setTimeout(()=>this.dom.announce.classList.remove(`show`),t)}_replay(e,t){e&&(e.classList.remove(t),e.offsetWidth,e.classList.add(t))}resetMatch(){this._scores=[-1,-1,-1,-1],this._orbs=-1,this._combo=-1;for(let e=0;e<4;e++)this.pods[e]?.classList.remove(`dead`,`hit`),this.setScore(e,V.startPoints);this.dom.combo.classList.remove(`show`),this.dom.announce.classList.remove(`show`)}showResult(e){let t=e.order[0]===0;this.dom.resultBadge.textContent=t?`VICTORY`:`ELIMINATED`,this.dom.resultBadge.classList.toggle(`defeat`,!t),this.dom.resultTitle.textContent=t?`LAST ONE STANDING`:`${B[e.order[0]].name} TAKES THE DECK`,this.dom.standings.innerHTML=``,e.order.forEach((t,n)=>{let r=B[t],i=document.createElement(`div`);i.className=`stand-row`+(n===0?` first`:``),i.style.setProperty(`--c`,r.css),i.style.animationDelay=`${n*.08}s`;let a=e.finalScores[t];i.innerHTML=`
        <div class="stand-rank">${n+1}</div>
        <div class="stand-dot"></div>
        <div class="stand-name">${r.name}</div>
        <div class="stand-val">${a>0?`${a} LEFT`:`OUT`}</div>`,this.dom.standings.appendChild(i)});let n=e.stats;this.dom.matchStats.innerHTML=`
      <div class="stat"><b>${n.deflections}</b><i>DEFLECTIONS</i></div>
      <div class="stat"><b>${n.bestChain}</b><i>BEST CHAIN</i></div>
      <div class="stat"><b>${n.knockouts}</b><i>KNOCKOUTS</i></div>
      <div class="stat"><b>${this._fmtTime(n.duration)}</b><i>DURATION</i></div>`,this.showScreen(this.dom.result)}_fmtTime(e){let t=Math.floor(e/60),n=Math.floor(e%60);return`${t}:${String(n).padStart(2,`0`)}`}},$=e=>document.getElementById(e),Yt=new class{constructor(){this.hud=new Jt,this.audio=new Kt,this.difficulty=1,this.timer=new o,this.governor=new _e(.62),this.renderScale=1,this.running=!1,this.inMatch=!1}async start(){let e=$(`gl`),t;try{t=new te({canvas:e,antialias:!1,alpha:!1,depth:!0,stencil:!1,powerPreference:`high-performance`,preserveDrawingBuffer:!1,failIfMajorPerformanceCaveat:!1})}catch(e){console.error(e),this.hud.showScreen($(`nowebgl`)),$(`boot`).classList.add(`hidden`);return}if(!t.capabilities.isWebGL2){this.hud.showScreen($(`nowebgl`)),$(`boot`).classList.add(`hidden`);return}this.renderer=t,t.toneMapping=0,t.outputColorSpace=v,t.shadowMap.enabled=!0,t.shadowMap.type=1,t.shadowMap.autoUpdate=!1,t.info.autoReset=!1,this.stats={sceneCalls:0,sceneTris:0,totalCalls:0,fps:0};let n=he(t.getContext()),r=new URLSearchParams(location.search),i=r.has(`tier`)?W(Number(r.get(`tier`))|0,0,2):n.tier;this.tier=i,this.preset={...ge[i]},this.isTouch=n.touch,this._dprOverride=r.has(`dpr`)?Number(r.get(`dpr`)):null,this._noMusic=r.has(`nomusic`),this._zoom=r.has(`zoom`)?Number(r.get(`zoom`)):null,this._auto=r.has(`auto`),!t.extensions.get(`EXT_color_buffer_half_float`)&&!t.extensions.get(`EXT_color_buffer_float`)&&(console.warn(`[gfx] no float render targets; disabling MSAA and hoping for the best`),this.preset.msaa=0),this.baseDpr=this._dprOverride??Math.min(window.devicePixelRatio||1,this.preset.maxDpr),this.scene=new g,this.gcam=new Je(this._aspect()),this.postfx=new Be(t,this.preset),this.input=new Bt(e),this._resize(),window.addEventListener(`resize`,()=>this._resize()),window.addEventListener(`orientationchange`,()=>setTimeout(()=>this._resize(),220)),visualViewport?.addEventListener(`resize`,()=>this._resize()),this.hud.setLoadProgress(.04,`LINKING SHADERS`),await this._nextFrame(),this.assets=new ye,await this.assets.loadAll((e,t,n)=>{this.hud.setLoadProgress(.05+e/t*.62,`LOADING ${n.toUpperCase()}`)}),this.assets.colormap&&Se(this.assets.colormap),this.hud.setLoadProgress(.7,`IGNITING NEBULA`),await this._nextFrame(),this.env=Ne(t,this.scene,this.preset),this.hud.setLoadProgress(.8,`ASSEMBLING DECK`),await this._nextFrame(),this.game=new Ut(this.scene,this.gcam,this.assets,this.audio,this.hud,this.preset,this.input),this.game.onMatchEnd=e=>this._onMatchEnd(e),this.hud.setLoadProgress(.9,`COMPILING PIPELINE`),await this._nextFrame(),await t.compileAsync(this.scene,this.gcam.cam),this._bakeShadows(),this.hud.setLoadProgress(1,`READY`),await this._nextFrame(),this._wireUI(),this.game.startAttract(),this.running=!0,t.setAnimationLoop(()=>this._frame()),await this._sleep(320),await this.hud.hideScreen($(`boot`)),this.hud.showScreen($(`menu`)),this.hud.showGame(!1)}_bakeShadows(){this.renderer.shadowMap.needsUpdate=!0,this.renderer.setRenderTarget(this.postfx.hdr),this.renderer.render(this.scene,this.gcam.cam),this.renderer.setRenderTarget(null)}_wireUI(){let e=async e=>{await this.audio.unlock(),e()};for(let t of document.querySelectorAll(`.diff`))t.addEventListener(`click`,()=>e(()=>{document.querySelectorAll(`.diff`).forEach(e=>e.classList.remove(`active`)),t.classList.add(`active`),this.difficulty=Number(t.dataset.diff),this.audio.ui(`tick`)}));$(`playBtn`).addEventListener(`click`,()=>e(()=>this._startMatch())),$(`againBtn`).addEventListener(`click`,()=>e(()=>this._startMatch())),$(`menuBtn`).addEventListener(`click`,()=>e(()=>this._toMenu())),$(`pauseBtn`).addEventListener(`click`,()=>e(()=>this._setPaused(!0))),$(`resumeBtn`).addEventListener(`click`,()=>e(()=>this._setPaused(!1))),$(`quitBtn`).addEventListener(`click`,()=>e(()=>{this._setPaused(!1),this._toMenu()})),document.addEventListener(`visibilitychange`,()=>{document.hidden?(this.inMatch&&!this.paused&&this._setPaused(!0),this.audio.ctx?.suspend?.()):this.audio.ctx?.state===`suspended`&&this.audio.ready&&this.audio.ctx.resume()}),window.addEventListener(`blur`,()=>{this.inMatch&&!this.paused&&this._setPaused(!0)});let t=this.renderer.domElement;t.addEventListener(`webglcontextlost`,e=>{e.preventDefault(),this.running=!1,this.renderer.setAnimationLoop(null),console.warn(`[gfx] context lost`)}),t.addEventListener(`webglcontextrestored`,()=>{console.warn(`[gfx] context restored`),this._resize(),this.renderer.shadowMap.needsUpdate=!0,this.running=!0,this.timer.update(),this.renderer.setAnimationLoop(()=>this._frame())})}async _startMatch(){this.audio.ui(`confirm`),this._music(.5),await Promise.all([this.hud.hideScreen($(`menu`)),this.hud.hideScreen($(`result`))]),this.hud.showGame(!0),this.inMatch=!0,this.game.autoPlayer=this._auto,this.game.startMatch(this.difficulty)}async _toMenu(){this.audio.ui(`back`),this.inMatch=!1,await Promise.all([this.hud.hideScreen($(`result`)),this.hud.hideScreen($(`pause`))]),this.hud.showGame(!1),this.game.startAttract(),this.hud.showScreen($(`menu`)),this._music(.28)}_setPaused(e){this.paused=e,this.game.setPaused(e),e?(this.audio.ui(`back`),this.hud.showScreen($(`pause`)),this._music(.18)):(this.audio.ui(`tick`),this.hud.hideScreen($(`pause`)),this._music(.5))}_onMatchEnd(e){this.inMatch=!1,this.hud.showGame(!1),this._music(.25),this.hud.showResult(e)}_aspect(){return Math.max(1,window.innerWidth)/Math.max(1,window.innerHeight)}_resize(){let e=Math.max(1,Math.floor(window.innerWidth)),t=Math.max(1,Math.floor(window.innerHeight)),n=this.baseDpr*this.renderScale;this.renderer.setPixelRatio(n),this.renderer.setSize(e,t,!1);let r=this.renderer.domElement;r.style.width=`${e}px`,r.style.height=`${t}px`;let i=new u;this.renderer.getDrawingBufferSize(i),this.postfx.setSize(i.x,i.y),this.gcam.resize(e/t),this.env?.setPixelRatio(n),this.game?.effects.setPixelRatio(Math.min(n,2)),this.game?.refreshMapper(e),this.cssWidth=e,this.game&&(this.renderer.shadowMap.needsUpdate=!0)}_applyRenderScale(){this._resize()}_frame(){if(!this.running)return;this.timer.update();let e=this.timer.getDelta(),t=Math.min(e,1/20);this.governor.update(e*1e3)&&(this.renderScale=this.governor.scale,this._applyRenderScale());let n=this.timer.getElapsed();this._zoom&&(this.gcam.targetZoom=this._zoom),this.audio.update(t),this.game.refreshMapper(this.cssWidth),this.game.update(t),this.gcam.update(t,n),this.env.update(n),this.env.group.position.copy(this.gcam.cam.position);let r=this.postfx.u,i=this.game.effects;r.uFlash.value=i.flash,r.uFlashTint.value.copy(i.flashColor),r.uRadial.value=i.radial,r.uDesat.value=(1-this.game.timeScale)*.3,r.uExposure.value=.92+i.flash*.22;let a=this.inMatch&&this.game.alive[0]&&this.game.scores[0]<=1?.5+.5*Math.sin(n*5.2):0;r.uVignette.value+=(.44+a*.3-r.uVignette.value)*Math.min(1,t*4),r.uBloomStrength.value=.42+i.flash*.45,this.renderer.info.reset(),this.postfx.renderScene(this.scene,this.gcam.cam);let o=this.renderer.info.render;this.stats.sceneCalls=o.calls,this.stats.sceneTris=o.triangles,this.postfx.present(n),this.stats.totalCalls=this.renderer.info.render.calls,this.stats.fps=1e3/Math.max(.01,this.governor.avg),this.input.consumePause()&&this.inMatch&&this._setPaused(!this.paused)}_music(e){this.audio.setMusicLevel(this._noMusic?0:e)}_nextFrame(){return new Promise(e=>requestAnimationFrame(()=>e()))}_sleep(e){return new Promise(t=>setTimeout(t,e))}};Yt.start().catch(e=>{console.error(`[boot] fatal`,e);let t=document.getElementById(`loadText`);t&&(t.textContent=`STARTUP FAILED — SEE CONSOLE`)}),window.__ballistix=Yt;