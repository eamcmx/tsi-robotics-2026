/* The point cloud: 42,000 points of light that assemble into one machine after another.
   Used on the title (four machines in a loop), on each part opener and on the last slide. */
(function(){
'use strict';
var u=RX.u,R=RX.robots,at=u.at,std=u.std,glow=u.glow,cyl=u.cyl,box=u.box,sph=u.sph,rbox=u.rbox,clamp=u.clamp,PI=Math.PI;
var N=42000, H=3.25, WMAX=3.8, PALE=[.62,.82,1];
function V(x,y,z){return new THREE.Vector3(x,y,z);}

/* ---------- sampling: points spread evenly over the surfaces of a model ---------- */
var COOL=new THREE.Color(.16,.52,1), tc=new THREE.Color();
function colOf(m){var c=tc.copy(m.color||COOL);if(m.emissive&&m.emissiveIntensity>0&&(m.emissive.r+m.emissive.g+m.emissive.b)>.05)c.copy(m.emissive);
  var mx=Math.max(c.r,c.g,c.b),mn=Math.min(c.r,c.g,c.b);
  if(mx<.2)return [.06,.27,.7];                                  // dark steel reads as blue light
  if(mx-mn<.12*mx)return PALE;                          // white and grey read as pale blue
  return [c.r/mx,c.g/mx,c.b/mx];}
function sample(obj,n){obj.updateMatrixWorld(true);var T=[],tot=0,a=V(),b=V(),c=V(),ab=V(),ac=V();
  obj.traverse(function(m){if(!m.isMesh||!m.visible||m.userData.noCloud)return;var g=m.geometry,pos=g.attributes.position,ix=g.index,cnt=ix?ix.count:pos.count,col=colOf(m.material);
    for(var i=0;i+2<cnt;i+=3){a.fromBufferAttribute(pos,ix?ix.getX(i):i).applyMatrix4(m.matrixWorld);b.fromBufferAttribute(pos,ix?ix.getX(i+1):i+1).applyMatrix4(m.matrixWorld);c.fromBufferAttribute(pos,ix?ix.getX(i+2):i+2).applyMatrix4(m.matrixWorld);
      var ar=ab.subVectors(b,a).cross(ac.subVectors(c,a)).length()*.5;if(ar<1e-9)continue;tot+=ar;T.push(a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z,tot,col[0],col[1],col[2]);}});
  var nt=T.length/13,p=new Float32Array(n*3),cl=new Float32Array(n*3);
  for(var k=0;k<n;k++){var r=Math.random()*tot,lo=0,hi=nt-1;while(lo<hi){var mid=(lo+hi)>>1;if(T[mid*13+9]<r)lo=mid+1;else hi=mid;}
    var o=lo*13,s1=Math.sqrt(Math.random()),s2=Math.random(),wa=1-s1,wb=s1*(1-s2),wc=s1*s2;
    p[k*3]=T[o]*wa+T[o+3]*wb+T[o+6]*wc;p[k*3+1]=T[o+1]*wa+T[o+4]*wb+T[o+7]*wc;p[k*3+2]=T[o+2]*wa+T[o+5]*wb+T[o+8]*wc;
    cl[k*3]=T[o+10];cl[k*3+1]=T[o+11];cl[k*3+2]=T[o+12];}
  return fit({p:p,c:cl});}
/* scale to the same height, stand it on the floor, centre it */
function fit(S,hh,ww){var p=S.p,n=p.length/3,mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9],i,k;for(i=0;i<n;i++)for(k=0;k<3;k++){var v=p[i*3+k];if(v<mn[k])mn[k]=v;if(v>mx[k])mx[k]=v;}
  var s=Math.min((hh||H)/(mx[1]-mn[1]),(ww||WMAX)/Math.max(mx[0]-mn[0],mx[2]-mn[2])),cx=(mn[0]+mx[0])/2,cz=(mn[2]+mx[2])/2;
  for(i=0;i<n;i++){p[i*3]=(p[i*3]-cx)*s;p[i*3+1]=(p[i*3+1]-mn[1])*s+.16;p[i*3+2]=(p[i*3+2]-cz)*s;}return S;}

/* ---------- the shapes ---------- */
var MAKE={
  doll:function(){var G=new THREE.Group(),P=R.person(0xff8a2a);P.walk(.25,.0);G.add(P.g);                     // a figure with a wind-up key, at a writing desk
    var kb=std(0x1a212c,.5,.5);G.add(at(cyl(.02,.3,kb,'x'),-.27,1.22,0));var key=new THREE.Mesh(new THREE.TorusGeometry(.12,.025,8,24),kb);key.rotation.y=PI/2;key.position.set(-.52,1.22,0);G.add(key);
    var wd=std(0xffc53d,.6,0);G.add(at(box(.62,.05,.7,wd),.5,.86,0));G.add(at(box(.05,.84,.05,wd),.76,.43,.3));G.add(at(box(.05,.84,.05,wd),.76,.43,-.3));G.add(at(box(.05,.84,.05,wd),.24,.43,.3));G.add(at(box(.05,.84,.05,wd),.24,.43,-.3));
    var arm=cyl(.045,.5,std(0xff8a2a),'x');arm.position.set(.25,1.2,.25);arm.rotation.z=-.55;G.add(arm);G.add(at(cyl(.012,.22,kb),.47,1.0,.25));return sample(G,N);},
  unimate:function(){var U=R.unimate();U.pose(.0,-.32,.25,1);PALE=[1,.78,.42];var S=sample(U.g,N);PALE=[.62,.82,1];return S;},
  arm:function(){var A=R.arm();A.ik(1.55,1.05,0,.25);return sample(A.g,N);},
  cobot:function(){var G=new THREE.Group(),C=R.cobot();C.ik(.62,.5,0);G.add(C.g);G.add(at(box(1.5,.9,1.0,std(0x1a212c)),.25,-.45,0));var P=R.person(0x2fe0a8);P.g.position.set(1.55,-.9,0);P.g.rotation.y=PI;P.walk(.25,.5);G.add(P.g);return sample(G,N);},
  humanoid:function(){var Hm=R.humanoid();Hm.gait(.18,1,.0);return sample(Hm.g,N);},
  duo:function(){var G=new THREE.Group(),Hm=R.humanoid();Hm.gait(.1,.0,0);Hm.g.position.x=.42;Hm.g.rotation.y=PI;G.add(Hm.g);var P=R.person(0x2fe0a8);P.walk(.25,.0);P.g.position.x=-.42;G.add(P.g);return sample(G,N);},
  globe:function(){var L=(window.LAND||[]).concat(window.LAND_EU||[]),n=L.length/2,p=new Float32Array(N*3),c=new Float32Array(N*3),r=1.62;
    for(var i=0;i<N;i++){var la,lo,land=i<N*.8&&n>0;if(land){var k=(Math.random()*n)|0;la=L[k*2]/100+(Math.random()-.5)*1.2;lo=L[k*2+1]/100+(Math.random()-.5)*1.2;}else{la=Math.asin(Math.random()*2-1)*180/PI;lo=Math.random()*360-180;}
      var ph=(90-la)*PI/180,th=(lo+48)*PI/180;p[i*3]=-r*Math.sin(ph)*Math.cos(th);p[i*3+1]=r*Math.cos(ph)+1.84;p[i*3+2]=r*Math.sin(ph)*Math.sin(th);
      if(land){c[i*3]=.2;c[i*3+1]=.62;c[i*3+2]=1;}else{c[i*3]=.05;c[i*3+1]=.13;c[i*3+2]=.3;}}
    for(var j=0;j<900;j++){var q=((Math.random()*N*.8)|0)*3;c[q]=1;c[q+1]=.5;c[q+2]=.1;}return {p:p,c:c};},
  /* Two bodies for the last slide, drawn without depth (flat:1) so that the turn can be seen in either direction.
     orb: beads spread evenly over a ball. The beads of the near half and of the far half cross in opposite directions and
     nothing says which half is which. This is the shape the illusion is known from: its outline never changes, so only
     the motion of the beads carries the turn. */
  orb:function(){var NB=300,r=1.52,B=[],i,j,k,p=new Float32Array(N*3),c=new Float32Array(N*3);
    function rnd3(){var z=Math.random()*2-1,a=Math.random()*2*PI,q=Math.sqrt(1-z*z);return [q*Math.cos(a),z,q*Math.sin(a)];}
    function gs(){return (Math.random()+Math.random()+Math.random()-1.5)*.056;}
    for(i=0;i<NB;i++){var best=null,bd=-1;for(k=0;k<(i?14:1);k++){var cnd=rnd3(),md=9;for(j=0;j<i;j++){var d=Math.pow(cnd[0]-B[j][0],2)+Math.pow(cnd[1]-B[j][1],2)+Math.pow(cnd[2]-B[j][2],2);if(d<md)md=d;}if(md>bd){bd=md;best=cnd;}}B.push(best);}
    for(i=0;i<N;i++){j=i%NB;var cy=j%4===0;p[i*3]=B[j][0]*r+gs();p[i*3+1]=B[j][1]*r+1.98+gs();p[i*3+2]=B[j][2]*r+gs();c[i*3]=cy?.3:1;c[i*3+1]=cy?.72:.46;c[i*3+2]=cy?1:.08;}
    return {p:p,c:c,gain:.42,flat:1};},
  /* spin: the humanoid on one leg, the other leg lifted in front, one arm out to the side and one raised. Its outline changes
     as it turns, and the outline of a turn to the left is the same as the outline of a turn to the right. The standing foot is on the axis. */
  spin:function(){var Hm=R.humanoid(),L=Hm.legs,A=Hm.arms;Hm.gait(0,0);L[1].h.rotation.z=1.05;L[1].k.rotation.z=-1.25;L[1].f.rotation.z=.2;
    A[0].s.rotation.x=-1.35;A[0].e.rotation.z=.15;A[1].s.rotation.x=2.55;A[1].s.rotation.z=.25;A[1].e.rotation.z=.35;Hm.torso.rotation.z=-.04;
    var S=fit(sample(Hm.g,N),3.3,3.4),P=S.p,n=0,mx=0,mz=0,i;for(i=0;i<N;i++)if(P[i*3+1]<.3){mx+=P[i*3];mz+=P[i*3+2];n++;}mx/=n;mz/=n;for(i=0;i<N;i++){P[i*3]-=mx;P[i*3+2]-=mz;}
    S.gain=.5;S.flat=1;return S;}
};
var shapes={};
function shape(n){if(!shapes[n])shapes[n]=MAKE[n]();return shapes[n];}

/* ---------- the cloud ---------- */
var geo,mat,pts,gA=.62,gB=.62,fA=0,fB=0,cue=0,cueNow=0,qAng=.6,lastT=0,curName=null,t0=-99,dur=2.6,spinG,seqI=0,seqT=0,mode='one',ring,beam;
var SEQ=[{s:'doll',y:'1774',c:'The Writer: a doll that writes'},{s:'unimate',y:'1961',c:'Unimate: the first factory robot'},{s:'arm',y:'Today',c:'Six-axis industrial arm'},{s:'humanoid',y:'2026',c:'Humanoid: built to learn'}];
var OPEN={'s-p1':'doll','s-p3':'arm','s-p4':'globe','s-p5':'cobot','s-p6':'humanoid','s-p7':'duo','s-end':'spin'};
function to(name,d){if(name===curName)return;var S=shape(name),A=geo.attributes;
  A.a.array.set(curName?A.b.array:scatter());A.ca.array.set(curName?A.cb.array:S.c);A.b.array.set(S.p);A.cb.array.set(S.c);A.a.needsUpdate=A.b.needsUpdate=A.ca.needsUpdate=A.cb.needsUpdate=true;
  curName=name;dur=d||2.6;gA=mat.uniforms.uGain.value;gB=S.gain||.62;fA=mat.uniforms.uFlat.value;fB=S.flat||0;t0=RX.STATIC?-99:performance.now()/1000;}
function scatter(){var p=new Float32Array(N*3);for(var i=0;i<N;i++){var a=Math.random()*PI*2,r=2+Math.random()*9;p[i*3]=Math.cos(a)*r;p[i*3+1]=Math.random()*7;p[i*3+2]=Math.sin(a)*r;}return p;}

RX.addSet('evo',{
  build:function(g){u.floor(g,{op:.42});
    var dk=std(0x0d1522,.45,.7);g.add(at(cyl(2.25,.1,dk,null,2.1,64),0,.05,0));g.add(at(cyl(1.9,.04,std(0x070b12,.3,.8),null,null,64),0,.11,0));
    ring=new THREE.Mesh(new THREE.TorusGeometry(2.0,.022,10,120),glow(0x3cc8ff,1.2));ring.rotation.x=PI/2;ring.position.y=.115;g.add(ring);
    var r2=new THREE.Mesh(new THREE.TorusGeometry(1.25,.012,8,90),glow(0xff7a1a,1.0));r2.rotation.x=PI/2;r2.position.y=.135;g.add(r2);
    beam=new THREE.Mesh(new THREE.CylinderGeometry(2.5,1.95,4.2,64,1,true),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{uT:RX.uT},
      vertexShader:'varying vec2 vU;void main(){vU=vec2(uv.x,position.y/4.2+.5);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'uniform float uT;varying vec2 vU;void main(){float a=pow(clamp(1.0-vU.y,0.0,1.0),2.6)*.085*step(vU.y,.985);a*=.8+.2*sin(vU.x*120.0+uT*1.5);gl_FragColor=vec4(vec3(.24,.7,1.0)*a,1.0);}'}));
    beam.position.y=2.2;g.add(beam);
    geo=new THREE.BufferGeometry();var z=function(k){return new THREE.BufferAttribute(new Float32Array(N*k),k);},rn=new Float32Array(N*4);for(var i=0;i<N*4;i++)rn[i]=Math.random();
    geo.setAttribute('position',z(3));geo.setAttribute('a',z(3));geo.setAttribute('b',z(3));geo.setAttribute('ca',z(3));geo.setAttribute('cb',z(3));geo.setAttribute('rnd',new THREE.BufferAttribute(rn,4));
    mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uMix:{value:1},uT:RX.uT,uH:{value:1080},uSize:{value:.021},uGain:{value:.62},uFlat:{value:0},uAng:{value:0},uCue:{value:0}},
      vertexShader:'attribute vec3 a,b,ca,cb;attribute vec4 rnd;uniform float uMix,uT,uH,uSize,uFlat,uAng,uCue;varying vec3 vC;varying float vA;'+
        'void main(){float k=clamp(uMix*1.4-rnd.x*.4,0.0,1.0);k=k*k*(3.0-2.0*k);float s=sin(3.14159*k);vec3 p=mix(a,b,k);'+
        'float ang=s*(1.2+rnd.y*2.6)*(rnd.z>.5?1.0:-1.0);float c=cos(ang),sn=sin(ang);p.xz=mat2(c,-sn,sn,c)*p.xz;p+=(rnd.yzw-.5)*s*2.4;p.y+=s*rnd.w*1.3;'+
        'p+=.011*vec3(sin(uT*1.7+rnd.x*40.0),cos(uT*1.3+rnd.y*40.0),sin(uT*1.1+rnd.z*40.0));'+
        'vec4 mv=modelViewMatrix*vec4(p,1.0);float cA=cos(uAng),sA=sin(uAng),xr=p.x*cA+p.z*sA,zr=p.z*cA-p.x*sA;'+
        'vec4 mc=modelViewMatrix*vec4(0.0,0.0,0.0,1.0);vec3 upv=normalize((modelViewMatrix*vec4(0.0,1.0,0.0,0.0)).xyz);'+
        'mv.xyz=mix(mv.xyz,mc.xyz+vec3(xr,0.0,0.0)+upv*p.y,uFlat);float q=max(.3,1.0+uCue*uFlat*zr*.36);'+
        'gl_Position=projectionMatrix*mv;gl_PointSize=max(1.5,uH*uSize*mix(.55+rnd.w*.9,1.05,uFlat)*q/(-mv.z));'+
        'vC=mix(ca,cb,k)+vec3(1.0,.55,.2)*s*.5;vA=mix(.62+.38*sin(uT*2.3+rnd.x*31.0),1.0,uFlat)*(1.0+s*.6)*q*q;}',
      fragmentShader:'uniform float uGain;varying vec3 vC;varying float vA;void main(){float d=length(gl_PointCoord-.5);float al=smoothstep(.5,.08,d);gl_FragColor=vec4(vC*al*vA*uGain,1.0);}'});
    pts=new THREE.Points(geo,mat);pts.frustumCulled=false;pts.renderOrder=6;spinG=new THREE.Group();spinG.add(pts);g.add(spinG);
    u.shadow(g);beam.castShadow=false;},
  enter:function(v){var id=RX.state().id;cue=0;mat.uniforms.uH.value=RX.renderer.domElement.height;
    if(id==='s-title'){mode='seq';if(RX.STATIC){seqI=2;to('arm');}else{seqI=0;seqT=performance.now()/1000;to(SEQ[0].s,3.2);}}
    else{mode='one';to(OPEN[id]||'arm');}},
  update:function(t){var k=clamp((t-t0)/dur,0,1);mat.uniforms.uMix.value=k;mat.uniforms.uGain.value=gA+(gB-gA)*k;mat.uniforms.uFlat.value=fA+(fB-fA)*k;
    var dt=Math.min(.1,Math.max(0,t-lastT));lastT=t;if(!RX.STATIC)qAng+=dt*1.25;mat.uniforms.uAng.value=qAng;cueNow+=(cue-cueNow)*Math.min(1,dt*4);if(RX.STATIC)cueNow=cue;mat.uniforms.uCue.value=cueNow;
    spinG.rotation.y=RX.STATIC?.5:.5+Math.sin(t*.21)*.5;ring.material.emissiveIntensity=2.2+Math.sin(t*2.2)*.7;
    if(mode==='seq'&&!RX.STATIC&&t-seqT>5.4){seqT=t;seqI=(seqI+1)%SEQ.length;to(SEQ[seqI].s,2.4);}}
});
RX.view('evo',{set:'evo',pos:[4.3,2.5,8.9],tgt:[0,1.72,0],off:[.235,-.015],amp:.09,fog:[24,60]});
RX.view('evoNear',{set:'evo',pos:[4.5,2.3,9.5],tgt:[0,1.3,0],off:[.235,-.015],amp:.09,fog:[24,60]});
SEQ.forEach(function(e,i){RX.label('<b>'+e.y+'</b><span>'+e.c+'</span>','era',V(.25,.0,2.5),['evoNear'],{when:function(){return mode==='seq'&&seqI===i&&RX.state().id==='s-title';}});});
/* depth cue on the turning body of the last slide: 0 none (either direction can be seen), +1 or -1 fixes one direction */
RX.evo={to:to,shape:shape,cue:function(c){cue=c;},state:function(){return {name:curName,mix:mat.uniforms.uMix.value,mode:mode,seq:seqI,flat:mat.uniforms.uFlat.value,ang:qAng,cue:cue,cueNow:mat.uniforms.uCue.value};}};
})();
