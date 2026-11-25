/* Deck engine: one WebGL scene behind HTML slides. three.js r128 (global THREE). */
(function(){
'use strict';
var RX=window.RX={};
var $=RX.$=function(s,r){return (r||document).querySelector(s);};
var $$=RX.$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
var root=document.documentElement, W=innerWidth, H=innerHeight, BG=0x050c1a;
RX.STATIC=/[?&]static/.test(location.search);RX.FX=!/[?&]nofx/.test(location.search);var uT=RX.uT={value:0};
if(RX.STATIC){var noTr=document.createElement('style');noTr.textContent='*,*::before,*::after{transition:none!important}#help{display:none}';document.head.appendChild(noTr);}

/* ---------- renderer, lights, reflections ---------- */
var renderer=new THREE.WebGLRenderer({canvas:$('#gl'),antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
var scene=new THREE.Scene();scene.background=new THREE.Color(BG);
var camera=new THREE.PerspectiveCamera(35,W/H,.1,900);
var hemi=new THREE.HemisphereLight(0xdfe9ff,0x0c1018,.7);scene.add(hemi);
var sun=new THREE.DirectionalLight(0xffffff,1.05);sun.position.set(6,12,7);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0005;sun.shadow.radius=4;
(function(c){c.left=-12;c.right=12;c.top=12;c.bottom=-12;c.near=1;c.far=45;})(sun.shadow.camera);
scene.add(sun);scene.add(sun.target);
var rim=new THREE.DirectionalLight(0x4fc3ff,.95);rim.position.set(-8,5,-7);scene.add(rim);
var kick=new THREE.DirectionalLight(0xff9a4d,.3);kick.position.set(-7,2.5,8);scene.add(kick);
(function(){ // a small studio, baked once, gives metal parts something to reflect
  try{var pm=new THREE.PMREMGenerator(renderer),s=new THREE.Scene();
    s.add(new THREE.Mesh(new THREE.SphereGeometry(60,24,12),new THREE.MeshBasicMaterial({color:0x141b28,side:THREE.BackSide})));
    function panel(w,h,x,y,z,c){var m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);s.add(m);}
    panel(40,18,0,38,0,0xffffff);panel(26,12,36,14,10,0xbfd8ff);panel(22,10,-34,10,-16,0xffc9a0);panel(60,6,0,2,-44,0x35506e);
    scene.environment=pm.fromScene(s,.03).texture;pm.dispose();}catch(e){}
})();
RX.renderer=renderer;RX.scene=scene;RX.camera=camera;RX.sun=sun;

/* ---------- small helpers ---------- */
var YAX=new THREE.Vector3(0,1,0), _v=new THREE.Vector3();
function V3(a){return a&&a.isVector3?a.clone():new THREE.Vector3(a[0],a[1],a[2]);}
function ease(k){return k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;}
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function lerp(a,b,k){return a+(b-a)*k;}
function at(m,x,y,z){m.position.set(x,y,z);return m;}
function std(c,r,m,o){var p={color:c,roughness:r==null?.5:r,metalness:m||0};if(o)for(var k in o)p[k]=o[k];return new THREE.MeshStandardMaterial(p);}
function glow(c,i){return new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:(i==null?.8:i)*1.6,roughness:.4});}
function cyl(r,h,m,ax,r2,seg){var g=new THREE.CylinderGeometry(r2==null?r:r2,r,h,seg||32);if(ax==='z')g.rotateX(Math.PI/2);if(ax==='x')g.rotateZ(-Math.PI/2);return new THREE.Mesh(g,m);}
function box(w,h,d,m){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);}
function sph(r,m,s){return new THREE.Mesh(new THREE.SphereGeometry(r,s||24,s?Math.round(s*.7):16),m);}
function rrShape(w,h,r){var s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
/* box with rounded edges: w along x, h along y, d along z */
function rbox(w,h,d,r,m){var b=Math.min(r*.5,d*.2,w*.2,h*.2),g=new THREE.ExtrudeGeometry(rrShape(w-2*b,h-2*b,Math.max(.001,r-b)),{depth:d-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:3,curveSegments:8});g.translate(0,0,-(d-2*b)/2);return new THREE.Mesh(g,m);}
/* robot link: two discs (r1 at the origin, r2 at x = L) joined by their tangents, t thick along z */
function stadium(L,r1,r2,t,m){var be=Math.acos(clamp((r1-r2)/L,-1,1)),s=new THREE.Shape();s.absarc(0,0,r1,be,2*Math.PI-be,false);s.absarc(L,0,r2,-be,be,false);
  var b=Math.min(.02,t*.2),g=new THREE.ExtrudeGeometry(s,{depth:t-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:20});g.translate(0,0,-(t-2*b)/2);return new THREE.Mesh(g,m);}
/* a thin bar that can be stretched between two points */
function rod(r,m,seg){var me=new THREE.Mesh(new THREE.CylinderGeometry(r,r,1,seg||12),m);me.setAB=function(a,b){var d=_v.copy(b).sub(a),l=d.length()||1e-6;me.position.copy(a).addScaledVector(d,.5);me.scale.set(1,l,1);me.quaternion.setFromUnitVectors(YAX,d.multiplyScalar(1/l));return me;};return me;}
function shadow(g,recv){g.traverse(function(o){if(o.isMesh){o.castShadow=true;if(recv)o.receiveShadow=true;}});return g;}
function floor(g,o){o=o||{};var f=new THREE.Mesh(new THREE.CircleGeometry(o.r||60,72),std(o.color==null?0x0b111b:o.color,.92,0));f.rotation.x=-Math.PI/2;f.receiveShadow=true;g.add(f);
  if(o.grid!==false)g.add(gridPlane(o));return f;}
/* floor grid: thin lines that fade with distance, and a ring of light that travels outwards */
function gridPlane(o){var cell=(o.size||60)/(o.div||60),m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,extensions:{derivatives:true},
  uniforms:{uT:uT,uC:{value:new THREE.Color(o.c1==null?0x2f8fe8:o.c1)},uCell:{value:cell},uOp:{value:(o.op||.5)*1.1},uFar:{value:o.far||46},uPulse:{value:o.pulse===false?0:1}},
  vertexShader:'varying vec2 vP;varying vec3 vW;void main(){vP=position.xy;vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:'uniform float uT,uCell,uOp,uFar,uPulse;uniform vec3 uC;varying vec2 vP;varying vec3 vW;'+
   'float ln(vec2 p,float w){vec2 g=abs(fract(p-.5)-.5)/fwidth(p);return 1.0-min(min(g.x,g.y)/w,1.0);}'+
   'void main(){vec2 p=vP/uCell;float a=ln(p,1.1)*.55+ln(p/5.0,1.4)*.9;float d=distance(vW,cameraPosition);float r=length(vP);'+
   'float fade=smoothstep(uFar,uFar*.18,d);float ring=uPulse*exp(-pow((r-mod(uT*3.2,42.0))*1.1,2.0))*smoothstep(42.0,6.0,r);'+
   'float pool=exp(-r*r/90.0)*.10;gl_FragColor=vec4(uC*(a*(1.0+ring*5.0)+ring*.22+pool)*uOp*fade,1.0);}'});
  var pl=new THREE.Mesh(new THREE.PlaneGeometry(130,130),m);pl.rotation.x=-Math.PI/2;pl.position.y=.006;pl.renderOrder=1;return pl;}
