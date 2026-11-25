/* Robot models built from simple solids. Each follows the real machine's structure:
   links run from joint to joint the way the hardware does (a SCARA goes up its column, then out along the arm). */
(function(){
'use strict';
var u=RX.u, at=u.at, std=u.std, glow=u.glow, cyl=u.cyl, box=u.box, sph=u.sph, rbox=u.rbox, stadium=u.stadium, rod=u.rod, clamp=u.clamp;
var R=RX.robots={}, PI=Math.PI;
function V(x,y,z){return new THREE.Vector3(x,y,z);}
/* two-link leg or arm in a vertical plane. dx forward, dy up (negative = below the hip).
   sgn +1: knee behind the hip-foot line, -1: knee in front. Returns [hip angle, knee angle]. */
function leg2(dx,dy,Lu,Ll,sgn){var D=clamp(Math.hypot(dx,dy),Math.abs(Lu-Ll)+.01,Lu+Ll-.004),g=Math.atan2(dx,-dy),
  al=Math.acos(clamp((Lu*Lu+D*D-Ll*Ll)/(2*Lu*D),-1,1)),ka=Math.acos(clamp((Lu*Lu+Ll*Ll-D*D)/(2*Lu*Ll),-1,1));return [g-sgn*al,sgn*(PI-ka)];}
R.leg2=leg2;

/* ---------- six-axis industrial arm ---------- */
R.arm=function(o){o=o||{};
  var mO=o.mat||std(o.color==null?0xff6a13:o.color,.42,.25), mD=o.mat||std(0x1a212c,.5,.55), mS=o.mat||std(0xc4cdd9,.28,.9), mK=o.mat||std(0x0b0e13,.7,.1);
  var L1=1.25,L2=1.2,L3=.4,SX=.3,SY=1.0,G=new THREE.Group();
  G.add(at(cyl(.5,.08,mD),0,.04,0));G.add(at(cyl(.41,.28,mD,null,.36),0,.22,0));
  var g1=new THREE.Group();g1.position.y=.36;G.add(g1);
  g1.add(at(cyl(.37,.2,mO),0,.1,0));g1.add(at(rbox(.64,.56,.46,.1,mO),.12,.46,0));g1.add(at(cyl(.13,.3,mD),-.26,.5,0));
  var g2=new THREE.Group();g2.position.set(SX,SY-.36,0);g1.add(g2);
  g2.add(cyl(.23,.62,mD,'z'));
  if(!o.mat){var mL=glow(o.led==null?0x3cc8ff:o.led,1.1),tor=function(r,t){return new THREE.Mesh(new THREE.TorusGeometry(r,t,8,48),mL);};
    g2.add(at(tor(.2,.014),0,0,.316));g2.add(at(tor(.2,.014),0,0,-.316));var tb=tor(.385,.014);tb.rotation.x=PI/2;tb.position.y=.105;g1.add(tb);}
  var ua=stadium(L1,.2,.15,.18,mO);ua.rotation.z=PI/2;ua.position.z=.2;g2.add(ua);
  g2.add(at(cyl(.07,.62,mD),-.02,.42,.33));g2.add(at(cyl(.045,.3,mS),-.02,.86,.33));
  var g3=new THREE.Group();g3.position.y=L1;g2.add(g3);
  g3.add(cyl(.17,.54,mD,'z'));if(!o.mat){g3.add(at(tor(.14,.012),0,0,.276));g3.add(at(tor(.14,.012),0,0,-.276));}g3.add(at(rbox(.5,.36,.34,.07,mO),.08,0,-.02));g3.add(at(cyl(.11,.28,mD,'x'),-.28,0,-.02));
  var g4=new THREE.Group();g3.add(g4);
  var fa=cyl(.14,L2-.5,mO,'x',.095);fa.position.x=.32+(L2-.5)/2;g4.add(fa);
  g4.add(at(box(.24,.2,.045,mO),L2-.08,0,.125));g4.add(at(box(.24,.2,.045,mO),L2-.08,0,-.125));
  var g5=new THREE.Group();g5.position.x=L2;g4.add(g5);
  g5.add(cyl(.1,.2,mD,'z'));
  var g6=new THREE.Group();g5.add(g6);
  g6.add(at(cyl(.085,.14,mD),0,-.12,0));g6.add(at(cyl(.1,.03,mS),0,-.205,0));
  var tool=new THREE.Group();tool.position.y=-.22;g6.add(tool);
  tool.add(at(box(.24,.07,.12,mK),0,-.035,0));
  var f1=at(box(.028,.15,.09,mS),.09,-.145,0),f2=at(box(.028,.15,.09,mS),-.09,-.145,0);tool.add(f1);tool.add(f2);
  var tip=new THREE.Object3D();tip.position.y=-(L3-.22);tool.add(tip);
  var A={g:G,j:[g1,g2,g3,g4,g5,g6],tip:tip,tool:tool,L1:L1,L2:L2,L3:L3,q:[0,0,0,0,0,0]};
  A.setQ=function(q){A.q=q.slice();g1.rotation.y=q[0];g2.rotation.z=q[1];g3.rotation.z=q[2];g4.rotation.x=q[3];g5.rotation.z=q[4];g6.rotation.y=q[5];};
  /* tip position in the robot's own frame; pitch 0 = tool straight down, positive = tilted forward */
  A.ik=function(x,y,z,pitch,roll){pitch=pitch||0;var th=Math.atan2(-z,x),r=Math.hypot(x,z),dx=r-L3*Math.sin(pitch)-SX,dy=y+L3*Math.cos(pitch)-SY,d=clamp(Math.hypot(dx,dy),.4,L1+L2-.002);
    var a1=Math.atan2(dy,dx)+Math.acos(clamp((L1*L1+d*d-L2*L2)/(2*L1*d),-1,1)),a2=a1-(PI-Math.acos(clamp((L1*L1+L2*L2-d*d)/(2*L1*L2),-1,1)));
    A.setQ([th,a1-PI/2,a2-a1+PI/2,0,-a2+pitch,roll||0]);};
  A.grip=function(k){f1.position.x=.05+.05*k;f2.position.x=-.05-.05*k;};A.grip(1);
  return A;};

/* ---------- collaborative arm: tubes and round joint housings with coloured caps ---------- */
R.cobot=function(o){o=o||{};
  var mT=std(0xdfe4ea,.3,.55), mJ=std(0x97a2b1,.38,.5), mC=std(o.cap==null?0x2f9be0:o.cap,.4,.15), mK=std(0x14181e,.6,.2), mS=std(0xc4cdd9,.28,.9);
  var L1=.86,L2=.78,SY=.34,ZA=.16,ZB=.03,WX=.1,WZ=-.11,LT=.205,rj=.075,G=new THREE.Group();
  function joint(ax,len){var g=new THREE.Group();g.add(cyl(rj,len,mJ,ax));var c=cyl(rj*.92,.012,mC,ax);g.add(c);g.cap=c;return g;}
  G.add(at(cyl(.12,.05,mK),0,.025,0));G.add(at(cyl(rj+.01,.21,mJ),0,.15,0));
  var g1=new THREE.Group();G.add(g1);
  var sh=joint('z',.2);sh.position.set(0,SY,0);sh.cap.position.z=-.106;g1.add(sh);
  var g2=new THREE.Group();g2.position.set(0,SY,0);g1.add(g2);
  var j2=joint('z',.13);j2.position.z=ZA;j2.cap.position.z=.071;g2.add(j2);
  g2.add(at(cyl(.056,L1,mT),0,L1/2,ZA));
  var j3a=joint('z',.13);j3a.position.set(0,L1,ZA);j3a.cap.position.z=.071;g2.add(j3a);
  var g3=new THREE.Group();g3.position.y=L1;g2.add(g3);
  var j3=joint('z',.13);j3.position.z=ZB;j3.cap.position.z=-.071;g3.add(j3);
  g3.add(at(cyl(.046,L2,mT,'x'),L2/2,0,ZB));
  var j4=joint('z',.12);j4.position.set(L2,0,ZB);j4.cap.position.z=.066;g3.add(j4);
  var g4=new THREE.Group();g4.position.set(L2,0,ZB);g3.add(g4);
  var g5=new THREE.Group();g5.position.z=WZ;g4.add(g5);
  var j5=joint('x',.12);j5.cap.position.x=-.066;g5.add(j5);
  var g6=new THREE.Group();g6.position.x=WX;g5.add(g6);
  var j6=joint('y',.11);j6.cap.position.y=.061;g6.add(j6);g6.add(at(cyl(.05,.02,mS),0,-.065,0));
  var tool=new THREE.Group();tool.position.y=-.075;g6.add(tool);
  tool.add(at(box(.14,.06,.09,mK),0,-.03,0));
  var f1=at(box(.022,.11,.06,mS),.05,-.115,0),f2=at(box(.022,.11,.06,mS),-.05,-.115,0);tool.add(f1);tool.add(f2);
  var tip=new THREE.Object3D();tip.position.y=-(LT-.075);tool.add(tip);
  var E=ZB+WZ, A={g:G,j:[g1,g2,g3,g4,g5,g6],tip:tip};
  A.ik=function(x,y,z){var rr=Math.hypot(x,z),X=Math.sqrt(Math.max(.01,rr*rr-E*E)),th=Math.atan2(-z,x)+Math.atan2(E,X),dx=X-WX,dy=y+LT-SY,d=clamp(Math.hypot(dx,dy),.3,L1+L2-.002);
    var a1=Math.atan2(dy,dx)+Math.acos(clamp((L1*L1+d*d-L2*L2)/(2*L1*d),-1,1)),a2=a1-(PI-Math.acos(clamp((L1*L1+L2*L2-d*d)/(2*L1*L2),-1,1)));
    g1.rotation.y=th;g2.rotation.z=a1-PI/2;g3.rotation.z=a2-a1+PI/2;g4.rotation.z=-a2;};
  A.grip=function(k){f1.position.x=.03+.03*k;f2.position.x=-.03-.03*k;};A.grip(1);
  return A;};

/* ---------- SCARA: up the column, out along arm 1, out along arm 2, down the quill ---------- */
R.scara=function(){
  var mW=std(0xeef1f5,.38,.15), mD=std(0x1a212c,.5,.5), mS=std(0xc4cdd9,.25,.9), mB=std(0x2f6fd0,.45,.2);
  var L1=.55,L2=.45,HC=.9,G=new THREE.Group();
  G.add(at(rbox(.56,.1,.56,.04,mD),0,.05,0));var col=rbox(.3,.3,HC-.1,.06,mW);col.rotation.x=PI/2;col.position.y=.1+(HC-.1)/2;G.add(col);
  G.add(at(box(.05,.4,.2,mB),-.17,.45,0));
  var g1=new THREE.Group();g1.position.y=HC;G.add(g1);
  g1.add(at(cyl(.17,.06,mD),0,.03,0));var a1=stadium(L1,.17,.13,.12,mW);a1.rotation.x=-PI/2;a1.position.y=.12;g1.add(a1);
  var g2=new THREE.Group();g2.position.set(L1,.18,0);g1.add(g2);
  g2.add(at(cyl(.12,.04,mD),0,.02,0));var a2=stadium(L2,.14,.11,.14,mW);a2.rotation.x=-PI/2;a2.position.y=.11;g2.add(a2);
  g2.add(at(rbox(.3,.18,.2,.05,mB),.12,.27,0));
  var hose=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0,.2,0),V(.02,.62,0),V(L1*.5,.78,0),V(L1-.02,.6,0),V(L1,.46,0)]),24,.03,8,false),mD);g1.add(hose);
  var g3=new THREE.Group();g3.position.x=L2;g2.add(g3);
  g3.add(at(cyl(.024,.74,mS),0,-.08,0));g3.add(at(cyl(.05,.03,mD),0,.29,0));g3.add(at(cyl(.045,.03,mD),0,-.46,0));g3.add(at(cyl(.03,.05,mB,null,.02),0,-.5,0));
  var tip=new THREE.Object3D();tip.position.y=-.525;g3.add(tip);
  var A={g:G,j:[g1,g2,g3],tip:tip,L1:L1,L2:L2};
  /* x, z: target in the horizontal plane (robot frame); y: tip height; s: elbow side (+1 or -1) */
  A.ik=function(x,y,z,s){var r2=x*x+z*z,c2=clamp((r2-L1*L1-L2*L2)/(2*L1*L2),-1,1),q2=(s||1)*Math.acos(c2),q1=Math.atan2(-z,x)-Math.atan2(L2*Math.sin(q2),L1+L2*Math.cos(q2));
    g1.rotation.y=q1;g2.rotation.y=q2;g3.position.y=clamp(y-(HC+.18)+.525,-.22,.1);};
  return A;};

