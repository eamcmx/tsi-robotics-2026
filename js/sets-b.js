/* Scenes, part B: robot families, mobile robots and the humanoid, the globe, the digital twin, the cobot, the instructed arm, the simulation farm. */
(function(){
'use strict';
var u=RX.u,R=RX.robots,$=RX.$,$$=RX.$$,at=u.at,std=u.std,glow=u.glow,cyl=u.cyl,box=u.box,sph=u.sph,rbox=u.rbox,rod=u.rod,clamp=u.clamp,ease=u.ease,lerp=u.lerp,PI=Math.PI;
function V(x,y,z){return new THREE.Vector3(x,y,z);}
function txt(id,s){var e=$(id);if(e&&e.textContent!==s)e.textContent=s;}
var steel=std(0xaeb8c4,.3,.9), iron=std(0x232a34,.6,.5), dark=std(0x161b23,.55,.4), bench=std(0x2a3340,.6,.3), topM=std(0x8794a6,.5,.3);
/* one transfer A to B, then B to A. s: 0 at A, 1 at B. lift: 0 down, 1 up. rest: where the part lies when not held. */
function hop(t,T){var n=Math.floor(t/T),q=(t-n*T)/T,s,l,h=false,b=n%2;
  if(q<.15){s=0;l=1-ease(q/.15);}else if(q<.2){s=0;l=0;h=true;}else if(q<.35){s=0;l=ease((q-.2)/.15);h=true;}else if(q<.65){s=ease((q-.35)/.3);l=1;h=true;}
  else if(q<.8){s=1;l=1-ease((q-.65)/.15);h=true;}else if(q<.85){s=1;l=0;}else{s=1;l=ease((q-.85)/.15);}
  return {s:b?1-s:s,lift:l,held:h,rest:(q<.2)?(b?1:0):(b?0:1),open:(q<.17||q>=.82)?1:0};}
var w=V(),w2=V();
function carry(rob,part,H,PA,PB,lift,base,dy){var p=w.lerpVectors(PA,PB,H.s);p.y+=H.lift*lift;rob.ik(p.x,p.y,p.z);if(rob.grip)rob.grip(.2+.8*H.open);
  if(H.held){rob.g.updateMatrixWorld(true);rob.tip.getWorldPosition(w2);part.position.set(w2.x,w2.y+(dy||0),w2.z);}else{var r=H.rest?PB:PA;part.position.set(base.x+r.x,base.y+r.y+(dy||0),base.z+r.z);}}

/* =============== five families of industrial robot, in a row =============== */
(function(){
  var X=[-9,-4.5,0,4.5,9],it=[],belt=[];
  RX.addSet('fam',{
    build:function(g){u.floor(g);var o;
      /* articulated */
      o={r:R.arm(),base:V(X[0],0,0),PA:V(1.6,.76,.9),PB:V(1.6,.76,-.9),lift:.8,T:5,dy:-.02};o.r.g.position.copy(o.base);g.add(o.r.g);
      [o.PA,o.PB].forEach(function(p){g.add(at(rbox(.6,.62,.6,.05,dark),X[0]+p.x,.31,p.z));g.add(at(box(.64,.02,.64,steel),X[0]+p.x,.63,p.z));});o.part=rbox(.22,.22,.22,.03,glow(0x2fe0a8,.55));g.add(o.part);it.push(o);
      /* SCARA on a bench */
      g.add(at(rbox(1.9,.55,1.3,.04,bench),X[1]+.35,.275,0));g.add(at(box(1.94,.03,1.34,topM),X[1]+.35,.565,0));
      o={r:R.scara(),base:V(X[1],.58,0),PA:V(.78,.375,.32),PB:V(.5,.375,-.5),lift:.2,T:2.3,dy:-.035};o.r.g.position.copy(o.base);g.add(o.r.g);
      [o.PA,o.PB].forEach(function(p){g.add(at(cyl(.11,.3,dark),X[1]+p.x,.58+.15,p.z));g.add(at(cyl(.12,.012,steel),X[1]+p.x,.58+.306,p.z));});o.part=cyl(.05,.06,glow(0xffc53d,.6));g.add(o.part);it.push(o);
      /* delta over a conveyor */
      g.add(at(box(2.6,.9,.6,bench),X[2],.45,0));var bt=at(box(2.6,.04,.5,std(0x15181d,.9,0)),X[2],.92,0);g.add(bt);
      for(var i=0;i<9;i++){var m=at(box(.03,.006,.5,std(0x39424f,.7,0)),0,.944,0);g.add(m);belt.push(m);}
      g.add(at(box(.56,.9,.4,bench),X[2]+.42,.45,.52));g.add(at(rbox(.5,.16,.42,.03,std(0x2f6fd0,.6,.1)),X[2]+.42,.98,.5));
      o={r:R.delta(),base:V(X[2],0,0),PA:V(-.28,.992,0),PB:V(.42,1.1,.5),lift:.2,T:1.3,dy:-.025};o.r.g.position.copy(o.base);g.add(o.r.g);o.part=cyl(.055,.045,glow(0xff7a1a,.6));g.add(o.part);it.push(o);
      /* gantry between two pallets */
      o={r:R.gantry(),base:V(X[3],0,0),PA:V(-.6,.63,-.25),PB:V(.6,.63,.25),lift:.45,T:6,dy:0};o.r.g.position.copy(o.base);g.add(o.r.g);
      [o.PA,o.PB].forEach(function(p){g.add(at(box(.7,.1,.6,std(0x6b4a2e,.8,0)),X[3]+p.x,.05,p.z));g.add(at(box(.6,.42,.5,std(0x9a7a52,.8,0)),X[3]+p.x,.31,p.z));});o.part=box(.24,.22,.22,std(0xc9a26a,.8,0));g.add(o.part);it.push(o);
      /* cobot on a workbench, with a person */
      g.add(at(rbox(1.7,.8,.95,.04,bench),X[4]+.3,.4,0));g.add(at(box(1.74,.03,.99,topM),X[4]+.3,.815,0));
      o={r:R.cobot(),base:V(X[4],.83,0),PA:V(.58,.05,.3),PB:V(.5,.05,-.32),lift:.25,T:6.5,dy:0};o.r.g.position.copy(o.base);g.add(o.r.g);
      [o.PA,o.PB].forEach(function(p){g.add(at(box(.24,.015,.24,steel),X[4]+p.x,.84,p.z));});o.part=rbox(.07,.07,.07,.01,glow(0x3cc8ff,.6));g.add(o.part);it.push(o);
      var pr=R.person();pr.g.position.set(X[4]+1.75,0,.15);pr.g.rotation.y=PI;g.add(pr.g);
      u.shadow(g);},
    update:function(t){it.forEach(function(o,i){carry(o.r,o.part,hop(t+i*.7,o.T),o.PA,o.PB,o.lift,o.base,o.dy);});
      belt.forEach(function(m,i){m.position.x=X[2]-1.3+((i*.29+t*.45)%2.6);});}});
  RX.fam={X:X,it:it};
  RX.view('fam0',{set:'fam',pos:[X[0]+4.6,3.1,8.8],tgt:[X[0]+.6,1.35,0],off:[.24,-.02],amp:.04,fog:[26,60]});
  RX.view('fam1',{set:'fam',pos:[X[1]+2.5,2.2,4.3],tgt:[X[1]+.3,1.12,0],off:[.24,0],amp:.04,fog:[26,60]});
  RX.view('fam2',{set:'fam',pos:[X[2]+2.6,2.1,5.6],tgt:[X[2]+.1,1.35,0],off:[.24,0],amp:.04,fog:[26,60]});
  RX.view('fam3',{set:'fam',pos:[X[3]+3.5,2.9,6.6],tgt:[X[3],.95,0],off:[.24,0],amp:.04,fog:[26,60]});
  RX.view('fam4',{set:'fam',pos:[X[4]+3.1,2.2,5.0],tgt:[X[4]+.6,1.1,.05],off:[.24,0],amp:.04,fog:[26,60]});
})();

/* =============== robots that move: AMR, drone, four legs, two legs =============== */
(function(){
  var X=[-7.5,-2.5,2.5,7.5],amr,dr,qd,hm,dash=[],st={ax:-1.8,adir:1,aturn:0,arot:0,gq:0,gh:0,run:0,runT:0,dm:'hover',dT:0,dp:V(),dy:0,droll:0,dpitch:0};
  var MIX={hover:[1,1,1,1],up:[1.4,1.4,1.4,1.4],forward:[.75,.75,1.4,1.4],side:[.75,1.4,1.4,.75],turn:[1.45,.7,1.45,.7]};
  function dashes(g,x,n){var a=[];for(var i=0;i<n;i++){var m=at(box(.5,.01,.07,std(0x3c5a7a,.8,0)),x,.012,.75);g.add(m);var m2=at(box(.5,.01,.07,std(0x3c5a7a,.8,0)),x,.012,-.75);g.add(m2);a.push(m,m2);}return {a:a,x:x,o:0};}
  RX.addSet('zoo',{
    build:function(g){u.floor(g);
      amr=R.amr({pod:true});g.add(amr.g);[-1.4,1.4].forEach(function(dx){var p=R.amr({pod:true,led:0x2fe0a8});p.g.position.set(X[0]+dx-.2,0,-3.5);g.add(p.g);});
      dr=R.drone();dr.g.scale.setScalar(1.5);g.add(dr.g);var pad=new THREE.Mesh(new THREE.RingGeometry(.5,.58,40),new THREE.MeshBasicMaterial({color:0xffc53d,side:THREE.DoubleSide}));pad.rotation.x=-PI/2;pad.position.set(X[1],.012,0);g.add(pad);
      g.add(at(u.sign('H',{sw:.5,w:128,h:128,px:100,color:'#ffc53d'}),X[1],.013,0).rotateX(-PI/2));
      qd=R.quad();qd.g.position.set(X[2],0,0);g.add(qd.g);dash.push(dashes(g,X[2],7));
      hm=R.humanoid();hm.g.position.set(X[3],0,0);g.add(hm.g);dash.push(dashes(g,X[3],7));
      u.shadow(g);},
    enter:function(view){st.runWant=(view==='humRun')?1:0;if(view!=='drone'){st.dm='hover';}},
    update:function(t,dt,view){
      /* AMR shuttles with its pod */
      if(st.aturn>0){st.aturn-=dt;st.arot+=PI*dt/1.4;if(st.aturn<=0){st.arot=Math.round(st.arot/PI)*PI;}}else{st.ax+=st.adir*1.1*dt;if(Math.abs(st.ax)>1.8){st.ax=1.8*st.adir;st.adir*=-1;st.aturn=1.4;}}
      amr.g.position.set(X[0]+st.ax,0,0);amr.g.rotation.y=st.arot;amr.led.emissiveIntensity=.7+.5*Math.sin(t*4);
      /* quadruped and humanoid walk on the spot while the floor marks slide past */
      st.gq=(st.gq+dt/qd.period)%1;qd.gait(st.gq,1);
      st.run+=(st.runWant-st.run)*Math.min(1,dt*2.2);var per=lerp(1.1,.62,st.run);st.gh=(st.gh+dt/per)%1;hm.gait(st.gh,1,st.run);
      var vq=qd.stride/(.5*qd.period),vh=lerp(.83,4.3,st.run);
      [vq,vh].forEach(function(v,k){var d=dash[k];d.o=(d.o+v*dt)%7;for(var i=0;i<d.a.length;i+=2){var x=d.x+3.5-((i/2+d.o)%7+7)%7;d.a[i].position.x=x;d.a[i+1].position.x=x;var vis=Math.abs(x-d.x)<2.4;d.a[i].visible=d.a[i+1].visible=vis;}});
      /* drone */
      var mix=MIX[st.dm]||MIX.hover;for(var i=0;i<4;i++)dr.w[i]+=(mix[i]-dr.w[i])*Math.min(1,dt*5);dr.spin(dt);st.dT+=dt;
      var tgt={hover:[0,0,0,0,0],up:[0,.55,0,0,0],forward:[.5,0,0,-.3,0],side:[0,0,.5,0,.3],turn:[0,0,0,0,0]}[st.dm]||[0,0,0,0,0];
      if(st.dm!=='hover'&&st.dm!=='turn'&&st.dT>2.2){st.dm='hover';st.dT=0;$$('#s-drone .btn[data-dm]').forEach(function(b){b.classList.toggle('on',b.dataset.dm==='hover');});}
      st.dp.x+=(tgt[0]-st.dp.x)*Math.min(1,dt*1.6);st.dy+=(tgt[1]-st.dy)*Math.min(1,dt*1.6);st.dp.z+=(tgt[2]-st.dp.z)*Math.min(1,dt*1.6);
      var near=Math.abs(tgt[0]-st.dp.x)+Math.abs(tgt[2]-st.dp.z);st.dpitch+=((near>.08?tgt[3]:0)-st.dpitch)*Math.min(1,dt*5);st.droll+=((near>.08?tgt[4]:0)-st.droll)*Math.min(1,dt*5);
      if(st.dm==='turn')dr.g.rotation.y+=dt*1.1;else{var ry=((dr.g.rotation.y+PI)%(2*PI)+2*PI)%(2*PI)-PI;dr.g.rotation.y=ry*(1-Math.min(1,dt*2));}
      dr.g.position.set(X[1]+st.dp.x,1.75+st.dy+.05*Math.sin(t*1.7),st.dp.z+.04*Math.sin(t*1.1));dr.g.rotation.z=st.dpitch+.02*Math.sin(t*2.3);dr.g.rotation.x=st.droll+.02*Math.sin(t*1.9);
      for(var k=0;k<4;k++)dr.discs[k].material.color.setHex(dr.w[k]>1.15?0xff7a1a:(dr.w[k]<.9?0x4a6a8a:0x9fd8ff));}});
  $$('#s-drone .btn[data-dm]').forEach(function(b){b.addEventListener('click',function(){st.dm=b.dataset.dm;st.dT=0;$$('#s-drone .btn[data-dm]').forEach(function(x){x.classList.toggle('on',x===b);});});});
  RX.hooks['s-drone']={key:function(k){var n=['hover','up','forward','side','turn'][+k-1];if(n){st.dm=n;st.dT=0;$$('#s-drone .btn[data-dm]').forEach(function(x){x.classList.toggle('on',x.dataset.dm===n);});return true;}}};
  RX.zoo={st:st,X:X,drone:function(){return {w:dr.w.slice(),p:dr.g.position.toArray(),ry:dr.g.rotation.y,rz:dr.g.rotation.z};}};
  RX.view('zoo0',{set:'zoo',pos:[X[0]+4.2,2.9,7.2],tgt:[X[0]+.3,.95,-.4],off:[.24,0],amp:.04,fog:[26,60]});
  RX.view('zoo1',{set:'zoo',pos:[X[1]+2.6,2.5,4.4],tgt:[X[1],1.6,0],off:[.24,0],amp:.04,fog:[26,60]});
  RX.view('zoo2',{set:'zoo',pos:[X[2]+2.4,1.5,3.9],tgt:[X[2],.5,0],off:[.24,.02],amp:.04,fog:[26,60]});
  RX.view('zoo3',{set:'zoo',pos:[X[3]+3.2,1.9,4.9],tgt:[X[3],1.0,0],off:[.24,0],amp:.04,fog:[26,60]});
  RX.view('hum',{set:'zoo',pos:[X[3]+3.4,1.8,5.2],tgt:[X[3],1.0,0],off:[.27,0],amp:.05,fog:[26,60]});
  RX.view('humDim',{set:'zoo',pos:[X[3]+3.8,1.9,5.8],tgt:[X[3],1.0,0],off:[.3,0],amp:.05,shade:.66,fog:[26,60]});
  RX.view('humRun',{set:'zoo',pos:[X[3]+1.2,1.25,6.6],tgt:[X[3]+.2,1.0,0],off:[.26,.1],amp:.02,fog:[26,60]});
  RX.view('drone',{set:'zoo',pos:[X[1]-.4,2.5,3.5],tgt:[X[1]+.3,1.78,0],off:[.21,0],amp:.03,fog:[26,60]});
  RX.view('zooDim',{set:'zoo',pos:[X[0]+5,3.2,8.5],tgt:[X[0]+.3,.95,-.4],off:[.26,0],amp:.05,shade:.72,fog:[26,60]});
})();

/* =============== the globe: where the new industrial robots of 2025 went =============== */
(function(){
  var RG=5,bars=[],t0=-99,stars;
  function ll(lat,lon,r){r=r||RG;var p=(90-lat)*PI/180,t=(lon+180)*PI/180;return V(-r*Math.sin(p)*Math.cos(t),r*Math.cos(p),r*Math.sin(p)*Math.sin(t));}
  /* installations in 2025, IFR press release of 24 September 2026 */
  var D=[['China',35,105,354000,'r'],['Japan',36.5,138.5,36219,'r'],['United States',39,-98,38500,'l'],['South Korea',36.3,127.8,30000,'l'],['Germany',51,10.2,25000,''],['India',22,79,10500,'l'],['Italy',42.8,12.6,7800,'r'],
    ['Mexico',23,-102,5200,'l'],['France',46.6,2.4,4500,'l'],['Spain',40,-3.7,4300,'l'],['Brazil',-10,-52,4300,'r'],['Canada',56,-106,4000,'r']];
  RX.addSet('globe',{
    build:function(g){
      g.add(new THREE.Mesh(new THREE.SphereGeometry(RG*.992,72,48),new THREE.MeshBasicMaterial({color:0x08111f})));
      function dots(arr,size,color,skipEU){var out=[];for(var i=0;i<arr.length;i+=2){var la=arr[i]/100,lo=arr[i+1]/100;if(skipEU&&la>34&&la<71.5&&lo>-12&&lo<45)continue;var v=ll(la,lo,RG);out.push(v.x,v.y,v.z);}
        var ge=new THREE.BufferGeometry();ge.setAttribute('position',new THREE.BufferAttribute(new Float32Array(out),3));return new THREE.Points(ge,new THREE.PointsMaterial({size:size,color:color,map:u.DISC,transparent:true,alphaTest:.25,sizeAttenuation:true}));}
      if(window.LAND){g.add(dots(window.LAND,.092,0x4aa8f0,true));g.add(dots(window.LAND_EU,.046,0x8fd2ff,false));}
      g.add(new THREE.Mesh(new THREE.SphereGeometry(RG*1.2,64,48),new THREE.ShaderMaterial({side:THREE.BackSide,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,
        vertexShader:'varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragmentShader:'varying vec3 vN;void main(){float i=pow(max(0.0,0.66-dot(vN,vec3(0.0,0.0,1.0))),4.0);gl_FragColor=vec4(0.22,0.58,1.0,1.0)*i;}'})));
      var n=1400,p=new Float32Array(n*3);for(var i=0;i<n;i++){var v=V(Math.random()*2-1,Math.random()*2-1,Math.random()*2-1).normalize().multiplyScalar(150+Math.random()*120);p[i*3]=v.x;p[i*3+1]=v.y;p[i*3+2]=v.z;}
      var sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(p,3));stars=new THREE.Points(sg,new THREE.PointsMaterial({size:1.1,color:0x9fc8ff,map:u.DISC,transparent:true,opacity:.7,depthWrite:false,fog:false}));g.add(stars);
      D.forEach(function(d,i){var h=2.3*Math.sqrt(d[3]/354000),b=new THREE.Group();b.position.copy(ll(d[1],d[2],RG));b.lookAt(b.position.clone().multiplyScalar(2));
        var m=new THREE.Mesh(new THREE.CylinderGeometry(.055,.075,1,16),new THREE.MeshBasicMaterial({color:i===0?0xff7a1a:0xffb23e}));m.geometry.rotateX(PI/2);m.geometry.translate(0,0,.5);b.add(m);
        var ring=new THREE.Mesh(new THREE.RingGeometry(.09,.13,28),new THREE.MeshBasicMaterial({color:0xffb23e,side:THREE.DoubleSide,transparent:true,opacity:.8}));ring.position.z=.01;b.add(ring);g.add(b);bars.push({m:m,h:h});
        RX.label('<b>'+d[3].toLocaleString('en-US')+'</b> '+d[0],'dot '+d[4],ll(d[1],d[2],RG+h+.14),['gAsia','gEu','gAm'],{globe:true});});},
    enter:function(view,st,fresh){if(fresh)t0=performance.now()/1000;},
    update:function(){var now=performance.now()/1000;bars.forEach(function(b,i){var q=clamp((now-t0-.6-i*.08)/1.2,0,1);b.m.scale.z=Math.max(.001,b.h*(1-Math.pow(1-q,3)));});}});
  RX.view('gFar',{set:'globe',pos:ll(30,95,21.5),tgt:[0,0,0],off:[.25,-.03],amp:.1,bg:0x05080e});
  RX.view('gDim',{set:'globe',pos:ll(30,95,21),tgt:[0,0,0],off:[.3,0],amp:.1,bg:0x05080e,shade:.55});
  RX.view('gAsia',{set:'globe',pos:ll(16,122,12.6),tgt:ll(30,119,RG),off:[.2,.05],amp:.025,bg:0x05080e});
  RX.view('gEu',{set:'globe',pos:ll(36,12,9.2),tgt:ll(46,8,RG),off:[.2,.04],amp:.02,bg:0x05080e});
  RX.view('gAm',{set:'globe',pos:ll(8,-72,14.8),tgt:ll(20,-70,RG),off:[.2,.02],amp:.025,bg:0x05080e});
})();

/* =============== cyber-physical system: a robot and its digital twin =============== */
(function(){
  var A,B,pts,N=70,curve,halo,XA=-2.3,XB=2.3,qf=[0,0,0,0,0,0];
  function q(t){return [.7*Math.sin(t*.5),-.45+.3*Math.sin(t*.7),.35+.35*Math.sin(t*.9+1),.8*Math.sin(t*.6),.5+.4*Math.sin(t*.8),t*.3];}
  RX.addSet('twin',{
    build:function(g){u.floor(g);A=R.arm();A.g.position.x=XA;g.add(A.g);u.shadow(A.g);
      B=R.arm({mat:new THREE.MeshBasicMaterial({color:0x3cc8ff,wireframe:true,transparent:true,opacity:.5})});B.g.position.x=XB;g.add(B.g);
      var ring=new THREE.Mesh(new THREE.RingGeometry(.9,1.0,64),new THREE.MeshBasicMaterial({color:0x3cc8ff,side:THREE.DoubleSide,transparent:true,opacity:.8}));ring.rotation.x=-PI/2;ring.position.set(XB,.02,0);g.add(ring);
      var disc=new THREE.Mesh(new THREE.CircleGeometry(.9,48),new THREE.MeshBasicMaterial({color:0x3cc8ff,transparent:true,opacity:.1}));disc.rotation.x=-PI/2;disc.position.set(XB,.015,0);g.add(disc);
      curve=new THREE.CatmullRomCurve3([V(XA+.3,2.6,0),V(XA+1.2,3.5,0),V(0,3.8,0),V(XB-1.2,3.5,0),V(XB-.3,2.6,0)]);
      var p=new Float32Array(N*3),c=new Float32Array(N*3);pts=new THREE.Points(new THREE.BufferGeometry(),new THREE.PointsMaterial({size:.13,map:u.DISC,transparent:true,alphaTest:.2,vertexColors:true,depthWrite:false}));
      pts.geometry.setAttribute('position',new THREE.BufferAttribute(p,3));pts.geometry.setAttribute('color',new THREE.BufferAttribute(c,3));pts.frustumCulled=false;g.add(pts);
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(60)),new THREE.LineBasicMaterial({color:0x2c4d74,transparent:true,opacity:.7})));
      halo=sph(.42,new THREE.MeshBasicMaterial({color:0xff5a5a,transparent:true,opacity:.35,depthWrite:false}),20);B.j[2].add(halo);halo.visible=false;
      this.elbowA=new THREE.Object3D();A.j[2].add(this.elbowA);this.elbowB=new THREE.Object3D();this.elbowB.position.set(0,.5,0);B.j[2].add(this.elbowB);},
    update:function(t,dt,view,step){var fault=step>=1,a=q(t),b=q(t-.12);
      if(fault){a[2]+=.03*Math.sin(t*41)+.02*Math.sin(t*67);a[1]+=.008*Math.sin(t*53);}
      A.setQ(a);B.setQ(b);halo.visible=fault;if(fault){halo.scale.setScalar(1+.25*Math.sin(t*6));}
      var pp=pts.geometry.attributes.position,cc=pts.geometry.attributes.color,v=V();for(var i=0;i<N;i++){var fw=i%2===0,k=((i/N)+t*(fw?.22:.18))%1;curve.getPointAt(fw?k:1-k,v);pp.setXYZ(i,v.x,v.y+(fw?.06:-.06),v.z+(fw?.08:-.08));
        if(fw){if(fault&&i%6===0)cc.setXYZ(i,1,.35,.35);else cc.setXYZ(i,.24,.78,1);}else cc.setXYZ(i,1,.77,.24);}pp.needsUpdate=true;cc.needsUpdate=true;}});
  var S=RX.sets.twin;
  RX.view('twin',{set:'twin',pos:[.4,3.4,12.4],tgt:[.2,1.75,0],off:[.15,-.03],amp:.03,shadeL:.9,fog:[26,60]});
  RX.label('Physical robot<small>sensors on every joint</small>','tag',V(XA,.0,1.4),['twin'],{});
  RX.label('Digital twin<small>a live software copy</small>','tag',V(XB,.0,1.4),['twin'],{});
  RX.label('sensor data','dot',V(-.9,4.05,0),['twin'],{});RX.label('commands','dot',V(.9,3.45,0),['twin'],{});
  RX.label('Vibration on axis 3 is rising','tag l hot',S.elbowA,['twin'],{when:function(k){return k>=1;}});
  RX.label('The twin predicts wear on axis 3<small>plan the service before it fails</small>','tag hot',S.elbowB,['twin'],{when:function(k){return k>=1;}});
})();

/* =============== cobot and person: speed and separation monitoring =============== */
(function(){
  var C,P,part,caps=[],st={d:4.0,auto:true,f:1,tr:0,ph:0,dir:-1,wait:0},PA=V(.58,.05,.3),PB=V(.5,.05,-.32),base=V(0,.83,0),zone=[];
  RX.addSet('cobot',{
    build:function(g){u.floor(g);
      [[0,1.5,0xff5a5a,.3],[1.5,2.7,0xffc53d,.22],[2.7,4.8,0x2fe0a8,.13]].forEach(function(z){var m=new THREE.Mesh(new THREE.RingGeometry(z[0],z[1],72),new THREE.MeshBasicMaterial({color:z[2],transparent:true,opacity:z[3],side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-PI/2;m.position.y=.012+zone.length*.001;g.add(m);zone.push(m);});
      g.add(at(rbox(1.1,.8,.95,.04,bench),.2,.4,0));g.add(at(box(1.14,.03,.99,topM),.2,.815,0));
      C=R.cobot();C.g.position.copy(base);g.add(C.g);C.g.traverse(function(o){if(o.isMesh&&o.material.color&&o.material.color.getHex()===0x2f9be0&&caps.indexOf(o.material)<0)caps.push(o.material);});
      [PA,PB].forEach(function(p){g.add(at(box(.24,.015,.24,steel),p.x,.84,p.z));});part=rbox(.07,.07,.07,.01,glow(0x3cc8ff,.6));g.add(part);
      P=R.person();P.g.rotation.y=PI;g.add(P.g);u.shadow(g);
      this.pa=new THREE.Object3D();this.pa.position.y=2.0;P.g.add(this.pa);},
    update:function(t,dt){
      if(st.auto){if(st.wait>0)st.wait-=dt;else{st.d+=st.dir*.75*dt;if(st.d<1.05){st.d=1.05;st.dir=1;st.wait=1.8;}if(st.d>4.2){st.d=4.2;st.dir=-1;st.wait=1.2;}}var sl=$('#cb-dist');if(sl)sl.value=Math.round(st.d*100);}
      var want=st.d>2.7?1:(st.d>1.5?.3:0);st.f+=(want-st.f)*Math.min(1,dt*6);st.tr+=dt*st.f;
      var moving=st.auto&&st.wait<=0;st.ph=(st.ph+(moving?dt*1.1:0))%1;P.walk(st.ph,moving?1:0);P.g.position.set(st.d,0,.15);P.g.rotation.y=(st.auto&&st.dir>0&&moving)?0:PI;
      carry(C,part,hop(st.tr,5),PA,PB,.25,base,0);
      var col=want===1?0x2fe0a8:(want>0?0xffc53d:0xff5a5a);caps.forEach(function(m){m.color.setHex(col);m.emissive=m.emissive||new THREE.Color();m.emissive.setHex(col);m.emissiveIntensity=.6;});
      txt('#cb-d',st.d.toFixed(1)+' m');txt('#cb-speed',Math.round(st.f*100)+'%');var e=$('#cb-state');if(e){var s=want===1?'Full speed':(want>0?'Reduced speed':'Protective stop');if(e.textContent!==s){e.textContent=s;e.style.color=want===1?'#2fe0a8':(want>0?'#ffc53d':'#ff5a5a');}}}});
  var sl=$('#cb-dist');if(sl)sl.addEventListener('input',function(){st.auto=false;st.d=+sl.value/100;var a=$('#cb-auto');if(a)a.classList.remove('on');});
  var ab=$('#cb-auto');if(ab)ab.addEventListener('click',function(){st.auto=!st.auto;ab.classList.toggle('on',st.auto);});
  RX.cobot=st;
  RX.view('cobot',{set:'cobot',pos:[5.2,3.5,6.9],tgt:[1.4,.8,0],off:[.24,0],amp:.04,fog:[26,60]});
  RX.view('cobotDim',{set:'cobot',pos:[7.4,4.6,9.4],tgt:[1.7,.8,0],off:[.27,0],amp:.04,shade:.72,fog:[26,60]});
})();

/* =============== an arm that takes its task in plain words (scripted illustration) =============== */
(function(){
  var A,S=.55,AB=V(0,.78,-.42),obj={},home=V(0,1.3,.12),tipNow=home.clone(),queue=[],cur=null,grip=1,held=null,busy=false,TY=.78;
  var INIT={red:V(.3,TY+.045,.25),blue:V(-.38,TY+.045,.12),green:V(-.05,TY+.045,.38),can:V(-.62,TY+.065,-.18)},BOWL=V(.6,TY,-.05),HAND=V(-.8,TY+.065,.22);
  function mv(p,dur,o){o=o||{};o.p=p;o.dur=dur;queue.push(o);}
  function task(name,to,dropY,labels){var o=obj[name],p=o.position.clone(),up=.26;
    mv(V(p.x,p.y+up,p.z),.7,{lab:labels[0]});mv(p.clone(),.45,{lab:'move down'});mv(p.clone(),.25,{grip:0,take:name,lab:'close gripper'});mv(V(p.x,p.y+up,p.z),.4,{lab:'lift'});
    mv(V(to.x,to.y+up,to.z),.9,{lab:labels[1]});mv(to.clone(),.45,{lab:'move down'});mv(to.clone(),.25,{grip:1,drop:dropY,lab:'open gripper'});mv(V(to.x,to.y+up,to.z),.4,{});mv(home.clone(),.7,{done:true});}
  function tokens(words){var a=$('#vla-in'),b=$('#vla-out');if(!a)return;a.innerHTML='';b.innerHTML='';var h='';for(var i=0;i<6;i++)h+='<i>image '+(i+1)+'</i>';words.forEach(function(wd){h+='<i>'+wd+'</i>';});a.innerHTML=h;
    $$('i',a).forEach(function(e,i){setTimeout(function(){e.classList.add('on');},RX.STATIC?0:40*i);});}
  function outTok(s){var b=$('#vla-out');if(!b||!s)return;var e=document.createElement('i');e.className='a';e.textContent=s;b.appendChild(e);if(b.children.length>9)b.removeChild(b.firstChild);setTimeout(function(){e.classList.add('on');},20);}
  function run(n){if(busy)return false;var o=obj;
    if(n===1){if(o.red.userData.at==='bowl')return false;tokens(['put','the','red','cube','in','the','bowl']);task('red',V(BOWL.x,TY+.085,BOWL.z),TY+.06,['reach: red cube','carry to: bowl']);o.red.userData.at='bowl';}
    else if(n===2){if(o.blue.userData.at==='green')return false;tokens(['stack','the','blue','cube','on','the','green','cube']);var gp=o.green.position;task('blue',V(gp.x,gp.y+.092,gp.z),null,['reach: blue cube','carry to: green cube']);o.blue.userData.at='green';}
    else if(n===3){if(o.can.userData.at==='front')return false;tokens(['I','am','thirsty']);task('can',HAND.clone(),null,['plan: thirsty, so a drink, so the can','carry to: the person']);o.can.userData.at='front';}
    else return false;busy=true;return true;}
  function reset(){queue=[];cur=null;busy=false;held=null;grip=1;tipNow.copy(home);for(var k in INIT){obj[k].position.copy(INIT[k]);obj[k].userData.at='';}var a=$('#vla-in'),b=$('#vla-out');if(a)a.innerHTML='';if(b)b.innerHTML='';}
  RX.addSet('vla',{
    build:function(g){u.floor(g);g.add(at(rbox(2.2,.06,1.3,.02,std(0xd8c7a6,.7,0)),0,TY-.03,0).rotateX(0));
      [[-1,-.55],[1,-.55],[1,.55],[-1,.55]].forEach(function(p){g.add(at(box(.07,TY-.06,.07,iron),p[0],(TY-.06)/2,p[1]));});
      A=R.arm();A.g.scale.setScalar(S);A.g.position.copy(AB);g.add(A.g);
      function cube(c){return rbox(.09,.09,.09,.012,std(c,.5,.05,{emissive:c,emissiveIntensity:.18}));}
      obj.red=cube(0xff4a3d);obj.blue=cube(0x2f8fe8);obj.green=cube(0x2fd27a);
      obj.can=new THREE.Group();obj.can.add(cyl(.033,.13,std(0xd8dde4,.25,.9)));obj.can.add(cyl(.0335,.07,std(0xd82c2c,.4,.3)));
      for(var k in obj){g.add(obj[k]);obj[k].userData.at='';}
      var bw=new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(.0,.004),new THREE.Vector2(.09,.004),new THREE.Vector2(.14,.07),new THREE.Vector2(.15,.07),new THREE.Vector2(.1,.0),new THREE.Vector2(0,0)],36),std(0xf1f3f6,.3,.1,{side:THREE.DoubleSide}));bw.position.copy(BOWL);g.add(bw);
      var mast=at(cyl(.02,1.3,iron),-1.0,TY+.65,-.55);g.add(mast);var camB=at(rbox(.16,.09,.1,.02,dark),-.96,TY+1.3,-.52);camB.lookAt(0,TY,.1);g.add(camB);g.add(at(sph(.03,glow(0x3cc8ff,1.5),10),-.9,TY+1.26,-.47));
      var fp=[];[[-.95,.5],[.95,.5],[.95,-.5],[-.95,-.5]].forEach(function(c){fp.push(-.92,TY+1.27,-.49,c[0],TY+.004,c[1]);});
      var fr=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x3cc8ff,transparent:true,opacity:.28}));fr.geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(fp),3));g.add(fr);
      var pr=R.person(0x4a6a8a);pr.g.position.set(-1.62,0,.2);g.add(pr.g);
      u.shadow(g);reset();},
    enter:function(view,st,fresh){if(fresh)reset();},
    update:function(t,dt){
      if(!cur&&queue.length){cur=queue.shift();cur.from=tipNow.clone();cur.t=0;cur.g0=grip;if(cur.lab)outTok(cur.lab);if(cur.take)held=cur.take;}
      if(cur){cur.t+=dt;var k=clamp(cur.t/cur.dur,0,1),e=ease(k);tipNow.lerpVectors(cur.from,cur.p,e);if(cur.grip!=null)grip=lerp(cur.g0,cur.grip,k);
        if(k>=1){if(cur.drop!==undefined&&held){if(cur.drop!=null)obj[held].position.y=cur.drop;held=null;}if(cur.done)busy=false;cur=null;}}
      else if(!busy){tipNow.set(home.x+.05*Math.sin(t*.8),home.y+.03*Math.sin(t*1.1),home.z);}
      A.ik((tipNow.x-AB.x)/S,(tipNow.y-AB.y)/S,(tipNow.z-AB.z)/S);A.grip(.18+.82*grip);
      if(held&&cur&&!(cur.take&&cur.t<cur.dur*.7)){A.g.updateMatrixWorld(true);A.tip.getWorldPosition(w);obj[held].position.copy(w);}}});
  $$('#s-vla .btn[data-cmd]').forEach(function(b){b.addEventListener('click',function(){if(b.dataset.cmd==='0')reset();else run(+b.dataset.cmd);});});
  RX.hooks['s-vla']={key:function(k){if(k==='0'){reset();return true;}if(+k>=1&&+k<=3){run(+k);return true;}}};
  RX.vla={run:run,reset:reset,obj:obj,busy:function(){return busy;}};
  RX.view('vla',{set:'vla',pos:[1.9,2.5,4.1],tgt:[-.2,1.05,.0],off:[.27,.02],amp:.03,fog:[20,50]});
  RX.view('vlaDim',{set:'vla',pos:[2.9,3.0,5.8],tgt:[-.25,1.05,.0],off:[.27,0],amp:.06,shade:.62,fog:[20,50]});
  RX.view('vlaWide',{set:'vla',pos:[2.6,2.9,5.4],tgt:[-.25,1.05,.0],off:[.25,0],amp:.06,fog:[20,50]});
})();

