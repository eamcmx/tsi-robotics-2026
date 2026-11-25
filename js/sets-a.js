/* Scenes, part A: the arm, the cam automaton, the timeline, Watt's governor, the assembly line, Unimate, sense-think-act. */
(function(){
'use strict';
var u=RX.u,R=RX.robots,$=RX.$,$$=RX.$$,at=u.at,std=u.std,glow=u.glow,cyl=u.cyl,box=u.box,sph=u.sph,rbox=u.rbox,rod=u.rod,clamp=u.clamp,ease=u.ease,lerp=u.lerp,PI=Math.PI;
function V(x,y,z){return new THREE.Vector3(x,y,z);}
function seg01(t,a,b){return clamp((t-a)/(b-a),0,1);}
function txt(id,s){var e=$(id);if(e&&e.textContent!==s)e.textContent=s;}
var steel=std(0xaeb8c4,.3,.9), iron=std(0x232a34,.6,.5), dark=std(0x161b23,.55,.4), brass=std(0xc9a24a,.3,.85), wood=std(0x6b4a2e,.8,0);

/* =============== the industrial arm: title, anatomy, six axes =============== */
(function(){
  var A,cube,mode='loop',mq=[0,0,0,0,0,0],demo=false,cab,anc={},RAD=2.0,AN=.62,TOP=.76,HALF=5.6;
  var sg=[[0,.9,'down'],[.9,1.2,'grip'],[1.2,2.0,'up'],[2.0,3.7,'move'],[3.7,4.5,'down2'],[4.5,4.8,'rel'],[4.8,5.6,'up2']];
  function cyp(a,y){return V(RAD*Math.cos(a),y,RAD*Math.sin(a));}
  var w=V();
  function pick(t){var n=Math.floor(t/HALF),q=t-n*HALF,src=(n%2?-AN:AN),dst=-src,a=src,y=TOP+.8,held=false,gr=1;
    for(var i=0;i<sg.length;i++){var s=sg[i];if(q>=s[0]&&q<=s[1]){var k=ease((q-s[0])/(s[1]-s[0]));
      if(s[2]==='down'){y=TOP+.8*(1-k);}else if(s[2]==='grip'){y=TOP;held=true;gr=1-k;}else if(s[2]==='up'){y=TOP+.8*k;held=true;gr=0;}
      else if(s[2]==='move'){a=src+(dst-src)*k;y=TOP+.8+.3*Math.sin(PI*k);held=true;gr=0;}else if(s[2]==='down2'){a=dst;y=TOP+.8*(1-k);held=true;gr=0;}
      else if(s[2]==='rel'){a=dst;y=TOP;gr=k;}else{a=dst;y=TOP+.8*k;}break;}}
    var p=cyp(a,y);A.ik(p.x,p.y,p.z);A.grip(.25+.75*gr);
    if(held){A.g.updateMatrixWorld(true);A.tip.getWorldPosition(w);cube.position.set(w.x,w.y-.02,w.z);}else{var c=cyp(q<1?src:dst,0);cube.position.set(c.x,TOP-.02,c.z);}}
  RX.addSet('arm',{
    build:function(g){u.floor(g);A=R.arm();g.add(A.g);
      [AN,-AN].forEach(function(a){var p=cyp(a,0);g.add(at(rbox(.6,.62,.6,.05,dark),p.x,.31,p.z));g.add(at(box(.64,.02,.64,steel),p.x,.63,p.z));});
      cube=rbox(.22,.22,.22,.03,glow(0x2fe0a8,.55));g.add(cube);
      cab=new THREE.Group();cab.position.set(-2.5,0,-.9);cab.rotation.y=.75;g.add(cab);
      cab.add(at(rbox(.72,1.3,.5,.03,std(0xd9dee6,.5,.2)),0,.65,0));cab.add(at(box(.54,.95,.012,std(0xb7c0cc,.5,.3)),0,.68,.256));
      cab.add(at(box(.2,.13,.014,std(0x0c1016,.2,.3,{emissive:0x1a6fb0,emissiveIntensity:.6})),.1,1.0,.264));
      [0xff5a5a,0xffc53d,0x2fe0a8].forEach(function(c,i){cab.add(at(cyl(.025,.02,glow(c,1),'z'),-.18+i*.07,1.02,.262));});
      var pend=new THREE.Group();pend.position.set(.52,.95,.1);pend.rotation.set(-.3,0,.12);cab.add(pend);pend.add(rbox(.26,.19,.04,.02,dark));pend.add(at(box(.17,.11,.005,std(0x0c1016,.2,.3,{emissive:0x2c8fd0,emissiveIntensity:.7})),-.02,0,.022));pend.add(at(cyl(.022,.03,glow(0xff3b3b,.9),'z'),.1,.05,.03));
      function A3(par,x,y,z){var o=new THREE.Object3D();o.position.set(x,y,z);par.add(o);return o;}
      anc.base=A3(A.g,-.42,.2,0);anc.a1=A3(A.j[0],0,.2,.4);anc.a2=A3(A.j[1],0,0,.36);anc.ua=A3(A.j[1],0,.42,.34);anc.a3=A3(A.j[2],0,0,-.3);anc.a4=A3(A.j[3],.62,.14,0);
      anc.a5=A3(A.j[4],0,.12,0);anc.a6=A3(A.j[5],.11,-.2,0);anc.tip=A.tip;anc.cab=A3(cab,0,1.34,0);anc.pend=A3(pend,.14,0,0);
      u.shadow(g);},
    enter:function(view){mode=(view==='armQ')?'manual':(view==='armA'?'pose':'loop');demo=false;},
    update:function(t){
      if(mode==='loop')pick(t);
      else{if(mode==='pose')A.setQ([.35+.1*Math.sin(t*.5),-.28,.18,0,.55,0]);
        else{if(demo){var i=Math.floor(t/3)%6,amp=[1.2,.6,.7,2.2,1.2,2.6][i];for(var k=0;k<6;k++)mq[k]*=.94;mq[i]=amp*Math.sin((t%3)/3*2*PI);syncSliders();}A.setQ(mq);}
        A.grip(1);var c=cyp(AN,0);cube.position.set(c.x,TOP-.02,c.z);}}});
  RX.dbg=RX.dbg||{};RX.dbg.arm=function(){A.g.updateMatrixWorld(true);return A.tip.getWorldPosition(new THREE.Vector3()).toArray();};
  function syncSliders(){$$('#s-dof input[type=range]').forEach(function(e){var i=+e.dataset.j;e.value=Math.round(mq[i]*180/PI);e.nextElementSibling.textContent=e.value+'°';});}
  $$('#s-dof input[type=range]').forEach(function(e){e.addEventListener('input',function(){demo=false;$('#dof-demo')&&$('#dof-demo').classList.remove('on');mq[+e.dataset.j]=+e.value*PI/180;e.nextElementSibling.textContent=e.value+'°';});});
  var db=$('#dof-demo');if(db)db.addEventListener('click',function(){demo=!demo;db.classList.toggle('on',demo);});
  var hb=$('#dof-home');if(hb)hb.addEventListener('click',function(){demo=false;db&&db.classList.remove('on');mq=[0,0,0,0,0,0];syncSliders();});
  RX.view('hero',{set:'arm',pos:[5.0,2.7,7.4],tgt:[.4,1.35,0],off:[.22,-.02],amp:.1,fog:[24,60]});
  RX.view('heroDim',{set:'arm',pos:[7.5,3.4,9.6],tgt:[.5,1.35,0],off:[.26,-.02],amp:.08,shade:.74,fog:[24,60]});
  RX.view('heroEnd',{set:'arm',pos:[4.6,2.4,6.8],tgt:[.4,1.45,0],off:[.24,-.03],amp:.12,fog:[24,60]});
  RX.view('armA',{set:'arm',pos:[1.6,2.4,8.2],tgt:[-.1,1.45,0],off:[.17,-.03],amp:.015,shadeL:.55,fog:[24,60]});
  RX.view('armQ',{set:'arm',pos:[4.9,2.9,7.6],tgt:[.4,1.5,0],off:[.25,0],amp:.03,fog:[24,60]});
  function s1(k){return k>=1;}function s2(k){return k>=2;}
  RX.label('Base','tag l',anc.base,['armA'],{when:s1});RX.label('Upper arm<small>a link</small>','tag r',anc.ua,['armA'],{when:s1});
  RX.label('End effector<small>here: a gripper</small>','tag b',anc.tip,['armA'],{when:s1});RX.label('Controller<small>the robot\'s computer</small>','tag',anc.cab,['armA'],{when:s1});
  RX.label('Teach pendant','tag b',anc.pend,['armA'],{when:s1});
  RX.label('1','num',anc.a1,['armA'],{when:s2});RX.label('2','num',anc.a2,['armA'],{when:s2});RX.label('3','num',anc.a3,['armA'],{when:s2});
  RX.label('4','num',anc.a4,['armA'],{when:s2});RX.label('5','num',anc.a5,['armA'],{when:s2});RX.label('6','num',anc.a6,['armA'],{when:s2});
})();

/* =============== the cam automaton: the shape of the cam is the program =============== */
(function(){
  var camX,camY,folX,folY,rail,xbar,riser,pen,trace,traceN=360,th=0,turns=0,shape='circle',arm1,arm2,push,pul=[];
  var R0=.55,SC=.26,SH=1.0,AX=SH+.14,XL=-.95,XR=.95,ZC=.12,BX=0,BY=3.35,BZ=-.95,TOP=AX+R0+1.06,PV=V(XL-.8,TOP,ZC),QY=TOP+.8,a=V(),b=V();
  var F={circle:[function(t){return Math.cos(t);},function(t){return Math.sin(t);}],
    eight:[function(t){return Math.sin(t);},function(t){return Math.sin(2*t);}],
    star:[function(t){return .62*Math.cos(t)+.38*Math.cos(4*t);},function(t){return .62*Math.sin(t)-.38*Math.sin(4*t);}],
    heart:[function(t){return Math.pow(Math.sin(t),3);},function(t){return (13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/16+.15;}]};
  /* the follower rides on top of the cam, so the profile at angle ph is the lift wanted when the cam has turned by pi/2 - ph */
  function camGeo(f,sgn){var s=new THREE.Shape(),n=200;for(var i=0;i<=n;i++){var ph=i/n*2*PI,r=R0+SC*sgn*f(PI/2-ph),x=r*Math.cos(ph),y=r*Math.sin(ph);if(i)s.lineTo(x,y);else s.moveTo(x,y);}
    var hole=new THREE.Path();hole.absarc(0,0,.06,0,2*PI,true);s.holes.push(hole);var g=new THREE.ExtrudeGeometry(s,{depth:.1,bevelEnabled:false,curveSegments:4});g.translate(0,0,-.05);return g;}
  function setShape(n){shape=n;var f=F[n];camX.geometry.dispose();camX.geometry=camGeo(f[0],-1);camY.geometry.dispose();camY.geometry=camGeo(f[1],1);
    var p=[];for(var i=0;i<=traceN;i++){var t=i/traceN*2*PI;p.push(BX+SC*f[0](t),BY+SC*f[1](t),BZ+.03);}
    trace.geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(p),3));trace.geometry.setDrawRange(0,0);turns=0;th=0;
    $$('#s-cam .btn[data-shape]').forEach(function(bn){bn.classList.toggle('on',bn.dataset.shape===n);});}
  RX.addSet('cam',{
    build:function(g){u.floor(g,{c1:0x6b5a3a,c2:0x2a2418,op:.35});
      var bX=std(0xf2c14a,.4,.3),bY=std(0xe88f3c,.4,.3);
      g.add(at(rbox(4.0,.14,2.2,.04,wood),-.2,.07,-.25));
      [XL,XR].forEach(function(x,i){g.add(at(rbox(.24,AX+.1,.14,.03,iron),x,(AX+.1)/2+.14,-.42));g.add(at(cyl(.05,.72,steel,'z'),x,AX,-.08));
        var pl=cyl(.17,.06,iron,'z');pl.position.set(x,AX,-.28);g.add(pl);pul.push(pl);g.add(at(box(.42,.06,.2,iron),x,TOP-.42,-.02));g.add(at(box(.08,TOP-.42,.08,iron),x+(i?.2:-.2),(TOP-.42)/2+.14,-.42));g.add(at(box(.08,.06,.44,iron),x+(i?.2:-.2),TOP-.42,-.22));});
      [.17,-.17].forEach(function(dy){var r=rod(.012,std(0x2a1d14,.9,0),6);r.setAB(V(XL,AX+dy,-.28),V(XR,AX+dy,-.28));g.add(r);});
      var crank=new THREE.Group();crank.position.set(XR,AX,-.5);g.add(crank);crank.add(at(box(.06,.36,.04,iron),0,.18,0));crank.add(at(cyl(.03,.2,wood,'z'),0,.36,-.1));this.crank=crank;
      camX=new THREE.Mesh(new THREE.BufferGeometry(),bX);camX.position.set(XL,AX,ZC);g.add(camX);
      camY=new THREE.Mesh(new THREE.BufferGeometry(),bY);camY.position.set(XR,AX,ZC);g.add(camY);
      function fol(x){var f=new THREE.Group();f.position.set(x,0,ZC);f.add(at(cyl(.06,.09,steel,'z'),0,.06,0));f.add(at(cyl(.024,1.0,steel),0,.56,0));g.add(f);return f;}
      folX=fol(XL);folY=fol(XR);
      g.add(at(box(2.5,2.1,.04,std(0xf4ecd9,.9,0)),BX,BY,BZ));g.add(at(box(2.62,2.22,.03,wood),BX,BY,BZ-.035));g.add(at(box(.1,BY+1.1,.1,iron),-1.36,(BY+1.1)/2,BZ-.1));g.add(at(box(.1,BY+1.1,.1,iron),1.36,(BY+1.1)/2,BZ-.1));
      rail=box(2.4,.04,.04,steel);rail.position.set(BX,BY,BZ+.1);g.add(rail);xbar=box(.04,2.0,.04,steel);xbar.position.set(BX,BY,BZ+.15);g.add(xbar);
      riser=rod(.02,iron,8);g.add(riser);var ri2=rod(.02,iron,8);g.add(ri2);this.ri2=ri2;
      pen=new THREE.Group();g.add(pen);pen.add(box(.11,.11,.12,iron));pen.add(at(cyl(.014,.1,std(0x101010,.4,.2),'z'),0,0,-.08));
      trace=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x1d3f9a}));g.add(trace);
      arm1=rod(.026,bX,8);arm2=rod(.026,bX,8);push=rod(.016,steel,8);g.add(arm1);g.add(arm2);g.add(push);
      g.add(at(cyl(.05,.2,iron,'z'),PV.x,PV.y,PV.z));g.add(at(box(.1,PV.y-.14,.1,iron),PV.x,(PV.y-.14)/2+.14,PV.z-.12));
      u.shadow(g);setShape('circle');},
    enter:function(view,st,fresh){if(fresh){trace.geometry.setDrawRange(0,0);turns=0;th=0;}},
    update:function(t,dt){var f=F[shape];th+=dt*.85;if(th>=2*PI){th-=2*PI;turns++;}
      camX.rotation.z=th;camY.rotation.z=th;this.crank.rotation.z=th;pul[0].rotation.z=th;pul[1].rotation.z=th;
      var fx=f[0](th),fy=f[1](th),dX=-SC*fx,dY=SC*fy;folX.position.y=AX+R0+dX;folY.position.y=AX+R0+dY;
      var px=BX+SC*fx,py=BY+SC*fy;rail.position.y=py;xbar.position.x=px;pen.position.set(px,py,BZ+.13);
      riser.setAB(a.set(XR,TOP+dY,ZC),b.set(XR,TOP+dY,BZ+.1));this.ri2.setAB(a.set(XR,TOP+dY,BZ+.1),b.set(XR,py,BZ+.1));
      arm1.setAB(PV,a.set(XL,TOP+dX,ZC));arm2.setAB(PV,a.set(PV.x-dX,QY,ZC));push.setAB(a.set(PV.x-dX,QY,ZC),b.set(px,QY,BZ+.15));
      trace.geometry.setDrawRange(0,turns?traceN+1:Math.floor(th/(2*PI)*traceN)+1);}});
  $$('#s-cam .btn[data-shape]').forEach(function(bn){bn.addEventListener('click',function(){setShape(bn.dataset.shape);});});
  RX.hooks['s-cam']={key:function(k){var n=['circle','eight','star','heart'][+k-1];if(n){setShape(n);return true;}}};
  RX.camSet={shape:function(){return shape;},pen:function(){return pen.position.toArray();},sig:function(){var a=camX.geometry.attributes.position.array,h=0;for(var i=0;i<a.length;i+=7)h+=a[i]*(i%13+1);return h;},drawn:function(){return trace.geometry.drawRange.count;}};
  RX.view('camWide',{set:'cam',pos:[4.6,3.4,9.6],tgt:[-.2,2.3,-.3],off:[.23,-.01],amp:.07,bg:0x0d0a07,fog:[24,58]});
  RX.view('cam',{set:'cam',pos:[2.9,3.1,8.4],tgt:[-.25,2.35,-.3],off:[.24,0],amp:.04,bg:0x0d0a07,fog:[24,58]});
  RX.view('camDim',{set:'cam',pos:[5.6,3.6,10.6],tgt:[-.2,2.3,-.3],off:[.26,-.01],amp:.06,shade:.78,bg:0x0d0a07,fog:[24,58]});
})();