/* ---------- delta: three arms and three pairs of parallel rods keep the plate level ---------- */
R.delta=function(){
  var mF=std(0xb8c2cf,.35,.7), mD=std(0x1a212c,.5,.5), mO=std(0xff6a13,.42,.25), mC=std(0x20262f,.3,.3), mS=std(0xc4cdd9,.25,.9);
  var HT=2.15,RB=.3,RP=.085,LA=.4,LF=.92,WR=.055,G=new THREE.Group();
  [[-.85,-.75],[.85,-.75],[.85,.75],[-.85,.75]].forEach(function(p){G.add(at(box(.08,HT+.1,.08,mF),p[0],(HT+.1)/2,p[1]));});
  G.add(at(box(1.78,.08,.08,mF),0,HT+.1,-.75));G.add(at(box(1.78,.08,.08,mF),0,HT+.1,.75));G.add(at(box(.08,.08,1.58,mF),-.85,HT+.1,0));G.add(at(box(.08,.08,1.58,mF),.85,HT+.1,0));
  G.add(at(box(.1,.06,1.5,mF),0,HT+.1,0));G.add(at(box(1.7,.06,.1,mF),0,HT+.1,0));
  G.add(at(cyl(.42,.1,mD,null,null,6),0,HT+.02,0));
  var C0=V(0,HT-.06,0),arms=[],plate=new THREE.Group();G.add(plate);
  plate.add(cyl(RP+.03,.03,mD,null,null,3));plate.add(at(cyl(.022,.1,mS),0,-.06,0));plate.add(at(cyl(.035,.03,mO,null,.022),0,-.12,0));
  var tip=new THREE.Object3D();tip.position.y=-.135;plate.add(tip);
  for(var i=0;i<3;i++){var ph=i*2*PI/3+PI/6,uu=V(Math.cos(ph),0,Math.sin(ph)),tt=V(-Math.sin(ph),0,Math.cos(ph)),g=new THREE.Group();
    g.position.copy(C0).addScaledVector(uu,RB);g.rotation.y=-ph;G.add(g);
    g.add(at(rbox(.2,.14,.16,.03,mO),-.1,.02,0));g.add(cyl(.05,.2,mD,'z'));
    var piv=new THREE.Group();g.add(piv);piv.add(stadium(LA,.05,.035,.05,mC));piv.add(at(cyl(.016,WR*2+.05,mS,'z'),LA,0,0));
    var r1=rod(.011,mS,8),r2=rod(.011,mS,8);G.add(r1);G.add(r2);arms.push({u:uu,t:tt,piv:piv,r1:r1,r2:r2});}
  var A={g:G,tip:tip,plate:plate,home:V(0,HT-.95,0)},E=V(),P=V(),a=V(),b=V();
  /* x, y, z: centre of the moving plate in the robot frame */
  A.ik=function(x,y,z){y+=.135;plate.position.set(x,y,z);var rx=x-C0.x,ry=y-C0.y,rz=z-C0.z;
    arms.forEach(function(m){var px=rx*m.u.x+rz*m.u.z+RP,py=rx*m.t.x+rz*m.t.z,pz=ry,lf=Math.sqrt(Math.max(.01,LF*LF-py*py)),cx=px-RB,d=Math.hypot(cx,pz)||1e-6;
      var k=(LA*LA-lf*lf+d*d)/(2*d),h=Math.sqrt(Math.max(0,LA*LA-k*k)),mx=RB+k*cx/d,mz=k*pz/d,ex=mx+h*(-pz)/d,ez=mz+h*cx/d,ex2=mx-h*(-pz)/d,ez2=mz-h*cx/d;
      if(ex2>ex){ex=ex2;ez=ez2;}
      m.piv.rotation.z=Math.atan2(ez,ex-RB);
      E.copy(C0).addScaledVector(m.u,ex);E.y+=ez;P.set(x,y,z).addScaledVector(m.u,RP);
      m.r1.setAB(a.copy(E).addScaledVector(m.t,WR),b.copy(P).addScaledVector(m.t,WR));m.r2.setAB(a.copy(E).addScaledVector(m.t,-WR),b.copy(P).addScaledVector(m.t,-WR));});};
  A.ik(0,HT-1.08,0);return A;};