/* =============== learning in simulation: many virtual robots practise at once =============== */
(function(){
  var NX=8,NZ=5,E=[],L1=.5,L2=.45,SH=.22,T0=0,stats={ep:0,ok:0},okM=glow(0x2fe0a8,.7),plM=std(0x18222f,.7,.2),CYC=24;
  function fk(q){var r=L1*Math.sin(q[1])+L2*Math.sin(q[1]+q[2]),y=SH+L1*Math.cos(q[1])+L2*Math.cos(q[1]+q[2]);return V(r*Math.cos(q[0]),y,-r*Math.sin(q[0]));}
  function ik(p){var th=Math.atan2(-p.z,p.x),r=Math.hypot(p.x,p.z),dy=p.y-SH,d=clamp(Math.hypot(r,dy),.1,L1+L2-.001),a=Math.atan2(r,dy),al=Math.acos(clamp((L1*L1+d*d-L2*L2)/(2*L1*d),-1,1)),ka=Math.acos(clamp((L1*L1+L2*L2-d*d)/(2*L1*L2),-1,1));return [th,a-al,PI-ka];}
  RX.addSet('farm',{
    build:function(g){u.floor(g,{op:.25});var mU=std(0xff7a1a,.45,.2),mF=std(0xd9dee6,.4,.4),mB=std(0x1a212c,.5,.5);
      for(var iz=0;iz<NZ;iz++)for(var ix=0;ix<NX;ix++){var c=new THREE.Group();c.position.set((ix-(NX-1)/2)*1.55,0,(iz-(NZ-1)/2)*1.55);g.add(c);
        var pl=at(box(1.3,.04,1.3,plM),0,.02,0);pl.receiveShadow=true;c.add(pl);c.add(at(cyl(.12,.18,mB),0,.13,0));
        var j1=new THREE.Group();j1.position.y=SH;c.add(j1);var j2=new THREE.Group();j1.add(j2);j2.add(at(box(.09,L1,.09,mU),0,L1/2,0));var j3=new THREE.Group();j3.position.y=L1;j2.add(j3);j3.add(at(box(.065,L2,.065,mF),0,L2/2,0));j3.add(at(sph(.05,mB,10),0,L2,0));
        var tg=sph(.06,glow(0xffc53d,1),10);c.add(tg);
        E.push({pl:pl,j1:j1,j2:j2,j3:j3,tg:tg,seed:ix*7.13+iz*3.71,ep:-1,p:V(),q:[0,0,0],won:false,bias:.75+.5*((ix*13+iz*7)%10)/10});}
      u.shadow(g);},
    enter:function(view,st,fresh){if(fresh){T0=performance.now()/1000;stats.ep=0;stats.ok=0;E.forEach(function(e){e.ep=-1;});}},
    update:function(t){var now=performance.now()/1000,g=(now-T0)%(CYC+5),prog=clamp(g/CYC,0,1);if(g<.05&&stats.ep>40){stats.ep=0;stats.ok=0;}
      var okNow=0;E.forEach(function(e){var skill=clamp((prog*1.25-.12)*e.bias,0,1);skill=skill*skill*(3-2*skill);var ep=Math.floor((now-T0+e.seed)/2.2);
        if(ep!==e.ep){if(e.ep>=0){stats.ep++;if(e.won)stats.ok++;}e.ep=ep;e.won=false;var a=(Math.sin(ep*12.9898+e.seed)*43758.5453)%1*2*PI,rr=.45+.3*Math.abs(Math.sin(ep*4.1+e.seed));e.p.set(rr*Math.cos(a),.25+.35*Math.abs(Math.sin(ep*2.3+e.seed*2)),rr*Math.sin(a));e.tg.position.copy(e.p);e.qi=ik(e.p);}
        var s=e.seed,nz=[Math.sin(t*1.7+s)+.6*Math.sin(t*3.1+s*2),Math.sin(t*1.3+s*3)+.5*Math.sin(t*2.7+s),Math.sin(t*2.1+s*5)+.5*Math.sin(t*3.7+s*4)],k=(1-skill);
        var tq=[e.qi[0]+nz[0]*1.6*k,e.qi[1]+nz[1]*.9*k,e.qi[2]+nz[2]*1.1*k];for(var i=0;i<3;i++)e.q[i]+=(tq[i]-e.q[i])*.12;
        e.j1.rotation.y=e.q[0];e.j2.rotation.z=-e.q[1];e.j3.rotation.z=-e.q[2];
        var hit=fk(e.q).distanceTo(e.p)<.09;if(hit)e.won=true;if(e.won)okNow++;e.pl.material=e.won?okM:plM;});
      txt('#farm-ep',String(stats.ep));txt('#farm-rate',Math.round(okNow/E.length*100)+'%');var b=$('#farm-bar');if(b)b.style.width=(prog*100)+'%';}});
  RX.farm={E:E,stats:stats};
  RX.view('farm',{set:'farm',pos:[9.5,8,12.5],tgt:[.6,0,.2],off:[.22,.04],amp:.05,fog:[30,70]});
  RX.view('farmDim',{set:'farm',pos:[11,9,14],tgt:[.6,0,.2],off:[.25,.04],amp:.05,shade:.68,fog:[30,70]});
})();
})();