/* =============== timeline of the industrial revolutions =============== */
(function(){
  var pins=[],icons=[],t0=-99,EV=[[-9,'1780','Steam and machines'],[-4.5,'1870','Electricity and the assembly line'],[0,'1970','Electronics, computers and robots'],[4.5,'2011','Industry 4.0: connected factories'],[9,'2021','Industry 5.0: people at the centre']],
    COL=[0xc9a24a,0xffc53d,0xff7a1a,0x3cc8ff,0x2fe0a8];
  RX.addSet('tl',{
    build:function(g){u.floor(g,{op:.28});
      var rib=at(box(27,.06,1.3,std(0x15263c,.7,.1)),0,.03,0);rib.receiveShadow=true;g.add(rib);
      var pts=[];for(var i=0;i<=60;i++)pts.push(V(-13.5+27*i/60,.07,0));var ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineDashedMaterial({color:0x6fb8ff,dashSize:.45,gapSize:.35}));ln.computeLineDistances();g.add(ln);
      EV.forEach(function(e,i){var p=new THREE.Group(),m=glow(COL[i],.35);p.add(at(sph(.42,m),0,1.15,0));var c=new THREE.Mesh(new THREE.ConeGeometry(.3,.8,24),m);c.rotation.x=PI;c.position.y=.48;p.add(c);p.position.set(e[0],0,0);g.add(p);pins.push(p);
        RX.label('<b>'+e[1]+'</b><span>'+e[2]+'</span>','tlc',V(e[0],0,1.5),['tl'],{});
        var ic=new THREE.Group();ic.position.set(e[0],0,-2.8);g.add(ic);icons.push(ic);});
      var fw=new THREE.Group();fw.position.y=1.5;icons[0].add(fw);fw.add(new THREE.Mesh(new THREE.TorusGeometry(1.0,.1,12,48),iron));fw.add(cyl(.16,.3,brass,'z'));for(var s=0;s<6;s++){var sp=box(.07,1.9,.07,iron);sp.rotation.z=s*PI/6;fw.add(sp);}
      icons[0].add(at(box(.5,.5,.9,dark),0,.25,0));this.fw=fw;
      var b=icons[1];b.add(at(sph(.55,new THREE.MeshStandardMaterial({color:0xfff0b0,emissive:0xffc53d,emissiveIntensity:1.2,transparent:true,opacity:.92}),28),0,1.8,0));b.add(at(cyl(.24,.4,steel),0,1.1,0));b.add(at(cyl(.3,.9,dark,null,.12),0,.45,0));
      var a=R.arm();a.g.scale.setScalar(.8);a.g.rotation.y=-.9;icons[2].add(a.g);a.ik(1.6,1.2,.6);this.arm=a;
      var net=new THREE.Group();net.position.y=1.6;icons[3].add(net);net.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.0,1),new THREE.MeshBasicMaterial({color:0x3cc8ff,wireframe:true,transparent:true,opacity:.7})));
      net.add(new THREE.Points(new THREE.IcosahedronGeometry(1.0,1),new THREE.PointsMaterial({color:0xffffff,size:.16,map:u.DISC,transparent:true,alphaTest:.3})));this.net=net;
      var pr=R.person();pr.g.position.set(-.55,0,0);pr.g.rotation.y=-.3;icons[4].add(pr.g);var cb=R.cobot({cap:0x2fe0a8});cb.g.position.set(.55,0,0);cb.g.scale.setScalar(1.25);icons[4].add(cb.g);cb.ik(-.5,.8,.25);this.cb=cb;
      u.shadow(g);},
    enter:function(view,st,fresh){if(fresh)t0=performance.now()/1000;},
    update:function(t){var now=performance.now()/1000;pins.forEach(function(p,i){var q=clamp((now-t0-.4-i*.18)/.7,0,1),b=1-Math.pow(1-q,3);p.position.y=(1-b)*6+Math.sin(t*1.6+i)*.05*b;p.scale.setScalar(.001+b);icons[i].scale.setScalar(.001+b*1.25);});
      this.fw.rotation.z=-t*1.2;this.net.rotation.y=t*.4;this.net.rotation.x=t*.17;this.arm.ik(1.5+.3*Math.sin(t*.9),1.1+.4*Math.sin(t*.6),.7*Math.sin(t*.7));this.cb.ik(-.5+.1*Math.sin(t),.7+.15*Math.sin(t*.8),.25*Math.sin(t*.6));}});
  RX.view('tl',{set:'tl',pos:[0,7.4,21.5],tgt:[0,1.2,-.4],off:[0,.03],amp:.02,shadeL:0,fog:[40,90]});
  RX.view('tlDark',{set:'tl',pos:[0,9,26],tgt:[0,1.2,-.4],off:[0,.03],amp:.02,shadeL:0,shade:.86,fog:[40,90]});
  RX.view('tlLow',{set:'tl',pos:[0,5.2,24],tgt:[0,1.4,-.4],off:[0,.24],amp:.02,shadeL:0,shade:.25,fog:[40,90]});
})();