var DISC=(function(){var c=document.createElement('canvas');c.width=c.height=64;var g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'#fff');gr.addColorStop(.5,'#fff');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
/* text painted on a canvas, for signs inside the 3D scene */
function sign(txt,o){o=o||{};var c=document.createElement('canvas');c.width=o.w||512;c.height=o.h||128;var g=c.getContext('2d');if(o.bg){g.fillStyle=o.bg;g.fillRect(0,0,c.width,c.height);}
  g.fillStyle=o.color||'#fff';g.font='800 '+(o.px||72)+'px Manrope, Segoe UI, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(txt,c.width/2,c.height/2+4);
  var t=new THREE.CanvasTexture(c);t.anisotropy=4;return new THREE.Mesh(new THREE.PlaneGeometry(o.sw||2,(o.sw||2)*c.height/c.width),new THREE.MeshBasicMaterial({map:t,transparent:!o.bg,depthWrite:!!o.bg,side:THREE.DoubleSide}));}
RX.u={V3:V3,ease:ease,clamp:clamp,lerp:lerp,at:at,std:std,glow:glow,cyl:cyl,box:box,sph:sph,rbox:rbox,stadium:stadium,rod:rod,shadow:shadow,floor:floor,DISC:DISC,sign:sign,YAX:YAX};

/* ---------- atmosphere: a sky that glows at the horizon, and dust in the light ---------- */
var hz=new THREE.Color(0x123c78);
var dome=new THREE.Mesh(new THREE.SphereGeometry(420,32,20),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,depthTest:false,fog:false,
  uniforms:{cT:{value:scene.background},cH:{value:hz}},
  vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform vec3 cT,cH;varying vec3 vD;void main(){float h=normalize(vD).y;float k=smoothstep(-.02,.42,h);vec3 c=mix(cH,cT,pow(k,.62));gl_FragColor=vec4(c,1.0);}'}));
dome.renderOrder=-10;dome.frustumCulled=false;scene.add(dome);
var dust=(function(){var n=700,p=new Float32Array(n*3),r=new Float32Array(n);for(var i=0;i<n;i++){p[i*3]=(Math.random()-.5)*34;p[i*3+1]=Math.random()*11;p[i*3+2]=(Math.random()-.5)*34;r[i]=Math.random();}
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('rnd',new THREE.BufferAttribute(r,1));
  var m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uT:uT,uH:{value:1080}},
    vertexShader:'attribute float rnd;uniform float uT,uH;varying float vA;void main(){vec3 p=position;p.x+=sin(uT*.11+rnd*50.0)*1.4;p.y=mod(p.y+uT*(.05+rnd*.09),11.0);p.z+=cos(uT*.09+rnd*31.0)*1.4;'+
      'vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=uH*(.012+rnd*.022)/max(1.0,-mv.z)*3.6;vA=(.2+.45*rnd)*smoothstep(1.5,5.0,-mv.z)*smoothstep(0.0,1.5,p.y)*smoothstep(11.0,8.0,p.y);}',
    fragmentShader:'varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(vec3(.55,.75,1.0)*smoothstep(.5,.05,d)*vA,1.0);}'});
  var pts=new THREE.Points(g,m);pts.frustumCulled=false;pts.renderOrder=5;scene.add(pts);pts.u=m.uniforms;return pts;})();

