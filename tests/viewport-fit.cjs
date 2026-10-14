const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const source=html.slice(html.indexOf('(function installViewportFit(){'),html.indexOf('</script>',html.indexOf('(function installViewportFit(){')));
// These are supplied DOM rectangles, not screenshots or real browser layout results.
function environment(width,height,{overflow={},collisionModes=[],negativeModes=[],autoOpen=false,userOpen=false,buttonOverflowModes=[],cardOverflowModes=[],hiddenButtonModes=[],responseOverlapModes=[],keyboardClipModes=[],auditResponse=false,textOverflowModes=[]}={}){
 const frames=[],events={},visualEvents={},observers={},styles=new Map();let fontReady;
 const body={dataset:{fit:'0'},style:{setProperty(k,v){styles.set(k,v)}},getBoundingClientRect(){return box(0,0,width,height)}};
 const mode=()=>Number(body.dataset.fit),box=(left,top,w,h)=>({left,top,right:left+w,bottom:top+h,width:w,height:h});
 function element(id,rect){return {id,className:id,getBoundingClientRect(){return rect(mode())}}}
 const header=element('header',()=>box(0,0,width,44)),toolbar=element('map-toolbar',()=>box(0,44,width,44));
 const blocks=[
  element('question',m=>box(0,negativeModes.includes(m)?-5:156,width,40)),
  element('step',()=>box(0,200,width,20)),
  element('feedback',m=>box(0,224,width,m===3?60:80)),
  element('staff',m=>m===3?box(0,290,width*.4-4,80):box(0,310,m===2?100:width/2-4,m===2?88:120)),
  element('response-panel',m=>m===3?box(width*.4+4,290,width*.6-4,80):box(m===2?104:width/2+4,collisionModes.includes(m)?290:310,m===2?width-104:width/2-4,m===2?88:100))
 ];
 const next=element('next',m=>box(width-86,buttonOverflowModes.includes(m)?height-20:cardOverflowModes.includes(m)?308:m===3?232:242,80,44));
 const readingText=element('feedback-content',m=>box(8,232,width-100,m===3?44:60));
 const glyph=element('reading-symbol',m=>box(8,textOverflowModes.includes(m)?308:242,40,32));
 const readingParts=selector=>[readingText,next,...(selector.includes('.reading-symbol')?[glyph]:[])];
 blocks[2].querySelectorAll=readingParts;
 const panel=blocks[4];
 const within=(m,offset,h,w)=>{const r=panel.getBoundingClientRect();return box(r.left,r.top+offset,w??r.width,h)};
 const identity=element('c-relations',m=>within(m,6,responseOverlapModes.includes(m)?40:20));
 const keyboard=element('c-keyboard',m=>within(m,responseOverlapModes.includes(m)?30:32,keyboardClipModes.includes(m)?30:50));
 const piano=element('chord-piano',m=>within(m,responseOverlapModes.includes(m)?30:32,50,panel.getBoundingClientRect().width+240));
 const scroller={getBoundingClientRect:()=>keyboard.getBoundingClientRect()};
 piano.closest=selector=>selector==='.keyboard-scroll'?scroller:null;
 panel.querySelectorAll=()=>auditResponse?[identity,keyboard]:[];
 const chrome=[element('lesson-toolbar',()=>box(0,88,width,44)),element('top',()=>box(0,132,width,20))];
 const map={querySelectorAll(selector){
  if(selector==='.reading-actions button:not([hidden])')return [next];
  if(selector==='.reading-card')return [blocks[2]];
  if(selector==='.response-panel')return [panel];
  if(selector==='.response-panel .piano,.response-panel .interval-piano')return auditResponse?[piano]:[];
  return selector.startsWith('h2,')?blocks:[...chrome,...blocks,...(selector.includes('.reading-content')?readingParts(selector):[])];
 }};
 const details={open:autoOpen||userOpen,automatic:autoOpen,removeAttribute(name){assert.equal(name,'data-auto-open');this.automatic=false}};
 const root={get scrollHeight(){return height+(overflow[mode()]||0)}};
 Object.defineProperty(body,'scrollHeight',{get(){return root.scrollHeight}});
 const report={open:false};
 const document={body,documentElement:root,fonts:{ready:{then(fn){fontReady=fn}}},querySelector(selector){return selector.startsWith('main>')?map:selector==='.report[open]'?(report.open?report:null):{}},querySelectorAll(selector){
  if(selector==='header,.map-toolbar')return [header,toolbar];
  if(selector==='.relation-details[open][data-auto-open]')return details.open&&details.automatic?[details]:[];
  return [...chrome,...blocks,header];
 }};
 class MutationObserver{constructor(fn){observers.mutation=fn}observe(){}}
 class ResizeObserver{constructor(fn){observers.resize=fn}observe(){}}
 const window={innerWidth:width,innerHeight:height,visualViewport:{width,height,addEventListener(name,fn){visualEvents[name]=fn}},requestAnimationFrame(fn){frames.push(fn)},addEventListener(name,fn){events[name]=fn},getComputedStyle(e){return {display:'block',visibility:e===next&&hiddenButtonModes.includes(mode())?'hidden':'visible'}},MutationObserver,ResizeObserver};
 vm.runInNewContext(source,{document,window});
 return {window,body,styles,frames,events,visualEvents,observers,details,report,flush(){let n=0;while(frames.length){assert.ok(++n<10);frames.shift()()}},fontReady};
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
// Both parent rectangles fit; the nested identity still obscures a keyboard.
const internalOverlap=environment(619,494,{auditResponse:true,responseOverlapModes:[0,1]});
assert.equal(internalOverlap.body.dataset.fit,'2');assert.equal(internalOverlap.window.youyangViewportAudit().fit,true);
const blockedEveryMode=environment(390,640,{auditResponse:true,responseOverlapModes:[0,1,2]});
assert.equal(blockedEveryMode.window.youyangViewportAudit().fit,false);
assert.ok(blockedEveryMode.window.youyangViewportAudit().collisions.some(c=>c.first==='c-relations'&&c.second==='c-keyboard'));
const clippedKeys=environment(619,494,{auditResponse:true,keyboardClipModes:[0,1]});
assert.equal(clippedKeys.body.dataset.fit,'2');assert.equal(clippedKeys.window.youyangViewportAudit().fit,true);
const clippedEveryMode=environment(390,640,{auditResponse:true,keyboardClipModes:[0,1,2]});
assert.equal(clippedEveryMode.window.youyangViewportAudit().fit,false);
assert.ok(clippedEveryMode.window.youyangViewportAudit().contentOverflow.some(c=>c.id==='chord-piano'));
const scrollableKeys=environment(390,640,{auditResponse:true});
assert.equal(scrollableKeys.window.youyangViewportAudit().fit,true,'Horizontal keyboard overflow is intentional and must remain scrollable');
// The reading card can fit while its continuation button is outside or invisible.
const buttonBelow=environment(390,640,{buttonOverflowModes:[0]});assert.equal(buttonBelow.body.dataset.fit,'1');assert.equal(buttonBelow.window.youyangViewportAudit().fit,true);
const buttonOutsideCard=environment(390,640,{cardOverflowModes:[0]});assert.equal(buttonOutsideCard.body.dataset.fit,'1');assert.equal(buttonOutsideCard.window.youyangViewportAudit().fit,true);
const invisibleButton=environment(390,640,{hiddenButtonModes:[0]});assert.equal(invisibleButton.body.dataset.fit,'1');assert.equal(invisibleButton.window.youyangViewportAudit().fit,true);
const textBeyondCard=environment(319,495,{textOverflowModes:[0]});assert.equal(textBeyondCard.body.dataset.fit,'1');assert.equal(textBeyondCard.window.youyangViewportAudit().fit,true);
const textBeyondEveryCard=environment(319,495,{textOverflowModes:[0,1,2]});assert.equal(textBeyondEveryCard.window.youyangViewportAudit().fit,false);assert.ok(textBeyondEveryCard.window.youyangViewportAudit().readingOverflow.some(r=>r.id==='reading-symbol'));
const noVisibleContinuation=environment(390,640,{hiddenButtonModes:[0,1,2]});assert.equal(noVisibleContinuation.window.youyangViewportAudit().fit,false);assert.deepEqual(Array.from(noVisibleContinuation.window.youyangViewportAudit().missingControls),['next']);
const recordRoom={0:100},stableRecord=environment(390,640,{overflow:recordRoom});
assert.equal(stableRecord.body.dataset.fit,'1');delete recordRoom[0];stableRecord.report.open=true;
stableRecord.window.youyangFitViewport();assert.equal(stableRecord.body.dataset.fit,'1','Opening a record must not move its launcher by changing layout');
stableRecord.report.open=false;stableRecord.window.youyangFitViewport();assert.equal(stableRecord.body.dataset.fit,'0');
const openedByUser=environment(390,640,{overflow:{0:100},userOpen:true});assert.equal(openedByUser.details.open,true);
const resized=environment(390,640);resized.window.visualViewport.height=600;resized.visualEvents.resize();resized.events.resize();resized.observers.mutation();resized.observers.resize();resized.fontReady();assert.equal(resized.frames.length,1);resized.flush();assert.equal(resized.styles.get('--app-height'),'600px');
resized.window.visualViewport.height=0;resized.window.innerHeight=0;resized.window.youyangFitViewport();assert.equal(resized.styles.get('--app-height'),'600px');
assert.ok(!/overflow\s*:\s*(hidden|clip)/.test(html.slice(html.indexOf('/* Keep the practice in the available viewport'))));
console.log(`Viewport fitting passed ${cases} supplied-size cases, off-screen/out-of-card/invisible continuation regressions, overflow, overlap, negative position, narrow/wide fallback, visual viewport height, event coalescing and detail handling. These checks simulate geometry; actual browser/device layout remains unverified.`);