/* =============== Watt's flyball governor: the first feedback loop of the factory =============== */
(function(){
  var spin,arms=[],links=[],sleeve,lever,vrod,plate,fly,st={rpm:120,ball:120,load:1,on:true,ang:0,fa:0,valve:.5},TOPY=2.9,LA=1.0,LK=.5,a=V(),b=V(),last=0;
  RX.addSet('gov',{
    build:function(g){u.floor(g,{c1:0x6b5a3a,c2:0x2a2418,op:.35});
      g.add(at(rbox(1.3,.3,1.3,.05,iron),0,.15,0));g.add(at(cyl(.2,.5,iron,null,.12),0,.55,0));g.add(at(cyl(.05,TOPY-.6,steel),0,.8+(TOPY-.8)/2-.1,0));
      spin=new THREE.Group();g.add(spin);spin.add(at(cyl(.1,.12,brass),0,TOPY,0));
      [1,-1].forEach(function(s){var ag=new THREE.Group();ag.position.set(s*.08,TOPY,0);spin.add(ag);ag.add(at(cyl(.025,LA,steel),0,-LA/2,0));ag.add(at(sph(.17,brass,28),0,-LA,0));arms.push({g:ag,s:s});var l=rod(.02,steel,8);spin.add(l);links.push(l);});
      sleeve=new THREE.Group();spin.add(sleeve);sleeve.add(cyl(.13,.16,brass));sleeve.add(at(cyl(.16,.03,brass),0,-.1,0));sleeve.add(at(cyl(.16,.03,brass),0,.1,0));
      g.add(at(box(.1,1.9,.1,iron),1.05,.95,0));g.add(at(cyl(.04,.2,steel,'z'),1.05,1.9,0));
      lever=rod(.03,iron,8);vrod=rod(.018,steel,8);g.add(lever);g.add(vrod);
      var pipe=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,2.6,32,1,true),new THREE.MeshStandardMaterial({color:0x8a5a3a,roughness:.4,metalness:.7,transparent:true,opacity:.45,side:THREE.DoubleSide}));pipe.rotation.x=PI/2;pipe.position.set(1.9,.9,0);g.add(pipe);
      [-1.3,1.3].forEach(function(z){g.add(at(cyl(.26,.06,brass,'z'),1.9,.9,z));});g.add(at(box(.16,.9,.16,iron),1.9,.35,.9));g.add(at(box(.16,.9,.16,iron),1.9,.35,-.9));
      plate=cyl(.185,.03,glow(0xff7a1a,.5),'z');plate.position.set(1.9,.9,0);g.add(plate);
      fly=new THREE.Group();fly.position.set(-1.7,1.5,-1.1);g.add(fly);fly.add(new THREE.Mesh(new THREE.TorusGeometry(1.0,.11,14,56),iron));fly.add(cyl(.2,.36,brass,'z'));for(var i=0;i<6;i++){var sp=box(.08,1.9,.08,iron);sp.rotation.z=i*PI/6;fly.add(sp);}
      g.add(at(rbox(1.5,.5,1.0,.05,std(0x3a2a22,.7,.3)),-1.7,.25,-1.1));g.add(at(box(.14,1.3,.14,iron),-1.7,.9,-.8));g.add(at(box(.14,1.3,.14,iron),-1.7,.9,-1.4));
      var belt=rod(.018,std(0x2a1d14,.9,0),6);belt.setAB(V(-1.7,1.68,-.86),V(0,.72,-.16));g.add(belt);var belt2=rod(.018,std(0x2a1d14,.9,0),6);belt2.setAB(V(-1.7,1.32,-.86),V(0,.6,-.16));g.add(belt2);
      u.shadow(g);},
    enter:function(){st.rpm=st.ball=120;},
    update:function(t,dt){for(var i=0;i<4;i++){var h=dt/4;st.ball+=(st.rpm-st.ball)*Math.min(1,h/.18);st.valve=st.on?clamp(.5-4*(st.ball-120)/120,0,1):.5;st.rpm+=.8*(240*st.valve-st.load*st.rpm)*h;}
      st.ang+=st.rpm/60*2*PI*dt*.35;st.fa+=st.rpm/60*2*PI*dt*.18;spin.rotation.y=st.ang;fly.rotation.z=-st.fa;
      var ph=clamp(40+(st.ball-120)*.3,13,72)*PI/180,sy=TOPY-2*LK*Math.cos(ph);
      arms.forEach(function(m,i){m.g.rotation.z=m.s*ph;links[i].setAB(a.set(m.s*(.08+LK*Math.sin(ph)),TOPY-LK*Math.cos(ph),0),b.set(m.s*.1,sy,0));});
      sleeve.position.y=sy;var py=1.9,lx=.2,ly=sy,rx=1.9,ry=py+(py-ly)*(.85/.85);lever.setAB(a.set(lx,ly,0),b.set(rx,ry,0));vrod.setAB(a.set(rx,ry,0),b.set(rx,1.12,0));
      plate.rotation.y=(1-st.valve)*PI/2;
      if(t-last>.12){last=t;txt('#gov-rpm',String(Math.round(st.rpm)));txt('#gov-valve',Math.round(st.valve*100)+'%');var e=$('#gov-rpm');if(e)e.style.color=Math.abs(st.rpm-120)<12?'#2fe0a8':'#ff7a1a';}}});
  var ld=$('#gov-load');if(ld)ld.addEventListener('input',function(){st.load=+ld.value/100;ld.nextElementSibling.textContent=ld.value+'%';});
  $$('#s-gov .btn[data-gov]').forEach(function(bn){bn.addEventListener('click',function(){st.on=bn.dataset.gov==='1';$$('#s-gov .btn[data-gov]').forEach(function(x){x.classList.toggle('on',x===bn);});});});
  RX.gov=st;RX.dbg.gov=function(){return {rpm:st.rpm,valve:st.valve,sleeve:sleeve.position.y};};
  RX.view('gov',{set:'gov',pos:[3.3,3.0,8.0],tgt:[.25,1.75,-.2],off:[.24,0],amp:.05,bg:0x0d0a07,fog:[22,55]});
  RX.view('govDim',{set:'gov',pos:[4.2,3.3,9.6],tgt:[.25,1.75,-.2],off:[.27,0],amp:.05,bg:0x0d0a07,shade:.3,fog:[22,55]});
})();

