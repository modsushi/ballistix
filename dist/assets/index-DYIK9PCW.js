import{$ as e,A as t,B as n,C as r,D as i,E as a,F as o,G as s,H as c,I as l,J as u,K as d,L as f,M as p,N as m,O as h,P as g,Q as _,R as v,S as y,T as b,U as x,V as ee,W as S,X as te,Y as ne,Z as re,_ as C,a as w,b as T,c as E,d as D,et as O,f as k,g as ie,h as A,i as ae,j as oe,k as se,l as ce,m as le,n as ue,nt as de,o as fe,p as pe,q as me,r as he,s as ge,t as _e,tt as ve,u as ye,v as be,w as xe,x as j,y as Se,z as Ce}from"./three-CblLknTi.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var we={LOW:0,MED:1,HIGH:2};function Te(e){try{let t=e.getExtension(`WEBGL_debug_renderer_info`);return t?(e.getParameter(t.UNMASKED_RENDERER_WEBGL)||``).toLowerCase():``}catch{return``}}function Ee(e){let t=matchMedia(`(hover: none) and (pointer: coarse)`).matches,n=navigator.hardwareConcurrency||4,r=navigator.deviceMemory||(t?4:8),i=Te(e),a=0;return a+=t?0:3,a+=n>=8?2:+(n>=6),a+=r>=8?2:+(r>=4),/apple\s*(a1[4-9]|a[2-9]\d|m[1-9])/.test(i)?a+=3:/apple/.test(i)&&(a+=2),/adreno\s*(7\d\d|6[5-9]\d)/.test(i)&&(a+=2),/mali-g(7[1-9]|[89]\d)/.test(i)&&(a+=1),/(rtx|radeon rx|geforce)/.test(i)&&(a+=3),/(swiftshader|llvmpipe|software)/.test(i)&&(a-=6),{tier:a>=7?we.HIGH:a>=4?we.MED:we.LOW,touch:t,cores:n,mem:r,renderer:i}}var De=[{maxDpr:1.5,msaa:0,bloomLevels:4,shadows:!0,shadowSize:768,sparks:260,orbLights:1,envSize:128,grain:!0,aberration:.55,floorDetail:.55,starCount:900,trailSegments:14},{maxDpr:2,msaa:4,bloomLevels:5,shadows:!0,shadowSize:1024,sparks:520,orbLights:2,envSize:256,grain:!0,aberration:.8,floorDetail:.8,starCount:1600,trailSegments:20},{maxDpr:2,msaa:4,bloomLevels:6,shadows:!0,shadowSize:2048,sparks:900,orbLights:4,envSize:256,grain:!0,aberration:1,floorDetail:1,starCount:2600,trailSegments:26}],Oe=class{constructor(e=.62){this.scale=1,this.min=e,this.avg=16.7,this.acc=0,this.dirty=!1}update(e){return e>120?!1:(this.avg+=(e-this.avg)*.045,this.avg>20.5?this.acc+=1:this.avg<13.2?--this.acc:this.acc*=.9,this.acc>70&&this.scale>this.min?(this.scale=Math.max(this.min,this.scale-.09),this.acc=0,!0):this.acc<-140&&this.scale<1&&(this.scale=Math.min(1,this.scale+.06),this.acc=0,!0))}},M=`models/space/`,ke=`models/station/`,Ae=[[`craft_speederA`,M],[`craft_speederB`,M],[`craft_speederC`,M],[`craft_speederD`,M],[`structure`,M],[`structure_detailed`,M],[`structure_diagonal`,M],[`supports_high`,M],[`supports_low`,M],[`platform_large`,M],[`platform_long`,M],[`platform_high`,M],[`rail_middle`,M],[`rail_end`,M],[`pipe_straight`,M],[`pipe_ring`,M],[`pipe_ringHigh`,M],[`pipe_supportHigh`,M],[`pipe_corner`,M],[`machine_generator`,M],[`machine_generatorLarge`,M],[`machine_wireless`,M],[`satelliteDish`,M],[`satelliteDish_large`,M],[`turret_single`,M],[`turret_double`,M],[`hangar_roundA`,M],[`hangar_smallB`,M],[`barrels`,M],[`barrels_rail`,M],[`rocket_baseA`,M],[`rocket_fuelA`,M],[`monorail_trackStraight`,M],[`monorail_trackSupport`,M],[`rock_crystals`,M],[`rock_crystalsLargeA`,M],[`meteor`,M],[`meteor_detailed`,M],[`rock_largeA`,M],[`container`,ke],[`container-tall`,ke],[`structure-barrier-high`,ke],[`structure-panel`,ke],[`display-wall`,ke],[`computer-wide`,ke]],je=class{constructor(){this.models=new Map,this.loader=new _e}async loadAll(e){let t=Ae.length,n=0,r=Ae.slice();await Promise.all(Array.from({length:6},async()=>{for(;;){let i=r.shift();if(!i)return;let[a,o]=i;try{let e=await this.loader.loadAsync(`${o}${a}.glb`);this.models.set(a,this._prepare(e.scene,a))}catch(e){console.warn(`[assets] failed: ${a}`,e),this.models.set(a,new j)}n++,e?.(n,t,a)}}));try{let e=await new re().loadAsync(`${ke}Textures/colormap.png`);e.colorSpace=S,e.flipY=!1,e.anisotropy=4,this.colormap=e}catch(e){console.warn(`[assets] colormap missing`,e)}return this.models}_prepare(e,t){e.updateMatrixWorld(!0);let n=new j;e.traverse(e=>{if(!e.isMesh||!e.geometry)return;let t=e.geometry.clone();t.applyMatrix4(e.matrixWorld),t.attributes.normal||t.computeVertexNormals();let r=new p(t,e.material);r.name=e.name,r.userData.srcMat=e.material?.name||`default`,r.castShadow=!0,r.receiveShadow=!0,n.add(r)});let r=new fe().setFromObject(n);r.isEmpty()&&r.set(new O,new O);let i=(r.min.x+r.max.x)*.5,a=(r.min.z+r.max.z)*.5,o=r.min.y;for(let e of n.children)e.geometry.translate(-i,-o,-a),e.geometry.computeBoundingSphere(),e.geometry.computeBoundingBox();return n.userData.modelName=t,n.userData._bounds=new fe().setFromObject(n),n}clone(e){let t=this.models.get(e);if(!t)return console.warn(`[assets] missing model: ${e}`),new j;let n=t.clone(!0);return n.traverse(e=>{e.isMesh&&(e.userData.srcMat=e.userData.srcMat)}),n}bounds(e){let t=this.models.get(e);return t?(t.userData._bounds||(t.userData._bounds=new fe().setFromObject(t)),t.userData._bounds):new fe(new O,new O(1,1,1))}},Me=new Map;function N(e,t){if(Me.has(e))return Me.get(e);let n=new g(t);return Me.set(e,n),n}var Ne=null;function Pe(e){Ne=e;let t=Me.get(`f.colormap`);t&&(t.map=e,t.needsUpdate=!0)}function Fe(){return{colormap:N(`f.colormap`,{map:Ne,color:6451327,metalness:.55,roughness:.66,envMapIntensity:.45}),metal:N(`f.metal`,{color:5464954,metalness:.9,roughness:.5,envMapIntensity:.5}),metalDark:N(`f.metalDark`,{color:3358543,metalness:.86,roughness:.6,envMapIntensity:.45}),dark:N(`f.dark`,{color:856603,metalness:.42,roughness:.6,envMapIntensity:.45}),metalRed:N(`f.accent`,{color:928312,metalness:.55,roughness:.38,emissive:2009544,emissiveIntensity:.28,envMapIntensity:.9}),_defaultMat:N(`f.default`,{color:4871781,metalness:.72,roughness:.55,envMapIntensity:.5}),rock:N(`f.rock`,{color:1909034,metalness:.06,roughness:.92,envMapIntensity:.4}),rockTrack:N(`f.rockTrack`,{color:1579811,metalness:.05,roughness:.95,envMapIntensity:.38}),crystal:N(`f.crystal`,{color:866890,metalness:.1,roughness:.12,emissive:3596543,emissiveIntensity:1.5,envMapIntensity:1.2,transparent:!0,opacity:.9})}}function Ie(e,t){let n=new k(e),r=new k(t),i={h:0,s:0,l:0};n.getHSL(i);let a=new k().setHSL(i.h,.58,.64),o=new k().setHSL(i.h,.62,.3),s=new k().setHSL(i.h,.55,.14);return{metal:new g({color:a,metalness:.62,roughness:.33,envMapIntensity:1.8}),metalDark:new g({color:o,metalness:.58,roughness:.46,envMapIntensity:1.5}),dark:new g({color:s,metalness:.5,roughness:.45,envMapIntensity:1}),metalRed:new g({color:r.clone().multiplyScalar(.35),metalness:.4,roughness:.3,emissive:n,emissiveIntensity:3.4,envMapIntensity:1}),_defaultMat:new g({color:a,metalness:.85,roughness:.38,envMapIntensity:1.2})}}function Le(e,t,n=`metal`){return e.traverse(e=>{e.isMesh&&(e.material=t[e.userData.srcMat]||t[n]||t._defaultMat)}),e}var Re=`
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
  float up = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
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
}`,ze=`
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,Be=`
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
}`,Ve=`
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
}`,He=`
varying vec3 vN;
varying vec3 vPos;
void main() {
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vPos = mv.xyz;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * mv;
}`,Ue=`
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
  float fres = pow(clamp(1.0 - dot(n, V), 0.0, 1.0), 3.2);
  float lit  = smoothstep(-0.55, 0.6, ndl);
  col += vec3(0.72, 0.42, 0.92) * fres * (0.18 + lit * 1.35);

  gl_FragColor = vec4(col, 1.0);
}`,We=new O(.42,.76,.5).normalize();function Ge(e,t,n){let r=new j;r.name=`environment`;let a=new d({vertexShader:ze,fragmentShader:Re,side:1,depthWrite:!1,uniforms:{uHorizon:{value:new k(1186360).convertSRGBToLinear()},uZenith:{value:new k(329749).convertSRGBToLinear()},uNebulaA:{value:new k(3810448).convertSRGBToLinear().multiplyScalar(2.1)},uNebulaB:{value:new k(1410488).convertSRGBToLinear().multiplyScalar(1.7)},uSunDir:{value:We.clone()},uSunColor:{value:new k(12575999).convertSRGBToLinear()}}}),o=new s,c=new p(new ge(2,2,2),a);o.add(c);let l=new ae(n.envSize,{type:y,format:ee,generateMipmaps:!0,minFilter:h,magFilter:i}),u=new le(.1,10,l),f=e.getRenderTarget();u.update(e,o),e.setRenderTarget(f);let m=new he(e);m.compileCubemapShader();let g=m.fromCubemap(l.texture);t.environment=g.texture,t.background=l.texture,t.backgroundIntensity=1.25,t.environmentIntensity=2.1,m.dispose(),c.geometry.dispose(),a.dispose();let _=n.starCount,v=new Float32Array(_*3),b=new Float32Array(_),S=new Float32Array(_),re=new Float32Array(_*3),C=new k;for(let e=0;e<_;e++){let t=Math.random()*2-1,n=Math.random()*Math.PI*2,r=Math.sqrt(1-t*t);v[e*3]=Math.cos(n)*r*620,v[e*3+1]=Math.max(-.18,t)*620*.9+40,v[e*3+2]=Math.sin(n)*r*620,b[e]=1.4+Math.random()**3.2*8.2,S[e]=Math.random()*100;let i=Math.random();i>.9?C.setHSL(.08,.55,.72):i>.76?C.setHSL(.11,.3,.84):i>.34?C.setHSL(.58,.18,.92):C.setHSL(.6,.42,.86),re[e*3]=C.r,re[e*3+1]=C.g,re[e*3+2]=C.b}let w=new ce;w.setAttribute(`position`,new E(v,3)),w.setAttribute(`aSize`,new E(b,1)),w.setAttribute(`aPhase`,new E(S,1)),w.setAttribute(`aTint`,new E(re,3)),w.boundingSphere=new ne(new O,868);let T=new d({vertexShader:Be,fragmentShader:Ve,uniforms:{uTime:{value:0},uPixelRatio:{value:Math.min(e.getPixelRatio(),2)}},transparent:!0,blending:2,depthWrite:!1,depthTest:!1}),D=new Ce(w,T);D.renderOrder=-900,D.frustumCulled=!1,r.add(D);let ie=new d({vertexShader:`varying vec3 vWorld;
`+He,fragmentShader:Ue,uniforms:{uSunDir:{value:We.clone()},uTime:{value:0}},depthWrite:!1}),A=new p(new te(1,64,48),ie);A.scale.setScalar(95),A.position.set(-390,105,-640),A.renderOrder=-880,A.frustumCulled=!1,r.add(A);let oe=new x(1.42,2.35,128,1),se=new d({transparent:!0,blending:2,depthWrite:!1,side:2,uniforms:{uSunDir:{value:We.clone()}},vertexShader:`
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
      }`}),ue=new p(oe,se);return ue.scale.setScalar(95),ue.position.copy(A.position),ue.rotation.set(-Math.PI/2+.3,.22,.5),ue.renderOrder=-870,ue.frustumCulled=!1,r.add(ue),t.add(r),{group:r,envTexture:g.texture,update(e){T.uniforms.uTime.value=e,ie.uniforms.uTime.value=e},setPixelRatio(e){T.uniforms.uPixelRatio.value=Math.min(e,2)},dispose(){w.dispose(),T.dispose(),A.geometry.dispose(),ie.dispose(),oe.dispose(),se.dispose(),l.dispose(),g.dispose()}}}var Ke=`
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`,qe=`
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2  uTexel;
uniform float uThreshold;
uniform float uKnee;
out vec4 fragColor;

float karis(vec3 c) { return 1.0 / (1.0 + max(c.r, max(c.g, c.b))); }

// Drop NaN/Inf to black. Comparisons against NaN are always false, so the mix
// selects 0. One poisoned scene pixel would otherwise be spread over the whole
// screen by the downsample chain and read as a full-screen flash.
vec3 scrub(vec3 c) { return mix(vec3(0.0), c, lessThan(abs(c), vec3(1e19))); }

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

  // Scrub before the clamp: min() with a NaN operand is implementation-defined
  // and some drivers hand back the *other* operand, i.e. a solid 48.0 white.
  fragColor = vec4(min(scrub(col), vec3(48.0)), 1.0);
}`,Je=`
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
}`,Ye=`
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
}`,Xe=`
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

// See the prefilter: comparisons against NaN are false, so this maps any
// non-finite channel to 0 rather than letting it survive the tonemap.
vec3 scrub(vec3 c) { return mix(vec3(0.0), c, lessThan(abs(c), vec3(1e19))); }

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

  vec3 col = scrub(scene) + scrub(bloom) * uBloomStrength;
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
}`;function Ze(e,t){return new c({glslVersion:T,vertexShader:`in vec3 position;
in vec2 uv;
`+Ke,fragmentShader:e,uniforms:t,depthTest:!1,depthWrite:!1})}var Qe=class{constructor(t,n){this.renderer=t,this.levels=n.bloomLevels,this.preset=n,this.scene=new s,this.cam=new o(-1,1,1,-1,0,1);let r=new ce;r.setAttribute(`position`,new E(new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),3)),r.setAttribute(`uv`,new E(new Float32Array([0,0,2,0,0,2]),2)),this.quad=new p(r,null),this.quad.frustumCulled=!1,this.scene.add(this.quad);let a={type:y,format:ee,minFilter:i,magFilter:i,wrapS:D,wrapT:D,depthBuffer:!0,generateMipmaps:!1,colorSpace:se};this.hdr=new de(2,2,{...a,samples:n.msaa|0}),this.mips=[],this.mPre=Ze(qe,{uTex:{value:null},uTexel:{value:new e},uThreshold:{value:1.28},uKnee:{value:.55}}),this.mDown=Ze(Je,{uTex:{value:null},uTexel:{value:new e}}),this.mUp=Ze(Ye,{uTex:{value:null},uTexel:{value:new e},uRadius:{value:1},uStretch:{value:1.42}}),this.mUp.blending=2,this.mComp=Ze(Xe,{uScene:{value:null},uBloom:{value:null},uRes:{value:new e},uTime:{value:0},uExposure:{value:1},uBloomStrength:{value:.42},uAberration:{value:n.aberration},uVignette:{value:.44},uGrain:{value:n.grain?.011:0},uRadial:{value:0},uFlash:{value:0},uFlashTint:{value:new k(1,1,1)},uDesat:{value:0}}),this.u=this.mComp.uniforms}setSize(e,t){e=Math.max(2,e|0),t=Math.max(2,t|0),this.w=e,this.h=t,this.hdr.setSize(e,t),this.u.uRes.value.set(e,t);for(let e of this.mips)e.dispose();this.mips=[];let n=e,r=t;for(let e=0;e<this.levels;e++){n=Math.max(1,n>>1),r=Math.max(1,r>>1);let t=new de(n,r,{type:y,format:ee,minFilter:i,magFilter:i,wrapS:D,wrapT:D,depthBuffer:!1,generateMipmaps:!1,colorSpace:se});if(this.mips.push(t),n<=2||r<=2){this.activeLevels=e+1;break}this.activeLevels=e+1}}_pass(e,t){this.quad.material=e,this.renderer.setRenderTarget(t),this.renderer.render(this.scene,this.cam)}renderScene(e,t){this.renderer.setRenderTarget(this.hdr),this.renderer.clear(!0,!0,!0),this.renderer.render(e,t)}present(e){let t=this.activeLevels;this.mPre.uniforms.uTex.value=this.hdr.texture,this.mPre.uniforms.uTexel.value.set(1/this.w,1/this.h),this._pass(this.mPre,this.mips[0]);for(let e=1;e<t;e++){let t=this.mips[e-1];this.mDown.uniforms.uTex.value=t.texture,this.mDown.uniforms.uTexel.value.set(1/t.width,1/t.height),this._pass(this.mDown,this.mips[e])}for(let e=t-1;e>0;e--){let t=this.mips[e];this.mUp.uniforms.uTex.value=t.texture,this.mUp.uniforms.uTexel.value.set(1/t.width,1/t.height),this._pass(this.mUp,this.mips[e-1])}this.u.uScene.value=this.hdr.texture,this.u.uBloom.value=this.mips[0].texture,this.u.uTime.value=e,this.renderer.setRenderTarget(null),this._pass(this.mComp,null)}dispose(){this.hdr.dispose();for(let e of this.mips)e.dispose();this.mPre.dispose(),this.mDown.dispose(),this.mUp.dispose(),this.mComp.dispose(),this.quad.geometry.dispose()}},P={half:19,chamfer:9.6,wallH:2.9,floorY:0,playY:.92},$e=[{key:`S`,nx:0,nz:1,ang:0},{key:`W`,nx:-1,nz:0,ang:Math.PI*.5},{key:`N`,nx:0,nz:-1,ang:Math.PI},{key:`E`,nx:1,nz:0,ang:Math.PI*1.5}],F=[{id:0,name:`YOU`,color:2417407,deep:688022,css:`#24e2ff`,craft:`craft_speederC`,human:!0},{id:1,name:`VEX`,color:16723880,deep:9573214,css:`#ff2fa8`,craft:`craft_speederB`,human:!1},{id:2,name:`KORR`,color:16756768,deep:9395205,css:`#ffb020`,craft:`craft_speederA`,human:!1},{id:3,name:`SABLE`,color:8847165,deep:4427802,css:`#86ff3d`,craft:`craft_speederD`,human:!1}],I={startPoints:5,maxPoints:7,salvageMinPilots:3,orbSchedule:[{t:0,n:1},{t:24,n:2},{t:56,n:3},{t:92,n:4}],orbCapMobile:3,respawnDelay:1.05,serveDelay:1.5},L={halfLen:2.4,halfThick:.46,standoff:2.45,maxSpeed:40,damp:26,track:34,moveSpeed:28,minPress:.045,returnMax:0,returnSpeed:3.5,returnRamp:.45,bankMax:.62,hover:.16},R={cooldown:15,startCharge:.55,duration:2.6,height:2.2,openTime:.18,fadeTime:.3,speedGain:.9,english:.34},z={radius:.52,baseSpeed:13.2,maxSpeed:33,rallyGain:.34,paddleBoost:1.05,spinInfluence:.26,angleInfluence:.78,minAngle:.3,cruise:19,bleed:2.4},B={perQuadrant:3,maxLive:8,perAlive:2,spawnFirst:8,spawnEvery:5,w:2.35,d:1.18,h:1.3,bevel:.11,innerR:4.6,outerR:12.6,minGap:.72,wellClear:2,hpInner:3,hpOuter:2,hpSplit:8.4,slow:.55,perPoint:12,regen:13,reformTime:.85,breakTime:.42},V={enabled:!1,upTime:14,downTime:30,warnTime:1.1,riseTime:.55,wellR:10.4,bumperGap:1.62,bumperR:.95,bumperH:1.55,kick:3.4,kickFloor:17,scatter:.16,slingBack:2.35,slingHalf:2.2,slingH:1.05,slingDepth:1.35,slingSpeed:25.5,slingSpread:.62,cool:.09},H={enabled:!0,first:26,duration:11,cooldown:44,warnTime:1.4,openTime:.9,spawnR:7.4,radius:6.6,pull:20,coreR:.95,discR:2.9,clearance:2.2},et=[{name:`ROOKIE`,react:.34,err:3.6,speed:.51,aggression:.25},{name:`PILOT`,react:.22,err:2.3,speed:.66,aggression:.45},{name:`ACE`,react:.13,err:1.2,speed:.82,aggression:.7}],U=(e,t,n)=>e<t?t:e>n?n:e,W=(e,t,n)=>e+(t-e)*n,tt=e=>e*e*(3-2*e),G=(e,t,n,r)=>W(e,t,1-Math.exp(-n*r)),K=(e,t)=>e+Math.random()*(t-e),nt=(e,t)=>e+Math.random()*(t-e+1)|0,rt=e=>e[Math.random()*e.length|0];function it(e){let t=Math.floor(e),n=e-t,r=n*n*(3-2*n),i=e=>{let t=Math.sin(e*127.1)*43758.5453;return(t-Math.floor(t))*2-1};return W(i(t),i(t+1),r)}var at=(()=>{let{half:e,chamfer:t,wallH:n,playY:r}=P,i=e-t,a=(e,t,n)=>new O(e,t,n),o=i-L.halfLen*.42,s=e-L.standoff;return{width:[a(-e,0,-i),a(e,0,-i),a(-i,0,-e),a(i,0,-e),a(-o-L.halfLen,r,s),a(o+L.halfLen,r,s)],top:[a(-i,2.5,-e),a(i,2.5,-e),a(-e,2.5,-i),a(e,2.5,-i)],bottom:[a(-i,0,e),a(0,0,e),a(i,0,e),a(-o,r+1.5,s),a(o,r+1.5,s)]}})(),ot=class{constructor(e){this.cam=new l(50,e,.5,1400),this.trauma=0,this.traumaTime=0,this.fovPunch=0,this.leanX=0,this.leanZ=0,this.targetLeanX=0,this.targetLeanZ=0,this.zoom=1,this.targetZoom=1,this.intro=0,this.introActive=!1,this.kickX=0,this.kickY=0,this._base=new O,this._look=new O,this.stableCam=new l(50,e,.5,1400),this.resize(e)}resize(e){this.aspect=e,this.cam.aspect=e;let t=U((1.35-e)/(1.35-.52),0,1);this.portraitness=tt(t),this.elevation=W(35,66,this.portraitness)*Math.PI/180,this.baseFov=W(48,62,this.portraitness),this.cam.fov=this.baseFov,this.lookLift=0,this._solveDistance(),this.cam.updateProjectionMatrix()}_solveDistance(){let e=this.baseFov*Math.PI/180,t=2*Math.atan(Math.tan(e/2)*this.aspect),n=W(1,.995,this.portraitness),r=W(.95,.94,this.portraitness),i=W(.88,.9,this.portraitness),a=P.half*1.2/Math.sin(Math.min(e,t)/2),o=0,s=ut;s.fov=this.baseFov,s.aspect=this.aspect,s.updateProjectionMatrix();for(let e=0;e<32;e++){let e=Math.cos(this.elevation),t=Math.sin(this.elevation);s.position.set(0,t*a,e*a),s.lookAt(0,o,o*.15),s.updateMatrixWorld(!0);let c=0,l=0,u=0;for(let e of at.width)lt.copy(e).project(s),c=Math.max(c,Math.abs(lt.x)/n);for(let e of at.top)lt.copy(e).project(s),l=Math.max(l,Math.max(0,lt.y)/r);for(let e of at.bottom)lt.copy(e).project(s),u=Math.max(u,Math.max(0,-lt.y)/i);let d=u-l;o=U(o-d*3.2,-7,2);let f=Math.max(c,l,u);if(Math.abs(f-1)<.003&&Math.abs(d)<.006)break;a*=f}this.distance=a,this.lookLift=o;let c=this.stableCam;c.fov=this.baseFov,c.aspect=this.aspect,c.updateProjectionMatrix(),c.position.set(0,Math.sin(this.elevation)*a,Math.cos(this.elevation)*a),c.lookAt(0,o,o*.15),c.updateMatrixWorld(!0)}shake(e){this.trauma=Math.min(1,this.trauma+e)}kick(e,t,n){this.kickX+=e*n,this.kickY+=t*n}punch(e){this.fovPunch=Math.min(9,this.fovPunch+e)}lookToward(e,t,n=1){this.targetLeanX=U(e*.055,-1.4,1.4)*n,this.targetLeanZ=U(t*.045,-1.2,1.2)*n}startIntro(){this.intro=0,this.introActive=!0}update(e,t){this.trauma=Math.max(0,this.trauma-e*1.55),this.traumaTime+=e*(28+this.trauma*26),this.fovPunch=G(this.fovPunch,0,6.5,e),this.kickX=G(this.kickX,0,8,e),this.kickY=G(this.kickY,0,8,e),this.leanX=G(this.leanX,this.targetLeanX,2.6,e),this.leanZ=G(this.leanZ,this.targetLeanZ,2.6,e),this.zoom=G(this.zoom,this.targetZoom,3.2,e);let n=this.distance*this.zoom,r=this.elevation,i=0;if(this.introActive){this.intro+=e;let t=U(this.intro/3.4,0,1),a=1-(1-t)**3;n*=W(.55,1,a),r=W(11*Math.PI/180,r,a),i=W(-.85,0,a),t>=1&&(this.introActive=!1)}i+=Math.sin(t*.13)*.019,r+=Math.sin(t*.097+1.3)*.012;let a=Math.cos(r),o=Math.sin(r);this._base.set(Math.sin(i)*a*n+this.leanX,o*n,Math.cos(i)*a*n+this.leanZ),this._look.set(this.leanX*1.7,this.lookLift,this.leanZ*1.7+this.lookLift*.15),this.cam.position.copy(this._base),this.cam.lookAt(this._look);let s=this.trauma*this.trauma;if(s>1e-4){let e=this.traumaTime,t=it(e)*s*1.35,n=it(e+47.3)*s*1.15,r=it(e+91.7)*s*.055;this.cam.translateX(t+this.kickX*.5),this.cam.translateY(n+this.kickY*.35),this.cam.rotateZ(r)}else(this.kickX||this.kickY)&&(this.cam.translateX(this.kickX*.5),this.cam.translateY(this.kickY*.35));let c=this.baseFov+this.fovPunch+s*1.6;Math.abs(c-this.cam.fov)>.005&&(this.cam.fov=c,this.cam.updateProjectionMatrix()),this.cam.updateMatrixWorld()}makeMapper(e,t,n,r){let i=P.half-L.standoff;st.set(e.nx*i+e.tx*-t,P.playY,e.nz*i+e.tz*-t),ct.set(e.nx*i+e.tx*t,P.playY,e.nz*i+e.tz*t),st.project(this.stableCam),ct.project(this.stableCam);let a=(st.x*.5+.5)*r,o=(ct.x*.5+.5)*r,s=(a+o)*.5;a=s+(a-s)/n,o=s+(o-s)/n;let c=o-a;return Math.abs(c)<1?{map:()=>0,sign:1}:{map:e=>(e-a)/c*2*t-t,sign:c>0?1:-1}}},st=new O,ct=new O,lt=new O,ut=new l(50,1,.5,1400),dt=8,ft=`
varying vec3 vWPos;
uniform float uTime;
uniform vec4  uWaves[${dt}];      // xz = origin, z = age, w = strength
uniform vec3  uWaveTint[${dt}];
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

// exp(-x²), written as a multiply. pow(x, 2.0) with a negative x is undefined
// in GLSL and several mobile drivers return NaN for it, which then blows out
// the bloom chain — so we never hand a signed value to pow().
float gauss(float x) { return exp(-x * x); }
`,pt=`
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
  for (int i = 0; i < ${dt}; i++) {
    vec4 w = uWaves[i];
    if (w.w <= 0.001) continue;
    float d = length(P - w.xy);
    float rad = w.z * 13.0;
    float ring = gauss((d - rad) * 1.9);
    float fade = w.w * exp(-w.z * 3.4);
    energy += uWaveTint[i] * ring * fade * 1.05;
    // Trailing inner fill gives the ring some body instead of a bare line.
    energy += uWaveTint[i] * smoothstep(rad, rad - 2.0, d) * fade * 0.07;
  }

  // ---- serve charge-up ----------------------------------------------------
  if (uCharge > 0.001) {
    float ring = gauss((dist - (1.0 - uCharge) * 11.0) * 1.4);
    energy += vec3(0.6, 0.95, 1.0) * ring * uCharge * 1.8;
  }

  // ---- centre emblem ------------------------------------------------------
  float core = exp(-dist * dist * 0.075);
  float coreRing = gauss((dist - 3.1) * 3.4);
  energy += vec3(0.10, 0.44, 0.66) * (core * 0.16 + coreRing * 0.26 * (0.65 + 0.35 * sin(uTime * 1.4)));

  // ---- rim ----------------------------------------------------------------
  energy += vec3(0.22, 0.68, 0.95) * smoothstep(0.955, 1.0, rn) * 0.30;

  // Radial vignette so the middle of the deck stays readable under the orbs.
  energy *= mix(1.0, 0.62, smoothstep(0.0, 0.55, rn));

  totalEmissiveRadiance += energy * uDetail;
`;function mt(e,t,n){let r=new me;r.moveTo(e[0].x,e[0].y);for(let t=1;t<e.length;t++)r.lineTo(e[t].x,e[t].y);r.closePath();let i=new u(r,1);i.rotateX(-Math.PI/2),i.computeVertexNormals();let a={uTime:{value:0},uWaves:{value:Array.from({length:dt},()=>new ve(0,0,0,0))},uWaveTint:{value:Array.from({length:dt},()=>new k(0,0,0))},uTerritory:{value:n.map(e=>new k(e.color).convertSRGBToLinear())},uTerrState:{value:new ve(1,1,1,1)},uRadius:{value:P.half},uDetail:{value:t.floorDetail},uCharge:{value:0}},o=new g({color:1778738,metalness:.12,roughness:.72,emissive:0,envMapIntensity:.38});o.onBeforeCompile=e=>{Object.assign(e.uniforms,a),e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
varying vec3 vWPos;`).replace(`#include <begin_vertex>`,`#include <begin_vertex>
vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`),e.fragmentShader=e.fragmentShader.replace(`#include <common>`,`#include <common>
`+ft).replace(`#include <roughnessmap_fragment>`,`#include <roughnessmap_fragment>
        {
          vec3 hgR = hexGrid(vWPos.xz * 0.62);
          float e = smoothstep(0.05, 0.0, hgR.x);
          roughnessFactor = mix(roughnessFactor, 0.26, e * 0.7);
        }`).replace(`#include <emissivemap_fragment>`,`#include <emissivemap_fragment>
`+pt)},o.customProgramCacheKey=()=>`arena-floor`;let s=new p(i,o);s.position.y=P.floorY,s.receiveShadow=!0,s.name=`deck`;let c=0,l=a.uWaves.value,d=a.uWaveTint.value,f=new k;return{mesh:s,uniforms:a,addWave(e,t,n=1,r=6742271){let i=-1,a=1e9;for(let e=0;e<dt;e++){if(l[e].w<=.001){i=e;break}let t=l[e].w*Math.exp(-l[e].z*3.4);t<a&&(a=t,i=e)}i<0&&(i=c=(c+1)%dt),l[i].set(e,t,0,n),f.set(r).convertSRGBToLinear(),d[i].copy(f)},setTerritory(e,t){let n=a.uTerrState.value;e===0?n.x=t:e===1?n.y=t:e===2?n.z=t:n.w=t},setCharge(e){a.uCharge.value=e},update(e,t){a.uTime.value=t;for(let t=0;t<dt;t++){let n=l[t];n.w<=.001||(n.z+=e,n.z>1.5&&(n.w=0))}},dispose(){i.dispose(),o.dispose()}}}function ht(){let{half:t,chamfer:n}=P,r=t-n;return[new e(-r,t),new e(r,t),new e(t,r),new e(t,-r),new e(r,-t),new e(-r,-t),new e(-t,-r),new e(-t,r)]}function gt(){let{half:e,chamfer:t}=P,n=(2*e-t)/Math.SQRT2,r=Math.SQRT1_2,i=[];for(let n=0;n<4;n++){let r=$e[n];i.push({nx:r.nx,nz:r.nz,d:e,goal:n,halfWidth:e-t})}return i.push({nx:r,nz:r,d:n,goal:-1}),i.push({nx:r,nz:-r,d:n,goal:-1}),i.push({nx:-r,nz:-r,d:n,goal:-1}),i.push({nx:-r,nz:r,d:n,goal:-1}),i}var _t=`
varying vec2 vUv;
varying vec3 vWPos;
varying vec3 vViewDir;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWPos = wp.xyz;
  vViewDir = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,vt=`
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
// exp(-x²), written as a multiply. pow(x, 2.0) with a negative x is undefined
// in GLSL and several mobile drivers return NaN for it, which then blows out
// the bloom chain — so we never hand a signed value to pow().
float gauss(float x) { return exp(-x * x); }

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
  float fres = pow(clamp(1.0 - abs(dot(normalize(uNormal), vViewDir)), 0.0, 1.0), 2.1);

  // Vertical containment: bright at the base, dissolving toward the top.
  float vFade = smoothstep(1.02, 0.18, uv.y);
  float base  = smoothstep(0.26, 0.0, uv.y);

  float scan = gauss((fract(uv.y - uTime * 0.22) - 0.5) * 6.48);

  float a = edge * 0.42 + cell + fres * 0.34 + scan * 0.22 + base * 0.5;
  a *= vFade;

  vec3 col = uColor * a;

  // ---- impact bloom --------------------------------------------------------
  if (uHit > 0.001) {
    float d = distance(uv * vec2(4.2, 1.0), uHitPos * vec2(4.2, 1.0));
    float ripple = gauss((d - (1.0 - uHit) * 1.5) * 3.4);
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
}`,yt=class{constructor(t,n,r){this.mat=new d({vertexShader:_t,fragmentShader:vt,transparent:!0,depthWrite:!1,blending:2,side:2,uniforms:{uColor:{value:new k(r).convertSRGBToLinear()},uTime:{value:0},uHealth:{value:1},uHit:{value:0},uHitPos:{value:new e(.5,.35)},uSealed:{value:0},uNormal:{value:new O(0,0,1)}}});let i=new f(t,n,1,1);this.mesh=new p(i,this.mat),this.mesh.renderOrder=6,this._hit=0,this._sealTarget=0}hit(e,t=.34,n=1){this.mat.uniforms.uHitPos.value.set(e,t),this._hit=Math.min(1.6,this._hit+n)}setHealth(e){this.mat.uniforms.uHealth.value=e}seal(){this._sealTarget=1}setNormal(e,t,n){this.mat.uniforms.uNormal.value.set(e,t,n)}update(e,t){let n=this.mat.uniforms;n.uTime.value=t,this._hit*=Math.exp(-e*4.2),this._hit<.002&&(this._hit=0),n.uHit.value=this._hit,n.uSealed.value+=(this._sealTarget-n.uSealed.value)*Math.min(1,e*3.2)}dispose(){this.mesh.geometry.dispose(),this.mat.dispose()}},bt=class{constructor(e){this.set=e,this.groups=new Map,this.count=0}add(e){e.updateWorldMatrix(!0,!0),e.traverse(e=>{if(!e.isMesh||!e.geometry)return;let t=e.userData.srcMat||`metal`,n=e.geometry.clone();if(n.applyMatrix4(e.matrixWorld),!n.attributes.uv){let e=n.attributes.position.count;n.setAttribute(`uv`,new E(new Float32Array(e*2),2))}for(let e of Object.keys(n.attributes))e!==`position`&&e!==`normal`&&e!==`uv`&&n.deleteAttribute(e);n.morphAttributes={},this.groups.has(t)||this.groups.set(t,[]),this.groups.get(t).push(n),this.count++})}build(e,t={}){let n=[];for(let[r,i]of this.groups){if(!i.length)continue;let a=i.length===1?i[0]:ue(i,!1);if(!a){console.warn(`[batch] merge failed for material "${r}"`);continue}if(i.length>1)for(let e of i)e.dispose();a.computeBoundingSphere();let o=this.set[r]||this.set.metal||this.set._defaultMat,s=new p(a,o);s.castShadow=t.castShadow??!0,s.receiveShadow=t.receiveShadow??!0,s.name=`${t.name||`batch`}:${r}`,e.add(s),n.push(s)}return this.groups.clear(),n}},xt=2*(P.half-P.chamfer),St=P.chamfer*Math.SQRT2,q=1.5,Ct=class{constructor(e,t,n){this.scene=e,this.assets=t,this.preset=n,this.root=new j,this.root.name=`arena`,e.add(this.root),this.mats=Fe(),this.planes=gt(),this.outline=ht(),this._buildDeck(),this._buildWalls(),this._buildBarriers(),this._buildSubstructure(),this._buildDressing(),this._buildLights()}_buildDeck(){this.floor=mt(this.outline,this.preset,F),this.root.add(this.floor.mesh);let e=new p(new A(P.half*1.02,P.half*.94,1.1,8,1),new g({color:593173,metalness:.85,roughness:.55}));e.rotation.y=Math.PI/8,e.position.y=-.58,e.receiveShadow=!0,this.root.add(e)}_buildWalls(){let e=new j;this.root.add(e);let t=new g({color:1712687,metalness:.55,roughness:.62,envMapIntensity:.55}),n=new g({color:858658,metalness:.6,roughness:.25,emissive:2076888,emissiveIntensity:.85});this.railMat=n;let r=(r,i,a,o,s)=>{let c=Math.atan2(i,a),l=i*(o+q*.5),u=a*(o+q*.5),d=new p(new ge(r,P.wallH,q),t);d.position.set(l,P.wallH*.5,u),d.rotation.y=c,d.castShadow=!0,d.receiveShadow=!0,e.add(d);let f=new p(new ge(r,.19,q*.26),n);f.position.set(l-i*q*.3,P.wallH+.04,u-a*q*.3),f.rotation.y=c,e.add(f);let m=new p(new ge(r*.96,.1,.08),new g({color:528406,metalness:.3,roughness:.4,emissive:s,emissiveIntensity:1.15}));return m.position.set(i*(o-.06),.34,a*(o-.06)),m.rotation.y=c,e.add(m),d};for(let e=0;e<4;e++){let t=$e[e];r(xt,t.nx,t.nz,P.half,F[e].color)}let i=(2*P.half-P.chamfer)/Math.SQRT2,a=Math.SQRT1_2;for(let[e,t]of[[a,a],[a,-a],[-a,-a],[-a,a]])r(St,e,t,i,3596543)}_buildBarriers(){this.fields=[];for(let e=0;e<4;e++){let t=$e[e],n=new yt(xt,P.wallH*1.15,F[e].color);n.mesh.position.set(t.nx*(P.half-.06),P.wallH*.575,t.nz*(P.half-.06)),n.mesh.rotation.y=Math.atan2(t.nx,t.nz),n.setNormal(t.nx,0,t.nz),this.root.add(n.mesh),this.fields.push(n)}}_buildSubstructure(){let e=this.assets,t=new bt(this.mats),n=new j,r=(t,r,i,a,o=0,s=1,c=0)=>{let l=e.clone(t);return l.position.set(r,i,a),l.rotation.set(c,o,0),l.scale.setScalar(s),n.add(l),l},i=P.half+1.6;for(let e=0;e<40;e++){let t=e/40*Math.PI*2,n=i+K(-.4,.4),a=Math.cos(t)*n,o=Math.sin(t)*n;r(`platform_large`,a,-1.1+K(-.15,.15),o,t+Math.PI/2,1.6),e%3==0&&r(`supports_high`,a*1.06,-2.7,o*1.06,K(0,6.28),1.5),e%5==2&&r(`pipe_supportHigh`,a*1.13,-3.4,o*1.13,t,1.3)}for(let e=0;e<8;e++){let t=e/8*Math.PI*2+Math.PI/8;for(let e=2;e<13;e++)r(`platform_long`,Math.cos(t)*e*1.2,-2.2,Math.sin(t)*e*1.2,t+Math.PI/2,1.5);r(`machine_generatorLarge`,Math.cos(t)*8,-3,Math.sin(t)*8,t,1.6)}for(let e=0;e<22;e++){let e=K(0,Math.PI*2),t=K(3,P.half),n=K(-6.5,-3.2);r(`pipe_straight`,Math.cos(e)*t,n,Math.sin(e)*t,K(0,6.28),K(1.1,2))}t.add(n),t.build(this.root,{name:`substructure`,castShadow:!1,receiveShadow:!1})}_buildDressing(){let e=this.assets,t=new bt(this.mats),n=new j,r=(t,r,i,a,o=0,s=1)=>{let c=e.clone(t);return c.position.set(r,i,a),c.rotation.y=o,c.scale.setScalar(s),n.add(c),c},i=(2*P.half-P.chamfer)/Math.SQRT2;for(let e=0;e<4;e++){let t=$e[e],n=Math.atan2(t.nx,t.nz),i=-t.nz,a=t.nx,o=P.half+q+.35;for(let e=0;e<9;e++){let s=(e/8-.5)*(xt-1.4),c=t.nx*o+i*s,l=t.nz*o+a*s;r(e%2?`structure`:`structure_detailed`,c,0,l,n,1.5),e%4==1&&r(`machine_wireless`,c+t.nx*1.3,1.5,l+t.nz*1.3,n,1.2)}let s=1.5,c=Math.ceil((xt+1)/s);for(let e=0;e<c;e++){let l=(e/(c-1)-.5)*(xt+1-s);r(`pipe_straight`,t.nx*(o+.5)+i*l,1.5,t.nz*(o+.5)+a*l,n+Math.PI/2,s)}}let a=Math.SQRT1_2;[[a,a],[a,-a],[-a,-a],[-a,a]].forEach(([e,t],n)=>{let a=Math.atan2(e,t),o=e*(i+q+1.1),s=t*(i+q+1.1);r(`pipe_ringHigh`,o,0,s,a,2.1),r(`supports_high`,o+e*1.4,0,s+t*1.4,a,2),r(`satelliteDish_large`,o+e*1.2,3,s+t*1.2,a+K(-.6,.6),2.4),r(`turret_double`,o-e*1.9,1.6,s-t*1.9,a+Math.PI,1.9),r(n%2?`barrels_rail`:`barrels`,o+e*2.6,0,s+t*2.6,K(0,6.28),1.7),r(`container-tall`,o-e*3.4+K(-1,1),0,s-t*3.4+K(-1,1),K(0,6.28),1.5)});let o=[[`hangar_roundA`,3.2],[`hangar_smallB`,3],[`rocket_baseA`,2.4],[`machine_generatorLarge`,3.4],[`hangar_roundA`,2.8],[`hangar_smallB`,3.4],[`machine_generatorLarge`,3],[`rocket_baseA`,2.2]],s=[`container`,`container-tall`,`display-wall`,`computer-wide`,`barrels`,`machine_generator`,`satelliteDish`];o.forEach(([e,t],n)=>{let i=n/o.length*Math.PI*2+Math.PI/8,a=P.half+13.5,c=Math.cos(i)*a,l=Math.sin(i)*a,u=Math.atan2(-c,-l);for(let e=-1;e<=1;e++)for(let t=-1;t<=1;t++){let n=Math.cos(u)*e*3.2-Math.sin(u)*t*3.2,i=Math.sin(u)*e*3.2+Math.cos(u)*t*3.2;r(`platform_large`,c+n,-1.2,l+i,u,1.6)}r(e,c,-1.0999999999999999,l,u,t);for(let e=0;e<5;e++){let t=u+K(-2.4,2.4),i=K(4.2,6.2);r(s[(n*3+e)%s.length],c+Math.cos(t)*i,-1.0999999999999999,l+Math.sin(t)*i,K(0,6.28),K(1.5,2.4))}r(`satelliteDish_large`,c+Math.cos(u+1.6)*5.4,-1.0999999999999999,l+Math.sin(u+1.6)*5.4,u+K(-.5,.5),2.6),r(`supports_high`,c,-3.8,l,u,3)});let c=P.half+26,l=Math.ceil(2*Math.PI*c/3);for(let e=0;e<l;e++){let t=e/l*Math.PI*2,n=Math.cos(t)*c,i=Math.sin(t)*c;r(`monorail_trackStraight`,n,-3,i,t+Math.PI/2,3),e%9==0&&r(`monorail_trackSupport`,n,-7.2,i,t+Math.PI/2,9)}let u=[`meteor`,`meteor_detailed`,`rock_largeA`,`rock_crystals`,`rock_crystalsLargeA`];for(let e=0;e<30;e++){let e=K(0,Math.PI*2),t=K(P.half+34,P.half+90);r(u[nt(0,u.length-1)],Math.cos(e)*t,K(-26,-6),Math.sin(e)*t,K(0,6.28),K(3,9))}t.add(n),this.dressMeshes=t.build(this.root,{name:`dressing`,castShadow:!1,receiveShadow:!1});for(let e of this.dressMeshes)e.name.endsWith(`:crystal`)&&(e.castShadow=!1)}_buildLights(){let e=new ie(12574975,1.75);if(e.position.set(16,30,14),e.target.position.set(0,0,0),this.preset.shadows){e.castShadow=!0;let t=P.half+4;e.shadow.mapSize.set(this.preset.shadowSize,this.preset.shadowSize),e.shadow.camera.left=-t,e.shadow.camera.right=t,e.shadow.camera.top=t,e.shadow.camera.bottom=-t,e.shadow.camera.near=8,e.shadow.camera.far=70,e.shadow.bias=-.0012,e.shadow.normalBias=.035,e.shadow.radius=2.2}this.root.add(e,e.target),this.keyLight=e;let t=new ie(16743070,.5);t.position.set(-22,8,-26),this.root.add(t);let n=new r(2779794,658968,.3);this.root.add(n);let i=new ie(13624063,.75);i.castShadow=!1,this.root.add(i,i.target),this.fillLight=i}goalHalfWidth(){return P.half-P.chamfer}hitBarrier(e,t,n){this.fields[e].hit(t,.32,n)}sealBarrier(e){this.fields[e].seal()}setBarrierHealth(e,t){this.fields[e].setHealth(t),this.floor.setTerritory(e,t)}shock(e,t,n,r){this.floor.addWave(e,t,n,r)}setCharge(e){this.floor.setCharge(e)}aimFill(e){this.fillLight&&this.fillLight.position.set(e.x*.55,e.y*.45+6,e.z*.55)}update(e,t){this.floor.update(e,t);for(let n of this.fields)n.update(e,t);this.railMat.emissiveIntensity=.78+Math.sin(t*1.1)*.14}dispose(){this.floor.dispose();for(let e of this.fields)e.dispose();this.root.traverse(e=>{e.isMesh&&e.geometry?.dispose()}),this.scene.remove(this.root)}},wt=new O,Tt=class{constructor(e,t,n,r){this.index=e,this.def=t,this.side=$e[e],this.nx=this.side.nx,this.nz=this.side.nz,this.tx=-this.side.nz,this.tz=this.side.nx,this.yaw=Math.atan2(this.nx,this.nz),this.halfLen=L.halfLen,this.halfThick=L.halfThick,this.limit=P.half-P.chamfer-this.halfLen*.42,this.u=0,this.vu=0,this.targetU=0,this.alive=!0,this.throttle=0,this.surge=1,this.surgeActive=0,this.arc=R.startCharge,this.arcActive=0,this.arcJustFired=!1,this.recoil=0,this.hitFlash=0,this.dying=0,this._dt=0,this.root=new j,this.root.name=`craft:${t.name}`,r.add(this.root),this._buildHull(n),this._buildDeflector(),this._buildThrusters(),this.sync(0)}_buildHull(e){this.mats=Ie(this.def.color,this.def.deep);let t=Le(e.clone(this.def.craft),this.mats),n=new fe().setFromObject(t),r=Math.max(.001,n.max.x-n.min.x),i=this.halfLen*2*.95/r;t.scale.setScalar(i),t.position.set(0,0,.62),t.traverse(e=>{e.isMesh&&(e.castShadow=!1,e.receiveShadow=!0)}),this.hullPivot=new j,this.hullPivot.add(t),this.bobPivot=new j,this.bobPivot.add(this.hullPivot),this.root.add(this.bobPivot),this.hull=t}_buildDeflector(){let e=6.2,t=this.halfLen*2.06/e,n=new A(e,e,1.55,26,1,!0,Math.PI-t/2,t);n.translate(0,0,e),n.rotateY(0),this.defMat=new d({transparent:!0,depthWrite:!1,side:2,blending:2,uniforms:{uColor:{value:new k(this.def.color).convertSRGBToLinear()},uTime:{value:0},uHit:{value:0},uHitU:{value:.5},uSurge:{value:1},uAlive:{value:1}},vertexShader:`
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
          float fres = pow(clamp(1.0 - abs(dot(normalize(vN), vV)), 0.0, 1.0), 1.7);

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
        }`}),this.deflector=new p(n,this.defMat),this.deflector.position.set(0,.62,-.5),this.deflector.renderOrder=7,this.deflectorPivot=new j,this.deflectorPivot.add(this.deflector),this.root.add(this.deflectorPivot)}_buildThrusters(){this.thrustMat=new m({color:new k(this.def.color),transparent:!0,opacity:.9,blending:2,depthWrite:!1});let e=new pe(.19,1.5,10,1,!0);e.rotateX(Math.PI/2),e.translate(0,0,.75),this.thrusters=[];let t=this.halfLen*.44;for(let n of[-t,t]){let t=new p(e,this.thrustMat);t.position.set(n,.24,1.45),t.renderOrder=7,this.bobPivot.add(t),this.thrusters.push(t)}let n=new p(new ye(this.halfLen*.9,20),new m({color:new k(this.def.color),transparent:!0,opacity:.16,blending:2,depthWrite:!1}));n.rotation.x=-Math.PI/2,n.position.y=-.42,this.root.add(n),this.hoverGlow=n,this.glowMat=n.material}worldPos(e=wt){let t=P.half-L.standoff-this.recoil;return e.set(this.nx*t+this.tx*this.u,P.playY,this.nz*t+this.tz*this.u)}get standoffDist(){return P.half-L.standoff-this.recoil}get effHalfLen(){return this.halfLen*(1+this.surgeActive*.42)}steer(e){this.targetU=U(e,-this.limit,this.limit)}trySurge(){return!this.alive||this.surge<1?!1:(this.surge=0,this.surgeActive=.55,!0)}tryArc(){return!this.alive||this.arc<1||this.arcActive>0?!1:(this.arc=0,this.arcActive=R.duration,this.arcJustFired=!0,!0)}get arcDist(){return P.half-L.standoff}onDeflect(e,t){this.defMat.uniforms.uHitU.value=e,this.defMat.uniforms.uHit.value=Math.min(1.4,this.defMat.uniforms.uHit.value+t),this.recoil=Math.min(.85,this.recoil+t*.5),this.hitFlash=1}onConcede(){this.hitFlash=1.6}eliminate(){this.alive&&(this.alive=!1,this.dying=.001)}update(e,t){if(this._dt=e,this.alive){let t=U((this.targetU-this.u)*L.track,-L.maxSpeed,L.maxSpeed),n=this.vu;this.vu=G(this.vu,t,L.damp,e),this.u=U(this.u+this.vu*e,-this.limit,this.limit),Math.abs(this.u)>=this.limit-1e-4&&(this.vu*=.35),this.accel=(this.vu-n)/Math.max(e,1e-4),this.throttle=G(this.throttle,Math.min(1,Math.abs(this.vu)/L.maxSpeed),9,e),this.surge=Math.min(1,this.surge+e/4.2),this.surgeActive=Math.max(0,this.surgeActive-e),this.arcActive=Math.max(0,this.arcActive-e),this.arcActive<=0&&(this.arc=Math.min(1,this.arc+e/R.cooldown))}else this.dying+=e,this.vu*=Math.exp(-e*2),this.u+=this.vu*e,this.arcActive=0;this.recoil=G(this.recoil,0,7.5,e),this.hitFlash=G(this.hitFlash,0,5.5,e);let n=this.defMat.uniforms;n.uTime.value=t,n.uHit.value*=Math.exp(-e*6.5),n.uSurge.value=G(n.uSurge.value,this.alive?this.surge:0,8,e),n.uAlive.value=G(n.uAlive.value,+!!this.alive,3,e),this.sync(t)}sync(e){let t=this.standoffDist;if(this.root.position.set(this.nx*t+this.tx*this.u,P.playY,this.nz*t+this.tz*this.u),this.root.rotation.y=this.yaw,this.alive){let t=-U(this.vu/L.maxSpeed,-1,1)*L.bankMax,n=U((this.accel||0)/900,-.22,.22),r=this._dt;this.hullPivot.rotation.z=G(this.hullPivot.rotation.z,t,11,r),this.hullPivot.rotation.x=G(this.hullPivot.rotation.x,n,9,r);let i=Math.sin(e*2.4+this.index*1.7)*L.hover+Math.sin(e*3.9+this.index)*L.hover*.35;this.bobPivot.position.y=i,this.bobPivot.rotation.z=Math.sin(e*1.6+this.index*2.1)*.035;let a=.25+this.throttle*1.5+this.hitFlash*.8;for(let e of this.thrusters)e.scale.set(1+this.throttle*.35,1,a);this.thrustMat.opacity=.35+this.throttle*.55,this.hoverGlow.material.opacity=.1+this.throttle*.14;let o=this.mats.metalRed;o.emissiveIntensity=2.2+this.hitFlash*5+this.surge*.7}else{let e=this.dying,t=this._dt*60;this.hullPivot.rotation.z+=.055*t,this.hullPivot.rotation.x+=.031*t,this.bobPivot.position.y=-e*e*3.2;let n=Math.max(0,1-e*.85);this.thrustMat.opacity=n*.2,this.hoverGlow.material.opacity=n*.04,this.mats.metalRed.emissiveIntensity=n*1.2;for(let e of this.thrusters)e.scale.set(1,1,n*.4);e>2.4&&(this.root.visible=!1)}let n=1+this.surgeActive*.42;this.deflector.scale.set(n,1,n)}dispose(){this.root.traverse(e=>{e.isMesh&&e.geometry?.dispose()});for(let e of Object.values(this.mats))e.dispose();this.defMat.dispose(),this.thrustMat.dispose(),this.glowMat.dispose(),this.root.parent?.remove(this.root)}},Et=`
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
  float w = uWidth * pow(clamp(1.0 - aT, 0.0, 1.0), 0.62) * (1.0 - 0.35 * aT);
  vec3 p = position + side * aSide * w;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`,Dt=`
precision mediump float;
varying float vT;
varying float vEdge;
uniform vec3 uColor;
uniform vec3 uHot;
uniform float uOpacity;
void main() {
  // Clamped before every pow(): the interpolated edge/age values can overshoot
  // their [0,1] range by an ulp at mediump, and pow() of a negative base is NaN
  // — which is what turned the ribbon edges into black stipple on mobile.
  float across = clamp(1.0 - abs(vEdge), 0.0, 1.0);  // 1 at the spine, 0 at the edges
  float body = pow(across, 1.6);
  float fade = pow(clamp(1.0 - vT, 0.0, 1.0), 2.1);
  // Hot core near the head cooling to the team colour down the tail.
  vec3 col = mix(uColor, uHot, body * (1.0 - vT * 0.75));
  float a = body * fade * uOpacity;
  if (a < 0.003) discard;
  gl_FragColor = vec4(col * a * 2.4, a);
}`,Ot=class{constructor(e,t,n=16777215,r=.34){this.n=e;let i=e,a=new Float32Array(i*2*3),o=new Float32Array(i*2*3),s=new Float32Array(i*2),c=new Float32Array(i*2),l=new Uint16Array((i-1)*6);for(let e=0;e<i;e++){s[e*2]=-1,s[e*2+1]=1;let t=e/(i-1);c[e*2]=t,c[e*2+1]=t}for(let e=0;e<i-1;e++){let t=e*2,n=t+1,r=t+2,i=t+3;l.set([t,n,r,n,i,r],e*6)}let u=new ce;this.aPos=new E(a,3).setUsage(C),this.aDir=new E(o,3).setUsage(C),u.setAttribute(`position`,this.aPos),u.setAttribute(`aDir`,this.aDir),u.setAttribute(`aSide`,new E(s,1)),u.setAttribute(`aT`,new E(c,1)),u.setIndex(new E(l,1)),u.boundingSphere=new ne(new O,1e4),this.mat=new d({vertexShader:Et,fragmentShader:Dt,uniforms:{uWidth:{value:r},uColor:{value:new k(t).convertSRGBToLinear()},uHot:{value:new k(n).convertSRGBToLinear()},uOpacity:{value:1}},transparent:!0,depthWrite:!1,blending:2,side:2}),this.mesh=new p(u,this.mat),this.mesh.frustumCulled=!1,this.mesh.renderOrder=8,this._primed=!1}setColor(e,t){this.mat.uniforms.uColor.value.set(e).convertSRGBToLinear(),t!==void 0&&this.mat.uniforms.uHot.value.set(t).convertSRGBToLinear()}setWidth(e){this.mat.uniforms.uWidth.value=e}reset(e,t,n){let r=this.aPos.array,i=this.aDir.array;for(let a=0;a<this.n*2;a++)r[a*3]=e,r[a*3+1]=t,r[a*3+2]=n,i[a*3]=0,i[a*3+1]=0,i[a*3+2]=1;this.aPos.needsUpdate=!0,this.aDir.needsUpdate=!0,this._primed=!0}push(e,t,n){if(!this._primed)return this.reset(e,t,n);let r=this.aPos.array,i=this.aDir.array,a=this.n;r.copyWithin(6,0,(a-1)*6),r[0]=e,r[1]=t,r[2]=n,r[3]=e,r[4]=t,r[5]=n;for(let e=0;e<a;e++){let t=Math.max(0,e-1)*6,n=Math.min(a-1,e+1)*6,o=r[t]-r[n],s=r[t+1]-r[n+1],c=r[t+2]-r[n+2],l=Math.hypot(o,s,c);l>1e-5?(o/=l,s/=l,c/=l):(o=0,s=0,c=1);let u=e*6;i[u]=o,i[u+1]=s,i[u+2]=c,i[u+3]=o,i[u+4]=s,i[u+5]=c}this.aPos.needsUpdate=!0,this.aDir.needsUpdate=!0}dispose(){this.mesh.geometry.dispose(),this.mat.dispose()}},kt=`
varying vec3 vN; varying vec3 vV; varying vec3 vLocal;
void main() {
  vLocal = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,At=`
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

  // clamp, not max: on mobile precision the dot can land just above 1.0, and
  // pow() of a negative base is NaN — which paints the rim black and poisons
  // the bloom chain with a value that smears across the screen.
  float fres = pow(clamp(1.0 - dot(normalize(vN), vV), 0.0, 1.0), 2.4);

  vec3 col = mix(uColor, uHot, smoothstep(0.42, 0.86, n));
  col = mix(col, uHot * 1.6, fres * 0.75);
  col *= 1.1 + uEnergy * 1.5;
  gl_FragColor = vec4(col, 1.0);
}`,jt=`
precision mediump float;
varying vec3 vN; varying vec3 vV; varying vec3 vLocal;
uniform vec3 uColor; uniform float uTime; uniform float uEnergy;
void main() {
  float fres = pow(clamp(1.0 - dot(normalize(vN), vV), 0.0, 1.0), 3.1);
  // Latitude bands drifting upward read as containment rings.
  float bands = 0.5 + 0.5 * sin(normalize(vLocal).y * 19.0 - uTime * 4.5);
  float a = fres * (0.55 + bands * 0.45);
  gl_FragColor = vec4(uColor * a * (1.6 + uEnergy * 2.2), a * 0.85);
}`,Mt=`
uniform float uSize;
varying vec2 vP;
void main() {
  vP = position.xy;
  // Billboard: build the quad directly in view space.
  vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  c.xy += position.xy * uSize;
  gl_Position = projectionMatrix * c;
}`,Nt=`
precision mediump float;
varying vec2 vP;
uniform vec3 uColor; uniform float uIntensity;
void main() {
  float r2 = dot(vP, vP);
  if (r2 > 1.0) discard;
  // Two lobes: a tight bright centre and a wide soft falloff.
  float a = exp(-r2 * 7.0) * 0.85 + exp(-r2 * 1.9) * 0.30;
  gl_FragColor = vec4(uColor * a * uIntensity * 2.4, a);
}`,Pt=null;function Ft(){return Pt||(Pt={core:new xe(z.radius*.82,3),shell:new xe(z.radius*1.16,3),glow:new f(2,2)}),Pt}var It=class{constructor(e,t,n){this.scene=e,this.active=!1,this.x=0,this.z=0,this.vx=0,this.vz=0,this.speed=z.baseSpeed,this.lastHitBy=-1,this.rally=0,this.age=0,this.impact=0,this.impactDirX=1,this.impactDirZ=0;let r=Ft();this.root=new j;let i=new k(7333631),a=new k(16777215);this.coreMat=new d({vertexShader:kt,fragmentShader:At,uniforms:{uColor:{value:i.clone().convertSRGBToLinear()},uHot:{value:a.clone().convertSRGBToLinear()},uTime:{value:0},uEnergy:{value:0}}}),this.core=new p(r.core,this.coreMat),this.core.castShadow=!1,this.shellMat=new d({vertexShader:kt,fragmentShader:jt,uniforms:{uColor:{value:i.clone().convertSRGBToLinear()},uTime:{value:0},uEnergy:{value:0}},transparent:!0,depthWrite:!1,blending:2,side:2}),this.shell=new p(r.shell,this.shellMat),this.glowMat=new d({vertexShader:Mt,fragmentShader:Nt,uniforms:{uColor:{value:i.clone().convertSRGBToLinear()},uSize:{value:z.radius*4.6},uIntensity:{value:1}},transparent:!0,depthWrite:!1,blending:2}),this.glow=new p(r.glow,this.glowMat),this.glow.frustumCulled=!1,this.glow.renderOrder=10,this.squash=new j,this.squash.add(this.core,this.shell),this.root.add(this.squash,this.glow),this.trail=new Ot(t.trailSegments,3066111,16777215,z.radius*.86),e.add(this.trail.mesh),n&&(this.light=new v(7333631,12,16,2),this.root.add(this.light)),this.blob=new p(new f(z.radius*6,z.radius*6),new d({transparent:!0,depthWrite:!1,blending:2,uniforms:{uColor:{value:i.clone().convertSRGBToLinear()}},vertexShader:`varying vec2 vU; void main(){ vU=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,fragmentShader:`precision mediump float; varying vec2 vU; uniform vec3 uColor;
          void main(){ vec2 p=(vU-0.5)*2.0; float r2=dot(p,p);
            if(r2>1.0) discard; float a=exp(-r2*4.5)*0.42;
            gl_FragColor=vec4(uColor*a,a); }`})),this.blob.rotation.x=-Math.PI/2,this.blob.renderOrder=3,this.root.add(this.blob),e.add(this.root),this.setVisible(!1)}setVisible(e){this.root.visible=e,this.trail.mesh.visible=e}setTint(e){let t=new k(e),n=t.clone().convertSRGBToLinear();this.coreMat.uniforms.uColor.value.copy(n),this.shellMat.uniforms.uColor.value.copy(n),this.glowMat.uniforms.uColor.value.copy(n),this.blob.material.uniforms.uColor.value.copy(n),this.trail.setColor(e,16777215),this.light&&this.light.color.copy(t)}spawn(e,t,n,r){this.active=!0,this.x=e,this.z=t,this.speed=r,this.vx=Math.sin(n)*r,this.vz=Math.cos(n)*r,this.lastHitBy=-1,this.rally=0,this.age=0,this.impact=0,this.setTint(7333631),this.root.position.set(e,P.playY,t),this.trail.reset(e,P.playY,t),this.setVisible(!0)}kill(){this.active=!1,this.setVisible(!1)}registerImpact(e,t,n=1){this.impact=Math.min(1.5,this.impact+n),this.impactDirX=e,this.impactDirZ=t}updateVisual(e,t){if(!this.active)return;this.age+=e;let n=U((this.speed-z.baseSpeed)/(z.maxSpeed-z.baseSpeed),0,1);this.impact=G(this.impact,0,9,e),this.root.position.set(this.x,P.playY,this.z);let r=1/Math.max(1e-4,Math.hypot(this.vx,this.vz)),i=this.vx*r,a=this.vz*r,o=1+n*.28+this.impact*.34,s=1/Math.sqrt(o);this.squash.quaternion.setFromUnitVectors(Lt,Rt.set(i,0,a)),this.squash.scale.set(s,s,o);let c=n*.7+this.impact*.5;this.coreMat.uniforms.uTime.value=t,this.coreMat.uniforms.uEnergy.value=c,this.shellMat.uniforms.uTime.value=t,this.shellMat.uniforms.uEnergy.value=c,this.glowMat.uniforms.uIntensity.value=.85+n*.7+this.impact*1.1,this.glowMat.uniforms.uSize.value=z.radius*(4.4+n*1.5+this.impact*2.2),this.light&&(this.light.intensity=9+n*10+this.impact*22),this.blob.position.set(0,-P.playY+.035,0);let l=1+n*.35;this.blob.scale.set(l,l,1),this.trail.push(this.x,P.playY,this.z),this.trail.setWidth(z.radius*(.8+n*.5))}dispose(){this.coreMat.dispose(),this.shellMat.dispose(),this.glowMat.dispose(),this.blob.geometry.dispose(),this.blob.material.dispose(),this.trail.dispose(),this.scene.remove(this.root,this.trail.mesh)}},Lt=new O(0,0,1),Rt=new O,zt=.22;function Bt(e,t,n,r,i){let a=e*-r+t*n,o=e*-n+t*-r,s=Math.sin(z.minAngle)*i;if(o>=s)return[e,t];let c=a>=0?1:-1,l=s,u=c*Math.sqrt(Math.max(0,i*i-l*l));return[-r*u+-n*l,n*u+-r*l]}function Vt(e,t,n){let{planes:r,crafts:i,bricks:a,pinball:o,blackhole:s,events:c}=n,l=t,u=0;for(;l>1e-6&&u++<64;){let t=Math.hypot(e.vx,e.vz)||1e-4,n=Math.min(l,zt/t);if(l-=n,e.x+=e.vx*n,e.z+=e.vz*n,t>z.cruise){let r=Math.max(z.cruise,t-z.bleed*n),i=r/t;e.vx*=i,e.vz*=i,e.speed=r}s&&s.affect(e,n);for(let n of i){if(!n.alive||n.arcActive<=0)continue;let r=e.vx*n.nx+e.vz*n.nz;if(r<=0)continue;let i=n.arcDist,a=e.x*n.nx+e.z*n.nz-i;if(a+z.radius<0||a>z.radius)continue;let o=e.x*n.tx+e.z*n.tz,s=P.half-P.chamfer;if(Math.abs(o)>s)continue;e.vx-=2*r*n.nx,e.vz-=2*r*n.nz;let l=U(n.vu/L.maxSpeed,-1,1)*R.english;e.vx+=n.tx*l*t,e.vz+=n.tz*l*t;let u=Math.min(z.maxSpeed,t+R.speedGain),[d,f]=Bt(e.vx,e.vz,n.nx,n.nz,u),p=Math.hypot(d,f)||1;e.vx=d/p*u,e.vz=f/p*u,e.speed=u;let m=a+z.radius+.02;e.x-=n.nx*m,e.z-=n.nz*m,e.registerImpact(-n.nx,-n.nz,1.1),c.push({type:`arc`,orb:e,craft:n,speed:u,x:e.x,z:e.z,u01:U(o/s,-1,1)*.5+.5});break}for(let n of i){if(!n.alive||e.vx*n.nx+e.vz*n.nz<=0)continue;let r=n.standoffDist,i=e.x-n.nx*r-n.tx*n.u,a=e.z-n.nz*r-n.tz*n.u,o=i*n.tx+a*n.tz,s=i*n.nx+a*n.nz;if(s>0)continue;let l=n.effHalfLen,u=U(o,-l,l),d=U(s,-n.halfThick,n.halfThick),f=o-u,p=s-d;if(f*f+p*p>z.radius*z.radius)continue;let m=U(o/l,-1,1),h=U(n.vu/L.maxSpeed,-1,1)*z.spinInfluence,g=m*z.angleInfluence+h;g=U(g,-1.35,1.35);let _=g,v=-1,y=1/Math.hypot(_,v);_*=y,v*=y;let b=+(n.surgeActive>0),x=Math.min(z.maxSpeed,t+z.rallyGain+z.paddleBoost+b*3.4);e.vx=(n.tx*_+n.nx*v)*x,e.vz=(n.tz*_+n.nz*v)*x,e.speed=x,e.rally++,e.lastHitBy=n.index;let ee=z.radius+n.halfThick+.02;e.x=n.nx*r+n.tx*n.u+n.tx*u-n.nx*ee,e.z=n.nz*r+n.tz*n.u+n.tz*u-n.nz*ee,e.registerImpact(-n.nx,-n.nz,.85+b*.5),c.push({type:`deflect`,orb:e,craft:n,u01:(m+1)*.5,power:.7+b*.6,speed:x,x:e.x,z:e.z});break}a&&a.collide(e,c),o&&o.collide(e,c);for(let t of r){let n=e.x*t.nx+e.z*t.nz;if(n+z.radius<=t.d)continue;if(t.goal>=0){let n=e.x*-t.nz+e.z*t.nx,r=i[t.goal];if(r.alive&&r.arcActive<=0&&Math.abs(n)<=t.halfWidth){e.active=!1,c.push({type:`goal`,orb:e,victim:t.goal,x:e.x,z:e.z,u01:U(n/t.halfWidth,-1,1)*.5+.5});return}}let r=n+z.radius-t.d;e.x-=t.nx*r*1.02,e.z-=t.nz*r*1.02;let a=e.vx*t.nx+e.vz*t.nz;a>0&&(e.vx-=2*a*t.nx,e.vz-=2*a*t.nz);let o=Math.min(z.maxSpeed,Math.hypot(e.vx,e.vz)+z.rallyGain*.35),[s,l]=Bt(e.vx,e.vz,t.nx,t.nz,o),u=Math.hypot(s,l)||1;e.vx=s/u*o,e.vz=l/u*o,e.speed=o,e.registerImpact(-t.nx,-t.nz,.55),c.push({type:t.goal>=0?`sealed`:`wall`,orb:e,x:e.x,z:e.z,nx:t.nx,nz:t.nz,speed:o,goal:t.goal});break}}}function Ht(e,t){let n=z.radius*2*(z.radius*2);for(let r=0;r<e.length;r++){let i=e[r];if(i.active)for(let a=r+1;a<e.length;a++){let r=e[a];if(!r.active)continue;let o=r.x-i.x,s=r.z-i.z,c=o*o+s*s;if(c>n||c<1e-8)continue;let l=Math.sqrt(c);o/=l,s/=l;let u=(r.vx-i.vx)*o+(r.vz-i.vz)*s;if(u<0){i.vx+=u*o,i.vz+=u*s,r.vx-=u*o,r.vz-=u*s;let e=Math.hypot(i.vx,i.vz)||1,n=Math.hypot(r.vx,r.vz)||1;i.vx=i.vx/e*i.speed,i.vz=i.vz/e*i.speed,r.vx=r.vx/n*r.speed,r.vz=r.vz/n*r.speed,i.registerImpact(-o,-s,.6),r.registerImpact(o,s,.6),t.push({type:`orbclash`,x:i.x+o*z.radius,z:i.z+s*z.radius,speed:Math.max(i.speed,r.speed)})}let d=(z.radius*2-l)*.5+.001;i.x-=o*d,i.z-=s*d,r.x+=o*d,r.z+=s*d}}}function Ut(e,t,n,r=4){let i=e.x,a=e.z,o=e.vx,s=e.vz,c=t[n],l=0;for(let e=0;e<10&&l<r;e++){let e=1/0,n=null;for(let r of t){let t=o*r.nx+s*r.nz;if(t<=1e-6)continue;let c=(r.d-z.radius-(i*r.nx+a*r.nz))/t;c>1e-5&&c<e&&(e=c,n=r)}if(!n||!isFinite(e))return null;if(l+=e,i+=o*e,a+=s*e,n===c)return{lateral:i*-c.nz+a*c.nx,time:l};let r=o*n.nx+s*n.nz;o-=2*r*n.nx,s-=2*r*n.nz}return null}var Wt=class{constructor(e,t,n){this.craft=e,this.diff=t,this.planes=n,this.reactTimer=0,this.aimError=0,this.desiredU=0,this.threatId=-1,this.victim=-1,this.idlePhase=K(0,Math.PI*2),this.commitTime=0,this.panic=0}_pickVictim(e,t){let n=this.craft.index,r=[];for(let i=0;i<4;i++){if(i===n||!e[i].alive)continue;let a=1+(6-t[i])*.45;i===0&&(a*=1+this.diff.aggression*.15),i===this.victim&&(a*=.45),r.push([i,a])}if(!r.length)return-1;let i=0;for(let[,e]of r)i+=e;let a=Math.random()*i;for(let[e,t]of r)if(a-=t,a<=0)return e;return r[0][0]}_aimOffset(e,t){let n=this.craft;if(e<0)return 0;let r=$e[e],i=K(-.55,.55)*(P.half-P.chamfer),a=-r.nz,o=r.nx,s=r.nx*P.half+a*i,c=r.nz*P.half+o*i,l=n.standoffDist,u=n.nx*l+n.tx*t,d=n.nz*l+n.tz*t,f=s-u,p=c-d,m=f*n.tx+p*n.tz,h=f*-n.nx+p*-n.nz;return h<=.5?0:U(U(m/h,-1.2,1.2)/z.angleInfluence,-.92,.92)}update(e,t,n,r){let i=this.craft;if(!i.alive)return;let a=null,o=null;for(let e of t){if(!e.active)continue;let t=Ut(e,this.planes,i.index,5);t&&(!a||t.time<a.time)&&(a=t,o=e)}if(this.reactTimer-=e,a){(o.id!==this.threatId||a.time>this.commitTime+.35)&&this.reactTimer<=0&&(this.threatId=o.id,this.reactTimer=this.diff.react*K(.7,1.35),this.victim=this._pickVictim(n,r),this.aimError=K(-1,1)*this.diff.err*K(.6,1.4)),this.commitTime=a.time;let t=this._aimOffset(this.victim,a.lateral)*i.halfLen,s=U(1-a.time/1.6,0,1),c=this.aimError*(1-s*.82);if(this.desiredU=a.lateral-t+c,this.panic=U(Math.abs(a.lateral-i.u)/8*(1-a.time/1.2),0,1),this.panic>.55&&a.time<.55&&i.surge>=1&&Math.random()<this.diff.aggression*e*22&&i.trySurge(),i.arc>=1&&a.time<1.1){let e=i.halfLen+L.maxSpeed*this.diff.speed*a.time;(Math.abs(a.lateral-i.u)>e||r[this.craft.index]<=1)&&i.tryArc()}}else{this.idlePhase+=e*.55;let t=Math.sin(this.idlePhase)*(P.half-P.chamfer)*.3;this.desiredU=W(this.desiredU,t,1-Math.exp(-e*1.6)),this.panic=0}let s=L.maxSpeed*this.diff.speed*(1+this.panic*.25),c=i.targetU,l=U(this.desiredU-c,-s*e,s*e);i.steer(c+l)}},Gt=`
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
}`,Kt=`
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
}`;new O;var qt=class{constructor(e,t=1){this.cap=e;let n=e;this.pos=new Float32Array(n*3),this.vel=new Float32Array(n*3),this.col=new Float32Array(n*3),this.size=new Float32Array(n),this.life=new Float32Array(n),this.rate=new Float32Array(n),this.angle=new Float32Array(n),this.stretch=new Float32Array(n),this.kind=new Float32Array(n),this.drag=new Float32Array(n),this.grav=new Float32Array(n),this.spin=new Float32Array(n);let r=new ce;this.aPos=new E(this.pos,3).setUsage(C),this.aCol=new E(this.col,3).setUsage(C),this.aSize=new E(this.size,1).setUsage(C),this.aLife=new E(this.life,1).setUsage(C),this.aAngle=new E(this.angle,1).setUsage(C),this.aStretch=new E(this.stretch,1).setUsage(C),this.aKind=new E(this.kind,1).setUsage(C),r.setAttribute(`position`,this.aPos),r.setAttribute(`aColor`,this.aCol),r.setAttribute(`aSize`,this.aSize),r.setAttribute(`aLife`,this.aLife),r.setAttribute(`aAngle`,this.aAngle),r.setAttribute(`aStretch`,this.aStretch),r.setAttribute(`aKind`,this.aKind),r.boundingSphere=new ne(new O,400),r.setDrawRange(0,0),this.mat=new d({vertexShader:Gt,fragmentShader:Kt,uniforms:{uPixelRatio:{value:t},uScale:{value:26}},transparent:!0,depthWrite:!1,blending:2}),this.points=new Ce(r,this.mat),this.points.frustumCulled=!1,this.points.renderOrder=9,this.cursor=0,this.high=0,this._c=new k}setPixelRatio(e){this.mat.uniforms.uPixelRatio.value=e}_alloc(){let e=this.cap;for(let t=0;t<e;t++){let n=(this.cursor+t)%e;if(this.life[n]<=0)return this.cursor=(n+1)%e,n+1>this.high&&(this.high=n+1),n}let t=this.cursor;return this.cursor=(t+1)%e,t}burst(e){let t=e.count|0,[n,r,i]=e.at,a=e.spread??1,o=e.speedMin??4,s=e.speedMax??12,c=e.lifeMin??.25,l=e.lifeMax??.7,u=e.sizeMin??6,d=e.sizeMax??16,f=e.kind??1,p=e.drag??2.4,m=e.grav??-9,h=e.jitter??0,g=this._c.set(e.color??16777215).convertSRGBToLinear(),_=g.r,v=g.g,y=g.b,b=_,x=v,ee=y;if(e.color2!==void 0){let t=this._c.set(e.color2).convertSRGBToLinear();b=t.r,x=t.g,ee=t.b}let S=!!e.dir,te=S?e.dir[0]:0,ne=S?e.dir[1]:0,re=S?e.dir[2]:0;for(let e=0;e<t;e++){let e=this._alloc(),t=Math.random()*2-1,g=Math.random()*Math.PI*2,C=Math.sqrt(Math.max(0,1-t*t)),w=Math.cos(g)*C,T=t,E=Math.sin(g)*C;if(S){let e=1-Math.min(a,1);w=w*(1-e)+te*e,T=T*(1-e)+ne*e,E=E*(1-e)+re*e;let t=Math.hypot(w,T,E)||1;w/=t,T/=t,E/=t}a<1&&!S&&(T=Math.abs(T));let D=o+Math.random()*(s-o),O=e*3;this.pos[O]=n+(Math.random()-.5)*h,this.pos[O+1]=r+(Math.random()-.5)*h,this.pos[O+2]=i+(Math.random()-.5)*h,this.vel[O]=w*D,this.vel[O+1]=T*D,this.vel[O+2]=E*D;let k=Math.random();this.col[O]=_+(b-_)*k,this.col[O+1]=v+(x-v)*k,this.col[O+2]=y+(ee-y)*k,this.size[e]=u+Math.random()*(d-u),this.life[e]=1,this.rate[e]=1/(c+Math.random()*(l-c)),this.angle[e]=Math.random()*Math.PI*2,this.stretch[e]=.16+Math.random()*.2,this.kind[e]=f,this.drag[e]=p,this.grav[e]=m,this.spin[e]=f===2?(Math.random()-.5)*14:0}}update(e,t){let n=this.high;if(n===0)return;let r=0,i=t.matrixWorldInverse.elements;for(let t=0;t<n;t++){let n=this.life[t];if(n<=0)continue;if(n-=this.rate[t]*e,n<=0){this.life[t]=0;continue}this.life[t]=n,r=t+1;let a=t*3,o=Math.exp(-this.drag[t]*e),s=this.vel[a]*o,c=this.vel[a+1]*o+this.grav[t]*e,l=this.vel[a+2]*o,u=this.pos[a]+s*e,d=this.pos[a+1]+c*e,f=this.pos[a+2]+l*e;if(d<.08&&c<0&&(d=.08,c=-c*.34,s*=.7,l*=.7),this.vel[a]=s,this.vel[a+1]=c,this.vel[a+2]=l,this.pos[a]=u,this.pos[a+1]=d,this.pos[a+2]=f,this.kind[t]===1){let e=i[0]*s+i[4]*c+i[8]*l,n=i[1]*s+i[5]*c+i[9]*l;this.angle[t]=Math.atan2(n,e)}else this.spin[t]!==0&&(this.angle[t]+=this.spin[t]*e)}this.high=r;let a=r;if(this.points.geometry.setDrawRange(0,a),a!==0)for(let e of[this.aPos,this.aCol,this.aSize,this.aLife,this.aAngle,this.aStretch,this.aKind])e.updateRanges.length=0,e.addUpdateRange(0,a*e.itemSize),e.needsUpdate=!0}clear(){this.life.fill(0),this.high=0,this.points.geometry.setDrawRange(0,0)}dispose(){this.points.geometry.dispose(),this.mat.dispose()}};function Jt(e,t,n){let r=e*.5-n,i=t*.5-n,a=new me;return a.moveTo(-r-n,-i),a.lineTo(-r-n,i),a.quadraticCurveTo(-r-n,i+n,-r,i+n),a.lineTo(r,i+n),a.quadraticCurveTo(r+n,i+n,r+n,i),a.lineTo(r+n,-i),a.quadraticCurveTo(r+n,-i-n,r,-i-n),a.lineTo(-r,-i-n),a.quadraticCurveTo(-r-n,-i-n,-r-n,-i),a}function Yt(e,t,n,r=.12){let i=Math.min(r*2,Math.min(e,t)*.2),a=new be(Jt(e-r*2,t-r*2,i),{depth:Math.max(.01,n-r*2),bevelEnabled:!0,bevelThickness:r,bevelSize:r,bevelSegments:1,curveSegments:2,steps:1});return a.rotateX(-Math.PI/2),a.translate(0,r,0),a.computeVertexNormals(),a}function Xt(e,t,n,r=20){let i=new A(t,e,n,r,1,!1);return i.translate(0,n*.5,0),i}function Zt(e,t,n){let r=new ce,i=e,a=t,o=i*.82,s=[-i,0,0,i,0,0,i,n,0,-i,n,0,-o,0,a,o,0,a,-o,n*.8,a,o,n*.8,a];return r.setAttribute(`position`,new Se(s,3)),r.setIndex([0,2,1,0,3,2,4,5,7,4,7,6,3,7,2,3,6,7,0,1,5,0,5,4,0,4,6,0,6,3,1,7,5,1,2,7]),r.computeVertexNormals(),r}var J=16754738,Qt=0,$t=1,en=2,tn=3,nn=new oe,rn=new n,an=new O,on=new O(1,1,1),sn=new O(0,1,0),cn=class{constructor(e,t){this.scene=e,this.preset=t,this.bumpers=[],this.slings=[];for(let e=0;e<4;e++){let t=Math.PI*.25+e*Math.PI*.5,n=Math.cos(t),r=Math.sin(t),i=-r,a=n;for(let t of[-1,1])this.bumpers.push({x:n*V.wellR+i*V.bumperGap*t,z:r*V.wellR+a*V.bumperGap*t,r:V.bumperR,flash:0,cool:0,seed:Math.random(),well:e});let o=V.wellR+V.slingBack;this.slings.push({x:n*o,z:r*o,nx:-n,nz:-r,tx:i,tz:a,half:V.slingHalf,depth:V.slingDepth,flash:0,cool:0,seed:Math.random(),well:e})}this._build(),this.reset()}obstacles(){let e=this.bumpers.map(e=>({x:e.x,z:e.z,r:e.r}));for(let t of this.slings)e.push({x:t.x,z:t.z,r:t.half*.8});return e}_build(){let e=this.bumpers.length,t=this.slings.length;this.bumperState=new Float32Array(e*2),this.slingState=new Float32Array(t*2),this._attrs=[],this._time={value:0},this.bodyGeo=Xt(V.bumperR*.88,V.bumperR*1.02,V.bumperH);let n=new g({color:2372425,metalness:.86,roughness:.34,envMapIntensity:1});n.onBeforeCompile=e=>{e.uniforms.uTime=this._time,e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
          attribute vec2 aState;
          varying vec2 vState; varying vec3 vLocal;`).replace(`#include <begin_vertex>`,`#include <begin_vertex>
          vState = aState; vLocal = position;`),e.fragmentShader=e.fragmentShader.replace(`#include <common>`,`#include <common>
          uniform float uTime;
          varying vec2 vState; varying vec3 vLocal;`).replace(`#include <emissivemap_fragment>`,`#include <emissivemap_fragment>
          {
            float y = vLocal.y / ${V.bumperH.toFixed(3)};
            float rad = length(vLocal.xz) / ${V.bumperR.toFixed(3)};
            // The cap is dark with a hot core, and there is a charge band just
            // beneath it. Lighting the whole cap turns the bumper into a
            // pancake from the match camera, which sits high enough to see it.
            float band = smoothstep(0.70, 0.78, y) * smoothstep(0.97, 0.90, y);
            float capFace = smoothstep(0.985, 1.0, y);
            // A target ring on the cap rather than a filled core — a lit disc
            // in the middle of a dark cap reads as a fried egg from above.
            float core = capFace * smoothstep(0.13, 0.0, abs(rad - 0.52));
            float idle = 0.55 + 0.45 * sin(uTime * 2.6 + vState.y * 6.28);
            vec3 c = vec3(1.0, 0.62, 0.18);
            diffuseColor.rgb *= 1.0 - capFace * 0.4;
            totalEmissiveRadiance += c * (band * (0.55 + idle * 0.5) + core * (1.1 + idle * 0.9));
            totalEmissiveRadiance += (c + vec3(1.0) * vState.x) * vState.x * (band * 2.6 + capFace * 1.6 + 0.25);
          }`)},n.customProgramCacheKey=()=>`bumper-body`,this.bodyMat=n,this.body=new a(this.bodyGeo,n,e),this._attr(this.bodyGeo,`aState`,this.bumperState,2),this.body.castShadow=!1,this.body.receiveShadow=!0,this.body.frustumCulled=!1,this.body.name=`bumpers`,this.crownGeo=new A(V.bumperR*1.06,V.bumperR*.94,.26,22,1,!0),this.crownGeo.translate(0,V.bumperH*.93,0),this.crownMat=new d({transparent:!0,depthWrite:!1,blending:2,uniforms:{uTime:this._time},vertexShader:`
        attribute vec2 aState;
        varying vec2 vState; varying vec3 vNrm; varying vec3 vView;
        void main() {
          vState = aState;
          vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
          vNrm = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
          vView = normalize(cameraPosition - wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,fragmentShader:`
        precision mediump float;
        uniform float uTime;
        varying vec2 vState; varying vec3 vNrm; varying vec3 vView;
        void main() {
          float fres = pow(clamp(1.0 - abs(dot(normalize(vNrm), vView)), 0.0, 1.0), 1.6);
          float idle = 0.55 + 0.45 * sin(uTime * 2.6 + vState.y * 6.28);
          float a = clamp(0.14 + fres * 0.34 + idle * 0.12 + vState.x * 1.4, 0.0, 1.0);
          vec3 col = vec3(1.0, 0.66, 0.22) * (1.0 + vState.x * 2.0) + vec3(1.0) * vState.x;
          gl_FragColor = vec4(col * a * 1.35, a * 0.9);
        }`}),this.crown=new a(this.crownGeo,this.crownMat,e),this._attr(this.crownGeo,`aState`,this.bumperState,2),this.crown.frustumCulled=!1,this.crown.renderOrder=6,this.slingGeo=Zt(V.slingHalf,V.slingDepth,V.slingH);let r=new g({color:1252135,metalness:.9,roughness:.36,envMapIntensity:.5});r.onBeforeCompile=e=>{e.uniforms.uTime=this._time,e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
          attribute vec2 aState;
          varying vec2 vState; varying vec3 vLocal;`).replace(`#include <begin_vertex>`,`#include <begin_vertex>
          vState = aState; vLocal = position;`),e.fragmentShader=e.fragmentShader.replace(`#include <common>`,`#include <common>
          uniform float uTime;
          varying vec2 vState; varying vec3 vLocal;`).replace(`#include <emissivemap_fragment>`,`#include <emissivemap_fragment>
          {
            // The striking face is the plane at local z = 0. Two features
            // only: a blade up the face, and a rail along its top edge so the
            // element still reads from a camera looking down on it. Lighting
            // the whole face turns the wedge into a pale slab.
            float y = vLocal.y / ${V.slingH.toFixed(3)};
            float face = smoothstep(0.09, 0.0, abs(vLocal.z));
            float blade = face * smoothstep(0.34, 0.58, y);
            float rail = smoothstep(0.30, 0.0, vLocal.z) * smoothstep(0.72, 0.94, y);
            float pulse = 0.6 + 0.4 * sin(uTime * 3.1 + vState.y * 6.28);
            vec3 c = vec3(1.0, 0.58, 0.15);
            totalEmissiveRadiance += c * (blade * (0.75 + pulse * 0.5) + rail * (0.5 + pulse * 0.4));
            totalEmissiveRadiance += (c + vec3(1.0) * vState.x) * vState.x * (face * 2.6 + rail * 1.8 + 0.3);
          }`)},r.customProgramCacheKey=()=>`sling-body`,this.slingMat=r,this.sling=new a(this.slingGeo,r,t),this._attr(this.slingGeo,`aState`,this.slingState,2),this.sling.castShadow=!1,this.sling.receiveShadow=!0,this.sling.frustumCulled=!1,this.sling.name=`slings`,this._placeInstances(),this.scene.add(this.body,this.crown,this.sling)}_attr(e,t,n,r){let i=new b(n,r);return i.setUsage(C),e.setAttribute(t,i),this._attrs.push(i),i}_placeInstances(){this.bumpers.forEach((e,t)=>{this.bumperState[t*2+1]=e.seed}),this.slings.forEach((e,t)=>{this.slingState[t*2+1]=e.seed})}reset(){for(let e of this.bumpers)e.flash=0,e.cool=0;for(let e of this.slings)e.flash=0,e.cool=0;this.phase=Qt,this.timer=V.downTime,this.lift=-2,this.well=Math.floor(Math.random()*4),this._warned=!1,this.justDeployed=!1,this.justRetracted=!1,this.justWarned=!1,this._applyLift()}get live(){return this.phase===en}activeBumpers(){return this.bumpers.filter(e=>e.well===this.well)}activeSlings(){return this.slings.filter(e=>e.well===this.well)}get cycle01(){return this.phase===en?U(this.timer/V.upTime,0,1):this.phase===Qt?U(1-this.timer/V.downTime,0,1):+(this.phase===$t)}_applyLift(){let e=this.lift,t=e<=-1.999;for(let e of[this.body,this.crown,this.sling])e.position.y=0,e.visible=!t;if(t)return;let n=nn,r=rn,i=an,a=on;this.bumpers.forEach((t,o)=>{let s=t.well===this.well;i.set(t.x,P.floorY+e,t.z),r.setFromAxisAngle(sn,t.seed*Math.PI),a.setScalar(+!!s),n.compose(i,r,a),this.body.setMatrixAt(o,n),this.crown.setMatrixAt(o,n)}),this.slings.forEach((t,o)=>{let s=t.well===this.well;i.set(t.x,P.floorY+e,t.z),r.setFromAxisAngle(sn,Math.atan2(-t.nx,-t.nz)),a.setScalar(+!!s),n.compose(i,r,a),this.sling.setMatrixAt(o,n)}),this.body.instanceMatrix.needsUpdate=!0,this.crown.instanceMatrix.needsUpdate=!0,this.sling.instanceMatrix.needsUpdate=!0}_cycle(e){switch(this.justDeployed=!1,this.justRetracted=!1,this.justWarned=!1,this.timer-=e,this.phase){case Qt:this.timer<=V.warnTime&&!this._warned&&(this._warned=!0,this.well=(this.well+1)%4,this.justWarned=!0),this.timer<=0&&(this.phase=$t,this.timer=V.riseTime,this._warned=!1,this.justDeployed=!0);break;case $t:this.timer<=0&&(this.phase=en,this.timer=V.upTime);break;case en:this.timer<=0&&(this.phase=tn,this.timer=V.riseTime,this.justRetracted=!0);break;case tn:this.timer<=0&&(this.phase=Qt,this.timer=V.downTime)}let t=1;this.phase===Qt?t=0:this.phase===$t?t=1-U(this.timer/V.riseTime,0,1):this.phase===tn&&(t=U(this.timer/V.riseTime,0,1));let n=this.phase===$t?1-(1-t)**3:t;this.lift=-2*(1-n),this._applyLift()}collide(e,t){if(this.phase!==en)return!1;let n=z.radius;for(let r of this.bumpers){if(r.well!==this.well||r.cool>0)continue;let i=e.x-r.x,a=e.z-r.z,o=r.r+n,s=i*i+a*a;if(s>o*o)continue;let c=Math.sqrt(s),l,u;if(c>1e-5)l=i/c,u=a/c;else{let t=Math.hypot(e.vx,e.vz)||1;l=-e.vx/t,u=-e.vz/t}let d=Math.hypot(e.vx,e.vz)||1,f=(e.vx*l+e.vz*u)/d,p=e.vx/d-2*f*l,m=e.vz/d-2*f*u,h=p*.42+l*.72,g=m*.42+u*.72,_=Math.atan2(g,h)+K(-V.scatter,V.scatter),v=U(d+V.kick,V.kickFloor,z.maxSpeed);return e.vx=Math.cos(_)*v,e.vz=Math.sin(_)*v,e.speed=v,e.x=r.x+l*(o+.02),e.z=r.z+u*(o+.02),e.registerImpact(-l,-u,1),r.flash=1,r.cool=V.cool,t.push({type:`bumper`,x:e.x,z:e.z,nx:l,nz:u,speed:v,el:r}),!0}for(let r of this.slings){if(r.well!==this.well)continue;let i=e.x-r.x,a=e.z-r.z,o=i*r.nx+a*r.nz,s=i*r.tx+a*r.tz;if(o<-r.depth-n||o>n||Math.abs(s)>r.half+n)continue;let c=U(o,-r.depth,0),l=U(s,-r.half,r.half),u=o-c,d=s-l,f=u*u+d*d,p,m,h;if(f>1e-8){if(f>n*n)continue;let e=Math.sqrt(f);p=u/e,m=d/e,h=n-e+.02}else{let e=-o,t=o+r.depth,i=r.half-Math.abs(s);e<=t&&e<=i?(p=1,m=0,h=e+n+.02):t<=i?(p=-1,m=0,h=t+n+.02):(p=0,m=Math.sign(s)||1,h=i+n+.02)}let g=r.nx*p+r.tx*m,_=r.nz*p+r.tz*m,v=e.vx*g+e.vz*_<0;if(e.x+=g*h,e.z+=_*h,p>.5&&v&&r.cool<=0){let n=U(s/r.half,-1,1),i=r.nx+r.tx*n*V.slingSpread,a=r.nz+r.tz*n*V.slingSpread,o=Math.hypot(i,a)||1,c=V.slingSpeed;return e.vx=i/o*c,e.vz=a/o*c,e.speed=c,e.registerImpact(-r.nx,-r.nz,1.3),r.flash=1,r.cool=V.cool,t.push({type:`sling`,x:e.x,z:e.z,nx:r.nx,nz:r.nz,speed:c,u01:n*.5+.5,el:r}),!0}if(v){let n=e.vx*g+e.vz*_;return e.vx-=2*n*g,e.vz-=2*n*_,e.registerImpact(-g,-_,.5),t.push({type:`wall`,orb:e,x:e.x,z:e.z,nx:g,nz:_,speed:e.speed,goal:-1}),!0}return!1}return!1}update(e,t){this._time&&(this._time.value=t),this._cycle(e);for(let t=0;t<this.bumpers.length;t++){let n=this.bumpers[t];n.cool=Math.max(0,n.cool-e),n.flash=Math.max(0,n.flash-e*3.6),this.bumperState[t*2]=n.flash}for(let t=0;t<this.slings.length;t++){let n=this.slings[t];n.cool=Math.max(0,n.cool-e),n.flash=Math.max(0,n.flash-e*3),this.slingState[t*2]=n.flash}for(let e of this._attrs)e.needsUpdate=!0}dispose(){this.bodyGeo.dispose(),this.crownGeo.dispose(),this.slingGeo.dispose(),this.bodyMat.dispose(),this.crownMat.dispose(),this.slingMat.dispose(),this.scene.remove(this.body,this.crown,this.sling)}},ln=V.warnTime,Y=11824127,un=class{constructor(e,t=10){this.items=[];let n=new x(.78,1,48,1);n.rotateX(-Math.PI/2),this.geo=n;for(let r=0;r<t;r++){let t=new d({transparent:!0,depthWrite:!1,blending:2,side:2,uniforms:{uColor:{value:new k(1,1,1)},uFade:{value:0}},vertexShader:`varying vec2 vU; void main(){ vU=uv;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,fragmentShader:`precision mediump float; varying vec2 vU;
          uniform vec3 uColor; uniform float uFade;
          void main(){
            // Soft across the band, hard-ish on the leading edge.
            float a = smoothstep(0.0,0.35,vU.y) * smoothstep(1.0,0.55,vU.y);
            a *= uFade;
            gl_FragColor = vec4(uColor*a*2.2, a);
          }`}),r=new p(n,t);r.visible=!1,r.renderOrder=5,e.add(r),this.items.push({mesh:r,mat:t,life:0,dur:1,from:1,to:6,tilt:0})}this.cursor=0}spawn(e,t,n,r,i,a,o,s=0,c=0){let l=this.items.find(e=>e.life<=0);return l||(l=this.items[this.cursor],this.cursor=(this.cursor+1)%this.items.length),l.life=a,l.dur=a,l.from=r,l.to=i,l.tilt=s,l.mesh.position.set(e,t,n),l.mesh.rotation.set(s,c,0),l.mesh.visible=!0,l.mat.uniforms.uColor.value.set(o).convertSRGBToLinear(),l.mat.uniforms.uFade.value=1,l}update(e){for(let t of this.items){if(t.life<=0)continue;if(t.life-=e,t.life<=0){t.mesh.visible=!1;continue}let n=1-t.life/t.dur,r=1-(1-n)**2.6,i=W(t.from,t.to,r);t.mesh.scale.set(i,i,i),t.mat.uniforms.uFade.value=(1-n)**1.7}}dispose(){this.geo.dispose();for(let e of this.items)e.mat.dispose(),e.mesh.parent?.remove(e.mesh)}},dn=class{constructor(e,t,n,r,i){this.scene=e,this.arena=t,this.cam=n,this.audio=r,this.preset=i,this.sparks=new qt(i.sparks,Math.min(devicePixelRatio||1,2)),e.add(this.sparks.points),this.rings=new un(e,i.sparks>400?12:7),this.flash=0,this.flashColor=new k(1,1,1),this.radial=0}setPixelRatio(e){this.sparks.setPixelRatio(e)}update(e,t){this.sparks.update(e,t),this.rings.update(e),this.flash=Math.max(0,this.flash-e*4.2),this.radial=Math.max(0,this.radial-e*3.4)}deflect(e){let t=e.craft,n=F[t.index],r=U((e.speed-15)/25,0,1),i=-t.nx,a=-t.nz;this.sparks.burst({at:[e.x,P.playY,e.z],dir:[i,.35,a],spread:.62,count:Math.round(W(8,20,r)*(this.preset.sparks/520+.4)),speedMin:6,speedMax:16+r*14,lifeMin:.16,lifeMax:.42,sizeMin:5,sizeMax:13,color:n.color,color2:16777215,kind:1,drag:3.4,grav:-7,jitter:.3}),this.rings.spawn(e.x,P.playY-.75,e.z,.25,2.4+r*1.6,.42,n.color),this.arena.shock(e.x,e.z,.55+r*.5,n.color),this.arena.hitBarrier(t.index,e.u01,.18),t.onDeflect(e.u01,e.power),this.audio.deflect(r,.75+e.power*.35,t.index/3),t.index===0?(this.cam.shake(.09+r*.1),this.cam.punch(.7+r*.9)):this.cam.shake(.035+r*.03)}wall(e){let t=U((e.speed-15)/25,0,1),n=e.goal>=0?16754237:6281471;this.sparks.burst({at:[e.x,P.playY,e.z],dir:[-e.nx,.5,-e.nz],spread:.75,count:Math.round(W(4,11,t)*(this.preset.sparks/520+.4)),speedMin:4,speedMax:11+t*8,lifeMin:.12,lifeMax:.34,sizeMin:4,sizeMax:9,color:n,color2:16777215,kind:1,drag:4.2,grav:-8}),this.arena.shock(e.x,e.z,.28+t*.3,n),this.audio.wall(t),this.cam.shake(.02+t*.03)}orbClash(e){(e.speed-15)/25,this.sparks.burst({at:[e.x,P.playY,e.z],spread:2,count:Math.round(16*(this.preset.sparks/520+.4)),speedMin:5,speedMax:15,lifeMin:.2,lifeMax:.5,sizeMin:4,sizeMax:11,color:16777215,color2:8382719,kind:0,drag:3,grav:-6}),this.rings.spawn(e.x,P.playY,e.z,.2,2.6,.4,12578815,-Math.PI/2),this.arena.shock(e.x,e.z,.5,12578815),this.audio.clash(),this.cam.shake(.07)}goal(e,t){let n=F[e.victim],r=this.preset.sparks;this.sparks.burst({at:[e.x,P.playY,e.z],spread:2,count:Math.round(46*(r/520+.5)),speedMin:8,speedMax:30,lifeMin:.3,lifeMax:.95,sizeMin:6,sizeMax:20,color:n.color,color2:16777215,kind:1,drag:2.2,grav:-11,jitter:.6}),this.sparks.burst({at:[e.x,P.playY,e.z],spread:2,count:Math.round(22*(r/520+.5)),speedMin:3,speedMax:12,lifeMin:.5,lifeMax:1.4,sizeMin:10,sizeMax:26,color:n.color,color2:16747082,kind:0,drag:1.6,grav:-2.5});let i=this.arena.planes[e.victim];this.rings.spawn(e.x,P.playY,e.z,.4,7,.7,n.color,0,Math.atan2(i.nx,i.nz)),this.rings.spawn(e.x,P.playY-.8,e.z,.4,11,.85,n.color),this.arena.shock(e.x,e.z,2,n.color),this.arena.hitBarrier(e.victim,e.u01,1.4),this.flash=t?.42:.2,this.flashColor.set(n.color).convertSRGBToLinear().lerp(new k(1,1,1),.55),this.radial=t?1.5:.7,this.audio.goal(t),this.cam.shake(t?.62:.34),this.cam.punch(t?5.5:3),this.cam.kick(-i.nx,-i.nz,t?.55:.3)}eliminate(e){let t=F[e.index],n=e.worldPos(new O),r=this.preset.sparks;this.sparks.burst({at:[n.x,n.y,n.z],spread:2,count:Math.round(90*(r/520+.5)),speedMin:10,speedMax:42,lifeMin:.4,lifeMax:1.3,sizeMin:7,sizeMax:24,color:t.color,color2:16777215,kind:1,drag:1.8,grav:-13,jitter:1.2}),this.sparks.burst({at:[n.x,n.y,n.z],spread:2,count:Math.round(40*(r/520+.5)),speedMin:4,speedMax:18,lifeMin:.8,lifeMax:2.2,sizeMin:14,sizeMax:40,color:16742954,color2:4199946,kind:0,drag:1.1,grav:-1.4,jitter:1.4}),this.sparks.burst({at:[n.x,n.y,n.z],spread:2,count:Math.round(26*(r/520+.5)),speedMin:6,speedMax:26,lifeMin:.9,lifeMax:2,sizeMin:8,sizeMax:18,color:10466249,color2:t.color,kind:2,drag:.9,grav:-16,jitter:1}),this.rings.spawn(n.x,P.playY-.8,n.z,.5,17,1.15,t.color),this.rings.spawn(n.x,P.playY,n.z,.5,9,.8,16777215,0,Math.atan2(e.nx,e.nz)),this.arena.shock(n.x,n.z,3,t.color),this.arena.sealBarrier(e.index),this.flash=.62,this.flashColor.set(16765088).convertSRGBToLinear(),this.radial=2.2,this.audio.explode(),this.cam.shake(.95),this.cam.punch(7)}arcIgnite(e){let t=F[e.index],n=this.preset.sparks,r=e.arcDist,i=P.half-P.chamfer,a=Math.round(14*(n/520+.5));for(let n=0;n<a;n++){let o=(n/(a-1)-.5)*2*i;this.sparks.burst({at:[e.nx*r+e.tx*o,P.playY+K(-.2,1.4),e.nz*r+e.tz*o],dir:[-e.nx,.5,-e.nz],spread:.85,count:3,speedMin:3,speedMax:13,lifeMin:.14,lifeMax:.5,sizeMin:4,sizeMax:12,color:16777215,color2:t.color,kind:1,drag:3.6,grav:-5,jitter:.5})}let o=e.worldPos(new O);this.rings.spawn(o.x,P.playY-.8,o.z,.4,9,.6,t.color),this.rings.spawn(o.x,P.playY,o.z,.3,5,.45,16777215,0,Math.atan2(e.nx,e.nz)),this.arena.shock(o.x,o.z,1.5,t.color),this.flash=e.index===0?.34:.16,this.flashColor.set(14217471).convertSRGBToLinear(),this.audio.arcOn(),this.cam.shake(e.index===0?.34:.16),this.cam.punch(e.index===0?3.2:1.4)}arcStrike(e){let t=e.craft,n=F[t.index],r=U((e.speed-15)/20,0,1);this.sparks.burst({at:[e.x,P.playY,e.z],dir:[-t.nx,.45,-t.nz],spread:.55,count:Math.round(W(14,28,r)*(this.preset.sparks/520+.4)),speedMin:8,speedMax:24+r*14,lifeMin:.12,lifeMax:.4,sizeMin:5,sizeMax:14,color:16777215,color2:n.color,kind:1,drag:3.2,grav:-8,jitter:.4}),this.sparks.burst({at:[e.x,P.playY,e.z],spread:2,count:Math.round(6*(this.preset.sparks/520+.4)),speedMin:1,speedMax:5,lifeMin:.4,lifeMax:.9,sizeMin:8,sizeMax:18,color:n.color,color2:10475775,kind:0,drag:2.2,grav:-1.5}),this.rings.spawn(e.x,P.playY-.78,e.z,.2,3.4,.4,16777215),this.arena.shock(e.x,e.z,.8+r*.5,n.color),this.audio.arcHit(r),this.cam.shake(t.index===0?.16:.05),t.index===0&&this.cam.punch(1.1)}arcCrackle(e,t){if(this._crackle=(this._crackle||0)+t*26,this._crackle<1)return;this._crackle=0;let n=F[e.index],r=e.arcDist,i=P.half-P.chamfer,a=K(-i,i);this.sparks.burst({at:[e.nx*r+e.tx*a,P.playY+K(-.3,1.5),e.nz*r+e.tz*a],dir:[-e.nx,.3,-e.nz],spread:1.1,count:1,speedMin:2,speedMax:9,lifeMin:.1,lifeMax:.32,sizeMin:3,sizeMax:9,color:16777215,color2:n.color,kind:1,drag:4,grav:-6})}arcExpire(e){let t=F[e.index],n=e.worldPos(new O);this.rings.spawn(n.x,P.playY-.8,n.z,6,.5,.4,t.color),this.audio.arcOff()}brickHit(e){let t=U((e.speed-12)/20,0,1);this.sparks.burst({at:[e.x,P.playY,e.z],dir:[e.nx,.55,e.nz],spread:.7,count:Math.round(W(4,10,t)*(this.preset.sparks/520+.4)),speedMin:4,speedMax:12+t*9,lifeMin:.12,lifeMax:.34,sizeMin:4,sizeMax:10,color:e.tint,color2:16777215,kind:1,drag:4,grav:-9,jitter:.35}),this.sparks.burst({at:[e.x,P.playY,e.z],dir:[e.nx,.8,e.nz],spread:1,count:Math.round(3*(this.preset.sparks/520+.4)),speedMin:3,speedMax:9,lifeMin:.4,lifeMax:.8,sizeMin:5,sizeMax:10,color:10466249,color2:e.tint,kind:2,drag:1.4,grav:-15}),this.arena.shock(e.x,e.z,.22+t*.22,e.tint),this.audio.brickHit(t,e.hp01),this.cam.shake(.015+t*.02)}brickBreak(e){let t=this.preset.sparks;this.sparks.burst({at:[e.x,P.playY,e.z],spread:2,count:Math.round(26*(t/520+.5)),speedMin:6,speedMax:22,lifeMin:.25,lifeMax:.7,sizeMin:5,sizeMax:15,color:e.tint,color2:16777215,kind:1,drag:2.6,grav:-12,jitter:.7}),this.sparks.burst({at:[e.x,P.playY,e.z],spread:2,count:Math.round(14*(t/520+.5)),speedMin:4,speedMax:15,lifeMin:.6,lifeMax:1.4,sizeMin:7,sizeMax:16,color:9414333,color2:e.tint,kind:2,drag:1.1,grav:-17,jitter:1}),this.sparks.burst({at:[e.x,P.playY,e.z],spread:2,count:Math.round(8*(t/520+.5)),speedMin:1,speedMax:6,lifeMin:.5,lifeMax:1.1,sizeMin:10,sizeMax:22,color:e.tint,color2:16751178,kind:0,drag:1.8,grav:-2}),this.rings.spawn(e.x,P.playY-.85,e.z,.3,5.5,.55,e.tint),this.arena.shock(e.x,e.z,.85,e.tint),this.audio.brickBreak(e.maxHp),this.cam.shake(.075),e.by===0&&this.cam.punch(.9)}salvagePoint(e){let t=F[e.index],n=e.worldPos(new O);this.sparks.burst({at:[n.x,n.y,n.z],dir:[-e.nx,.9,-e.nz],spread:.9,count:Math.round(22*(this.preset.sparks/520+.4)),speedMin:5,speedMax:17,lifeMin:.35,lifeMax:.9,sizeMin:5,sizeMax:13,color:16777215,color2:t.color,kind:1,drag:2.4,grav:-3,jitter:.8}),this.rings.spawn(n.x,P.playY-.8,n.z,.4,7,.6,t.color),this.arena.shock(n.x,n.z,1.1,t.color),this.audio.salvage(),e.index===0&&(this.flash=.16,this.flashColor.set(t.color).convertSRGBToLinear().lerp(new k(1,1,1),.6),this.cam.punch(1.4))}brickSurface(e){let t=this.preset.sparks;this.sparks.burst({at:[e.x,P.floorY+.1,e.z],dir:[0,1,0],spread:.9,count:Math.round(9*(t/520+.4)),speedMin:2,speedMax:9,lifeMin:.25,lifeMax:.6,sizeMin:4,sizeMax:11,color:9431295,color2:16777215,kind:1,drag:2.8,grav:-6,jitter:.5}),this.rings.spawn(e.x,P.playY-.85,e.z,.2,3.4,.5,9431295),this.arena.shock(e.x,e.z,.5,9431295),this.audio.brickSurface()}blackHoleWarn(e){this.rings.spawn(e.x,P.playY-.86,e.z,H.radius*.9,.5,H.warnTime,Y),this.arena.shock(e.x,e.z,1.1,Y),this.audio.blackHoleWarn()}blackHoleOpen(e){let t=this.preset.sparks;this.sparks.burst({at:[e.x,P.playY,e.z],spread:2,count:Math.round(40*(t/520+.5)),speedMin:9,speedMax:30,lifeMin:.3,lifeMax:.9,sizeMin:6,sizeMax:18,color:16777215,color2:Y,kind:1,drag:2.2,grav:-3,jitter:.9}),this.rings.spawn(e.x,P.playY-.85,e.z,.4,13,.85,Y),this.rings.spawn(e.x,P.playY,e.z,.3,6,.6,16777215,-Math.PI/2),this.arena.shock(e.x,e.z,2.4,Y),this.flash=.3,this.flashColor.set(13215487).convertSRGBToLinear(),this.radial=1.3,this.audio.blackHoleOpen(),this.cam.shake(.5),this.cam.punch(3.4)}blackHoleAmbient(e,t){if(this._bhAcc=(this._bhAcc||0)+t*(14+e.strength*24),this._bhAcc<1)return;this._bhAcc=0;let n=K(0,Math.PI*2),r=H.radius*K(.45,1),i=e.x+Math.cos(n)*r,a=e.z+Math.sin(n)*r,o=n+Math.PI+K(.5,1);this.sparks.burst({at:[i,P.playY+K(-.3,.5),a],dir:[Math.cos(o),.05,Math.sin(o)],spread:.16,count:1,speedMin:6,speedMax:13,lifeMin:.35,lifeMax:.7,sizeMin:4,sizeMax:10,color:Y,color2:16767392,kind:1,drag:.4,grav:0})}blackHoleClose(e){this.rings.spawn(e.x,P.playY-.85,e.z,9,.3,.75,Y),this.sparks.burst({at:[e.x,P.playY,e.z],spread:2,count:Math.round(16*(this.preset.sparks/520+.4)),speedMin:2,speedMax:9,lifeMin:.3,lifeMax:.8,sizeMin:5,sizeMax:14,color:Y,color2:16777215,kind:0,drag:2.4,grav:-2}),this.arena.shock(e.x,e.z,1.4,Y),this.audio.blackHoleClose(),this.cam.shake(.22)}pinballWarn(e){for(let t of e.activeBumpers())this.rings.spawn(t.x,P.playY-.86,t.z,2.6,.4,ln,J),this.arena.shock(t.x,t.z,.45,J);this.audio.pinballWarn()}pinballDeploy(e){let t=this.preset.sparks;for(let n of e.activeBumpers())this.sparks.burst({at:[n.x,P.floorY+.1,n.z],dir:[0,1,0],spread:.55,count:Math.round(14*(t/520+.4)),speedMin:5,speedMax:16,lifeMin:.2,lifeMax:.6,sizeMin:5,sizeMax:13,color:16777215,color2:J,kind:1,drag:3,grav:-8,jitter:.5}),this.rings.spawn(n.x,P.playY-.85,n.z,.3,4.6,.55,J),this.arena.shock(n.x,n.z,.9,J);for(let t of e.activeSlings())this.arena.shock(t.x,t.z,.7,J);this.flash=.18,this.flashColor.set(16767392).convertSRGBToLinear(),this.audio.pinballDeploy(),this.cam.shake(.3),this.cam.punch(2.2)}pinballRetract(e){for(let t of e.activeBumpers())this.rings.spawn(t.x,P.playY-.85,t.z,3.2,.3,.45,J),this.arena.shock(t.x,t.z,.4,J);this.audio.pinballRetract(),this.cam.shake(.1)}bumper(e){let t=U((e.speed-15)/18,0,1);this.sparks.burst({at:[e.x,P.playY,e.z],dir:[e.nx,.6,e.nz],spread:.8,count:Math.round(W(10,20,t)*(this.preset.sparks/520+.4)),speedMin:7,speedMax:20+t*10,lifeMin:.14,lifeMax:.42,sizeMin:5,sizeMax:13,color:16777215,color2:J,kind:1,drag:3.4,grav:-7,jitter:.5}),this.rings.spawn(e.x,P.playY,e.z,.2,3,.36,J,0,Math.atan2(e.nx,e.nz)),this.rings.spawn(e.x,P.playY-.8,e.z,.2,3.6,.42,J),this.arena.shock(e.x,e.z,.6,J),this.audio.bumper(t),this.cam.shake(.05+t*.04)}sling(e){let t=this.preset.sparks;this.sparks.burst({at:[e.x,P.playY,e.z],dir:[e.nx,.4,e.nz],spread:.42,count:Math.round(24*(t/520+.4)),speedMin:12,speedMax:34,lifeMin:.16,lifeMax:.5,sizeMin:5,sizeMax:15,color:16777215,color2:J,kind:1,drag:2.4,grav:-6,jitter:.3}),this.sparks.burst({at:[e.x,P.playY,e.z],spread:2,count:Math.round(6*(t/520+.4)),speedMin:1,speedMax:5,lifeMin:.4,lifeMax:1,sizeMin:9,sizeMax:20,color:J,color2:16767392,kind:0,drag:2,grav:-1.2}),this.rings.spawn(e.x,P.playY,e.z,.3,5,.42,16769200,0,Math.atan2(e.nx,e.nz)),this.arena.shock(e.x,e.z,1,J),this.audio.sling(),this.cam.shake(.11),this.cam.kick(e.nx,e.nz,.14)}surge(e){let t=e.worldPos(new O),n=F[e.index];this.sparks.burst({at:[t.x,t.y,t.z],dir:[-e.nx,.2,-e.nz],spread:.5,count:Math.round(18*(this.preset.sparks/520+.4)),speedMin:6,speedMax:20,lifeMin:.2,lifeMax:.5,sizeMin:5,sizeMax:12,color:16777215,color2:n.color,kind:1,drag:3,grav:-4,jitter:1.4}),this.rings.spawn(t.x,P.playY-.8,t.z,.4,5.5,.5,16777215),this.audio.surge(),e.index===0&&this.cam.punch(1.6)}serveCharge(e){if(this.arena.setCharge(e),e>.02&&Math.random()<e*.5){let t=K(0,Math.PI*2),n=W(11,1.2,e);this.sparks.burst({at:[Math.cos(t)*n,P.playY,Math.sin(t)*n],dir:[-Math.cos(t),.1,-Math.sin(t)],spread:.25,count:2,speedMin:8,speedMax:18,lifeMin:.2,lifeMax:.45,sizeMin:4,sizeMax:9,color:10481663,color2:16777215,kind:1,drag:1.2,grav:0})}}serveBurst(e,t,n){this.sparks.burst({at:[e,P.playY,t],dir:[Math.sin(n),.2,Math.cos(n)],spread:.7,count:Math.round(26*(this.preset.sparks/520+.4)),speedMin:8,speedMax:24,lifeMin:.2,lifeMax:.55,sizeMin:5,sizeMax:14,color:9431295,color2:16777215,kind:1,drag:2.6,grav:-4}),this.rings.spawn(e,P.playY-.8,t,.3,8,.6,9431295),this.arena.shock(e,t,.8,9431295),this.cam.shake(.14),this.cam.punch(2)}clear(){this.sparks.clear()}dispose(){this.sparks.dispose(),this.rings.dispose()}},fn=4,pn=0,mn=1,hn=2,gn=3,_n=4,vn=`
float bHash(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float bNoise(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(bHash(i), bHash(i + vec3(1,0,0)), f.x),
                 mix(bHash(i + vec3(0,1,0)), bHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(bHash(i + vec3(0,0,1)), bHash(i + vec3(1,0,1)), f.x),
                 mix(bHash(i + vec3(0,1,1)), bHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}`,yn=`
  float hp = vState.x;             // 1 = pristine, 0 = one hit from gone
  float flash = vState.y;
  float seed = vState.z;

  float ex = abs(vLocal.x) * 2.0;  // 0 at the centre, 1 at the long edge
  float ez = abs(vLocal.z) * 2.0;
  float edge = max(ex, ez);

  // One hairline seam around the shoulder, and an inset panel on the top face
  // picked out by its outline rather than filled with light. The camera sits
  // high enough that the top face is most of what a block presents, so this is
  // the difference between machined hardware and a lit tile.
  float seam = smoothstep(0.60, 0.66, vLocal.y) * smoothstep(0.77, 0.71, vLocal.y)
             * smoothstep(0.86, 0.96, edge);

  float top = smoothstep(0.93, 1.0, vLocal.y);
  float inZ = step(ez, 0.52), inX = step(ex, 0.76);
  float outline = max(smoothstep(0.07, 0.0, abs(ez - 0.52)) * inX,
                      smoothstep(0.05, 0.0, abs(ex - 0.76)) * inZ);
  float panel = top * inZ * inX;
  float slot = top * outline;

  // Fissures open as hit points are spent, so damage is legible before a block
  // breaks. The threshold is *tight* — a wide one produces crazy paving over
  // the whole shell, which reads as a texture rather than as damage. Intensity
  // carries the severity instead: faint dark lines at first, glowing ones when
  // the block is one hit from gone.
  float damage = 1.0 - hp;
  vec3 q = (vLocal + seed * 7.3) * vec3(8.5, 3.6, 8.5);
  float n = bNoise(q) * 0.68 + bNoise(q * 2.6) * 0.32;
  float ridge = 1.0 - abs(n * 2.0 - 1.0);
  float crack = smoothstep(0.965, 0.998, ridge) * step(0.02, damage);
`,bn=class{constructor(e,t){this.scene=e,this.preset=t,this.count=B.perQuadrant*fn,this.bricks=[],this.liveCount=0,this.spawned=0,this._nextAt=0,this.justSpawned=[];let{w:r,d:i,h:a}=B;this.geo=Yt(r,i,a,B.bevel),this.auraGeo=Yt(r+.16,i+.16,a+.1,B.bevel),this.state=new Float32Array(this.count*3),this.tint=new Float32Array(this.count*3),this._attrs=[],this.shell=this._buildShell(),this.aura=this._buildAura(),e.add(this.shell,this.aura),this._m=new oe,this._q=new n,this._pos=new O,this._scl=new O,this._col=new k}_attr(e,t,n,r){let i=new b(n,r);return i.setUsage(C),e.setAttribute(t,i),this._attrs.push(i),i}_buildShell(){this._attr(this.geo,`aState`,this.state,3),this._attr(this.geo,`aTint`,this.tint,3);let e=new g({color:1252135,metalness:.9,roughness:.34,envMapIntensity:.85}),t=new O(B.w,B.h,B.d);e.onBeforeCompile=e=>{e.uniforms.uDim={value:t},e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
          attribute vec3 aState; attribute vec3 aTint;
          uniform vec3 uDim;
          varying vec3 vState; varying vec3 vTint; varying vec3 vLocal;`).replace(`#include <begin_vertex>`,`#include <begin_vertex>
          vState = aState; vTint = aTint;
          vLocal = vec3(position.x / uDim.x, position.y / uDim.y, position.z / uDim.z);`),e.fragmentShader=e.fragmentShader.replace(`#include <common>`,`#include <common>
          varying vec3 vState; varying vec3 vTint; varying vec3 vLocal;
          ${vn}`).replace(`#include <roughnessmap_fragment>`,`#include <roughnessmap_fragment>
          {
            // Polish the top face only; the walls stay matte so the block
            // keeps a readable silhouette against a bright deck.
            roughnessFactor = mix(roughnessFactor, 0.16, smoothstep(0.92, 1.0, vLocal.y) * 0.55);
          }`).replace(`#include <emissivemap_fragment>`,`#include <emissivemap_fragment>
          {
            ${yn}
            // A fracture reads as heat: the block holds energy in, and loses
            // containment exactly where it is split.
            vec3 hot = vec3(1.0, 0.40, 0.11);
            vec3 glow = vTint * (seam * 0.5 + slot * 0.8 + panel * 0.07) * (0.32 + hp * 0.68);
            glow += hot * crack * (0.2 + damage * damage * 1.9);
            // The panel itself is darker than the shell around it, which is
            // what makes the outline read as an inset rather than a decal.
            diffuseColor.rgb *= 1.0 - panel * 0.45;
            glow += (vTint * 1.6 + vec3(1.0) * flash) * flash;
            diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.25,
              min(1.0, crack * (0.5 + damage)));
            totalEmissiveRadiance += glow;
          }`)},e.customProgramCacheKey=()=>`brick-shell`,this.shellMat=e;let n=new a(this.geo,e,this.count);return n.name=`bricks`,n.frustumCulled=!1,n.castShadow=!1,n.receiveShadow=!0,n.instanceMatrix.setUsage(C),n}_buildAura(){this._attr(this.auraGeo,`aState`,this.state,3),this._attr(this.auraGeo,`aTint`,this.tint,3);let e=new d({transparent:!0,depthWrite:!1,blending:2,uniforms:{uDim:{value:new O(B.w,B.h,B.d)}},vertexShader:`
        attribute vec3 aState; attribute vec3 aTint;
        uniform vec3 uDim;
        varying vec3 vState; varying vec3 vTint; varying vec3 vLocal; varying vec3 vNrm; varying vec3 vView;
        void main() {
          vState = aState; vTint = aTint;
          vLocal = vec3(position.x / uDim.x, position.y / uDim.y, position.z / uDim.z);
          vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
          vNrm = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
          vView = normalize(cameraPosition - wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,fragmentShader:`
        precision mediump float;
        varying vec3 vState; varying vec3 vTint; varying vec3 vLocal; varying vec3 vNrm; varying vec3 vView;
        ${vn}
        void main() {
          ${yn}
          // Silhouette-only: a fresnel rim so the aura hugs the block's edge
          // instead of fogging its faces.
          float fres = pow(clamp(1.0 - abs(dot(normalize(vNrm), vView)), 0.0, 1.0), 2.6);
          float a = fres * (0.13 + hp * 0.11) + seam * 0.20 + slot * 0.26;
          a += crack * damage * 0.5 + flash * 0.85;
          a = clamp(a, 0.0, 1.0);
          vec3 col = vTint * (1.0 + flash * 2.0) + vec3(1.0) * flash * 0.8;
          gl_FragColor = vec4(col * a * 1.1, a * 0.70);
        }`});this.auraMat=e;let t=new a(this.auraGeo,e,this.count);return t.name=`bricks:aura`,t.frustumCulled=!1,t.renderOrder=6,t.instanceMatrix.setUsage(C),t}reset(e=[]){let t=[],{w:n,d:r,innerR:i,outerR:a,minGap:o,wellClear:s}=B,c=n=>{let r=Math.hypot(Math.abs(n.x)+n.hw,Math.abs(n.z)+n.hd),c=Math.max(0,Math.abs(n.x)-n.hw),l=Math.max(0,Math.abs(n.z)-n.hd);if(r>a||Math.hypot(c,l)<i)return!1;for(let t of e){let e=U(t.x-n.x,-n.hw,n.hw),r=U(t.z-n.z,-n.hd,n.hd);if(Math.hypot(t.x-n.x-e,t.z-n.z-r)<t.r+s)return!1}for(let e of t)if(Math.abs(n.x-e.x)<n.hw+e.hw+o&&Math.abs(n.z-e.z)<n.hd+e.hd+o)return!1;return!0},l=0;for(let e=0;e<6e3&&l<B.perQuadrant;e++){let e=K(0,Math.PI*.5),o=Math.sqrt(K(i*i,a*a)),s=Math.random()<.5,u=[],d=Math.cos(e)*o,f=Math.sin(e)*o,p=(s?r:n)*.5,m=(s?n:r)*.5,h=!0;for(let e=0;e<fn;e++){let e={x:d,z:f,hw:p,hd:m,rot:p<m?Math.PI/2:0};if(!c(e)){h=!1;break}u.push(e);let t=-f;f=d,d=t;let n=m;m=p,p=n}if(h){for(let e of u)t.push({...e,group:l});l++}}this.spawned=0,this._nextAt=B.spawnFirst,this.justSpawned=[],this.bricks=t.map((e,t)=>{let n=Math.hypot(e.x,e.z)<B.hpSplit?B.hpInner:B.hpOuter;return{i:t,x:e.x,z:e.z,hw:e.hw,hd:e.hd,rot:e.rot,group:e.group,hp:n,maxHp:n,phase:_n,timer:0,anim:0,flash:0,spin:0,seed:Math.random(),by:-1}});for(let e=this.bricks.length;e<this.count;e++)this._writeInstance(e,0,0,0,0,0),this.state[e*3]=0,this.state[e*3+1]=0,this.state[e*3+2]=0;for(let e of this.bricks)this._tint(e,-1);this.liveCount=0,this._sync()}_surface(e){let t=this.bricks[e];return!t||t.phase!==_n?!1:(t.phase=gn,t.anim=0,t.flash=.85,this.liveCount++,this.justSpawned.push(t),!0)}standing(){return this.bricks.filter(e=>e.phase===pn)}_tint(e,t){e.by=t,this._col.set(t>=0?F[t].color:5232383).convertSRGBToLinear();let n=e.i*3;this.tint[n]=this._col.r,this.tint[n+1]=this._col.g,this.tint[n+2]=this._col.b}collide(e,t){let n=z.radius;for(let r of this.bricks){if(r.phase!==pn)continue;let i=e.x-r.x,a=e.z-r.z;if(Math.abs(i)>r.hw+n||Math.abs(a)>r.hd+n)continue;let o=U(i,-r.hw,r.hw),s=U(a,-r.hd,r.hd),c=i-o,l=a-s,u=c*c+l*l,d,f,p;if(u>1e-8){if(u>n*n)continue;let e=Math.sqrt(u);d=c/e,f=l/e,p=n-e+.02}else{let e=r.hw-Math.abs(i),t=r.hd-Math.abs(a);e<t?(d=Math.sign(i)||1,f=0,p=e+n+.02):(d=0,f=Math.sign(a)||1,p=t+n+.02)}let m=e.vx*d+e.vz*f;m<0&&(e.vx-=2*m*d,e.vz-=2*m*f),e.x+=d*p,e.z+=f*p;let h=Math.max(z.baseSpeed*.72,Math.hypot(e.vx,e.vz)-B.slow),g=Math.hypot(e.vx,e.vz)||1;e.vx=e.vx/g*h,e.vz=e.vz/g*h,e.speed=h,e.registerImpact(-d,-f,.7);let _=e.lastHitBy;return this._tint(r,_),r.flash=1,r.hp--,r.hp<=0?(r.phase=mn,r.anim=0,r.spin=K(-1,1)*3.4,this.liveCount--,t.push({type:`brickbreak`,x:r.x,z:r.z,nx:d,nz:f,by:_,speed:h,tint:_>=0?F[_].color:5232383,maxHp:r.maxHp})):t.push({type:`brickhit`,x:e.x,z:e.z,nx:d,nz:f,by:_,speed:h,tint:_>=0?F[_].color:5232383,hp01:r.hp/r.maxHp}),!0}return!1}update(e,t=0,n=4){this.justSpawned.length=0;let r=Math.min(B.maxLive,B.perAlive*n);this.spawned<this.bricks.length&&t>=this._nextAt&&this.liveCount<r&&(this._surface(this.spawned)&&this.spawned++,this._nextAt=Math.max(t,this._nextAt)+B.spawnEvery);for(let t of this.bricks)switch(t.flash=Math.max(0,t.flash-e*4.4),t.phase){case mn:t.anim+=e/B.breakTime,t.anim>=1&&(t.phase=hn,t.timer=B.regen);break;case hn:t.timer-=e,t.timer<=0&&this.liveCount<r&&(t.phase=gn,t.anim=0,t.flash=.85,this.liveCount++);break;case gn:t.anim+=e/B.reformTime,t.anim>=1&&(t.phase=pn,t.hp=t.maxHp,t.anim=0,this._tint(t,-1))}this._sync()}_sync(){for(let e of this.bricks){let t=1,n=1,r=0,i=0,a=e.hp/e.maxHp;if(e.phase===mn){let o=e.anim,s=o<.22?1+o*.9:Math.max(0,1.2-(o-.22)*1.54);t=s,n=s*(1-o*.55),r=e.spin*o*o,i=o*o*.6,a=0}else if(e.phase===hn||e.phase===_n)t=0,n=0;else if(e.phase===gn){let r=e.anim,o=1-(1-r)**3;t=o*(1+Math.sin(r*Math.PI)*.14),n=o,i=-(1-o)*B.h,a=1}let o=e.i*3;this.state[o]=a,this.state[o+1]=Math.min(1,e.flash),this.state[o+2]=e.seed,this._writeInstance(e.i,e.x,e.z,e.rot+r,t,n,i)}this.shell.instanceMatrix.needsUpdate=!0,this.aura.instanceMatrix.needsUpdate=!0;for(let e of this._attrs)e.needsUpdate=!0}_writeInstance(e,t,n,r,i,a,o=0){this._pos.set(t,P.floorY+o,n),this._q.setFromAxisAngle(xn,r),this._scl.set(i,a,i),this._m.compose(this._pos,this._q,this._scl),this.shell.setMatrixAt(e,this._m),this.aura.setMatrixAt(e,this._m)}dispose(){this.geo.dispose(),this.auraGeo.dispose(),this.shellMat.dispose(),this.auraMat.dispose(),this.scene.remove(this.shell,this.aura)}},xn=new O(0,1,0),Sn=0,Cn=1,wn=2,Tn=3,En=4,Dn=`
float hHash(vec2 p){ p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
float hNoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hHash(i), hHash(i + vec2(1,0)), f.x),
             mix(hHash(i + vec2(0,1)), hHash(i + vec2(1,1)), f.x), f.y);
}`,On=class{constructor(e,t){this.scene=e,this.preset=t,this.x=0,this.z=0,this.phase=Sn,this.timer=H.first,this.strength=0,this.quadrant=Math.floor(Math.random()*4),this.justWarned=!1,this.justOpened=!1,this.justClosed=!1,this._warned=!1,this.root=new j,this.root.visible=!1,e.add(this.root),this._time={value:0},this._amount={value:0},this._build()}_build(){this.coreMat=new d({uniforms:{uTime:this._time,uAmount:this._amount},vertexShader:`
        varying vec3 vN; varying vec3 vV;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vN = normalize(mat3(modelMatrix) * normal);
          vV = normalize(cameraPosition - wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,fragmentShader:`
        precision highp float;
        varying vec3 vN; varying vec3 vV;
        uniform float uTime; uniform float uAmount;
        void main() {
          float fres = clamp(1.0 - abs(dot(normalize(vN), vV)), 0.0, 1.0);
          // Two rings: a hard photon ring right on the limb and a softer
          // halo just outside it. Everything inside stays absolutely black,
          // which is what makes it read as a hole rather than a dark ball.
          float ring = pow(fres, 9.0) * 3.4 + pow(fres, 3.4) * 0.5;
          vec3 col = mix(vec3(1.0, 0.72, 0.36), vec3(0.75, 0.85, 1.0),
                         0.5 + 0.5 * sin(uTime * 1.7));
          gl_FragColor = vec4(col * ring * uAmount * 2.2, 1.0);
        }`}),this.core=new p(new xe(H.coreR,4),this.coreMat),this.core.renderOrder=8;let e=new x(H.coreR*1.05,H.discR,72,3);e.rotateX(-Math.PI/2),this.discMat=new d({transparent:!0,depthWrite:!1,side:2,blending:2,uniforms:{uTime:this._time,uAmount:this._amount},vertexShader:`varying vec2 vP; void main(){ vP = position.xz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,fragmentShader:`
        precision mediump float;
        varying vec2 vP;
        uniform float uTime; uniform float uAmount;
        ${Dn}
        void main() {
          float r = length(vP);
          float a = atan(vP.y, vP.x);
          float rn = clamp((r - ${H.coreR.toFixed(3)}) /
                           ${(H.discR-H.coreR).toFixed(3)}, 0.0, 1.0);

          // Differential rotation — the inner edge laps the outer one, which is
          // what makes it read as falling in rather than as a spinning decal.
          float swirl = a * 2.0 + r * 3.4 - uTime * (5.2 - rn * 3.0);
          float streak = 0.5 + 0.5 * sin(swirl);
          float turb = hNoise(vec2(swirl * 1.6, r * 5.0 - uTime * 1.4));
          float body = mix(streak, turb, 0.45);

          // Hot and tight at the inner edge, cool and thin at the rim.
          float fall = smoothstep(1.0, 0.15, rn) * smoothstep(0.0, 0.10, rn);
          float inten = fall * (0.35 + body * 0.85);
          // Kept off white on purpose: at full intensity the bloom chain eats
          // the gradient and the disc turns into a flat bright ring.
          vec3 hot = vec3(1.0, 0.72, 0.34);
          vec3 cool = vec3(0.52, 0.22, 1.0);
          vec3 col = mix(hot, cool, smoothstep(0.0, 0.6, rn));
          float al = clamp(inten * uAmount, 0.0, 1.0);
          gl_FragColor = vec4(col * al * 1.5, al);
        }`}),this.disc=new p(e,this.discMat),this.disc.position.y=.02,this.disc.renderOrder=7;let t=new x(H.radius*.965,H.radius,96,1);t.rotateX(-Math.PI/2),this.edgeMat=new d({transparent:!0,depthWrite:!1,side:2,blending:2,uniforms:{uTime:this._time,uAmount:this._amount},vertexShader:`varying vec2 vU; void main(){ vU = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,fragmentShader:`
        precision mediump float;
        varying vec2 vU;
        uniform float uTime; uniform float uAmount;
        void main() {
          // Dashes crawling inward around the boundary: unmistakably a limit,
          // and unmistakably pulling.
          float d = 0.5 + 0.5 * sin(vU.x * 132.0 - uTime * 2.4);
          float a = (0.18 + d * 0.42) * uAmount;
          gl_FragColor = vec4(vec3(0.72, 0.45, 1.0) * a * 1.6, a * 0.8);
        }`}),this.edge=new p(t,this.edgeMat),this.edge.position.y=P.floorY-P.playY+.045,this.edge.renderOrder=4,this.root.add(this.core,this.disc,this.edge)}reset(){this.phase=Sn,this.timer=H.first,this.strength=0,this.justWarned=this.justOpened=this.justClosed=!1,this._warned=!1,this.root.visible=!1}get live(){return this.strength>.001}get cycle01(){return this.phase===Sn?U(1-this.timer/H.cooldown,0,1):this.phase===Tn?U(this.timer/H.duration,0,1):this.phase===Cn?1:this.strength}_place(e){this.quadrant=(this.quadrant+1)%4;let t=0,n=0;for(let r=0;r<12;r++){let r=(this.quadrant+K(.18,.82))*Math.PI*.5;if(t=Math.cos(r)*H.spawnR,n=Math.sin(r)*H.spawnR,!e||this._clearOf(e,t,n))break}this.x=t,this.z=n,this.root.position.set(t,P.playY,n)}_clearOf(e,t,n){for(let r of e.standing()){let e=U(t-r.x,-r.hw,r.hw),i=U(n-r.z,-r.hd,r.hd);if(Math.hypot(t-r.x-e,n-r.z-i)<H.coreR+H.clearance)return!1}return!0}affect(e,t){if(this.strength<=.001)return!1;let n=this.x-e.x,r=this.z-e.z,i=n*n+r*r,a=H.radius;if(i>a*a||i<1e-6)return!1;let o=Math.sqrt(i),s=o/a,c=(1-s*s)*kn(o),l=H.pull*c*this.strength*t,u=e.speed||Math.hypot(e.vx,e.vz)||1;e.vx+=n/o*l,e.vz+=r/o*l;let d=Math.hypot(e.vx,e.vz)||1;return e.vx=e.vx/d*u,e.vz=e.vz/d*u,!0}update(e,t,n){switch(this.justWarned=this.justOpened=this.justClosed=!1,this._time.value=t,this.timer-=e,this.phase){case Sn:this.timer<=H.warnTime&&!this._warned&&(this._warned=!0,this._place(n),this.justWarned=!0),this.timer<=0&&(this.phase=wn,this.timer=H.openTime,this._warned=!1,this.justOpened=!0,this.root.visible=!0);break;case wn:this.strength=1-U(this.timer/H.openTime,0,1),this.timer<=0&&(this.phase=Tn,this.timer=H.duration,this.strength=1);break;case Tn:this.timer<=0&&(this.phase=En,this.timer=H.openTime,this.justClosed=!0);break;case En:this.strength=U(this.timer/H.openTime,0,1),this.timer<=0&&(this.phase=Sn,this.timer=H.cooldown,this.strength=0,this.root.visible=!1)}if(!this.root.visible)return;this._amount.value=this.strength;let r=this.strength**.65;this.core.scale.setScalar(r),this.disc.scale.set(r,1,r),this.disc.rotation.y=t*.35,this.edge.scale.set(.35+r*.65,1,.35+r*.65)}dispose(){this.core.geometry.dispose(),this.disc.geometry.dispose(),this.edge.geometry.dispose(),this.coreMat.dispose(),this.discMat.dispose(),this.edgeMat.dispose(),this.scene.remove(this.root)}};function kn(e){let t=U(e/(H.coreR*2.2),0,1);return t*t*(3-2*t)}var An=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,jn=`
float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float vn1(float x) {
  float i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(hash11(i), hash11(i + 1.0), f);
}
float fbm1(float x) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * vn1(x); x *= 2.07; a *= 0.5; }
  return s;
}
// exp(-x²), written as a multiply. pow(x, 2.0) with a negative x is undefined
// in GLSL and several mobile drivers return NaN for it, which then blows out
// the bloom chain — so we never hand a signed value to pow().
float gauss(float x) { return exp(-x * x); }`,Mn=`
precision highp float;
varying vec2 vUv;

uniform vec3  uColor;
uniform float uTime;
uniform float uOpen;     // 0..1, how far the fence has unzipped
uniform float uOriginU;  // where it grew from, in uv.x
uniform float uHit;      // impact envelope, 0..1
uniform float uHitU;
uniform float uFade;     // master intensity; drops to 0 on expiry

${jn}

/**
 * One jagged filament running the length of the fence.
 *
 * Returned as two lobes: a very tight core and a much wider halo. A single
 * gaussian gives an evenly-lit noodle — it's the hard core inside a soft bloom
 * that reads as something too bright to look at.
 */
float bolt(vec2 uv, float seed, float amp, float freq, float speed, float w) {
  float y = 0.5 + (fbm1(uv.x * freq + uTime * speed + seed) - 0.5) * amp;
  float d = abs(uv.y - y);
  return exp(-d * d / (w * w)) * 1.35        // core
       + exp(-d * d / (w * w * 16.0)) * 0.18; // halo
}

/**
 * Per-strand flicker. Smooth rather than a hard step so strands fade in and out
 * instead of popping, but it still reaches zero — a strand that never fully
 * dies is a ribbon, not a spark.
 */
float gate(float seed, float rate) {
  return smoothstep(0.30, 0.62, vn1(uTime * rate + seed));
}

void main() {
  vec2 uv = vUv;

  // Growth: the fence unzips outward from where the craft was standing.
  float reach = uOpen * 1.22;
  float grow = 1.0 - smoothstep(reach - 0.07, reach, abs(uv.x - uOriginU));
  if (grow <= 0.002) discard;

  // --- filaments -----------------------------------------------------------
  float e = 0.0;
  e += bolt(uv,  0.0, 0.78,  4.5,  1.6, 0.013) * gate( 3.0, 11.0);
  e += bolt(uv, 17.3, 0.60,  7.5, -2.4, 0.009) * gate( 9.0, 14.0) * 0.9;
  e += bolt(uv, 31.7, 0.88,  3.0,  1.0, 0.019) * gate(21.0,  8.0) * 0.75;
  e += bolt(uv, 55.1, 0.42, 12.0, -3.4, 0.006) * gate(33.0, 19.0) * 0.7;
  // Two fast, thin strands gated hard — these are the ones that read as forks.
  e += bolt(uv, 71.9, 0.52, 19.0,  4.6, 0.005) * gate(47.0, 26.0) * 0.55;
  e += bolt(uv, 88.2, 0.34, 27.0, -5.9, 0.004) * gate(61.0, 31.0) * 0.45;

  // --- vertical jumps ------------------------------------------------------
  // Short arcs leaping between strands. Their x position is quantised in time,
  // so each one holds for a frame or two and then relocates.
  float jumps = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float slot = floor(uTime * 8.0 + fi * 13.7);
    float jx = vn1(slot * 1.37 + fi * 57.0);
    float jy = vn1(slot * 2.11 + fi * 91.0);
    float dx = abs(uv.x - jx) + fbm1(uv.y * 26.0 + slot) * 0.012;
    jumps += exp(-dx * dx * 2600.0)
           * gauss((uv.y - jy) * 3.4)
           * gate(slot + fi, 60.0);
  }

  // --- containment ---------------------------------------------------------
  // Broken, not continuous. Two unbroken lines running the full span read as
  // the edges of a pane of glass no matter how thin they are; chewing them up
  // with noise turns them back into current crawling along a rail.
  float railMask = smoothstep(0.35, 0.75, fbm1(uv.x * 22.0 + uTime * 3.1))
                 + smoothstep(0.45, 0.85, fbm1(uv.x * 31.0 - uTime * 2.3)) * 0.7;
  float rails = (gauss((uv.y - 0.02) * 90.0) + gauss((uv.y - 0.98) * 90.0))
              * railMask;
  float posts = gauss(uv.x * 55.0) + gauss((uv.x - 1.0) * 55.0);

  // Barely-there haze so the gaps read as charged air rather than as holes.
  float haze = gauss((uv.y - 0.5) * 2.6)
             * (0.030 + 0.022 * sin(uTime * 13.0 + uv.x * 24.0));

  // --- impact --------------------------------------------------------------
  float dHit = abs(uv.x - uHitU);
  float wave = gauss((dHit - (1.0 - uHit) * 0.55) * 10.0) * uHit;
  float flash = exp(-dHit * dHit * 240.0) * uHit;

  float energy = (e + jumps * 1.2 + rails * 0.30 + posts * 0.85 + haze) * grow;
  energy += (wave * 1.5 + flash * 2.8) * grow;

  // White-hot core bleeding to the team colour in the halo. The threshold is
  // low so anything at full strength clips to white and the colour only shows
  // in the falloff — which is how a real discharge photographs.
  vec3 col = mix(uColor, vec3(1.0), clamp(energy * 1.15, 0.0, 1.0));
  col *= energy * (2.1 + uHit * 1.4) * uFade;

  float a = clamp(energy * 0.95, 0.0, 1.0) * uFade;
  if (a < 0.004) discard;
  gl_FragColor = vec4(col, a);
}`,Nn=`
precision mediump float;
varying vec2 vUv;
uniform vec3 uColor;
uniform float uTime, uOpen, uOriginU, uFade, uHit, uHitU;

${jn}

void main() {
  vec2 uv = vUv;
  float reach = uOpen * 1.22;
  float grow = 1.0 - smoothstep(reach - 0.07, reach, abs(uv.x - uOriginU));
  if (grow <= 0.002) discard;

  // Across the strip: tight to the fence line, gone within a metre.
  float across = gauss((uv.y - 0.5) * 5.4);
  // Tendrils crawling outward. Contrast-stretched hard so this reads as
  // discharge branching over the deck rather than as a lit strip of floor —
  // a smooth band under the fence is most of what makes the whole thing look
  // like a glass panel standing on the ground.
  float creep = fbm1(uv.x * 16.0 + uTime * 1.3) * fbm1(uv.y * 6.0 - uTime * 0.7);
  creep = smoothstep(0.18, 0.62, creep);
  float e = across * (0.06 + creep * 1.15);
  e += exp(-abs(uv.x - uHitU) * 14.0) * uHit * across * 2.2;

  vec3 col = mix(uColor, vec3(1.0), clamp(e * 0.7, 0.0, 1.0)) * e * 1.4 * uFade * grow;
  float a = clamp(e, 0.0, 1.0) * uFade * grow * 0.7;
  if (a < 0.004) discard;
  gl_FragColor = vec4(col, a);
}`,Pn=class{constructor(e,t,n,r){this.span=t,this.side=e;let i=new k(n).convertSRGBToLinear(),a=()=>({uColor:{value:i.clone()},uTime:{value:0},uOpen:{value:0},uOriginU:{value:.5},uHit:{value:0},uHitU:{value:.5},uFade:{value:0}});this.fenceMat=new d({vertexShader:An,fragmentShader:Mn,uniforms:a(),transparent:!0,depthWrite:!1,blending:2,side:2}),this.deckMat=new d({vertexShader:An,fragmentShader:Nn,uniforms:a(),transparent:!0,depthWrite:!1,blending:2,side:2});let o=P.half-L.standoff,s=Math.atan2(e.nx,e.nz);this.fence=new p(new f(t,R.height,1,1),this.fenceMat),this.fence.position.set(e.nx*o,P.playY+R.height*.34,e.nz*o),this.fence.rotation.y=s,this.fence.renderOrder=11,this.fence.visible=!1,this.fence.frustumCulled=!1,this.deck=new p(new f(t,2.3,1,1),this.deckMat),this.deck.position.set(e.nx*o,.045,e.nz*o),this.deck.rotation.set(-Math.PI/2,0,-s),this.deck.renderOrder=4,this.deck.visible=!1,this.deck.frustumCulled=!1,r.add(this.fence,this.deck),this.active=!1,this._open=0,this._fade=0,this._hit=0,this.scene=r}ignite(e){let n=t.clamp(e/this.span+.5,0,1);for(let e of[this.fenceMat,this.deckMat])e.uniforms.uOriginU.value=n;this.active=!0,this.fence.visible=!0,this.deck.visible=!0}extinguish(){this.active=!1}strike(e,t=1){for(let t of[this.fenceMat,this.deckMat])t.uniforms.uHitU.value=e;this._hit=Math.min(1.5,this._hit+t)}update(e,t){let n=+!!this.active,r=e/Math.max(1e-4,R.openTime);this._open=this.active?Math.min(1,this._open+r):Math.max(0,this._open-r);let i=e/Math.max(1e-4,this.active?R.openTime:R.fadeTime);this._fade+=Math.sign(n-this._fade)*Math.min(i,Math.abs(n-this._fade)),this._hit*=Math.exp(-e*5),this._hit<.003&&(this._hit=0);for(let e of[this.fenceMat,this.deckMat]){let n=e.uniforms;n.uTime.value=t,n.uOpen.value=this._open,n.uFade.value=this._fade,n.uHit.value=this._hit}this._fade<=.001&&!this.active&&(this.fence.visible=!1,this.deck.visible=!1)}dispose(){this.fence.geometry.dispose(),this.fenceMat.dispose(),this.deck.geometry.dispose(),this.deckMat.dispose(),this.scene.remove(this.fence,this.deck)}},Fn=1.34,In=240,Ln=12,Rn=class{constructor(e){this.canvas=e,this.active=!1,this.pointerId=null,this.screenX=0,this.touchMode=!1,this.keyLeft=!1,this.keyRight=!1,this.surgeRequested=!1,this.surgeOnlyRequested=!1,this.pauseRequested=!1,this.source=`none`,this._latch=0,this._latchDir=0,this._restTime=0,this._downT=0,this._downX=0,this._downY=0,this._moved=0,this._padIndex=null,this._bind()}_bind(){let e=this.canvas,t={passive:!1};this._onDown=t=>{if(this.pointerId===null||t.pointerId===this.pointerId){this.pointerId=t.pointerId,this.active=!0,this.source=`pointer`,this.touchMode=t.pointerType!==`mouse`,this.screenX=t.clientX,this._downT=performance.now(),this._downX=t.clientX,this._downY=t.clientY,this._moved=0;try{e.setPointerCapture?.(t.pointerId)}catch{}t.preventDefault()}},this._onMove=e=>{let t=Math.abs(e.clientX-this.screenX)>1;if(e.pointerType===`mouse`){t&&(this.source=`pointer`),this.screenX=e.clientX,this.touchMode=!1,this.active=!0,e.pointerId===this.pointerId&&(this._moved=Math.max(this._moved,Math.hypot(e.clientX-this._downX,e.clientY-this._downY)),e.preventDefault());return}e.pointerId===this.pointerId&&(t&&(this.source=`pointer`),this.screenX=e.clientX,this._moved=Math.max(this._moved,Math.hypot(e.clientX-this._downX,e.clientY-this._downY)),e.preventDefault())},this._onUp=t=>{if(t.pointerId===this.pointerId){performance.now()-this._downT<In&&this._moved<Ln&&(this.surgeRequested=!0),this.pointerId=null,this.touchMode&&(this.active=!1);try{e.releasePointerCapture?.(t.pointerId)}catch{}}},e.addEventListener(`pointerdown`,this._onDown,t),window.addEventListener(`pointermove`,this._onMove,t),window.addEventListener(`pointerup`,this._onUp),window.addEventListener(`pointercancel`,this._onUp),this._onKeyDown=e=>{switch(e.code){case`ArrowLeft`:case`KeyA`:this.keyLeft||(this.keyLeft=!0,this._arm(-1)),this.source=`keys`,e.preventDefault();break;case`ArrowRight`:case`KeyD`:this.keyRight||(this.keyRight=!0,this._arm(1)),this.source=`keys`,e.preventDefault();break;case`Space`:this.surgeRequested=!0,e.preventDefault();break;case`ShiftLeft`:case`ShiftRight`:this.surgeOnlyRequested=!0,e.preventDefault();break;case`Escape`:case`KeyP`:this.pauseRequested=!0}},this._onKeyUp=e=>{(e.code===`ArrowLeft`||e.code===`KeyA`)&&(this.keyLeft=!1),(e.code===`ArrowRight`||e.code===`KeyD`)&&(this.keyRight=!1)},window.addEventListener(`keydown`,this._onKeyDown),window.addEventListener(`keyup`,this._onKeyUp),window.addEventListener(`gamepadconnected`,e=>{this._padIndex=e.gamepad.index}),window.addEventListener(`gamepaddisconnected`,()=>{this._padIndex=null}),e.addEventListener(`touchstart`,e=>e.preventDefault(),t),e.addEventListener(`gesturestart`,e=>e.preventDefault(),t),window.addEventListener(`contextmenu`,e=>e.preventDefault())}_arm(e){this._latchDir=e,this._latch=L.minPress}_pollPad(){if(this._padIndex===null||!navigator.getGamepads)return 0;let e=navigator.getGamepads()[this._padIndex];if(!e)return 0;let t=e.axes[0]||0;Math.abs(t)<.14&&(t=0);let n=!!e.buttons[14]?.pressed,r=!!e.buttons[15]?.pressed;return n&&!this._padL&&this._arm(-1),r&&!this._padR&&this._arm(1),this._padL=n,this._padR=r,n&&(t=-1),r&&(t=1),e.buttons[0]?.pressed&&!this._padA&&(this.surgeRequested=!0),this._padA=e.buttons[0]?.pressed,e.buttons[9]?.pressed&&!this._padStart&&(this.pauseRequested=!0),this._padStart=e.buttons[9]?.pressed,t}resolve(e,t,n,r,i=1){let a=this._pollPad(),o=0;if(this.keyLeft&&--o,this.keyRight&&(o+=1),a!==0&&(o=a,this.source=`pad`),o===0&&this._latch>0&&(o=this._latchDir),o!==0){this._latch=Math.max(0,this._latch-e),this._restTime=0;let t=L.moveSpeed*Math.min(1,Math.abs(o));return U(r+Math.sign(o)*i*t*e,-n,n)}return this.source===`pointer`?this.active?U(t(this.screenX),-n,n):r:(this._restTime+=e,this._recentre(r,e))}_recentre(e,t){let{returnSpeed:n,returnMax:r,returnRamp:i}=L;if(r<=0||e===0)return e;let a=i>0?U(this._restTime/i,0,1):1,o=n+(r-n)*a*a,s=Math.sign(e),c=e-s*o*t;return Math.sign(c)===s?c:0}consumeSurge(){let e=this.surgeRequested;return this.surgeRequested=!1,e}consumeSurgeOnly(){let e=this.surgeOnlyRequested;return this.surgeOnlyRequested=!1,e}consumePause(){let e=this.pauseRequested;return this.pauseRequested=!1,e}release(){this.active=!1,this.pointerId=null,this.keyLeft=this.keyRight=!1,this.surgeRequested=!1,this.surgeOnlyRequested=!1,this.source=`none`,this._latch=0,this._restTime=0}dispose(){window.removeEventListener(`pointermove`,this._onMove),window.removeEventListener(`pointerup`,this._onUp),window.removeEventListener(`pointercancel`,this._onUp),window.removeEventListener(`keydown`,this._onKeyDown),window.removeEventListener(`keyup`,this._onKeyUp)}},zn=1/120,Bn=.25,Vn=.4,X={INTRO:`intro`,SERVE:`serve`,PLAY:`play`,KO:`ko`,OVER:`over`},Hn=class{constructor(e,t,n,r,i,a,o){this.scene=e,this.camera=t,this.assets=n,this.audio=r,this.hud=i,this.preset=a,this.input=o,this.arena=new Ct(e,n,a),this.effects=new dn(e,this.arena,t,r,a),this.pinball=V.enabled?new cn(e,a):null,this.bricks=new bn(e,a),this.blackhole=H.enabled?new On(e,a):null,this.crafts=[];for(let t=0;t<4;t++)this.crafts.push(new Tt(t,F[t],n,e));this.maxOrbs=Math.min(4,a.sparks>400?4:I.orbCapMobile),this.orbs=[];for(let t=0;t<this.maxOrbs;t++){let n=new It(e,a,t<a.orbLights);n.id=t,this.orbs.push(n)}let s=2*(P.half-P.chamfer);this.arcFields=this.crafts.map(t=>new Pn(t,s,F[t.index].color,e)),this.ais=[],this.state=X.INTRO,this.accum=0,this.timeScale=1,this._targetScale=1,this._freeze=0,this.events=[],this.paused=!1,this.attract=!0,this.startAttract()}startMatch(e=1){this.attract=!1,this.autoPlayer=this.autoPlayer||!1,this._resetCommon(e),this.state=X.INTRO,this.introTimer=0,this.camera.startIntro()}startAttract(){this.attract=!0,this._resetCommon(2),this.playTime=40,this.state=X.SERVE,this.serveTimer=0,this.serveDuration=.7,this.pendingServes=[0]}_resetCommon(e=1){let t=et[U(e,0,2)];this.difficulty=e,this.scores=F.map(()=>I.startPoints),this.salvage=F.map(()=>0),this.alive=[!0,!0,!0,!0],this.eliminationOrder=[],this.stats={deflections:0,bestChain:0,knockouts:0,bricks:0,duration:0},this.chain=0,this.matchTime=0,this.playTime=0,this.serveTimer=0,this.koTimer=0,this.pendingServes=[],this.lastConceder=-1;for(let e of this.crafts)e.alive=!0,e.dying=0,e.arc=R.startCharge,e.arcActive=0,e.arcJustFired=!1,e.u=0,e.vu=0,e.targetU=0,e.recoil=0,e.hitFlash=0,e.surge=1,e.surgeActive=0,e.root.visible=!0,e.bobPivot.position.y=0,e.hullPivot.rotation.set(0,0,0),e.defMat.uniforms.uAlive.value=1,e.sync(0);for(let e of this.orbs)e.kill();for(let e of this.arcFields||[])e.extinguish(),e.update(1,0);this.audio.arcSilence(),this._arcWasReady=!1,this.ais=[];for(let e=0;e<4;e++)this.ais[e]=new Wt(this.crafts[e],t,this.arena.planes);this.pinball?.reset(),this.blackhole?.reset(),this.bricks.reset(this.pinball?.obstacles()??[]);for(let e=0;e<4;e++)this.arena.setBarrierHealth(e,1),this.hud.setScore(e,I.startPoints);this.hud.resetMatch(),this.hud.setOrbCount(0),this.hud.setCombo(0),this.hud.setSalvage(0,B.perPoint),this.effects.clear(),this.arena.setCharge(0),this.timeScale=1,this._targetScale=1,this._freeze=0,this._slowHold=0,this._resultShown=!1,this.overTimer=0}_slow(e,t){this._targetScale=e,this._slowHold=t}_toast(e,t){this.attract||this.hud.toast(e,t)}get aliveCount(){return this.alive.reduce((e,t)=>e+ +!!t,0)}targetOrbCount(){let e=1;for(let t of I.orbSchedule)this.playTime>=t.t&&(e=t.n);return U(Math.min(e,this.maxOrbs),1,Math.max(2,this.aliveCount+1))}activeOrbs(){return this.orbs.filter(e=>e.active)}update(e){if(this.paused){this.arena.update(0,this.matchTime);return}this._slowHold>0&&(this._slowHold-=e,this._slowHold<=0&&(this._targetScale=1)),this._freeze>0?(this._freeze-=e,this.timeScale=0):this.timeScale=G(this.timeScale,this._targetScale,7,e);let t=e*this.timeScale;switch(this.matchTime+=e,this.state){case X.INTRO:this._updateIntro(e);break;case X.SERVE:this._updateServe(t,e);break;case X.PLAY:this._updatePlay(t);break;case X.KO:this._updateKO(t,e);break;case X.OVER:this._updateOver(e)}if(this.state!==X.INTRO){this.accum=Math.min(this.accum+t,Bn);let e=0;for(;this.accum>=zn&&e++<40;)this._fixedStep(zn),this.accum-=zn}this._updateArcs(t),this._updateMiddle(t);for(let e of this.crafts)e.update(t,this.matchTime);for(let e of this.orbs)e.updateVisual(t,this.matchTime);this.arena.aimFill(this.camera.cam.position),this.arena.update(t,this.matchTime),this.effects.update(e,this.camera.cam),this._updateCameraFocus(e),this._updateAudioIntensity()}_fixedStep(e){let t=this.events;if(t.length=0,this.state===X.PLAY||this.state===X.SERVE||this.state===X.KO){this.attract||this.autoPlayer?this.ais[0].update(e,this.orbs,this.crafts,this.scores):this._steerPlayer(e);for(let t=1;t<4;t++)this.alive[t]&&this.ais[t].update(e,this.orbs,this.crafts,this.scores)}let n={planes:this.arena.planes,crafts:this.crafts,bricks:this.bricks,pinball:this.pinball,blackhole:this.blackhole,events:t};for(let t of this.orbs)t.active&&Vt(t,e,n);Ht(this.activeOrbs(),t);for(let e of t)this._handleEvent(e)}_steerPlayer(e){let t=this.crafts[0];if(!t.alive)return;let n=this._mapper;n&&t.steer(this.input.resolve(e,n.map,t.limit,t.targetU,n.sign)),this.input.consumeSurge()&&!t.tryArc()&&t.trySurge()&&this.effects.surge(t),this.input.consumeSurgeOnly()&&t.trySurge()&&this.effects.surge(t)}_handleEvent(e){switch(e.type){case`deflect`:this.effects.deflect(e),e.craft.index===0&&(this.chain++,this.stats.deflections++,this.stats.bestChain=Math.max(this.stats.bestChain,this.chain),this.hud.setCombo(this.chain)),e.orb.setTint(F[e.craft.index].color);break;case`wall`:case`sealed`:this.effects.wall(e);break;case`orbclash`:this.effects.orbClash(e);break;case`arc`:this.effects.arcStrike(e),this.arcFields[e.craft.index].strike(e.u01,.9);break;case`brickhit`:this.effects.brickHit(e);break;case`brickbreak`:this._brickBreak(e);break;case`bumper`:this.effects.bumper(e);break;case`sling`:this.effects.sling(e);break;case`goal`:this._concede(e)}}_brickBreak(e){this.effects.brickBreak(e);let t=e.by;if(!(t<0||!this.alive[t])&&(t===0&&this.stats.bricks++,!this.attract)){if(this.aliveCount<I.salvageMinPilots){t===0&&this.hud.setSalvageClosed(!0);return}this.salvage[t]++,t===0&&this.hud.setSalvage(this.salvage[0],B.perPoint),!(this.salvage[t]<B.perPoint)&&(this.salvage[t]-=B.perPoint,t===0&&this.hud.setSalvage(this.salvage[0],B.perPoint),!(this.scores[t]>=I.maxPoints)&&(this.scores[t]++,this.hud.setScore(t,this.scores[t]),this.arena.setBarrierHealth(t,Math.min(1,this.scores[t]/I.startPoints)),this.effects.salvagePoint(this.crafts[t])))}}_concede(e){let t=e.victim;if(!this.alive[t])return;if(e.orb.kill(),this.attract){this.effects.goal(e,!1),this.lastConceder=t,this._queueServe(.5);return}this.scores[t]=Math.max(0,this.scores[t]-1),this.hud.setScore(t,this.scores[t]),this.arena.setBarrierHealth(t,Math.min(1,this.scores[t]/I.startPoints)),this.crafts[t].onConcede(),this.lastConceder=t;let n=t===0;this.effects.goal(e,n),n?(this.chain=0,this.hud.setCombo(0)):e.orb.lastHitBy===0&&(this.stats.knockouts+=+(this.scores[t]===0)),this._freeze=n?.11:.06,this._slow(.34,n?.42:.26),this.scores[t]===0?this._eliminate(t):this._queueServe(I.respawnDelay)}_eliminate(e){this.alive[e]=!1,this.eliminationOrder.push(e),this.crafts[e].eliminate(),this.hud.markEliminated(e),this.effects.eliminate(this.crafts[e]),this._freeze=.2,this._slow(.25,.9);let t=this.aliveCount;if(t<=1){this.state=X.OVER,this.overTimer=0;for(let e of this.orbs)e.kill();let e=this.alive.indexOf(!0);this._toast(e===0?`YOU SURVIVE`:`${F[e].name} WINS`,{color:F[e].css,tone:e===0?`good`:void 0}),this.audio.stinger(e===0),this.audio.setIntensity(0);return}this.state=X.KO,this.koTimer=1.9,this._slow(.25,.7);let n=e===0?`YOU ARE OUT`:`${F[e].name} DOWN`;this._toast(n,{color:e===0?`var(--danger)`:F[e].css,tone:e===0?`bad`:void 0}),t<I.salvageMinPilots&&(this.hud.setSalvageClosed(!0),this._toast(`SALVAGE CLOSED`));for(let e of this.orbs)e.active&&e.kill()}_queueServe(e){this.pendingServes.push(e),this.state===X.PLAY&&this.activeOrbs().length===0&&(this.state=X.SERVE,this.serveTimer=0,this.serveDuration=Math.max(e,I.serveDelay),this.audio.serve())}_serveOrb(){let e=this.orbs.find(e=>!e.active);if(!e)return;let t=K(0,Math.PI*2),n=this.lastConceder;for(let e=0;e<24;e++){t=K(0,Math.PI*2);let e=Math.sin(t),r=Math.cos(t);if(Math.abs(e)<.22||Math.abs(r)<.22)continue;if(n>=0){let t=this.arena.planes[n];if(e*t.nx+r*t.nz>.55)continue}let i=!0;for(let t=0;t<4;t++){if(this.alive[t])continue;let n=this.arena.planes[t];if(e*n.nx+r*n.nz>.8){i=!1;break}}if(i)break}let r=z.baseSpeed+Math.min(6,this.playTime*.05);e.spawn(0,0,t,r),this.effects.serveBurst(0,0,t),this.arena.setCharge(0),this.hud.setOrbCount(this.activeOrbs().length)}_updateIntro(e){let t=this.introTimer;this.introTimer+=e;for(let e=0;e<3;e++){let n=Vn+e;t<n&&this.introTimer>=n&&!this.attract&&(this.hud.countdown(3-e),this.audio.ui(e===2?`confirm`:`tick`))}this.introTimer>=3.4&&(this.state=X.SERVE,this.serveTimer=0,this.serveDuration=1.4,this.pendingServes=[0],this.audio.serve())}_updateServe(e,t){this.serveTimer+=t;let n=U(this.serveTimer/this.serveDuration,0,1);this.effects.serveCharge(n),n>=1&&(this.pendingServes.shift(),this._serveOrb(),this.state=X.PLAY)}_updatePlay(e){this.playTime+=e,this.pendingServes.length&&(this.pendingServes[0]-=e,this.pendingServes[0]<=0&&(this.pendingServes.shift(),this._serveOrb()));let t=this.targetOrbCount();this.activeOrbs().length+this.pendingServes.length<t&&this.pendingServes.push(.6),this.hud.setOrbCount(this.activeOrbs().length);for(let e of this.orbs)e.active&&Math.hypot(e.x,e.z)>P.half*1.9&&e.kill();this.activeOrbs().length===0&&this.pendingServes.length===0&&this._queueServe(I.respawnDelay)}_updateKO(e,t){this.hud.setOrbCount(0),this.koTimer-=t,this.koTimer<=0&&(this.state=X.SERVE,this.serveTimer=0,this.serveDuration=I.serveDelay,this.pendingServes=[0],this.lastConceder=-1,this.audio.serve())}_updateOver(e){this.overTimer+=e,!this._resultShown&&this.overTimer>2.2&&(this._resultShown=!0,this.onMatchEnd?.(this.buildResult()))}buildResult(){let e=[];for(let t=0;t<4;t++)this.alive[t]&&e.push(t);e.sort((e,t)=>this.scores[t]-this.scores[e]);let t=[...e,...this.eliminationOrder.slice().reverse()];return this.stats.duration=this.matchTime,{order:t,finalScores:this.scores.slice(),stats:this.stats}}_updateArcs(e){for(let t=0;t<4;t++){let n=this.crafts[t],r=this.arcFields[t];n.arcJustFired&&(n.arcJustFired=!1,r.ignite(n.u),this.effects.arcIgnite(n)),r.active&&n.arcActive<=0&&(r.extinguish(),this.effects.arcExpire(n)),n.arcActive>0&&this.effects.arcCrackle(n,e),r.update(e,this.matchTime)}let t=this.crafts[0],n=this._arcWasReady===!0,r=t.arc>=1&&t.arcActive<=0;this.hud.setArc(t.arcActive>0?t.arcActive/R.duration:t.arc,r,t.arcActive>0),r&&!n&&!this.attract&&this.audio.arcReady(),this._arcWasReady=r}_updateMiddle(e){this.bricks.update(e,this.playTime,this.aliveCount);let t=this.bricks.justSpawned;for(let e=0;e<Math.min(t.length,4);e++)this.effects.brickSurface(t[e]);let n=this.blackhole;n&&(n.update(e,this.matchTime,this.bricks),n.justWarned&&this.effects.blackHoleWarn(n),n.justOpened&&this.effects.blackHoleOpen(n),n.justClosed&&this.effects.blackHoleClose(n),n.live&&this.effects.blackHoleAmbient(n,e),this.hud.setBlackHole(n.cycle01,n.live));let r=this.pinball;r&&(r.update(e,this.matchTime),r.justWarned&&this.effects.pinballWarn(r),r.justDeployed&&this.effects.pinballDeploy(r),r.justRetracted&&this.effects.pinballRetract(r),this.hud.setPinball(r.cycle01,r.live))}_updateCameraFocus(e){let t=0,n=0,r=0;for(let e of this.orbs){if(!e.active)continue;let i=.4+e.speed/z.maxSpeed;t+=e.x*i,n+=e.z*i,r+=i}r>0?this.camera.lookToward(t/r,n/r,1):this.camera.lookToward(0,0,.2)}_updateAudioIntensity(){let e=0;for(let t of this.orbs){if(!t.active)continue;let n=U((t.speed-z.baseSpeed)/(z.maxSpeed-z.baseSpeed),0,1),r=U(t.vz/Math.max(.001,t.speed),0,1),i=U((t.z+P.half)/(P.half*2),0,1);e=Math.max(e,n*.55+r*i*.6)}let t=this.activeOrbs().length/this.maxOrbs,n=1-this.scores[0]/I.startPoints;this.audio.setIntensity(U(e*.5+t*.3+n*.35,0,1))}refreshMapper(e){let t=this.input.touchMode?Fn:1;this._mapper=this.camera.makeMapper(this.crafts[0],this.crafts[0].limit,t,e)}setPaused(e){this.paused=e,e&&this.input.release()}dispose(){for(let e of this.arcFields)e.dispose();this.bricks.dispose(),this.pinball?.dispose(),this.blackhole?.dispose(),this.effects.dispose();for(let e of this.crafts)e.dispose();for(let e of this.orbs)e.dispose();this.arena.dispose()}},Un=440,Z=e=>Un*2**(e/12),Wn=[0,3,5,7,10,12,15,17,19,22],Gn=class{constructor(){this.ctx=null,this.ready=!1,this.muted=!1,this.intensity=0,this._targetIntensity=0,this._nextBeat=0,this._beat=0,this._root=-5,this._duckUntil=0}async unlock(){if(this.ctx){this.ctx.state===`suspended`&&await this.ctx.resume();return}let e=window.AudioContext||window.webkitAudioContext;if(!e)return;let t=new e({latencyHint:`interactive`});this.ctx=t,this.master=t.createGain(),this.master.gain.value=.9,this.comp=t.createDynamicsCompressor(),this.comp.threshold.value=-14,this.comp.knee.value=22,this.comp.ratio.value=6,this.comp.attack.value=.004,this.comp.release.value=.16,this.sfx=t.createGain(),this.sfx.gain.value=.85,this.music=t.createGain(),this.music.gain.value=0,this.gameBus=t.createGain(),this.gameBus.gain.value=1,this.uiBus=t.createGain(),this.uiBus.gain.value=1,this.wide=t.createStereoPanner?t.createStereoPanner():null,this.sfx.connect(this.gameBus),this.music.connect(this.gameBus),this.gameBus.connect(this.comp),this.uiBus.connect(this.comp),this.comp.connect(this.master),this.master.connect(t.destination),this._buildNoise(),this._buildBed(),t.state===`suspended`&&await t.resume(),this.ready=!0,this._nextBeat=t.currentTime+.2}_buildNoise(){let e=this.ctx,t=e.sampleRate*2,n=e.createBuffer(1,t,e.sampleRate),r=n.getChannelData(0);for(let e=0;e<t;e++)r[e]=Math.random()*2-1;this.noiseBuf=n}_noise(e,t){let n=this.ctx.createBufferSource();return n.buffer=this.noiseBuf,n.loop=!0,n.start(t),n.stop(t+e+.05),n}_buildBed(){let e=this.ctx;this.droneGain=e.createGain(),this.droneGain.gain.value=.16,this.droneFilter=e.createBiquadFilter(),this.droneFilter.type=`lowpass`,this.droneFilter.frequency.value=340,this.droneFilter.Q.value=3.2,this.droneOscs=[];for(let t of[-9,0,7]){let n=e.createOscillator();n.type=`sawtooth`,n.frequency.value=Z(this._root-24),n.detune.value=t;let r=e.createGain();r.gain.value=t===0?.5:.3,n.connect(r),r.connect(this.droneFilter),n.start(),this.droneOscs.push({o:n,g:r})}this.droneFilter.connect(this.droneGain),this.droneGain.connect(this.music);let t=e.createOscillator();t.frequency.value=.055;let n=e.createGain();n.gain.value=190,t.connect(n),n.connect(this.droneFilter.frequency),t.start(),this._lfo=t,this.subGain=e.createGain(),this.subGain.gain.value=0;let r=e.createOscillator();r.type=`sine`,r.frequency.value=Z(this._root-36),r.connect(this.subGain),this.subGain.connect(this.music),r.start(),this.sub=r}setIntensity(e){this._targetIntensity=U(e,0,1)}setMusicLevel(e){this.ready&&(this.music.gain.cancelScheduledValues(this.ctx.currentTime),this.music.gain.linearRampToValueAtTime(e,this.ctx.currentTime+.8))}setMuted(e){this.muted=e,this.ready&&(this.master.gain.value=e?0:.9)}setPauseMuted(e){if(!this.ready)return;let t=this.ctx.currentTime,n=this.gameBus.gain;n.cancelScheduledValues(t),n.setValueAtTime(n.value,t),n.linearRampToValueAtTime(+!e,t+(e?.09:.22))}duck(e=.5,t=.35){if(!this.ready)return;let n=this.ctx.currentTime,r=this.music.gain,i=r.value;r.cancelScheduledValues(n),r.setValueAtTime(i,n),r.linearRampToValueAtTime(i*t,n+.04),r.linearRampToValueAtTime(i,n+e)}update(e){if(!this.ready)return;this.intensity+=(this._targetIntensity-this.intensity)*Math.min(1,e*.9);let t=this.intensity;this.droneFilter.Q.value=3+t*4,this.droneGain.gain.value=.13+t*.09,this.subGain.gain.value=t*t*.11;let n=60/W(78,122,t),r=this.ctx.currentTime,i=0;for(;this._nextBeat<r+.12&&i++<8;)this._sequence(this._nextBeat,this._beat,t),this._beat++,this._nextBeat+=n}_sequence(e,t,n){let r=t%4==0;if(this._pulse(e,r?.3:.14,r?54:78),Math.random()<.16+n*.42){let t=this._root+rt(Wn)+(Math.random()<.25?12:0);this._pluck(e+K(0,.05),Z(t),.07+n*.05)}if(t%64==0&&t>0){this._root=rt([-5,-3,-7,-10]);let t=Z(this._root-24);for(let{o:n}of this.droneOscs)n.frequency.cancelScheduledValues(e),n.frequency.linearRampToValueAtTime(t,e+2.2);this.sub.frequency.linearRampToValueAtTime(Z(this._root-36),e+2.2)}}_pulse(e,t,n){let r=this.ctx,i=r.createOscillator();i.type=`sine`,i.frequency.setValueAtTime(n*2.4,e),i.frequency.exponentialRampToValueAtTime(n,e+.06);let a=r.createGain();a.gain.setValueAtTime(0,e),a.gain.linearRampToValueAtTime(t,e+.006),a.gain.exponentialRampToValueAtTime(1e-4,e+.34),i.connect(a),a.connect(this.music),i.start(e),i.stop(e+.4)}_pluck(e,t,n){let r=this.ctx,i=r.createOscillator();i.type=`triangle`,i.frequency.value=t;let a=r.createBiquadFilter();a.type=`bandpass`,a.frequency.value=t*2.2,a.Q.value=5;let o=r.createGain();o.gain.setValueAtTime(0,e),o.gain.linearRampToValueAtTime(n,e+.004),o.gain.exponentialRampToValueAtTime(1e-4,e+.5),i.connect(a),a.connect(o),o.connect(this.music),i.start(e),i.stop(e+.55)}deflect(e=.5,t=1,n=.5){if(!this.ready||this.muted)return;let r=this.ctx,i=r.currentTime,a=W(180,340,e),o=r.createOscillator();o.type=`sine`,o.frequency.setValueAtTime(a*3.1,i),o.frequency.exponentialRampToValueAtTime(a*.75,i+.09);let s=r.createGain();s.gain.setValueAtTime(0,i),s.gain.linearRampToValueAtTime(.34*t,i+.003),s.gain.exponentialRampToValueAtTime(1e-4,i+.19),o.connect(s),s.connect(this.sfx),o.start(i),o.stop(i+.22);let c=r.createOscillator();c.type=`triangle`,c.frequency.setValueAtTime(a*W(4.2,7.4,n),i);let l=r.createGain();l.gain.setValueAtTime(0,i),l.gain.linearRampToValueAtTime(.11*t,i+.002),l.gain.exponentialRampToValueAtTime(1e-4,i+.28),c.connect(l),l.connect(this.sfx),c.start(i),c.stop(i+.3);let u=this._noise(.09,i),d=r.createBiquadFilter();d.type=`bandpass`,d.frequency.setValueAtTime(W(1400,3600,e),i),d.Q.value=1.4;let f=r.createGain();f.gain.setValueAtTime(.2*t,i),f.gain.exponentialRampToValueAtTime(1e-4,i+.085),u.connect(d),d.connect(f),f.connect(this.sfx)}wall(e=.5){if(!this.ready||this.muted)return;let t=this.ctx,n=t.currentTime,r=t.createOscillator();r.type=`sine`,r.frequency.setValueAtTime(W(120,210,e),n),r.frequency.exponentialRampToValueAtTime(W(62,96,e),n+.07);let i=t.createGain();i.gain.setValueAtTime(0,n),i.gain.linearRampToValueAtTime(.19,n+.003),i.gain.exponentialRampToValueAtTime(1e-4,n+.16),r.connect(i),i.connect(this.sfx),r.start(n),r.stop(n+.18);let a=this._noise(.06,n),o=t.createBiquadFilter();o.type=`lowpass`,o.frequency.value=900;let s=t.createGain();s.gain.setValueAtTime(.1,n),s.gain.exponentialRampToValueAtTime(1e-4,n+.06),a.connect(o),o.connect(s),s.connect(this.sfx)}clash(){if(!this.ready||this.muted)return;let e=this.ctx,t=e.currentTime;for(let[n,r]of[[1,.15],[2.76,.09],[5.4,.05]]){let i=e.createOscillator();i.type=`sine`,i.frequency.value=620*n*K(.94,1.06);let a=e.createGain();a.gain.setValueAtTime(0,t),a.gain.linearRampToValueAtTime(r,t+.002),a.gain.exponentialRampToValueAtTime(1e-4,t+.42),i.connect(a),a.connect(this.sfx),i.start(t),i.stop(t+.45)}}brickHit(e=.5,t=1){if(!this.ready||this.muted)return;let n=this.ctx,r=n.currentTime,i=W(150,260,t)*W(.94,1.12,e),a=n.createOscillator();a.type=`triangle`,a.frequency.setValueAtTime(i*2,r),a.frequency.exponentialRampToValueAtTime(i,r+.05);let o=n.createGain();o.gain.setValueAtTime(0,r),o.gain.linearRampToValueAtTime(.13*W(.7,1,t),r+.003),o.gain.exponentialRampToValueAtTime(1e-4,r+.07+t*.06),a.connect(o),o.connect(this.sfx),a.start(r),a.stop(r+.16);let s=this._noise(.05,r),c=n.createBiquadFilter();c.type=`bandpass`,c.Q.value=1.1,c.frequency.value=W(900,2200,e);let l=n.createGain();l.gain.setValueAtTime(.085,r),l.gain.exponentialRampToValueAtTime(1e-4,r+.05),s.connect(c),c.connect(l),l.connect(this.sfx)}brickBreak(e=2){if(!this.ready||this.muted)return;let t=this.ctx,n=t.currentTime,r=e>=3?300:390;for(let[e,i,a]of[[1,.13,.34],[2.41,.09,.26],[4.17,.055,.2],[6.8,.03,.15]]){let o=t.createOscillator();o.type=`sine`,o.frequency.value=r*e*K(.93,1.08);let s=t.createGain();s.gain.setValueAtTime(0,n),s.gain.linearRampToValueAtTime(i,n+.002),s.gain.exponentialRampToValueAtTime(1e-4,n+a),o.connect(s),s.connect(this.sfx),o.start(n),o.stop(n+a+.02)}let i=this._noise(.3,n),a=t.createBiquadFilter();a.type=`bandpass`,a.Q.value=.8,a.frequency.setValueAtTime(3400,n),a.frequency.exponentialRampToValueAtTime(420,n+.28);let o=t.createGain();o.gain.setValueAtTime(.2,n),o.gain.exponentialRampToValueAtTime(1e-4,n+.3),i.connect(a),a.connect(o),o.connect(this.sfx);let s=t.createOscillator();s.type=`sine`,s.frequency.setValueAtTime(110,n),s.frequency.exponentialRampToValueAtTime(46,n+.2);let c=t.createGain();c.gain.setValueAtTime(0,n),c.gain.linearRampToValueAtTime(.2,n+.006),c.gain.exponentialRampToValueAtTime(1e-4,n+.26),s.connect(c),c.connect(this.sfx),s.start(n),s.stop(n+.3)}salvage(){if(!this.ready||this.muted)return;let e=this.ctx,t=e.currentTime;this.duck(.45,.55),[0,7,12].forEach((n,r)=>{let i=t+r*.065,a=e.createOscillator();a.type=`triangle`,a.frequency.value=Z(n+12);let o=e.createGain();o.gain.setValueAtTime(0,i),o.gain.linearRampToValueAtTime(.11,i+.006),o.gain.exponentialRampToValueAtTime(1e-4,i+.36);let s=e.createBiquadFilter();s.type=`lowpass`,s.frequency.value=5e3,a.connect(s),s.connect(o),o.connect(this.sfx),a.start(i),a.stop(i+.38)})}brickSurface(){if(!this.ready||this.muted)return;let e=this.ctx,t=e.currentTime,n=e.createOscillator();n.type=`triangle`,n.frequency.setValueAtTime(90,t),n.frequency.exponentialRampToValueAtTime(280*K(.94,1.08),t+.26);let r=e.createGain();r.gain.setValueAtTime(1e-4,t),r.gain.exponentialRampToValueAtTime(.075,t+.14),r.gain.exponentialRampToValueAtTime(1e-4,t+.42);let i=e.createBiquadFilter();i.type=`lowpass`,i.frequency.value=1800,n.connect(i),i.connect(r),r.connect(this.sfx),n.start(t),n.stop(t+.45)}blackHoleWarn(){if(!this.ready||this.muted)return;let e=this.ctx,t=e.currentTime;for(let n of[0,11]){let r=e.createOscillator();r.type=`sawtooth`,r.frequency.setValueAtTime(38,t),r.frequency.exponentialRampToValueAtTime(150,t+1.3),r.detune.value=n;let i=e.createBiquadFilter();i.type=`lowpass`,i.Q.value=9,i.frequency.setValueAtTime(160,t),i.frequency.exponentialRampToValueAtTime(900,t+1.3);let a=e.createGain();a.gain.setValueAtTime(1e-4,t),a.gain.exponentialRampToValueAtTime(.13,t+1.25),a.gain.exponentialRampToValueAtTime(1e-4,t+1.5),r.connect(i),i.connect(a),a.connect(this.sfx),r.start(t),r.stop(t+1.55)}}blackHoleOpen(){if(!this.ready||this.muted)return;let e=this.ctx,t=e.currentTime;this.duck(1.2,.28);let n=e.createOscillator();n.type=`sine`,n.frequency.setValueAtTime(320,t),n.frequency.exponentialRampToValueAtTime(26,t+1.1);let r=e.createGain();r.gain.setValueAtTime(0,t),r.gain.linearRampToValueAtTime(.5,t+.02),r.gain.exponentialRampToValueAtTime(1e-4,t+1.3),n.connect(r),r.connect(this.sfx),n.start(t),n.stop(t+1.35);let i=e.createOscillator();i.type=`sawtooth`,i.frequency.setValueAtTime(60,t),i.frequency.exponentialRampToValueAtTime(2400,t+.9);let a=e.createBiquadFilter();a.type=`bandpass`,a.Q.value=4,a.frequency.setValueAtTime(300,t),a.frequency.exponentialRampToValueAtTime(3400,t+.9);let o=e.createGain();o.gain.setValueAtTime(.16,t),o.gain.exponentialRampToValueAtTime(1e-4,t+1),i.connect(a),a.connect(o),o.connect(this.sfx),i.start(t),i.stop(t+1.05);let s=this._noise(1.2,t),c=e.createBiquadFilter();c.type=`bandpass`,c.Q.value=.7,c.frequency.setValueAtTime(900,t),c.frequency.exponentialRampToValueAtTime(140,t+1.1);let l=e.createGain();l.gain.setValueAtTime(.24,t),l.gain.exponentialRampToValueAtTime(1e-4,t+1.2),s.connect(c),c.connect(l),l.connect(this.sfx)}blackHoleClose(){if(!this.ready||this.muted)return;let e=this.ctx,t=e.currentTime,n=e.createOscillator();n.type=`sine`,n.frequency.setValueAtTime(40,t),n.frequency.exponentialRampToValueAtTime(420,t+.5);let r=e.createGain();r.gain.setValueAtTime(.22,t),r.gain.exponentialRampToValueAtTime(1e-4,t+.55);let i=e.createBiquadFilter();i.type=`lowpass`,i.frequency.value=2200,n.connect(i),i.connect(r),r.connect(this.sfx),n.start(t),n.stop(t+.58);let a=this._noise(.3,t+.42),o=e.createBiquadFilter();o.type=`highpass`,o.frequency.value=1800;let s=e.createGain();s.gain.setValueAtTime(.12,t+.42),s.gain.exponentialRampToValueAtTime(1e-4,t+.7),a.connect(o),o.connect(s),s.connect(this.sfx)}pinballWarn(){if(!this.ready||this.muted)return;let e=this.ctx,t=e.currentTime,n=e.createOscillator();n.type=`sawtooth`,n.frequency.setValueAtTime(58,t),n.frequency.exponentialRampToValueAtTime(180,t+.9);let r=e.createBiquadFilter();r.type=`lowpass`,r.Q.value=6,r.frequency.setValueAtTime(300,t),r.frequency.exponentialRampToValueAtTime(1500,t+.9);let i=e.createGain();i.gain.setValueAtTime(1e-4,t),i.gain.exponentialRampToValueAtTime(.14,t+.85),i.gain.exponentialRampToValueAtTime(1e-4,t+1.05),n.connect(r),r.connect(i),i.connect(this.sfx),n.start(t),n.stop(t+1.1)}pinballDeploy(){if(!this.ready||this.muted)return;let e=this.ctx,t=e.currentTime;this.duck(.5,.45);let n=this._noise(.4,t),r=e.createBiquadFilter();r.type=`lowpass`,r.frequency.setValueAtTime(2600,t),r.frequency.exponentialRampToValueAtTime(240,t+.35);let i=e.createGain();i.gain.setValueAtTime(.26,t),i.gain.exponentialRampToValueAtTime(1e-4,t+.4),n.connect(r),r.connect(i),i.connect(this.sfx);let a=e.createOscillator();a.type=`sine`,a.frequency.setValueAtTime(160,t),a.frequency.exponentialRampToValueAtTime(44,t+.32);let o=e.createGain();o.gain.setValueAtTime(0,t),o.gain.linearRampToValueAtTime(.42,t+.008),o.gain.exponentialRampToValueAtTime(1e-4,t+.42),a.connect(o),o.connect(this.sfx),a.start(t),a.stop(t+.45),[7,14].forEach((n,r)=>{let i=t+.04+r*.09,a=e.createOscillator();a.type=`square`,a.frequency.value=Z(n);let o=e.createGain();o.gain.setValueAtTime(0,i),o.gain.linearRampToValueAtTime(.07,i+.006),o.gain.exponentialRampToValueAtTime(1e-4,i+.24);let s=e.createBiquadFilter();s.type=`lowpass`,s.frequency.value=3200,a.connect(s),s.connect(o),o.connect(this.sfx),a.start(i),a.stop(i+.26)})}pinballRetract(){if(!this.ready||this.muted)return;let e=this.ctx,t=e.currentTime,n=e.createOscillator();n.type=`sawtooth`,n.frequency.setValueAtTime(220,t),n.frequency.exponentialRampToValueAtTime(52,t+.4);let r=e.createBiquadFilter();r.type=`lowpass`,r.Q.value=4,r.frequency.setValueAtTime(1400,t),r.frequency.exponentialRampToValueAtTime(220,t+.4);let i=e.createGain();i.gain.setValueAtTime(.13,t),i.gain.exponentialRampToValueAtTime(1e-4,t+.44),n.connect(r),r.connect(i),i.connect(this.sfx),n.start(t),n.stop(t+.46)}bumper(e=.5){if(!this.ready||this.muted)return;let t=this.ctx,n=t.currentTime,r=W(760,1150,e)*K(.92,1.1),i=t.createOscillator();i.type=`square`,i.frequency.setValueAtTime(r,n),i.frequency.exponentialRampToValueAtTime(r*.18,n+.085);let a=t.createBiquadFilter();a.type=`lowpass`,a.Q.value=5,a.frequency.setValueAtTime(4200,n),a.frequency.exponentialRampToValueAtTime(700,n+.1);let o=t.createGain();o.gain.setValueAtTime(0,n),o.gain.linearRampToValueAtTime(.19,n+.004),o.gain.exponentialRampToValueAtTime(1e-4,n+.14),i.connect(a),a.connect(o),o.connect(this.sfx),i.start(n),i.stop(n+.16);let s=t.createOscillator();s.type=`sine`,s.frequency.setValueAtTime(190,n),s.frequency.exponentialRampToValueAtTime(72,n+.12);let c=t.createGain();c.gain.setValueAtTime(0,n),c.gain.linearRampToValueAtTime(.16,n+.005),c.gain.exponentialRampToValueAtTime(1e-4,n+.16),s.connect(c),c.connect(this.sfx),s.start(n),s.stop(n+.18)}sling(){if(!this.ready||this.muted)return;let e=this.ctx,t=e.currentTime,n=this._noise(.12,t),r=e.createBiquadFilter();r.type=`bandpass`,r.Q.value=2.4,r.frequency.setValueAtTime(2600,t),r.frequency.exponentialRampToValueAtTime(560,t+.1);let i=e.createGain();i.gain.setValueAtTime(.3,t),i.gain.exponentialRampToValueAtTime(1e-4,t+.12),n.connect(r),r.connect(i),i.connect(this.sfx);let a=e.createOscillator();a.type=`sawtooth`,a.frequency.setValueAtTime(620*K(.94,1.08),t),a.frequency.exponentialRampToValueAtTime(96,t+.13);let o=e.createGain();o.gain.setValueAtTime(0,t),o.gain.linearRampToValueAtTime(.17,t+.004),o.gain.exponentialRampToValueAtTime(1e-4,t+.18);let s=e.createBiquadFilter();s.type=`lowpass`,s.frequency.value=3e3,a.connect(s),s.connect(o),o.connect(this.sfx),a.start(t),a.stop(t+.2)}goal(e){if(!this.ready||this.muted)return;let t=this.ctx,n=t.currentTime;this.duck(.7,.3);let r=this._noise(.5,n),i=t.createBiquadFilter();i.type=`lowpass`,i.frequency.setValueAtTime(3200,n),i.frequency.exponentialRampToValueAtTime(180,n+.42);let a=t.createGain();a.gain.setValueAtTime(.42,n),a.gain.exponentialRampToValueAtTime(1e-4,n+.5),r.connect(i),i.connect(a),a.connect(this.sfx);let o=t.createOscillator();o.type=`sine`,o.frequency.setValueAtTime(150,n),o.frequency.exponentialRampToValueAtTime(34,n+.55);let s=t.createGain();s.gain.setValueAtTime(0,n),s.gain.linearRampToValueAtTime(.5,n+.008),s.gain.exponentialRampToValueAtTime(1e-4,n+.7),o.connect(s),s.connect(this.sfx),o.start(n),o.stop(n+.75),(e?[Z(4),Z(0)]:[Z(7),Z(12)]).forEach((e,r)=>{let i=t.createOscillator();i.type=`triangle`,i.frequency.value=e;let a=t.createGain(),o=n+.06+r*.11;a.gain.setValueAtTime(0,o),a.gain.linearRampToValueAtTime(.13,o+.01),a.gain.exponentialRampToValueAtTime(1e-4,o+.4),i.connect(a),a.connect(this.sfx),i.start(o),i.stop(o+.42)})}explode(){if(!this.ready||this.muted)return;let e=this.ctx,t=e.currentTime;this.duck(1.4,.22);let n=this._noise(1.4,t),r=e.createBiquadFilter();r.type=`lowpass`,r.frequency.setValueAtTime(5200,t),r.frequency.exponentialRampToValueAtTime(90,t+1.2);let i=e.createGain();i.gain.setValueAtTime(.62,t),i.gain.exponentialRampToValueAtTime(1e-4,t+1.35),n.connect(r),r.connect(i),i.connect(this.sfx);let a=e.createOscillator();a.type=`sine`,a.frequency.setValueAtTime(120,t),a.frequency.exponentialRampToValueAtTime(24,t+1);let o=e.createGain();o.gain.setValueAtTime(.6,t+.01),o.gain.exponentialRampToValueAtTime(1e-4,t+1.2),a.connect(o),o.connect(this.sfx),a.start(t),a.stop(t+1.25)}surge(){if(!this.ready||this.muted)return;let e=this.ctx,t=e.currentTime,n=e.createOscillator();n.type=`sawtooth`,n.frequency.setValueAtTime(180,t),n.frequency.exponentialRampToValueAtTime(1150,t+.26);let r=e.createBiquadFilter();r.type=`bandpass`,r.Q.value=7,r.frequency.setValueAtTime(400,t),r.frequency.exponentialRampToValueAtTime(2600,t+.26);let i=e.createGain();i.gain.setValueAtTime(0,t),i.gain.linearRampToValueAtTime(.2,t+.03),i.gain.exponentialRampToValueAtTime(1e-4,t+.32),n.connect(r),r.connect(i),i.connect(this.sfx),n.start(t),n.stop(t+.34)}serve(){if(!this.ready||this.muted)return;let e=this.ctx,t=e.currentTime,n=this._noise(1.1,t),r=e.createBiquadFilter();r.type=`bandpass`,r.Q.value=5,r.frequency.setValueAtTime(240,t),r.frequency.exponentialRampToValueAtTime(2400,t+1);let i=e.createGain();i.gain.setValueAtTime(.001,t),i.gain.exponentialRampToValueAtTime(.17,t+.95),i.gain.exponentialRampToValueAtTime(1e-4,t+1.12),n.connect(r),r.connect(i),i.connect(this.sfx);let a=e.createOscillator();a.type=`square`,a.frequency.setValueAtTime(880,t+1),a.frequency.exponentialRampToValueAtTime(220,t+1.16);let o=e.createGain();o.gain.setValueAtTime(0,t+1),o.gain.linearRampToValueAtTime(.16,t+1.01),o.gain.exponentialRampToValueAtTime(1e-4,t+1.2),a.connect(o),o.connect(this.sfx),a.start(t+1),a.stop(t+1.22)}arcOn(){if(!this.ready||this.muted)return;let e=this.ctx,t=e.currentTime;this.duck(.5,.5);let n=this._noise(.7,t),r=e.createBiquadFilter();r.type=`bandpass`,r.Q.value=3.5,r.frequency.setValueAtTime(320,t),r.frequency.exponentialRampToValueAtTime(4200,t+.3);let i=e.createGain();i.gain.setValueAtTime(1e-4,t),i.gain.exponentialRampToValueAtTime(.34,t+.1),i.gain.exponentialRampToValueAtTime(1e-4,t+.62);let a=e.createGain();a.gain.value=0;let o=e.createOscillator();o.type=`square`,o.frequency.setValueAtTime(38,t),o.frequency.exponentialRampToValueAtTime(120,t+.5);let s=e.createGain();s.gain.value=1,o.connect(s),s.connect(a.gain),o.start(t),o.stop(t+.7),n.connect(r),r.connect(a),a.connect(i),i.connect(this.sfx);let c=e.createOscillator();c.type=`sine`,c.frequency.setValueAtTime(180,t),c.frequency.exponentialRampToValueAtTime(42,t+.4);let l=e.createGain();l.gain.setValueAtTime(0,t),l.gain.linearRampToValueAtTime(.42,t+.012),l.gain.exponentialRampToValueAtTime(1e-4,t+.55),c.connect(l),l.connect(this.sfx),c.start(t),c.stop(t+.6),this._arcLoopStart()}_arcLoopStart(){let e=this.ctx;if(!this._arcBus){let t=e.createGain();t.gain.value=0,t.connect(this.sfx);let n=e.createBiquadFilter();n.type=`bandpass`,n.frequency.value=900,n.Q.value=6,n.connect(t);for(let t of[58,87.5,174]){let r=e.createOscillator();r.type=`sawtooth`,r.frequency.value=t;let i=e.createGain();i.gain.value=t>100?.1:.22,r.connect(i),i.connect(n),r.start()}let r=this._noise(1e6,e.currentTime),i=e.createBiquadFilter();i.type=`highpass`,i.frequency.value=2600;let a=e.createGain();a.gain.value=.075,r.connect(i),i.connect(a),a.connect(t);let o=e.createOscillator();o.type=`sine`,o.frequency.value=7.3;let s=e.createGain();s.gain.value=420,o.connect(s),s.connect(n.frequency),o.start(),this._arcBus=t}let t=this._arcBus.gain,n=e.currentTime;t.cancelScheduledValues(n),t.setValueAtTime(t.value,n),t.linearRampToValueAtTime(.3,n+.1)}arcSilence(){if(!this.ready||!this._arcBus)return;let e=this.ctx.currentTime,t=this._arcBus.gain;t.cancelScheduledValues(e),t.setValueAtTime(t.value,e),t.linearRampToValueAtTime(0,e+.06)}arcOff(){if(!this.ready||this.muted)return;let e=this.ctx,t=e.currentTime;if(this._arcBus){let e=this._arcBus.gain;e.cancelScheduledValues(t),e.setValueAtTime(e.value,t),e.exponentialRampToValueAtTime(1e-4,t+.28)}let n=e.createOscillator();n.type=`sawtooth`,n.frequency.setValueAtTime(900,t),n.frequency.exponentialRampToValueAtTime(70,t+.34);let r=e.createBiquadFilter();r.type=`lowpass`,r.Q.value=8,r.frequency.setValueAtTime(3e3,t),r.frequency.exponentialRampToValueAtTime(200,t+.34);let i=e.createGain();i.gain.setValueAtTime(.18,t),i.gain.exponentialRampToValueAtTime(1e-4,t+.38),n.connect(r),r.connect(i),i.connect(this.sfx),n.start(t),n.stop(t+.4)}arcHit(e=.5){if(!this.ready||this.muted)return;let t=this.ctx,n=t.currentTime,r=this._noise(.14,n),i=t.createBiquadFilter();i.type=`bandpass`,i.Q.value=1.2,i.frequency.setValueAtTime(W(2600,5200,e),n),i.frequency.exponentialRampToValueAtTime(700,n+.12);let a=t.createGain();a.gain.setValueAtTime(.3,n),a.gain.exponentialRampToValueAtTime(1e-4,n+.13),r.connect(i),i.connect(a),a.connect(this.sfx);let o=t.createOscillator();o.type=`square`,o.frequency.setValueAtTime(W(700,1300,e)*K(.9,1.12),n),o.frequency.exponentialRampToValueAtTime(160,n+.09);let s=t.createGain();s.gain.setValueAtTime(0,n),s.gain.linearRampToValueAtTime(.13,n+.003),s.gain.exponentialRampToValueAtTime(1e-4,n+.11),o.connect(s),s.connect(this.sfx),o.start(n),o.stop(n+.12)}arcReady(){if(!this.ready||this.muted)return;let e=this.ctx,t=e.currentTime;[0,.075].forEach((n,r)=>{let i=e.createOscillator();i.type=`triangle`,i.frequency.value=Z(r===0?12:19);let a=e.createGain();a.gain.setValueAtTime(0,t+n),a.gain.linearRampToValueAtTime(.075,t+n+.006),a.gain.exponentialRampToValueAtTime(1e-4,t+n+.3),i.connect(a),a.connect(this.sfx),i.start(t+n),i.stop(t+n+.32)})}ui(e=`tick`){if(!this.ready||this.muted)return;let t=this.ctx,n=t.currentTime,r=e===`confirm`?880:e===`back`?330:660,i=t.createOscillator();i.type=`square`,i.frequency.setValueAtTime(r,n),e===`confirm`&&i.frequency.exponentialRampToValueAtTime(r*1.5,n+.08);let a=t.createGain();a.gain.setValueAtTime(0,n),a.gain.linearRampToValueAtTime(.07,n+.004),a.gain.exponentialRampToValueAtTime(1e-4,n+.12);let o=t.createBiquadFilter();o.type=`lowpass`,o.frequency.value=3200,i.connect(o),o.connect(a),a.connect(this.uiBus),i.start(n),i.stop(n+.14)}stinger(e){if(!this.ready||this.muted)return;let t=this.ctx,n=t.currentTime;(e?[0,7,12,19]:[0,-2,-5,-12]).forEach((r,i)=>{let a=n+i*.13;for(let[n,i]of[[1,.15],[2,.07]]){let o=t.createOscillator();o.type=e?`triangle`:`sawtooth`,o.frequency.value=Z(r)*n;let s=t.createGain();s.gain.setValueAtTime(0,a),s.gain.linearRampToValueAtTime(i,a+.012),s.gain.exponentialRampToValueAtTime(1e-4,a+1.1);let c=t.createBiquadFilter();c.type=`lowpass`,c.frequency.value=e?4200:1400,o.connect(c),c.connect(s),s.connect(this.sfx),o.start(a),o.stop(a+1.15)}})}},Kn=2*Math.PI*42,Q=e=>document.getElementById(e),qn=`<svg class="g-bolt" viewBox="0 0 12 20" aria-hidden="true"><path d="M8.4 0 L1 11.4 H4.9 L3.6 20 L11 8.2 H6.6 Z"/></svg>`,Jn=`
  <div class="ctrl">
    <div class="keys wasd">
      <b class="key dead">W</b>
      <b class="key">A</b><b class="key dead">S</b><b class="key">D</b>
    </div>
    <i>STEER</i>
  </div>
  <div class="ctrl">
    <b class="key space">SPACE</b>
    <i>${qn}ARC / SURGE</i>
  </div>
  <div class="ctrl">
    <b class="key">SHIFT</b>
    <i>SURGE ONLY</i>
  </div>`,Yn=`
  <div class="ctrl">
    <svg class="glyph" viewBox="0 0 44 32" aria-hidden="true">
      <path class="g-stroke" d="M8 16 H36" />
      <path class="g-stroke" d="M12 11 L7 16 L12 21" />
      <path class="g-stroke" d="M32 11 L37 16 L32 21" />
      <circle class="g-fill" cx="22" cy="16" r="5" />
    </svg>
    <i>SLIDE TO STEER</i>
  </div>
  <div class="ctrl">
    <svg class="glyph" viewBox="0 0 44 32" aria-hidden="true">
      <circle class="g-stroke" cx="22" cy="16" r="12" opacity="0.35" />
      <circle class="g-stroke" cx="22" cy="16" r="8" opacity="0.7" />
      <circle class="g-fill" cx="22" cy="16" r="4" />
    </svg>
    <i>${qn}TAP TO FIRE</i>
  </div>`,Xn=class{constructor(){this.dom={hud:Q(`hud`),rivals:Q(`rivals`),orbCount:Q(`orbCount`),selfArc:Q(`selfArc`),selfScore:Q(`selfScore`),selfPips:Q(`selfPips`),countdown:Q(`countdown`),countdownNum:Q(`countdown`).querySelector(`span`),toasts:Q(`toasts`),arcMeter:Q(`arcMeter`),arcFill:Q(`arcFill`),arcWord:Q(`arcWord`),salvMeter:Q(`salvMeter`),salvFill:Q(`salvFill`),salvWord:Q(`salvWord`),pinMeter:Q(`pinMeter`),pinFill:Q(`pinFill`),pinWord:Q(`pinWord`),bhMeter:Q(`bhMeter`),bhFill:Q(`bhFill`),bhWord:Q(`bhWord`),combo:Q(`combo`),comboNum:Q(`combo`).querySelector(`b`),boot:Q(`boot`),loadFill:Q(`loadFill`),loadText:Q(`loadText`),menu:Q(`menu`),pause:Q(`pause`),result:Q(`result`),resultBadge:Q(`resultBadge`),resultTitle:Q(`resultTitle`),standings:Q(`standings`),matchStats:Q(`matchStats`),ctrlHint:Q(`ctrlHint`),nowebgl:Q(`nowebgl`)},this.pods=[],this.pips=[],this._scores=[-1,-1,-1,-1],this._orbs=-1,this._combo=-1,this._arc=-1,this._arcState=``,this._salv=-1,this._salvClosed=null,this._pin=-1,this._pinLive=null,this._bh=-1,this._bhLive=null,this._countTimer=null,V.enabled||(this.dom.pinMeter.style.display=`none`),H.enabled||(this.dom.bhMeter.style.display=`none`),this._buildPods(),this._setControlHint()}_pipStrip(e){let t=[];for(let n=0;n<I.maxPoints;n++){let r=document.createElement(`i`);r.className=n>=I.startPoints?`pip bonus`:`pip`,e.appendChild(r),t.push(r)}return t}_buildPods(){let e=[1,2,3];this.dom.rivals.innerHTML=``;for(let t of e){let e=F[t],n=document.createElement(`div`);n.className=`pod`,n.style.setProperty(`--c`,e.css),n.innerHTML=`<div class="pod-name">${e.name}</div><div class="pips"></div>`,this.dom.rivals.appendChild(n),this.pods[t]=n,this.pips[t]=this._pipStrip(n.querySelector(`.pips`))}this.dom.selfPips.innerHTML=``,this.pips[0]=this._pipStrip(this.dom.selfPips),this.pods[0]=Q(`selfPod`)}_setControlHint(){let e=matchMedia(`(hover: none) and (pointer: coarse)`).matches;this.dom.ctrlHint.innerHTML=e?Yn:Jn}showGame(e){this.dom.hud.style.opacity=e?`1`:`0`,this.dom.hud.style.transition=`opacity .4s cubic-bezier(.16,1,.3,1)`,this.dom.hud.classList.toggle(`inert`,!e)}hideScreen(e){return new Promise(t=>{if(e.classList.contains(`hidden`))return t();e.classList.add(`leaving`),setTimeout(()=>{e.classList.add(`hidden`),e.classList.remove(`leaving`),t()},320)})}showScreen(e){e.classList.remove(`hidden`,`leaving`),e.style.animation=`none`,e.offsetWidth,e.style.animation=``}setLoadProgress(e,t){this.dom.loadFill.style.width=`${Math.round(e*100)}%`,t&&(this.dom.loadText.textContent=t)}setScore(e,t,n=I.maxPoints){if(this._scores[e]===t)return;let r=this._scores[e],i=t<r&&r>=0,a=t>r&&r>=0;this._scores[e]=t;let o=this.pips[e];for(let e=0;e<o.length;e++)o[e].classList.toggle(`spent`,e>=t);e===0&&(this.dom.selfScore.textContent=String(t),this.dom.selfArc.style.strokeDashoffset=String(Kn*(1-t/n)),this.dom.selfArc.style.stroke=t<=1?`var(--danger)`:t>I.startPoints?`var(--salv)`:`var(--p0)`,(i||a)&&this._replay(this.dom.selfScore,i?`hit`:`gain`)),i?this._replay(this.pods[e],`hit`):a&&this._replay(this.pods[e],`gain`)}setSalvageClosed(e){e!==this._salvClosed&&(this._salvClosed=e,this.dom.salvMeter.classList.toggle(`closed`,e),this.dom.salvWord.textContent=e?`CLOSED`:`SALVAGE`,e&&(this._salv=0,this.dom.salvFill.style.width=`0%`))}setSalvage(e,t){if(this._salvClosed)return;let n=Math.round(Math.min(1,e/t)*100);n!==this._salv&&(n<this._salv&&this._replay(this.dom.salvMeter,`paid`),this._salv=n,this.dom.salvFill.style.width=`${n}%`)}markEliminated(e){this.pods[e]?.classList.add(`dead`)}setOrbCount(e){if(this._orbs===e)return;let t=e>this._orbs&&this._orbs>=0;this._orbs=e,this.dom.orbCount.textContent=String(e),t&&this._replay(this.dom.orbCount,`bump`)}setCombo(e){if(this._combo!==e){if(this._combo=e,e<3){this.dom.combo.classList.remove(`show`);return}this.dom.comboNum.textContent=String(e),this.dom.combo.classList.add(`show`),this._replay(this.dom.combo,`tick`)}}setArc(e,t,n){let r=n?`live`:t?`ready`:``,i=Math.round(e*100);i!==this._arc&&(this._arc=i,this.dom.arcFill.style.width=`${i}%`),r!==this._arcState&&(this._arcState=r,this.dom.arcMeter.classList.toggle(`ready`,r===`ready`),this.dom.arcMeter.classList.toggle(`live`,r===`live`),this.dom.arcWord.textContent=n?`LIVE`:t?`READY`:`ARC`)}setPinball(e,t){let n=Math.round(e*100);n!==this._pin&&(this._pin=n,this.dom.pinFill.style.width=`${n}%`),t!==this._pinLive&&(this._pinLive=t,this.dom.pinMeter.classList.toggle(`live`,t),this.dom.pinWord.textContent=t?`LIVE`:`BUMPERS`)}setBlackHole(e,t){let n=Math.round(e*100);n!==this._bh&&(this._bh=n,this.dom.bhFill.style.width=`${n}%`),t!==this._bhLive&&(this._bhLive=t,this.dom.bhMeter.classList.toggle(`live`,t),this.dom.bhWord.textContent=t?`OPEN`:`SINGULARITY`)}countdown(e){this.dom.countdownNum.textContent=String(e),this.dom.countdown.classList.remove(`show`),this.dom.countdown.offsetWidth,this.dom.countdown.classList.add(`show`),clearTimeout(this._countTimer),this._countTimer=setTimeout(()=>this.dom.countdown.classList.remove(`show`),950)}toast(e,t={}){let n=document.createElement(`div`);for(n.className=`toast`+(t.tone?` ${t.tone}`:``),t.color&&n.style.setProperty(`--c`,t.color),n.textContent=e,this.dom.toasts.appendChild(n);this.dom.toasts.children.length>3;)this.dom.toasts.firstElementChild.remove();setTimeout(()=>{n.classList.add(`out`),setTimeout(()=>n.remove(),360)},2200)}clearToasts(){this.dom.toasts.innerHTML=``,this.dom.countdown.classList.remove(`show`),clearTimeout(this._countTimer)}_replay(e,t){e&&(e.classList.remove(t),e.offsetWidth,e.classList.add(t))}resetMatch(){this._scores=[-1,-1,-1,-1],this._orbs=-1,this._combo=-1;for(let e=0;e<4;e++)this.pods[e]?.classList.remove(`dead`,`hit`),this.setScore(e,I.startPoints);this.dom.combo.classList.remove(`show`),this.clearToasts(),this._arc=-1,this._arcState=``,this.setArc(0,!1,!1),this._salv=-1,this._salvClosed=null,this.setSalvageClosed(!1),this.setSalvage(0,B.perPoint),this._pin=-1,this._pinLive=null,this.setPinball(0,!1),this._bh=-1,this._bhLive=null,this.setBlackHole(0,!1)}showResult(e){let t=e.order[0]===0;this.dom.resultBadge.textContent=t?`VICTORY`:`ELIMINATED`,this.dom.resultBadge.classList.toggle(`defeat`,!t),this.dom.resultTitle.textContent=t?`LAST ONE STANDING`:`${F[e.order[0]].name} TAKES THE DECK`,this.dom.standings.innerHTML=``,e.order.forEach((t,n)=>{let r=F[t],i=document.createElement(`div`);i.className=`stand-row`+(n===0?` first`:``),i.style.setProperty(`--c`,r.css),i.style.animationDelay=`${n*.08}s`;let a=e.finalScores[t];i.innerHTML=`
        <div class="stand-rank">${n+1}</div>
        <div class="stand-dot"></div>
        <div class="stand-name">${r.name}</div>
        <div class="stand-val">${a>0?`${a} LEFT`:`OUT`}</div>`,this.dom.standings.appendChild(i)});let n=e.stats;this.dom.matchStats.innerHTML=`
      <div class="stat"><b>${n.deflections}</b><i>DEFLECTIONS</i></div>
      <div class="stat"><b>${n.bestChain}</b><i>BEST CHAIN</i></div>
      <div class="stat"><b>${n.bricks}</b><i>BLOCKS BROKEN</i></div>
      <div class="stat"><b>${n.knockouts}</b><i>KNOCKOUTS</i></div>
      <div class="stat"><b>${this._fmtTime(n.duration)}</b><i>DURATION</i></div>`,this.showScreen(this.dom.result)}_fmtTime(e){let t=Math.floor(e/60),n=Math.floor(e%60);return`${t}:${String(n).padStart(2,`0`)}`}},$=e=>document.getElementById(e),Zn=new class{constructor(){this.hud=new Xn,this.audio=new Gn,this.difficulty=1,this.timer=new _,this.governor=new Oe(.62),this.renderScale=1,this.running=!1,this.inMatch=!1}async start(){let e=$(`gl`),t;try{t=new w({canvas:e,antialias:!1,alpha:!1,depth:!0,stencil:!1,powerPreference:`high-performance`,preserveDrawingBuffer:!1,failIfMajorPerformanceCaveat:!1})}catch(e){console.error(e),this.hud.showScreen($(`nowebgl`)),$(`boot`).classList.add(`hidden`);return}if(!t.capabilities.isWebGL2){this.hud.showScreen($(`nowebgl`)),$(`boot`).classList.add(`hidden`);return}this.renderer=t,t.toneMapping=0,t.outputColorSpace=se,t.shadowMap.enabled=!0,t.shadowMap.type=1,t.shadowMap.autoUpdate=!1,t.info.autoReset=!1,this.stats={sceneCalls:0,sceneTris:0,totalCalls:0,fps:0};let n=Ee(t.getContext()),r=new URLSearchParams(location.search),i=r.has(`tier`)?U(Number(r.get(`tier`))|0,0,2):n.tier;this.tier=i,this.preset={...De[i]},this.isTouch=n.touch,this._dprOverride=r.has(`dpr`)?Number(r.get(`dpr`)):null,this._noMusic=r.has(`nomusic`),this._zoom=r.has(`zoom`)?Number(r.get(`zoom`)):null,this._auto=r.has(`auto`),!t.extensions.get(`EXT_color_buffer_half_float`)&&!t.extensions.get(`EXT_color_buffer_float`)&&(console.warn(`[gfx] no float render targets; disabling MSAA and hoping for the best`),this.preset.msaa=0),this.baseDpr=this._dprOverride??Math.min(window.devicePixelRatio||1,this.preset.maxDpr),this.scene=new s,this.gcam=new ot(this._aspect()),this.postfx=new Qe(t,this.preset),this.input=new Rn(e),this._resize(),window.addEventListener(`resize`,()=>this._resize()),window.addEventListener(`orientationchange`,()=>setTimeout(()=>this._resize(),220)),visualViewport?.addEventListener(`resize`,()=>this._resize()),this.hud.setLoadProgress(.04,`LINKING SHADERS`),await this._nextFrame(),this.assets=new je,await this.assets.loadAll((e,t,n)=>{this.hud.setLoadProgress(.05+e/t*.62,`LOADING ${n.toUpperCase()}`)}),this.assets.colormap&&Pe(this.assets.colormap),this.hud.setLoadProgress(.7,`IGNITING NEBULA`),await this._nextFrame(),this.env=Ge(t,this.scene,this.preset),this.hud.setLoadProgress(.8,`ASSEMBLING DECK`),await this._nextFrame(),this.game=new Hn(this.scene,this.gcam,this.assets,this.audio,this.hud,this.preset,this.input),this.game.onMatchEnd=e=>this._onMatchEnd(e),this.hud.setLoadProgress(.9,`COMPILING PIPELINE`),await this._nextFrame(),await t.compileAsync(this.scene,this.gcam.cam),this._bakeShadows(),this.hud.setLoadProgress(1,`READY`),await this._nextFrame(),this._wireUI(),this.game.startAttract(),this.running=!0,t.setAnimationLoop(()=>this._frame()),await this._sleep(320),await this.hud.hideScreen($(`boot`)),this.hud.showScreen($(`menu`)),this.hud.showGame(!1)}_bakeShadows(){this.renderer.shadowMap.needsUpdate=!0,this.renderer.setRenderTarget(this.postfx.hdr),this.renderer.render(this.scene,this.gcam.cam),this.renderer.setRenderTarget(null)}_wireUI(){let e=async e=>{await this.audio.unlock(),e()};for(let t of document.querySelectorAll(`.diff`))t.addEventListener(`click`,()=>e(()=>{document.querySelectorAll(`.diff`).forEach(e=>e.classList.remove(`active`)),t.classList.add(`active`),this.difficulty=Number(t.dataset.diff),this.audio.ui(`tick`)}));$(`playBtn`).addEventListener(`click`,()=>e(()=>this._startMatch())),$(`againBtn`).addEventListener(`click`,()=>e(()=>this._startMatch())),$(`menuBtn`).addEventListener(`click`,()=>e(()=>this._toMenu())),$(`pauseBtn`).addEventListener(`click`,()=>e(()=>this._setPaused(!0))),$(`resumeBtn`).addEventListener(`click`,()=>e(()=>this._setPaused(!1))),$(`quitBtn`).addEventListener(`click`,()=>e(()=>{this._setPaused(!1),this._toMenu()})),document.addEventListener(`visibilitychange`,()=>{document.hidden?(this.inMatch&&!this.paused&&this._setPaused(!0),this.audio.ctx?.suspend?.()):this.audio.ctx?.state===`suspended`&&this.audio.ready&&this.audio.ctx.resume()}),window.addEventListener(`blur`,()=>{this.inMatch&&!this.paused&&this._setPaused(!0)});let t=this.renderer.domElement;t.addEventListener(`webglcontextlost`,e=>{e.preventDefault(),this.running=!1,this.renderer.setAnimationLoop(null),console.warn(`[gfx] context lost`)}),t.addEventListener(`webglcontextrestored`,()=>{console.warn(`[gfx] context restored`),this._resize(),this.renderer.shadowMap.needsUpdate=!0,this.running=!0,this.timer.update(),this.renderer.setAnimationLoop(()=>this._frame())})}async _startMatch(){this.audio.ui(`confirm`),this._music(.5),await Promise.all([this.hud.hideScreen($(`menu`)),this.hud.hideScreen($(`result`))]),this.hud.showGame(!0),this.inMatch=!0,this.game.autoPlayer=this._auto,this.game.startMatch(this.difficulty)}async _toMenu(){this.audio.ui(`back`),this.inMatch=!1,await Promise.all([this.hud.hideScreen($(`result`)),this.hud.hideScreen($(`pause`))]),this.hud.showGame(!1),this.game.startAttract(),this.hud.showScreen($(`menu`)),this._music(.28)}_setPaused(e){this.paused=e,this.game.setPaused(e),this.audio.setPauseMuted(e),e?(this.audio.ui(`back`),this.hud.showScreen($(`pause`))):(this.audio.ui(`tick`),this.hud.hideScreen($(`pause`)))}_onMatchEnd(e){this.inMatch=!1,this.hud.showGame(!1),this._music(.25),this.hud.showResult(e)}_aspect(){return Math.max(1,window.innerWidth)/Math.max(1,window.innerHeight)}_resize(){let t=Math.max(1,Math.floor(window.innerWidth)),n=Math.max(1,Math.floor(window.innerHeight)),r=this.baseDpr*this.renderScale;this.renderer.setPixelRatio(r),this.renderer.setSize(t,n,!1);let i=this.renderer.domElement;i.style.width=`${t}px`,i.style.height=`${n}px`;let a=new e;this.renderer.getDrawingBufferSize(a),this.postfx.setSize(a.x,a.y),this.gcam.resize(t/n),this.env?.setPixelRatio(r),this.game?.effects.setPixelRatio(Math.min(r,2)),this.game?.refreshMapper(t),this.cssWidth=t,this.game&&(this.renderer.shadowMap.needsUpdate=!0)}_applyRenderScale(){this._resize()}_frame(){if(!this.running)return;this.timer.update();let e=this.timer.getDelta(),t=Math.min(e,1/20);this.governor.update(e*1e3)&&(this.renderScale=this.governor.scale,this._applyRenderScale());let n=this.timer.getElapsed();this._zoom&&(this.gcam.targetZoom=this._zoom),this.audio.update(t),this.game.refreshMapper(this.cssWidth),this.game.update(t),this.gcam.update(t,n),this.env.update(n),this.env.group.position.copy(this.gcam.cam.position);let r=this.postfx.u,i=this.game.effects;r.uFlash.value=i.flash,r.uFlashTint.value.copy(i.flashColor),r.uRadial.value=i.radial,r.uDesat.value=(1-this.game.timeScale)*.3,r.uExposure.value=.92+i.flash*.22;let a=this.inMatch&&this.game.alive[0]&&this.game.scores[0]<=1?.5+.5*Math.sin(n*5.2):0;r.uVignette.value+=(.44+a*.3-r.uVignette.value)*Math.min(1,t*4),r.uBloomStrength.value=.42+i.flash*.45,this.renderer.info.reset(),this.postfx.renderScene(this.scene,this.gcam.cam);let o=this.renderer.info.render;this.stats.sceneCalls=o.calls,this.stats.sceneTris=o.triangles,this.postfx.present(n),this.stats.totalCalls=this.renderer.info.render.calls,this.stats.fps=1e3/Math.max(.01,this.governor.avg),this.input.consumePause()&&this.inMatch&&this._setPaused(!this.paused)}_music(e){this.audio.setMusicLevel(this._noMusic?0:e)}_nextFrame(){return new Promise(e=>requestAnimationFrame(()=>e()))}_sleep(e){return new Promise(t=>setTimeout(t,e))}};Zn.start().catch(e=>{console.error(`[boot] fatal`,e);let t=document.getElementById(`loadText`);t&&(t.textContent=`STARTUP FAILED — SEE CONSOLE`)}),window.__ballistix=Zn;