/* ---------- Cartesian gantry: three straight axes ---------- */
R.gantry=function(){
  var mF=std(0xb8c2cf,.35,.7), mD=std(0x1a212c,.5,.5), mO=std(0xff6a13,.42,.25), mS=std(0xc4cdd9,.25,.9);
  var HY=1.5,G=new THREE.Group();
  [[-1.05,-.72],[1.05,-.72],[1.05,.72],[-1.05,.72]].forEach(function(p){G.add(at(box(.09,HY,.09,mF),p[0],HY/2,p[1]));});
  G.add(at(box(2.3,.1,.1,mF),0,HY+.05,-.72));G.add(at(box(2.3,.1,.1,mF),0,HY+.05,.72));
  var br=new THREE.Group();br.position.y=HY+.16;G.add(br);
  br.add(box(.14,.12,1.62,mO));br.add(at(box(.24,.1,.16,mD),0,-.04,-.72));br.add(at(box(.24,.1,.16,mD),0,-.04,.72));
  var car=new THREE.Group();br.add(car);car.add(at(rbox(.26,.24,.24,.04,mD),0,.02,0));
  var colm=new THREE.Group();car.add(colm);colm.add(at(box(.08,1.0,.08,mS),0,.1,0));colm.add(at(box(.2,.06,.12,mD),0,-.43,0));
  var f1=at(box(.025,.13,.08,mS),.07,-.52,0),f2=at(box(.025,.13,.08,mS),-.07,-.52,0);colm.add(f1);colm.add(f2);
  var tip=new THREE.Object3D();tip.position.y=-.56;colm.add(tip);
  var A={g:G,tip:tip};
  A.ik=function(x,y,z){br.position.x=clamp(x,-.95,.95);car.position.z=clamp(z,-.6,.6);colm.position.y=clamp(y-(HY+.16)+.56,-.5,.3);};
  A.grip=function(k){f1.position.x=.04+.035*k;f2.position.x=-.04-.035*k;};A.grip(1);A.ik(0,.9,0);return A;};