/* =============== the moving assembly line =============== */
(function(){
  var cars=[],SP=3.4,N=6,LEN=SP*N,black=std(0x0c0e12,.35,.5),tyre=std(0x101216,.9,0);
  function car(){var c=new THREE.Group(),st=[];function S(k,m){m.userData.k=k;st.push(m);c.add(m);return m;}
    c.add(at(box(1.9,.07,.09,iron),0,.42,.32));c.add(at(box(1.9,.07,.09,iron),0,.42,-.32));
    [.72,-.72].forEach(function(x){c.add(at(cyl(.03,.98,steel,'z'),x,.36,0));[.47,-.47].forEach(function(z){var w=new THREE.Group();w.position.set(x,.36,z);w.add(new THREE.Mesh(new THREE.TorusGeometry(.3,.05,10,28),tyre));w.add(cyl(.05,.07,brass,'z'));for(var i=0;i<4;i++){var sp=box(.03,.56,.03,wood);sp.rotation.z=i*PI/4;w.add(sp);}c.add(w);});});
    S(1,at(box(.46,.36,.4,std(0x5a6470,.5,.6)),.52,.66,0));S(1,at(box(.06,.44,.5,brass),.84,.7,0));
    S(2,at(box(.5,.12,.74,std(0x5a3a22,.8,0)),-.25,.62,0));S(2,at(box(.1,.4,.74,std(0x5a3a22,.8,0)),-.5,.84,0));S(2,at(cyl(.02,.5,steel),.18,.86,.2).rotateZ(-.5));
    S(3,at(box(1.0,.34,.82,black),-.3,.74,0));S(3,at(box(.56,.4,.5,black),.52,.72,0));
    S(4,at(box(1.05,.04,.86,black),-.32,1.5,0));[[.18,.4],[.18,-.4],[-.8,.4],[-.8,-.4]].forEach(function(p){S(4,at(box(.03,.62,.03,black),p[0],1.2,p[1]));});
    c.parts=st;return c;}
  RX.addSet('line',{
    build:function(g){u.floor(g,{c1:0x6b5a3a,c2:0x2a2418,op:.3});
      var belt=at(box(LEN+2,.1,1.5,std(0x1c1f25,.85,.1)),0,.05,0);belt.receiveShadow=true;g.add(belt);g.add(at(box(LEN+2,.14,.08,iron),0,.07,.8));g.add(at(box(LEN+2,.14,.08,iron),0,.07,-.8));
      for(var i=0;i<5;i++){var x=-6.8+i*3.4;g.add(at(box(.1,2.6,.1,iron),x,1.3,-1.25));g.add(at(box(.1,2.6,.1,iron),x,1.3,1.6));g.add(at(box(.1,.1,2.95,iron),x,2.6,.175));
        g.add(at(cyl(.22,.16,std(0xfff0b0,.4,0,{emissive:0xffc53d,emissiveIntensity:.9}),null,.08),x,2.47,.175));
        var p=R.person([0x4a6a8a,0x6a5a4a,0x4a7a6a,0x7a5a5a,0x5a5a7a][i]);p.g.position.set(x+.5,0,1.15);p.g.rotation.y=PI/2;g.add(p.g);p.walk(.12+i*.07,.5);}
      for(var k=0;k<N;k++){var c=car();g.add(c);cars.push(c);}
      this.marks=[];for(var m=0;m<12;m++){var mk=at(box(.5,.012,.1,std(0xffc53d,.6,0)),0,.106,.62);g.add(mk);this.marks.push(mk);}
      u.shadow(g);},
    update:function(t){var off=(t*.55)%SP;cars.forEach(function(c,k){var x=-LEN/2+k*SP+off;c.position.set(x,.1,0);var stage=Math.floor((x+LEN/2)/SP*.83);c.parts.forEach(function(p){p.visible=p.userData.k<=stage;});});
      this.marks.forEach(function(m,i){m.position.x=-LEN/2+((i*1.7+t*.55)%LEN);});}});
  RX.view('line',{set:'line',pos:[16.5,5.0,8.2],tgt:[5.2,.8,0],off:[.28,0],amp:.03,bg:0x0d0a07,fog:[14,38]});
})();