/* ---------- glow pass: the bright parts of the picture bleed light; then a vignette and a little grain ---------- */
var post=null,fxOn=true;
function mkPost(){
  var gl2=renderer.capabilities.isWebGL2,hf=gl2&&renderer.extensions.get('EXT_color_buffer_float'),type=hf?THREE.HalfFloatType:THREE.UnsignedByteType,N=5;
  function rt(ms){var o={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,type:type,depthBuffer:!!ms,stencilBuffer:false};
    return (ms&&gl2)?new THREE.WebGLMultisampleRenderTarget(4,4,o):new THREE.WebGLRenderTarget(4,4,o);}
  var S=rt(true),D=[],U=[],i;for(i=0;i<=N;i++){D.push(rt(false));U.push(rt(false));}
  var qs=new THREE.Scene(),qc=new THREE.OrthographicCamera(-1,1,1,-1,0,1),VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}';
  function mat(fs,u){return new THREE.ShaderMaterial({uniforms:u,vertexShader:VS,fragmentShader:'varying vec2 vUv;uniform sampler2D tA;uniform vec2 px;'+fs,depthTest:false,depthWrite:false});}
  var mB=mat('uniform float th,kn;void main(){vec3 c=(texture2D(tA,vUv+px*vec2(-.5,-.5)).rgb+texture2D(tA,vUv+px*vec2(.5,-.5)).rgb+texture2D(tA,vUv+px*vec2(-.5,.5)).rgb+texture2D(tA,vUv+px*vec2(.5,.5)).rgb)*.25;c=min(c,vec3(4.0));float l=max(c.r,max(c.g,c.b)),lo=min(c.r,min(c.g,c.b));float sat=(l-lo)/max(l,.001);gl_FragColor=vec4(c*smoothstep(th,th+kn,l)*mix(.1,1.0,smoothstep(.15,.6,sat)),1.0);}',{tA:{value:null},px:{value:new THREE.Vector2()},th:{value:hf?1.0:.82},kn:{value:hf?.9:.2}});
  var mD=mat('void main(){vec3 c=texture2D(tA,vUv).rgb*4.0+texture2D(tA,vUv+px*vec2(-1.0,-1.0)).rgb+texture2D(tA,vUv+px*vec2(1.0,-1.0)).rgb+texture2D(tA,vUv+px*vec2(-1.0,1.0)).rgb+texture2D(tA,vUv+px*vec2(1.0,1.0)).rgb;gl_FragColor=vec4(c*.125,1.0);}',{tA:{value:null},px:{value:new THREE.Vector2()}});
  var mU=mat('uniform sampler2D tB;uniform float w;void main(){vec3 c=texture2D(tA,vUv+px*vec2(-2.0,0.0)).rgb+texture2D(tA,vUv+px*vec2(2.0,0.0)).rgb+texture2D(tA,vUv+px*vec2(0.0,2.0)).rgb+texture2D(tA,vUv+px*vec2(0.0,-2.0)).rgb+2.0*(texture2D(tA,vUv+px*vec2(-1.0,1.0)).rgb+texture2D(tA,vUv+px*vec2(1.0,1.0)).rgb+texture2D(tA,vUv+px*vec2(1.0,-1.0)).rgb+texture2D(tA,vUv+px*vec2(-1.0,-1.0)).rgb);gl_FragColor=vec4(c/12.0*w+texture2D(tB,vUv).rgb,1.0);}',{tA:{value:null},tB:{value:null},px:{value:new THREE.Vector2()},w:{value:.92}});
  var mC=mat('uniform sampler2D tB;uniform float str,t;uniform vec2 res;void main(){vec3 c=texture2D(tA,vUv).rgb+texture2D(tB,vUv).rgb*str;'+
    'vec2 q=(vUv-.5)*vec2(1.0,.8)*2.0;c*=mix(.62,1.0,smoothstep(1.45,.45,length(q)));'+
    'float n=fract(sin(dot(vUv*res+fract(t)*91.7,vec2(12.9898,78.233)))*43758.5453);c+=(n-.5)*.016;gl_FragColor=vec4(c,1.0);}',{tA:{value:null},tB:{value:null},px:{value:new THREE.Vector2()},str:{value:.5},t:uT,res:{value:new THREE.Vector2()}});
  var quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),mB);quad.frustumCulled=false;qs.add(quad);
  function pass(m,src,dst){quad.material=m;m.uniforms.tA.value=src.texture;m.uniforms.px.value.set(1/src.width,1/src.height);renderer.setRenderTarget(dst);renderer.render(qs,qc);}
  var P={str:mC.uniforms.str,th:mB.uniforms.th};
  P.size=function(){var pr=renderer.getPixelRatio(),w=Math.max(4,Math.round(W*pr)),h=Math.max(4,Math.round(H*pr));S.setSize(w,h);mC.uniforms.res.value.set(w,h);dust.u.uH.value=h;
    for(var i=0;i<=N;i++){w=Math.max(2,w>>1);h=Math.max(2,h>>1);D[i].setSize(w,h);U[i].setSize(w,h);}};
  P.render=function(){renderer.setRenderTarget(S);renderer.render(scene,camera);
    pass(mB,S,D[0]);for(var i=1;i<=N;i++)pass(mD,D[i-1],D[i]);
    var up=D[N];for(i=N-1;i>=0;i--){mU.uniforms.tB.value=D[i].texture;pass(mU,up,U[i]);up=U[i];}
    mC.uniforms.tB.value=U[0].texture;pass(mC,S,null);};
  return P;}