/* ---------- autonomous mobile robot, with an optional shelf pod on its back ---------- */
R.amr=function(o){o=o||{};
  var mW=std(o.color==null?0xe6eaef:o.color,.4,.15), mD=std(0x161b23,.55,.4), mL=glow(o.led==null?0x3cc8ff:o.led,1), mT=std(0x0a0c10,.9,0), G=new THREE.Group();
  G.add(at(rbox(1.0,.62,.16,.07,mD),0,.13,0).rotateX(PI/2));G.add(at(rbox(.96,.58,.07,.03,mW),0,.245,0).rotateX(PI/2));
  var led=at(rbox(1.01,.63,.02,.07,mL),0,.2,0);led.rotation.x=PI/2;G.add(led);
  [.2,-.2].forEach(function(z){G.add(at(cyl(.085,.06,mT,'z'),0,.085,z*1.4));});
  [[.42,.27],[-.42,-.27]].forEach(function(p){G.add(at(cyl(.055,.07,mD),p[0],.25,p[1]));G.add(at(cyl(.057,.02,mL),p[0],.25,p[1]));});
  var lift=at(cyl(.2,.03,mD),0,.295,0);G.add(lift);
  var A={g:G,led:mL,lift:lift};
  if(o.pod){var p=new THREE.Group(),mP=std(0x2a3340,.6,.4),cols=[0xffb23e,0x3cc8ff,0x2fe0a8,0xff7a1a,0xd9dee6,0x8a6cff];p.position.y=.31;G.add(p);
    [[.4,.3],[-.4,.3],[.4,-.3],[-.4,-.3]].forEach(function(q){p.add(at(box(.04,1.5,.04,mP),q[0],.75,q[1]));});
    for(var s=0;s<4;s++){p.add(at(box(.86,.03,.66,mP),0,.02+s*.46,0));if(s<3)for(var k=0;k<3;k++){var w=.18+((s*3+k)%3)*.03;p.add(at(box(w,.2+((s+k)%2)*.1,.4,std(cols[(s*3+k)%6],.7,0)),-.28+k*.28,.15+s*.46+((s+k)%2)*.05,0));}}
    A.pod=p;}
  return A;};

