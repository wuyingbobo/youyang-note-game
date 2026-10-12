const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const start=html.indexOf('(function installDismissiblePanels(){');
assert.ok(start>=0,'Dismissible panel controller is required');
const source=html.slice(start,html.indexOf('// Measure rendered content;',start));
const listeners={},events={},visualEvents={};let refits=0;
const maps=Array.from({length:3},(_,i)=>({id:i,hidden:false,edge:148,querySelector(){return {getBoundingClientRect:()=>({bottom:this.edge})}}}));
function makePanel(type,map){
 const callbacks={},style=new Map(),summary={focused:0,focus(options){assert.equal(options.preventScroll,true);this.focused++}};
 const popover=type==='settings'?{style:{setProperty(k,v){this[k]=v}},getBoundingClientRect(){return {top:map.edge+5}}}:null;
 return {type,map,open:false,style:{setProperty(k,v){style.set(k,v)}},styleValues:style,summary,popover,callbacks,
  querySelector(q){return q==='summary'?summary:q==='.settings-popover'?popover:null},
  closest(q){return q==='[hidden]'?(map.hidden?map:null):q==='main>section'?map:this},
  contains(target){return target===this||target.panel===this},
  addEventListener(name,fn){callbacks[name]=fn},
  toggle(on){this.open=on;callbacks.toggle()}
 };
}
const panels=maps.flatMap(m=>[makePanel('report',m),makePanel('settings',m)]);
const relation={open:false,querySelector(){return {focus(){}}}};
const document={addEventListener(name,fn,capture){(listeners[name]??=[]).push({fn,capture})},
 querySelectorAll(q){return q==='.report,.practice-settings'?panels:q==='.relation-details[open]'&&relation.open?[relation]:[]},
 querySelector(q){return q==='.relation-details[open]'&&relation.open?relation:null}};
const window={innerHeight:640,visualViewport:{height:640,addEventListener(n,f){visualEvents[n]=f}},addEventListener(n,f){events[n]=f},youyangScheduleViewportFit(){refits++}};
vm.runInNewContext(source,{document,window});
function click(target){
 const e={target,prevented:false,stopped:false,preventDefault(){this.prevented=true},stopPropagation(){this.stopped=true}};
 listeners.click.forEach(({fn})=>fn(e));return e;
}
function escape(){const e={key:'Escape',prevented:false,preventDefault(){this.prevented=true}};listeners.keydown.forEach(({fn})=>fn(e));return e}
const target=panel=>({panel,closest(){return null}});
const outside={closest(){return null}};
const closeButton=panel=>({panel,closest(q){return q==='[data-close-panel]'?this:panel}});
let scenarios=0;
for(const p of panels){
 p.toggle(true);click(target(p));assert.equal(p.open,true,'Reading inside a panel must keep it open');
 const e=click(closeButton(p));assert.equal(p.open,false);assert.equal(e.prevented,true);assert.equal(e.stopped,true);assert.ok(p.summary.focused>0);scenarios++;
 p.toggle(true);click(outside);assert.equal(p.open,false,'A click outside must dismiss the panel');scenarios++;
 p.toggle(true);assert.equal(escape().prevented,true);assert.equal(p.open,false,'Escape must close records and settings in any fit mode');scenarios++;
 // Opening a different panel closes the first one, including higher chord overlays.
 const other=panels.find(x=>x!==p);other.toggle(true);relation.open=true;p.toggle(true);
 assert.equal(other.open,false);assert.equal(p.open,true);assert.equal(relation.open,false);window.youyangClosePanels();assert.ok(panels.every(x=>!x.open));scenarios++;
}
assert.equal(listeners.click[0].capture,true,'Dismissal must run before the navigation handler');
for(const button of ['音程','音组设置','第3组']){
 const report=panels[0];report.toggle(true);
 const e=click({label:button,closest(){return null}});
 assert.equal(report.open,false);assert.equal(e.prevented,false);assert.equal(e.stopped,false);scenarios++;
}
// Available visible height, not an oversized layout viewport, bounds the report.
for(const height of [375,568,640]){
 window.visualViewport.height=height;maps[0].edge=height===375?90:148;
 const report=panels[0];report.toggle(true);
 const top=parseFloat(report.styleValues.get('--report-top'));
 assert.ok(top>=maps[0].edge+8,'Record must remain below navigation');
 assert.ok(top+160<=height,'Record must leave a usable scroll area');
 const settings=panels[1];settings.toggle(true);
 const room=parseFloat(settings.popover.style['--panel-room']);
 assert.ok(settings.popover.getBoundingClientRect().top+room<=height-12,'Settings must fit the actual visible viewport');
 window.youyangClosePanels();scenarios++;
}
panels[0].toggle(true);maps[0].hidden=true;const focused=panels[0].summary.focused;escape();assert.equal(panels[0].summary.focused,focused);maps[0].hidden=false;window.youyangClosePanels();
relation.open=true;escape();assert.equal(relation.open,false);
assert.ok(refits>0);assert.equal(typeof events.resize,'function');assert.equal(typeof visualEvents.resize,'function');
assert.equal((html.match(/aria-label="关闭学习记录"/g)||[]).length,3);
assert.equal((html.match(/aria-label="关闭练习设置"/g)||[]).length,3);
console.log(`Panel dismissal passed ${scenarios} simulated close/outside/Escape/exclusive-open/navigation/viewport cases across all three maps. Native browser scrolling and hit testing remain unverified.`);