if(RX.FX){try{post=mkPost();}catch(e){console.warn('glow pass off',e);post=null;}}
RX.post=post;

/* ---------- sets (one group visible at a time), views, labels ---------- */
var sets={}, VIEWS={}, labels=[], labBox=$('#labels');
RX.sets=sets;RX.views=VIEWS;
RX.addSet=function(name,def){def.g=new THREE.Group();def.g.visible=false;scene.add(def.g);def.name=name;sets[name]=def;def.build(def.g);return def;};
RX.view=function(name,v){v.pos=V3(v.pos);v.tgt=V3(v.tgt);v.off=new THREE.Vector2(v.off?v.off[0]:0,v.off?v.off[1]:0);v.amp=v.amp==null?.04:v.amp;v.shade=v.shade||0;v.shadeL=v.shadeL==null?1:v.shadeL;v.bgc=new THREE.Color(v.bg==null?BG:v.bg);v.hzc=new THREE.Color(v.hz!=null?v.hz:(!v.fog?v.bgc.getHex():(v.bgc.r>v.bgc.b?0x4d2b10:0x123c78)));VIEWS[name]=v;return v;};
/* pos: Vector3, Object3D (followed) or function returning a Vector3. o.when(step) limits it to some steps. */
RX.label=function(html,cls,pos,views,o){var el=document.createElement('div');el.className='lab '+cls;el.innerHTML='<div>'+html+'</div>';labBox.appendChild(el);var L={el:el,pos:pos,views:views,o:o||{}};labels.push(L);return L;};

var cam={pos:new THREE.Vector3(0,3,12),tgt:new THREE.Vector3(),off:new THREE.Vector2(),amp:0}, tw=null, curV=null, activeSet=null, pending=false, fade=$('#fade');
var orb={yaw:0,pitch:0,zoom:1,home:false};
function setView(name,instant){var v=VIEWS[name];if(!v){console.warn('no view',name);return;}
  var same=(name===curV);curV=name;root.style.setProperty('--shade',v.shade);root.style.setProperty('--shadeL',v.shadeL);orb.home=true;
  if(pending)return;
  if(v.set===activeSet&&RX.STATIC){cam.pos.copy(v.pos);cam.tgt.copy(v.tgt);cam.off.copy(v.off);cam.amp=v.amp;tw=null;if(sets[v.set].enter)sets[v.set].enter(name,curStep,false);return;}
  if(v.set===activeSet&&!instant){if(!same)tw={a:{pos:cam.pos.clone(),tgt:cam.tgt.clone(),off:cam.off.clone(),amp:cam.amp},b:v,t0:performance.now()/1000,dur:v.dur||1.8};
    if(sets[v.set].enter)sets[v.set].enter(name,curStep,false);return;}
  pending=true;if(activeSet&&!instant)fade.classList.add('on');
  setTimeout(function(){pending=false;var v=VIEWS[curV];if(activeSet&&sets[activeSet].leave)sets[activeSet].leave();
    activeSet=v.set;for(var k in sets)sets[k].g.visible=(k===v.set);
    cam.pos.copy(v.pos);cam.tgt.copy(v.tgt);cam.off.copy(v.off);cam.amp=v.amp;tw=null;scene.background.copy(v.bgc);orb.yaw=orb.pitch=0;orb.zoom=1;
    scene.fog=v.fog?new THREE.Fog(v.hzc.getHex(),v.fog[0],v.fog[1]):null;hz.copy(v.hzc);dust.visible=!!v.fog;
    if(sets[v.set].enter)sets[v.set].enter(curV,curStep,true);fade.classList.remove('on');tick();},(activeSet&&!instant)?300:0);}
RX.setView=setView;

/* drag on empty space to look around, wheel to zoom; the view comes home on the next slide */
(function(){var gl=$('#gl'),d=null;
  gl.addEventListener('pointerdown',function(e){d={x:e.clientX,y:e.clientY,yaw:orb.yaw,pitch:orb.pitch};orb.home=false;gl.setPointerCapture(e.pointerId);});
  gl.addEventListener('pointermove',function(e){if(!d)return;orb.yaw=d.yaw-(e.clientX-d.x)*.006;orb.pitch=clamp(d.pitch+(e.clientY-d.y)*.004,-.6,1);});
  gl.addEventListener('pointerup',function(){d=null;});gl.addEventListener('pointercancel',function(){d=null;});
  gl.addEventListener('wheel',function(e){orb.home=false;orb.zoom=clamp(orb.zoom*(e.deltaY>0?1.08:.93),.45,2.2);e.preventDefault();},{passive:false});
})();