/* ---------- quadrotor ---------- */
R.drone=function(){
  var mB=std(0x20262f,.4,.4), mW=std(0xe6eaef,.4,.1), mS=std(0xc4cdd9,.25,.9), G=new THREE.Group(), props=[], discs=[];
  G.add(rbox(.34,.2,.09,.04,mB).rotateX(PI/2));var top=sph(.12,mW);top.scale.set(1.25,.45,.8);top.position.y=.04;G.add(top);
  var cam=sph(.045,std(0x0a0c10,.15,.6));cam.position.set(.17,-.05,0);G.add(cam);G.add(at(box(.05,.05,.08,mB),.14,-.03,0));
  var P=[[.27,-.27],[.27,.27],[-.27,.27],[-.27,-.27]],dir=[1,-1,1,-1];
  P.forEach(function(p,i){var a=rod(.016,mB,8);a.setAB(V(0,0,0),V(p[0],.01,p[1]));G.add(a);G.add(at(cyl(.034,.06,mS),p[0],.03,p[1]));
    var pr=new THREE.Group();pr.position.set(p[0],.07,p[1]);pr.add(box(.34,.006,.03,mB));pr.add(box(.03,.006,.34,mB));G.add(pr);props.push(pr);
    var d=new THREE.Mesh(new THREE.CircleGeometry(.175,28),new THREE.MeshBasicMaterial({color:0x9fd8ff,transparent:true,opacity:.14,side:THREE.DoubleSide,depthWrite:false}));d.rotation.x=-PI/2;d.position.set(p[0],.072,p[1]);G.add(d);discs.push(d);
    G.add(at(sph(.016,glow(i<2?0x2fe0a8:0xff5a5a,1.4),10),p[0],-.005,p[1]));});
  [.1,-.1].forEach(function(z){var s=rod(.01,mB,6);s.setAB(V(-.14,-.13,z),V(.14,-.13,z));G.add(s);[-.1,.1].forEach(function(x){var l=rod(.008,mB,6);l.setAB(V(x,-.03,z*.8),V(x,-.13,z));G.add(l);});});
  var A={g:G,props:props,discs:discs,dir:dir,w:[1,1,1,1]};
  A.spin=function(dt){for(var i=0;i<4;i++){props[i].rotation.y+=dir[i]*A.w[i]*38*dt;discs[i].material.opacity=.07+.13*clamp(A.w[i],0,1.6);}};
  return A;};