/* =============== Unimate, 1961: teach it once, it repeats =============== */
(function(){
  var U,part,pm,marks=[],tt=0,P=[[.45,.22,0,1],[0,0,.62,1],[0,.05,.05,0],[-PI/2,.05,.05,0],[-PI/2,-.24,.5,0]],tank=V(.25,.3,2.38),w=V(),pts=[],cool=0,inDie=true,sunk=0,teachN=0;
  function pose(a,b,k){var e=ease(k);U.pose(lerp(a[0],b[0],e),lerp(a[1],b[1],e),lerp(a[2],b[2],e),lerp(a[3],b[3],e));}
  var TL=[[0,1.2,0,1],[1.2,1.6,'grip'],[1.6,2.6,1,2],[2.6,4.0,2,3],[4.0,5.0,3,4],[5.0,5.4,'rel'],[5.4,6.2,4,3],[6.2,7.6,3,0]];
  RX.addSet('uni',{
    build:function(g){u.floor(g);U=R.unimate();g.add(U.g);
      var mm=std(0x2c3a36,.6,.4);g.add(at(rbox(1.7,2.1,1.9,.06,mm),3.95,1.05,0));g.add(at(box(.24,1.5,1.5,std(0x39453f,.5,.6)),3.02,1.2,0));
      g.add(at(box(.1,.34,.6,glow(0xff6a13,1.3)),2.93,1.28,0));[.55,-.55].forEach(function(z){g.add(at(cyl(.09,1.3,steel,'x'),3.6,2.0,z));});
      g.add(at(cyl(.2,.7,mm),4.0,2.45,0));
      var tw=std(0x4a5560,.6,.5);g.add(at(box(1.2,.7,.05,tw),.25,.35,1.9));g.add(at(box(1.2,.7,.05,tw),.25,.35,2.86));g.add(at(box(.05,.7,1.0,tw),-.33,.35,2.38));g.add(at(box(.05,.7,1.0,tw),.83,.35,2.38));
      var water=new THREE.Mesh(new THREE.BoxGeometry(1.1,.56,.9),new THREE.MeshStandardMaterial({color:0x2a8fd0,transparent:true,opacity:.55,roughness:.1,metalness:.2}));water.position.set(.25,.3,2.38);g.add(water);
      pm=new THREE.MeshStandardMaterial({color:0xff7a1a,emissive:0xff5a00,emissiveIntensity:1.4,roughness:.5,metalness:.4});part=rbox(.3,.14,.22,.02,pm);g.add(part);
      u.shadow(g);g.updateMatrixWorld(true);
      P.forEach(function(p,i){U.pose(p[0],p[1],p[2],p[3]);U.g.updateMatrixWorld(true);var q=V();U.tip.getWorldPosition(q);pts.push(q);var m=sph(.07,glow(0xffc53d,1.2),14);m.position.copy(q);m.visible=false;g.add(m);marks.push(m);
        RX.label(String(i+1),'num',q.clone().add(V(0,.22,0)),['uni','uniTeach'],{when:function(){return m.visible;}});});
      U.pose(P[0][0],P[0][1],P[0][2],1);
      g.add(at(box(.3,1.7,1.7,std(0x46554e,.5,.6)),2.86,1.2,0));[[.7,.7],[.7,-.7],[-.7,.7],[-.7,-.7]].forEach(function(q){g.add(at(cyl(.07,1.0,steel,'x'),3.3,1.2+q[0],q[1]));});},
    enter:function(view,st,fresh){if(fresh||view==='uniTeach'&&RX.onStep()===0){tt=0;teachN=0;marks.forEach(function(m){m.visible=false;});inDie=true;cool=0;}},
    update:function(t,dt,view,step){var teach=(view==='uniTeach'&&step===0),sp=teach?.5:1.15;tt+=dt*sp;var q=tt%7.6,held=false;
      for(var i=0;i<TL.length;i++){var s=TL[i];if(q>=s[0]&&q<s[1]){var k=(q-s[0])/(s[1]-s[0]);
        if(s[2]==='grip'){U.pose(P[1][0],P[1][1],P[1][2],1-k);held=k>.6;if(k>.6)inDie=false;}
        else if(s[2]==='rel'){U.pose(P[4][0],P[4][1],P[4][2],k);held=k<.3;if(k>=.3&&!sunk){sunk=.001;}}
        else{pose(P[s[2]],P[s[3]],k);held=(s[2]>=1&&s[3]>=2&&s[2]<=3)&&!(i===6);if(k>.97&&view==='uniTeach'){var idx=[1,null,2,3,4][i];if(idx!=null&&i<5){teachN=Math.max(teachN,idx+1);}}}
        if(i===0&&k<.1&&!inDie&&q<.2){inDie=true;cool=0;sunk=0;}break;}}
      if(view==='uniTeach'||view==='uni')marks.forEach(function(m,i){m.visible=(view==='uniTeach')&&(step>0||i<Math.max(1,teachN));});
      if(held){U.g.updateMatrixWorld(true);U.tip.getWorldPosition(w);part.position.copy(w);part.rotation.y=U.j[0].rotation.y;part.visible=true;cool=Math.min(1,cool+dt*.05);}
      else if(inDie){part.position.set(2.72,1.28,0);part.rotation.y=0;part.visible=true;}
      else if(sunk){sunk=Math.min(1,sunk+dt*.6);part.position.set(tank.x+.5,lerp(.72,.2,sunk),tank.z+.25);part.position.x=pts[4].x;part.position.z=pts[4].z;cool=Math.min(1,cool+dt*.8);}
      pm.emissiveIntensity=1.4*(1-cool);pm.color.setHex(0xff7a1a).lerp(new THREE.Color(0x7d8791),cool);}});
  RX.view('uni',{set:'uni',pos:[3.6,3.4,11.4],tgt:[1.9,1.0,.5],off:[.23,-.02],amp:.04,fog:[24,60]});
  RX.view('uniTeach',{set:'uni',pos:[3.2,4.9,10.8],tgt:[1.9,.9,.7],off:[.22,0],amp:.03,fog:[24,60]});
  RX.label('Die-casting machine','tag',V(3.9,2.95,0),['uni','uniTeach'],{});RX.label('Water tank','tag b',V(.25,0,3.0),['uni','uniTeach'],{});RX.label('Unimate','tag',V(0,2.3,0),['uni','uniTeach'],{});
})();