var last=performance.now()/1000, tmp=new THREE.Vector3(), tmp2=new THREE.Vector3(), right=new THREE.Vector3(), started=false;
function tick(){var now=performance.now()/1000,dt=Math.min(.05,Math.max(0,now-last));last=now;
  if(tw){var k=Math.min(1,(now-tw.t0)/tw.dur),e=ease(k),da=tw.a.pos.clone().sub(tw.a.tgt),db=tw.b.pos.clone().sub(tw.b.tgt),la=da.length(),lb=db.length();
    cam.tgt.lerpVectors(tw.a.tgt,tw.b.tgt,e);var dir=da.normalize().lerp(db.normalize(),e).normalize();
    cam.pos.copy(cam.tgt).addScaledVector(dir,la+(lb-la)*e+Math.sin(Math.PI*e)*Math.min(la,lb)*.1);
    cam.off.lerpVectors(tw.a.off,tw.b.off,e);cam.amp=tw.a.amp+(tw.b.amp-tw.a.amp)*e;if(k>=1)tw=null;}
  var v=curV?VIEWS[curV]:null;if(v){scene.background.lerp(v.bgc,.06);hz.lerp(v.hzc,.06);if(scene.fog)scene.fog.color.copy(hz);}uT.value=now;
  if(orb.home){orb.yaw*=.86;orb.pitch*=.86;orb.zoom+=(1-orb.zoom)*.14;if(Math.abs(orb.yaw)+Math.abs(orb.pitch)+Math.abs(orb.zoom-1)<.002){orb.yaw=orb.pitch=0;orb.zoom=1;orb.home=false;}}
  tmp.copy(cam.pos).sub(cam.tgt);var len=tmp.length(),dr=RX.STATIC?0:1;
  tmp.applyAxisAngle(YAX,Math.sin(now*.17)*cam.amp*dr+orb.yaw);right.crossVectors(YAX,tmp).normalize();tmp.applyAxisAngle(right,-orb.pitch);
  if(tmp.y<.15*len&&cam.pos.y>cam.tgt.y)tmp.y=Math.max(tmp.y,.02*len);
  tmp.multiplyScalar(orb.zoom);tmp.y+=Math.sin(now*.23)*cam.amp*len*.12*dr;
  camera.position.copy(cam.tgt).add(tmp);camera.lookAt(cam.tgt);
  camera.setViewOffset(W,H,-cam.off.x*W,-cam.off.y*H,W,H);
  if(activeSet&&sets[activeSet].update)sets[activeSet].update(now,dt,curV,curStep);
  dome.position.copy(camera.position);dust.position.set(cam.tgt.x,0,cam.tgt.z);
  if(post&&fxOn)post.render();else{renderer.setRenderTarget(null);renderer.render(scene,camera);}
  for(var q=0;q<labels.length;q++){var L=labels[q],on=!pending&&v&&L.views.indexOf(curV)>=0&&v.set===activeSet;
    if(on&&L.o.when)on=!!L.o.when(curStep);
    if(on){var p=L.pos;if(typeof p==='function')p=p();else if(p.isObject3D){if(!p.visible){on=false;}p=p.getWorldPosition(tmp2);}
      if(on&&L.o.globe){tmp.copy(camera.position).sub(p);on=tmp.dot(p)>0;}
      if(on){tmp2.copy(p).project(camera);on=tmp2.z<1;L.el.style.transform='translate('+((tmp2.x*.5+.5)*W).toFixed(1)+'px,'+((-tmp2.y*.5+.5)*H).toFixed(1)+'px)';}}
    L.el.classList.toggle('on',!!on);}
}
function loop(){requestAnimationFrame(loop);tick();}
RX.tick=tick;

/* ---------- slides and steps ---------- */
var slides=$$('.slide'), cur=-1, curStep=0, hooks=RX.hooks={}, t0=null;
function nsteps(s){if(s._n==null){var m=0;$$('[data-st]',s).forEach(function(e){m=Math.max(m,+e.dataset.st);});$$('[data-only]',s).forEach(function(e){m=Math.max(m,+e.dataset.only);});
  s._n=Math.max(m,+(s.dataset.steps||0),s.dataset.views?s.dataset.views.split(',').length-1:0);if(s.querySelector('[data-main]'))s._n+=1;}return s._n;}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,',');}
function counters(s){$$('[data-to]',s).forEach(function(el){var to=+el.dataset.to,suf=el.dataset.suf||'',pre=el.dataset.pre||'',dec=+(el.dataset.dec||0),t1=performance.now()+600;
  function put(v){el.textContent=pre+(dec?v.toFixed(dec):fmt(v))+suf;}
  if(RX.STATIC){put(to);return;}
  (function go(){var k=clamp((performance.now()-t1)/1400,0,1),e=1-Math.pow(1-k,3);put(to*e);if(k<1&&s.classList.contains('on'))requestAnimationFrame(go);else put(to);})();});}