/* ---------- four-legged robot: all four knees point backwards ---------- */
R.quad=function(){
  var mY=std(0xf7c21a,.45,.15), mD=std(0x14181e,.5,.45), mS=std(0xc4cdd9,.25,.9), LU=.34,LL=.36,HB=.56,G=new THREE.Group(),body=new THREE.Group(),legs=[];
  G.add(body);body.position.y=HB;
  body.add(rbox(.86,.2,.28,.07,mY));body.add(at(rbox(.14,.17,.25,.04,mD),.47,-.005,0));body.add(at(rbox(.1,.15,.24,.04,mD),-.46,0,0));
  body.add(at(box(.6,.02,.05,mD),0,.11,.1));body.add(at(box(.6,.02,.05,mD),0,.11,-.1));
  [[.3,.2],[.3,-.2],[-.3,.2],[-.3,-.2]].forEach(function(p,i){var hip=new THREE.Group();hip.position.set(p[0],-.02,p[1]);body.add(hip);
    hip.add(cyl(.065,.09,mD,'z'));var up=stadium(LU,.06,.04,.055,mD);up.rotation.z=-PI/2;hip.add(up);
    var kn=new THREE.Group();kn.position.y=-LU;hip.add(kn);kn.add(cyl(.042,.07,mD,'z'));kn.add(at(cyl(.02,LL,mS),0,-LL/2,0));kn.add(at(sph(.038,mD,12),0,-LL,0));
    legs.push({hip:hip,kn:kn,x:p[0],ph:(i===0||i===3)?0:.5});});
  var A={g:G,body:body,legs:legs,stride:.26,period:.9};
  /* p: gait phase 0..1; k: 0 = standing, 1 = full trot */
  A.gait=function(p,k){k=k==null?1:k;body.position.y=HB+.008*Math.sin(p*4*PI)*k;body.rotation.z=.012*Math.sin(p*2*PI)*k;
    legs.forEach(function(l){var q=(p+l.ph)%1,fx,fy=0,S=A.stride*k;if(q<.5){fx=S/2-S*(q/.5);}else{var w=(q-.5)/.5;fx=-S/2+S*(.5-.5*Math.cos(PI*w));fy=.075*Math.sin(PI*w)*k;}
      var a=leg2(fx-.03,-(HB-.02-.038)+fy,LU,LL,1);l.hip.rotation.z=a[0];l.kn.rotation.z=a[1];});};
  A.gait(0,0);return A;};