/* =============== sense, think, act: a small robot maps a room and plans its way =============== */
(function(){
  var N=14,CS=.5,H=N*CS/2,occ=[],boxes=[],vac,rays,rayN=64,hits,hitBuf,hitN=0,HITMAX=5000,pathLine,goalM,path=[],pi=0,pos=V(-2.75,0,-2.75),head=0,G,dropped=[],state={mode:'go'};
  function idx(c,r){return r*N+c;}function free(c,r){return c>=0&&r>=0&&c<N&&r<N&&!occ[idx(c,r)];}
  function cw(c){return -H+(c+.5)*CS;}function wc(x){return clamp(Math.floor((x+H)/CS),0,N-1);}
  function addBox(c0,r0,c1,r1,hh,m,keep){for(var r=r0;r<=r1;r++)for(var c=c0;c<=c1;c++)occ[idx(c,r)]=1;var bw=(c1-c0+1)*CS,bd=(r1-r0+1)*CS,me=at(rbox(bw-.06,hh,bd-.06,.04,m),-H+c0*CS+bw/2,hh/2,-H+r0*CS+bd/2);me.castShadow=true;G.add(me);
    var b={x0:-H+c0*CS,x1:-H+(c1+1)*CS,z0:-H+r0*CS,z1:-H+(r1+1)*CS,m:me,c:[c0,r0,c1,r1]};boxes.push(b);if(!keep)dropped.push(b);return b;}
  function astar(sc,sr,gc,gr){var open=[[sc,sr]],g={},f={},came={},k0=idx(sc,sr);g[k0]=0;f[k0]=0;var D=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],guard=0;
    while(open.length&&guard++<4000){var bi=0;for(var i=1;i<open.length;i++)if(f[idx(open[i][0],open[i][1])]<f[idx(open[bi][0],open[bi][1])])bi=i;var cur=open.splice(bi,1)[0],ck=idx(cur[0],cur[1]);
      if(cur[0]===gc&&cur[1]===gr){var out=[cur];while(came[ck]!=null){ck=came[ck];out.unshift([ck%N,Math.floor(ck/N)]);}return out;}
      D.forEach(function(d){var c=cur[0]+d[0],r=cur[1]+d[1];if(!free(c,r))return;if(d[0]&&d[1]&&(!free(cur[0]+d[0],cur[1])||!free(cur[0],cur[1]+d[1])))return;
        var nk=idx(c,r),ng=g[ck]+(d[0]&&d[1]?1.414:1);if(g[nk]==null||ng<g[nk]){g[nk]=ng;f[nk]=ng+Math.hypot(c-gc,r-gr);came[nk]=ck;if(!open.some(function(o){return o[0]===c&&o[1]===r;}))open.push([c,r]);}});}
    return null;}
  function plan(newGoal){var sc=wc(pos.x),sr=wc(pos.z),tries=0;
    while(tries++<60){if(newGoal||!state.goal){var c=Math.floor(Math.random()*N),r=Math.floor(Math.random()*N);if(!free(c,r)||Math.hypot(c-sc,r-sr)<6)continue;state.goal=[c,r];}
      var p=astar(sc,sr,state.goal[0],state.goal[1]);if(p&&p.length>1){path=p.map(function(q){return V(cw(q[0]),0,cw(q[1]));});path[0]=pos.clone();pi=1;
        var pp=[];path.forEach(function(q){pp.push(q.x,.03,q.z);});pathLine.geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pp),3));pathLine.geometry.setDrawRange(0,path.length);goalM.position.set(path[path.length-1].x,.02,path[path.length-1].z);state.len=path.length;return true;}
      newGoal=true;}return false;}
  function cast(ox,oz,dx,dz,max){var best=max;for(var i=0;i<boxes.length;i++){var b=boxes[i],t0=0,t1=best,ok=true;
      if(Math.abs(dx)<1e-6){if(ox<b.x0||ox>b.x1)ok=false;}else{var a=(b.x0-ox)/dx,c=(b.x1-ox)/dx;if(a>c){var s=a;a=c;c=s;}t0=Math.max(t0,a);t1=Math.min(t1,c);}
      if(ok){if(Math.abs(dz)<1e-6){if(oz<b.z0||oz>b.z1)ok=false;}else{var a2=(b.z0-oz)/dz,c2=(b.z1-oz)/dz;if(a2>c2){var s2=a2;a2=c2;c2=s2;}t0=Math.max(t0,a2);t1=Math.min(t1,c2);}}
      if(ok&&t0<=t1&&t0>0&&t0<best)best=t0;}
    var tw=[(H-ox)/dx,(-H-ox)/dx,(H-oz)/dz,(-H-oz)/dz];for(var k=0;k<4;k++)if(isFinite(tw[k])&&tw[k]>0&&tw[k]<best)best=tw[k];return best;}
  RX.addSet('sta',{
    build:function(g){G=g;u.floor(g,{color:0x0d131c,size:N*CS,div:N,c1:0x24486e,c2:0x1a3350,op:.7});for(var i=0;i<N*N;i++)occ[i]=0;
      var wm=std(0x26303d,.8,.1);[[0,-H-.05,N*CS+.2,.1],[0,H+.05,N*CS+.2,.1],[-H-.05,0,.1,N*CS],[H+.05,0,.1,N*CS]].forEach(function(w){var m=at(box(w[2],.5,w[3],wm),w[0],.25,w[1]);m.castShadow=true;g.add(m);});
      addBox(2,5,3,9,.75,std(0x3d5a80,.8,0),1);addBox(7,2,9,3,.9,std(0x6b4a2e,.8,0),1);addBox(10,8,11,9,.5,std(0x4f6f52,.8,0),1);addBox(6,10,6,11,1.4,std(0x7a7f87,.6,.2),1);addBox(11,4,11,4,1.1,std(0x2f6f4a,.8,0),1);addBox(5,6,5,6,.45,std(0x8a6a4a,.8,0),1);
      vac=R.vacuum();vac.g.scale.setScalar(1.7);g.add(vac.g);
      rays=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x3cc8ff,transparent:true,opacity:.42}));rays.geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(rayN*6),3));rays.frustumCulled=false;g.add(rays);
      hitBuf=new Float32Array(HITMAX*3);hits=new THREE.Points(new THREE.BufferGeometry(),new THREE.PointsMaterial({color:0xffc53d,size:.09,map:u.DISC,transparent:true,alphaTest:.3}));hits.geometry.setAttribute('position',new THREE.BufferAttribute(hitBuf,3));hits.geometry.setDrawRange(0,0);hits.frustumCulled=false;g.add(hits);
      pathLine=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x2fe0a8}));pathLine.frustumCulled=false;g.add(pathLine);var pd=new THREE.Points(pathLine.geometry,new THREE.PointsMaterial({color:0x2fe0a8,size:.17,map:u.DISC,transparent:true,alphaTest:.3}));pd.frustumCulled=false;g.add(pd);
      goalM=new THREE.Mesh(new THREE.RingGeometry(.14,.22,28),new THREE.MeshBasicMaterial({color:0x2fe0a8,side:THREE.DoubleSide}));goalM.rotation.x=-PI/2;g.add(goalM);
      u.shadow(vac.g);plan(true);},
    update:function(t,dt){if(!path.length||pi>=path.length){plan(true);return;}
      var tg=path[pi],dx=tg.x-pos.x,dz=tg.z-pos.z,d=Math.hypot(dx,dz),stp=1.15*dt;if(d<stp){pos.copy(tg);pi++;}else{pos.x+=dx/d*stp;pos.z+=dz/d*stp;var want=Math.atan2(-dz,dx),df=((want-head+PI)%(2*PI)+2*PI)%(2*PI)-PI;head+=df*Math.min(1,dt*7);}
      vac.g.position.set(pos.x,0,pos.z);vac.g.rotation.y=head;vac.turret.rotation.y=t*9;
      var rp=rays.geometry.attributes.position,base=Math.floor(t*60)%4;for(var i=0;i<rayN;i++){var an=i/rayN*2*PI+t*.3,cx=Math.cos(an),cz=Math.sin(an),r=cast(pos.x,pos.z,cx,cz,3.6);rp.setXYZ(i*2,pos.x,.2,pos.z);rp.setXYZ(i*2+1,pos.x+cx*r,.2,pos.z+cz*r);
        if(r<3.59&&(i%4)===base){hitBuf[hitN%HITMAX*3]=pos.x+cx*r;hitBuf[hitN%HITMAX*3+1]=.14;hitBuf[hitN%HITMAX*3+2]=pos.z+cz*r;hitN++;}}
      rp.needsUpdate=true;hits.geometry.attributes.position.needsUpdate=true;hits.geometry.setDrawRange(0,Math.min(hitN,HITMAX));
      goalM.scale.setScalar(1+.25*Math.sin(t*5));txt('#sta-pts',String(Math.min(hitN,HITMAX)));txt('#sta-len',((path.length-pi)*CS).toFixed(1)+' m');}});
  function drop(){if(path.length-pi<4)return false;var q=path[Math.min(path.length-2,pi+2+Math.floor(Math.random()*3))],c=wc(q.x),r=wc(q.z);if(!free(c,r)||(c===wc(pos.x)&&r===wc(pos.z)))return false;
    addBox(c,r,c,r,.42,glow(0xff7a1a,.35));state.drops=(state.drops||0)+1;plan(false);return true;}
  function reset(){dropped.forEach(function(b){for(var r=b.c[1];r<=b.c[3];r++)for(var c=b.c[0];c<=b.c[2];c++)occ[idx(c,r)]=0;G.remove(b.m);boxes.splice(boxes.indexOf(b),1);});dropped=[];hitN=0;plan(false);}
  var b1=$('#sta-drop');if(b1)b1.addEventListener('click',drop);var b2=$('#sta-reset');if(b2)b2.addEventListener('click',reset);
  RX.sta={drop:drop,reset:reset,state:state,boxes:boxes,path:function(){return path.map(function(p){return [+(p.x.toFixed(2)),+(p.z.toFixed(2))];});},pos:function(){return [pos.x,pos.z];}};
  RX.view('sta',{set:'sta',pos:[7.0,9.4,9.6],tgt:[.6,0,.4],off:[.25,.03],amp:.04,fog:[26,60]});
})();
})();