function bars(s,on){$$('.bar div',s).forEach(function(d){var i=d.querySelector('i'),b=d.querySelector('b'),w=on?+d.dataset.w:0;if(i)i.style.width=w+'%';if(b)b.style.left=w+'%';});}
function applyStep(s,k){curStep=k;$$('[data-st]',s).forEach(function(e){e.classList.toggle('on',+e.dataset.st<=k);});
  $$('[data-only]',s).forEach(function(e){e.classList.toggle('on',+e.dataset.only===k);});
  var vs=s.dataset.views;if(vs){vs=vs.split(',');setView(vs[Math.min(k,vs.length-1)].trim());}
  var mv=s.querySelector('[data-main]');if(mv){var tile=mv.classList.contains('vt');if(k>=nsteps(s)){if(tile)openTile(mv);else vidPlay(mv,true);}else{if(tile)closeOv();else vidStop(mv);}}
  var h=hooks[s.id];if(h&&h.step)h.step(k,s);
  if(activeSet&&sets[activeSet].step&&!pending)sets[activeSet].step(k,curV);
  try{history.replaceState(null,'','#'+(cur+1)+(k?'.'+k:''));}catch(e){}
  pushNotes();}
function show(i,k,instant){i=clamp(i,0,slides.length-1);
  if(i!==cur){if(cur>=0){var o=slides[cur];o.classList.remove('on');$$('.vid',o).forEach(vidStop);closeOv();bars(o,false);if(hooks[o.id]&&hooks[o.id].leave)hooks[o.id].leave(o);}
    cur=i;var s=slides[i];s.classList.add('on');curStep=k||0;
    if(!s.dataset.views)setView(s.dataset.view,instant);else{var vs=s.dataset.views.split(',');setView(vs[Math.min(curStep,vs.length-1)].trim(),instant);}
    counters(s);setTimeout(function(){if(slides[cur]===s)bars(s,true);},RX.STATIC?0:500);
    if(hooks[s.id]&&hooks[s.id].enter)hooks[s.id].enter(s);
    $('#num').textContent=(i+1)+' / '+slides.length;$('#sec').textContent=s.dataset.sec||'';segs(i);
    if(i>0){$('#help').style.opacity=0;if(t0===null)t0=Date.now();}}
  applyStep(slides[cur],clamp(k||0,0,nsteps(slides[cur])));
  tick();}
function next(){var s=slides[cur];if(curStep<nsteps(s))applyStep(s,curStep+1);else if(cur<slides.length-1)show(cur+1,0);}
function prev(){if(curStep>0)applyStep(slides[cur],curStep-1);else if(cur>0){var p=slides[cur-1],n=nsteps(p);if(p.querySelector('[data-main]'))n-=1;show(cur-1,n);}}
RX.show=show;RX.next=next;RX.prev=prev;RX.count=slides.length;
RX.state=function(){return {slide:cur+1,step:curStep,steps:nsteps(slides[cur]),view:curV,set:activeSet,id:slides[cur].id};};
RX.onStep=function(){return curStep;};
RX.go=function(id,k){for(var i=0;i<slides.length;i++)if(slides[i].id===id||slides[i].id==='s-'+id){show(i,k||0);return RX.state();}};

/* progress bar in parts */
var parts=[];slides.forEach(function(s,i){var p=s.dataset.part||'0';if(!parts.length||parts[parts.length-1].p!==p)parts.push({p:p,a:i,n:0,name:s.dataset.sec});parts[parts.length-1].n++;});
(function(){var box=$('#segs');parts.forEach(function(p){var e=document.createElement('i');e.style.flex=p.n;e.innerHTML='<b></b>';box.appendChild(e);p.el=e.firstChild;});})();
function segs(i){parts.forEach(function(p){p.el.style.width=(clamp((i+1-p.a)/p.n,0,1)*100)+'%';});}

/* ---------- video ---------- */
function vidInit(el){var d=el.dataset,poster=d.poster||(d.src?d.src.replace(/([^\/]+)\.mp4$/,'posters/$1.jpg'):(d.yt?'https://i.ytimg.com/vi/'+d.yt+'/hqdefault.jpg':''));
  el.innerHTML='<img class="poster" src="'+poster+'" alt=""><div class="play"></div><div class="cap"><span>'+(d.title||'')+'</span><small>'+(d.len||'')+(d.cred?' · '+d.cred:'')+'</small></div>';
  el.querySelector('img').onerror=function(){this.style.display='none';};}
function ytOrOff(el){var d=el.dataset;
  if(d.yt&&/^https?:$/.test(location.protocol)){var f=document.createElement('iframe');f.allow='autoplay; encrypted-media; fullscreen; picture-in-picture';f.allowFullscreen=true;f.referrerPolicy='strict-origin-when-cross-origin';
    f.src='https://www.youtube.com/embed/'+d.yt+'?autoplay=1&rel=0&modestbranding=1'+(d.t0?'&start='+d.t0:'')+(d.t1?'&end='+d.t1:'');el.appendChild(f);}
  else{var o=document.createElement('div');o.className='off';
    o.innerHTML=d.yt?'This video plays from YouTube.<a href="https://www.youtube.com/watch?v='+d.yt+(d.t0?'&t='+d.t0+'s':'')+'" target="_blank" rel="noopener">Open it on YouTube</a><span class="small">To play it inside the slide, start the talk with the file "Start Robotics.bat".</span>':'Video file not found: '+d.src;el.appendChild(o);}}