/* ---------- humanoid, 1.72 m, facing +x ---------- */
R.humanoid=function(o){o=o||{};
  var mW=std(o.color==null?0xe8ecf1:o.color,.42,.12), mD=std(0x14181e,.5,.4), mV=std(0x05070a,.12,.7), mA=std(o.accent==null?0xff7a1a:o.accent,.45,.2);
  var LT=.43,LS=.43,HH=.92,G=new THREE.Group(),up=new THREE.Group();G.add(up);up.position.y=HH;
  var torso=new THREE.Group();up.add(torso);
  torso.add(at(rbox(.2,.15,.3,.06,mD),0,.03,0));torso.add(at(cyl(.1,.12,mD),0,.16,0));
  torso.add(at(rbox(.23,.36,.38,.09,mW),.005,.4,0));torso.add(at(rbox(.02,.12,.2,.01,mA),.122,.44,0));torso.add(at(rbox(.14,.26,.26,.05,mD),-.1,.4,0));
  torso.add(at(cyl(.045,.08,mD),0,.62,0));
  var head=new THREE.Group();head.position.y=.76;torso.add(head);head.add(rbox(.2,.23,.19,.085,mW));head.add(at(rbox(.04,.13,.165,.02,mV),.09,.01,0));
  function arm(z){var s=new THREE.Group();s.position.set(0,.53,z);torso.add(s);s.add(sph(.07,mD,16));s.add(at(cyl(.045,.25,mW,null,.052),0,-.16,0));
    var e=new THREE.Group();e.position.y=-.3;s.add(e);e.add(sph(.05,mD,14));e.add(at(cyl(.036,.23,mW,null,.045),0,-.14,0));e.add(at(rbox(.05,.12,.08,.02,mD),0,-.31,0));return {s:s,e:e};}
  function leg(z){var h=new THREE.Group();h.position.set(0,0,z);up.add(h);h.add(sph(.075,mD,16));h.add(at(cyl(.058,LT-.1,mW,null,.075),0,-LT/2,0));
    var k=new THREE.Group();k.position.y=-LT;h.add(k);k.add(cyl(.058,.1,mD,'z'));k.add(at(cyl(.042,LS-.1,mW,null,.058),0,-LS/2,0));
    var f=new THREE.Group();f.position.y=-LS;k.add(f);f.add(sph(.045,mD,12));f.add(at(rbox(.25,.055,.1,.025,mD),.055,-.04,0));return {h:h,k:k,f:f};}
  var aL=arm(.25),aR=arm(-.25),lL=leg(.1),lR=leg(-.1),A={g:G,up:up,torso:torso,head:head,arms:[aL,aR],legs:[lL,lR],stride:.55,period:1.1};
  function setLeg(l,dx,dy){var a=leg2(dx,dy,LT,LS,-1);l.h.rotation.z=a[0];l.k.rotation.z=a[1];l.f.rotation.z=-(a[0]+a[1]);}
  /* p: phase 0..1; k: 0 standing, 1 walking; run: 0..1 adds a flight phase and a forward lean */
  A.gait=function(p,k,run){k=k==null?1:k;run=run||0;var S=A.stride*k*(1+.9*run),lift=(.07+.12*run)*k,st=.6-.22*run,drop=.035+.05*run*k,hy=HH-drop-.004*k+(.014+.03*run)*k*Math.cos(p*4*PI);
    up.position.y=hy;torso.rotation.z=-(.03*k+.2*run*k);
    [lL,lR].forEach(function(l,i){var q=(p+i*.5)%1,fx,fy=0;if(q<st){fx=S/2-S*(q/st);}else{var w=(q-st)/(1-st);fx=-S/2+S*(.5-.5*Math.cos(PI*w));fy=lift*Math.sin(PI*w);}
      setLeg(l,fx,-(hy-.065)+fy);});
    var sw=Math.cos(p*2*PI)*(.45+.5*run)*k;aL.s.rotation.z=-sw;aR.s.rotation.z=sw;aL.e.rotation.z=.25*k+.9*run*k+Math.max(0,-sw)*.4;aR.e.rotation.z=.25*k+.9*run*k+Math.max(0,sw)*.4;
    aL.s.rotation.x=-.07;aR.s.rotation.x=.07;};
  A.gait(0,0);return A;};

