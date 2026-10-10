const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const source=html.slice(html.indexOf('(function installViewportFit(){'),html.indexOf('</script>',html.indexOf('(function installViewportFit(){')));
// These are supplied DOM rectangles, not screenshots or real browser layout results.
function environment(width,height,{overflow={},collisionModes=[],negativeModes=[],autoOpen=false,userOpen=false}={}){
 const frames=[],events={},visualEvents={},observers={},styles=new Map();let fontReady;
 const body={dataset:{fit:'0'},style:{setProperty(k,v){styles.set(k,v)}},getBoundingClientRect(){return box(0,0,width,height)}};
 const mode=()=>Number(body.dataset.fit),box=(left,top,w,h)=>({left,top,right:left+w,bottom:top+h,width:w,height:h});
 function element(id,rect){return {id,className:id,getBoundingClientRect(){return rect(mode())}}}
 const header=element('header',()=>box(0,0,width,44)),toolbar=element('map-toolbar',()=>box(0,44,width,44));
 const blocks=[
  element('question',m=>box(0,negativeModes.includes(m)?-5:156,width,40)),
  element('step',()=>box(0,200,width,20)),
  element('feedback',m=>m===3?box(width*.25+4,224,width*.4-8,120):m===2?box(104,224,width-104,120):box(0,224,width,80)),
  element('staff',m=>m===3?box(0,224,width*.25,120):m===2?box(0,224,100,120):box(0,310,width/2-4,120)),
  element('response-panel',m=>m===3?box(width*.65+4,224,width*.35-4,100):box(m===2?0:width/2+4,collisionModes.includes(m)?290:m===2?350:310,m===2?width:width/2-4,100))
 ];
 const chrome=[element('lesson-toolbar',()=>box(0,88,width,44)),element('top',()=>box(0,132,width,20))];
 const map={querySelectorAll(selector){return selector.startsWith('h2,')?blocks:[...chrome,...blocks]}};
 const details={open:autoOpen||userOpen,automatic:autoOpen,removeAttribute(name){assert.equal(name,'data-auto-open');this.automatic=false}};
 const root={get scrollHeight(){return height+(overflow[mode()]||0)}};
 Object.defineProperty(body,'scrollHeight',{get(){return root.scrollHeight}});
 const document={body,documentElement:root,fonts:{ready:{then(fn){fontReady=fn}}},querySelector(selector){return selector.startsWith('main>')?map:{}},querySelectorAll(selector){
  if(selector==='header,.map-toolbar')return [header,toolbar];
  if(selector==='.relation-details[open][data-auto-open]')return details.open&&details.automatic?[details]:[];
  return [...chrome,...blocks,header];
 }};
 class MutationObserver{constructor(fn){observers.mutation=fn}observe(){}}
 class ResizeObserver{constructor(fn){observers.resize=fn}observe(){}}
 const window={innerWidth:width,innerHeight:height,visualViewport:{width,height,addEventListener(name,fn){visualEvents[name]=fn}},requestAnimationFrame(fn){frames.push(fn)},addEventListener(name,fn){events[name]=fn},MutationObserver,ResizeObserver};
 vm.runInNewContext(source,{document,window});
 return {window,body,styles,frames,events,visualEvents,observers,details,flush(){let n=0;while(frames.length){assert.ok(++n<10);frames.shift()()}},fontReady};
}
let cases=0;
for(const [width,height] of [[320,568],[360,640],[390,844],[412,915],[667,375],[844,390],[972,494],[1366,768],[1440,900]]){
 // Wide shallow rectangles need the third layout; larger heights keep the first.
 const env=environment(width,height);assert.equal(env.window.youyangViewportAudit().fit,true);assert.equal(env.body.dataset.fit,height<430?'3':'0');cases++;
}
const compact=environment(390,640,{overflow:{0:100},autoOpen:true});
assert.equal(compact.body.dataset.fit,'1');assert.equal(compact.window.youyangViewportAudit().fit,true);assert.equal(compact.details.open,false);
const portrait=environment(320,568,{overflow:{0:140},collisionModes:[1]});
assert.equal(portrait.body.dataset.fit,'2');assert.equal(portrait.window.youyangViewportAudit().fit,true);
const landscape=environment(844,375,{overflow:{0:120,1:60}});assert.equal(landscape.body.dataset.fit,'3');assert.equal(landscape.window.youyangViewportAudit().fit,true);
const tooSmall=environment(390,568,{overflow:{0:90,1:30,2:12}});assert.equal(tooSmall.body.dataset.fit,'2');assert.equal(tooSmall.window.youyangViewportAudit().fit,false);assert.equal(tooSmall.window.youyangViewportAudit().documentOverflow,12);
const overlap=environment(390,640,{collisionModes:[0]});assert.equal(overlap.body.dataset.fit,'1');assert.equal(overlap.window.youyangViewportAudit().fit,true);
const above=environment(390,640,{negativeModes:[0]});assert.equal(above.body.dataset.fit,'1');
const openedByUser=environment(390,640,{overflow:{0:100},userOpen:true});assert.equal(openedByUser.details.open,true);
const resized=environment(390,640);resized.window.visualViewport.height=600;resized.visualEvents.resize();resized.events.resize();resized.observers.mutation();resized.observers.resize();resized.fontReady();assert.equal(resized.frames.length,1);resized.flush();assert.equal(resized.styles.get('--app-height'),'600px');
resized.window.visualViewport.height=0;resized.window.innerHeight=0;resized.window.youyangFitViewport();assert.equal(resized.styles.get('--app-height'),'600px');
assert.ok(!/overflow\s*:\s*(hidden|clip)/.test(html.slice(html.indexOf('/* Keep the practice in the available viewport'))));
console.log(`Viewport fitting passed ${cases} supplied-size cases plus overflow, overlap, negative position, narrow/wide fallback, actual visual viewport height, event coalescing and automatic/user-open detail handling. These checks simulate geometry; actual browser/device layout remains unverified.`);