function vidPlay(el,auto){if(el.classList.contains('playing')){var v0=el.querySelector('video');if(v0&&!auto){if(v0.paused)v0.play();else v0.pause();}return;}
  el.classList.add('playing');var d=el.dataset;
  if(d.src){var v=document.createElement('video');v.src=d.src+(d.t0?'#t='+d.t0:'');v.controls=true;v.playsInline=true;v.onerror=function(){v.remove();ytOrOff(el);};
    if(d.t1)v.ontimeupdate=function(){if(v.currentTime>=+d.t1){v.pause();v.ontimeupdate=null;}};
    el.appendChild(v);var p=v.play();if(p&&p.catch)p.catch(function(){});}
  else ytOrOff(el);}
function vidStop(el){if(!el.classList.contains('playing'))return;el.classList.remove('playing');$$('video,iframe,.off',el).forEach(function(n){if(n.pause)n.pause();n.removeAttribute&&n.removeAttribute('src');n.remove();});}
$$('.vid').forEach(function(el){vidInit(el);el.addEventListener('click',function(e){if(e.target.tagName==='VIDEO'||e.target.tagName==='A')return;vidPlay(el);});});
/* small tiles open a full-screen player */
var ov=$('#ov'), ovVid=null;
function openTile(t){closeOv();ovVid=document.createElement('div');ovVid.className='vid';for(var k in t.dataset)ovVid.dataset[k]=t.dataset[k];vidInit(ovVid);ov.appendChild(ovVid);ov.classList.add('on');vidPlay(ovVid);}
function closeOv(){if(ovVid){vidStop(ovVid);ovVid.remove();ovVid=null;}ov.classList.remove('on');}
$$('.vt').forEach(function(t){var d=t.dataset,poster=d.poster||(d.src?d.src.replace(/([^\/]+)\.mp4$/,'posters/$1.jpg'):'https://i.ytimg.com/vi/'+d.yt+'/hqdefault.jpg');
  t.insertAdjacentHTML('afterbegin','<img src="'+poster+'" alt="">');t.querySelector('img').onerror=function(){this.style.display='none';};t.addEventListener('click',function(){openTile(t);});});
ov.addEventListener('click',function(e){if(e.target===ov)closeOv();});
RX.closeOv=closeOv;

/* click-to-reveal cards */
document.addEventListener('click',function(e){var c=e.target.closest&&e.target.closest('.pc.live,.qz .card');if(c)c.classList.toggle('rev');});

/* ---------- presenter notes: N opens a second window, Shift+N shows them under the slide ---------- */
var nw=null, inl=$('#inl');
function noteHTML(s){var n=s.querySelector('.notes');return n?n.innerHTML:'<p>No notes for this slide.</p>';}
function titleOf(s){var h=s.querySelector('h1,h2');return (h?h.textContent:s.dataset.sec||'').replace(/\s+/g,' ').trim();}
function clock(){if(t0===null)return '0:00';var t=Math.floor((Date.now()-t0)/1000);return Math.floor(t/60)+':'+('0'+t%60).slice(-2);}
function pushNotes(){if(cur<0)return;var s=slides[cur];
  if(inl.classList.contains('on'))inl.innerHTML='<b>'+(cur+1)+'. '+titleOf(s)+'</b> · planned minute '+(s.dataset.t||'?')+' · clock '+clock()+noteHTML(s);
  if(!nw||nw.closed)return;var d=nw.document;
  d.getElementById('h').textContent=(cur+1)+' / '+slides.length+'   '+titleOf(s);d.getElementById('st').textContent=nsteps(s)?'click '+curStep+' of '+nsteps(s):'';
  d.getElementById('pl').textContent='Planned: minute '+(s.dataset.t||'?');d.getElementById('n').innerHTML=noteHTML(s);
  d.getElementById('nx').textContent=cur<slides.length-1?'Next: '+titleOf(slides[cur+1]):'Last slide';}