/* ---------- Unimate, 1961: a turret, a tilting boom, and an arm that slides in and out ---------- */
R.unimate=function(){
  var mB=std(0xd9d6c4,.55,.1), mG=std(0x56616d,.5,.4), mS=std(0xc4cdd9,.22,.9), mD=std(0x171b22,.6,.3), G=new THREE.Group();
  G.add(at(box(1.62,.1,1.02,mD),-.1,.05,0));G.add(at(rbox(1.56,.72,.96,.05,mB),-.1,.46,0));
  G.add(at(box(.5,.3,.02,mG),-.5,.5,.49));for(var i=0;i<4;i++)G.add(at(cyl(.022,.02,glow([0xff5a5a,0xffc53d,0x2fe0a8,0x3cc8ff][i],.9),'z'),-.68+i*.12,.56,.5));
  var g1=new THREE.Group();g1.position.set(.25,.82,0);G.add(g1);
  g1.add(at(cyl(.36,.12,mG),0,.06,0));g1.add(at(box(.46,.52,.06,mG),0,.38,.31));g1.add(at(box(.46,.52,.06,mG),0,.38,-.31));
  var g2=new THREE.Group();g2.position.y=.46;g1.add(g2);
  g2.add(cyl(.07,.7,mS,'z'));g2.add(at(rbox(1.15,.34,.5,.05,mB),.12,0,0));g2.add(at(box(.3,.26,.4,mG),-.56,0,0));
  var g3=new THREE.Group();g2.add(g3);
  g3.add(at(cyl(.045,1.5,mS,'x'),.62,0,.13));g3.add(at(cyl(.045,1.5,mS,'x'),.62,0,-.13));g3.add(at(rbox(.16,.22,.38,.03,mG),1.4,0,0));
  var f1=at(box(.26,.045,.05,mD),1.6,0,.1),f2=at(box(.26,.045,.05,mD),1.6,0,-.1);g3.add(f1);g3.add(f2);
  var tip=new THREE.Object3D();tip.position.set(1.66,0,0);g3.add(tip);
  var A={g:G,tip:tip,j:[g1,g2,g3]};
  A.pose=function(yaw,pitch,ext,open){g1.rotation.y=yaw;g2.rotation.z=pitch;g3.position.x=ext;f1.position.z=.045+.07*open;f2.position.z=-.045-.07*open;};
  A.pose(0,0,0,1);return A;};

/* ---------- person for scale and for the safety demo ---------- */
R.person=function(c){
  var m=std(c==null?0x3b7d86:c,.8,0), mH=std(0xf0d8c0,.7,0), G=new THREE.Group(), legs=[], arms=[];
  [.09,-.09].forEach(function(z){var h=new THREE.Group();h.position.set(0,.9,z);G.add(h);h.add(at(cyl(.07,.86,m,null,.085),0,-.43,0));h.add(at(rbox(.24,.06,.1,.02,std(0x14181e,.6,0)),.05,-.87,0));legs.push(h);});
  G.add(at(rbox(.24,.58,.4,.09,m),0,1.2,0));G.add(at(cyl(.045,.08,mH),0,1.52,0));G.add(at(sph(.105,mH),0,1.65,0));
  var helm=sph(.112,std(0xffc53d,.4,.1));helm.scale.set(1,.62,1);helm.position.set(0,1.71,0);G.add(helm);
  [.25,-.25].forEach(function(z){var s=new THREE.Group();s.position.set(0,1.44,z);G.add(s);s.add(at(cyl(.045,.6,m,null,.055),0,-.3,0));arms.push(s);});
  var A={g:G};A.walk=function(p,k){var s=Math.sin(p*2*PI)*.45*k;legs[0].rotation.z=s;legs[1].rotation.z=-s;arms[0].rotation.z=-s*.8;arms[1].rotation.z=s*.8;};return A;};

/* ---------- robot vacuum cleaner ---------- */
R.vacuum=function(){
  var mW=std(0xe6eaef,.35,.15), mD=std(0x14181e,.5,.4), G=new THREE.Group();
  G.add(at(cyl(.17,.07,mD),0,.045,0));G.add(at(cyl(.165,.02,mW),0,.09,0));G.add(at(cyl(.05,.035,mD),-.04,.115,0));
  var eye=at(box(.02,.012,.05,glow(0x3cc8ff,1.5)),.012,.118,0);var tur=new THREE.Group();tur.position.set(-.04,0,0);tur.add(at(eye,.045,.118,0));G.add(tur);
  G.add(at(box(.012,.02,.12,glow(0x2fe0a8,1.2)),.165,.06,0));
  return {g:G,turret:tur};};
})();