function openNotes(){nw=window.open('','rxnotes','width=980,height=760');if(!nw)return;
  nw.document.write('<!doctype html><title>Presenter notes</title><style>body{font:19px/1.5 Segoe UI,Arial,sans-serif;background:#0b111b;color:#dbe4f2;margin:0;padding:22px 30px}#top{display:flex;justify-content:space-between;align-items:baseline;gap:20px;border-bottom:2px solid #ff7a1a;padding-bottom:10px;margin-bottom:14px}#h{font-size:25px;font-weight:800;color:#fff}#ck{font-size:42px;font-weight:800;color:#ffc53d;font-variant-numeric:tabular-nums}#pl,#st{color:#8a99b0;font-size:17px}#n p{margin:0 0 12px}#n b{color:#ff7a1a}#n .t{color:#ffc53d;font-weight:800}#nx{margin-top:18px;padding-top:12px;border-top:1px solid #24344c;color:#3cc8ff;font-weight:700}button{font:inherit;background:#18243a;color:#fff;border:1px solid #2c456c;border-radius:8px;padding:6px 14px;cursor:pointer;margin-right:8px}</style><div id="top"><div><div id="h"></div><span id="pl"></span> <span id="st"></span></div><div id="ck">0:00</div></div><div id="n"></div><div id="nx"></div><p style="margin-top:20px"><button id="b1">Previous</button><button id="b2">Next</button><button id="b3">Restart clock</button></p>');
  nw.document.close();nw.document.getElementById('b1').onclick=prev;nw.document.getElementById('b2').onclick=next;nw.document.getElementById('b3').onclick=function(){t0=Date.now();};
  nw.document.addEventListener('keydown',onKey);pushNotes();}
setInterval(function(){if(nw&&!nw.closed){var c=nw.document.getElementById('ck');if(c)c.textContent=clock();}},1000);

/* ---------- overview (O) ---------- */
var grid=$('#grid');
function buildGrid(){var h='<p class="small">Click a slide, or press O or Esc to close.</p>';parts.forEach(function(p){h+='<h4>'+(p.name||'')+'</h4>';for(var i=p.a;i<p.a+p.n;i++)h+='<a data-i="'+i+'"'+(i===cur?' class="cur"':'')+'><b>'+(i+1)+'</b>'+titleOf(slides[i])+'</a>';});grid.innerHTML=h;}
grid.addEventListener('click',function(e){var a=e.target.closest('a');if(a){grid.classList.remove('on');show(+a.dataset.i,0);}});

/* ---------- keys, clicker, touch ---------- */
var jump='', jumpEl=$('#jump');
function onKey(e){var k=e.key,s=slides[cur];if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.target&&/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)&&k!=='PageDown'&&k!=='PageUp'&&k!=='Escape')return;
  if(k==='Escape'){if(ov.classList.contains('on'))closeOv();else if(grid.classList.contains('on'))grid.classList.remove('on');jump='';jumpEl.style.display='none';return;}
  if(ov.classList.contains('on')){if(k===' '||k==='k'){var v=ov.querySelector('video');if(v){if(v.paused)v.play();else v.pause();}e.preventDefault();}else if(k==='ArrowRight'||k==='PageDown'||k==='Enter'){closeOv();next();}else if(k==='ArrowLeft'||k==='PageUp'){closeOv();}return;}
  if(/^[0-9]$/.test(k)){var h=hooks[s.id];if(h&&h.key&&h.key(k)){return;}jump+=k;jumpEl.textContent='Go to '+jump+' (Enter)';jumpEl.style.display='block';return;}
  if(k==='Enter'&&jump){show(parseInt(jump,10)-1,0);jump='';jumpEl.style.display='none';return;}
  if(k==='ArrowRight'||k==='PageDown'||k===' '||k==='Enter'||k==='ArrowDown'){e.preventDefault();next();}
  else if(k==='ArrowLeft'||k==='PageUp'||k==='Backspace'||k==='ArrowUp'){e.preventDefault();prev();}
  else if(k==='Home')show(0,0);else if(k==='End')show(slides.length-1,0);
  else if(k==='f'||k==='F'){if(document.fullscreenElement)document.exitFullscreen();else if(root.requestFullscreen)root.requestFullscreen();}
  else if(k==='N'){inl.classList.toggle('on');pushNotes();}
  else if(k==='n'){openNotes();}
  else if(k==='o'||k==='O'||k==='g'){buildGrid();grid.classList.toggle('on');}
  else if(k==='k'||k==='K'){var pv=s.querySelector('.vid.playing video');if(pv){if(pv.paused)pv.play();else pv.pause();}}
  else if(k==='t'||k==='T'){t0=Date.now();}
  else if(k==='x'||k==='X'){fxOn=!fxOn;}
  else{var h2=hooks[s.id];if(h2&&h2.key)h2.key(k);}}
addEventListener('keydown',onKey);
var tx=null;addEventListener('touchstart',function(e){tx=e.touches[0].clientX;},{passive:true});
addEventListener('touchend',function(e){if(tx===null)return;var dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>70&&!e.target.closest('input,button,.vid,.vt')){if(dx<0)next();else prev();}tx=null;},{passive:true});
function fit(){W=innerWidth;H=innerHeight;renderer.setSize(W,H,false);if(post)post.size();camera.aspect=W/H;camera.fov=(W/H<1.5)?42:35;camera.updateProjectionMatrix();root.style.setProperty('--s',Math.min(W/1920,H/1080));}
addEventListener('resize',function(){fit();tick();});
slides.forEach(function(s){$$('.rise',s).forEach(function(e,i){e.style.setProperty('--i',i);});});

RX.start=function(){fit();var h=location.hash.slice(1).split('.');show(clamp((parseInt(h[0],10)||1)-1,0,slides.length-1),parseInt(h[1],10)||0,true);
  setTimeout(function(){$('#help').style.opacity=0;},9000);started=true;loop();};
})();
