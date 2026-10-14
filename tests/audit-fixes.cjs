const fs=require('fs'),vm=require('vm'),assert=require('assert');const html=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8');let source=html.split('<script>')[1].split('</script>')[0],ia=source.indexOf('const intervalGame='),ca=source.indexOf('const chordGame=');source=source.slice(0,ia)+source.slice(ia,ca).replace('return {reset};',`return {reset,respond,next,hint,start(g,l,d,s,dir=1,stage=3){octave=g;level=l;journey().stage=stage;reset();pair=makePair(d,s,dir);beginQuestion()},state(){return {pair,step,finished,score,round,counters,usedHint,weak:weakDegrees,key:practiceKey()}},startRound(g,l,stage){octave=g;level=l;journey().stage=stage;reset()}};`)+source.slice(ca).replace('return {reset};',`return {reset,respond,next,hint,start(g,l,r){octave=g;level=l;reset();build(r);begin()},state(){return {root,tones,step,finished,score,round,counters,usedHint,symbolConfirmed,selected:[...selectedKeys],weak:weakChords,key:practiceKey()}},startRound(g,l){octave=g;level=l;reset()}};`);
const symbols=['C','Dm','Em','F','G','Am','Bdim'],symbolForms=[symbols,['C/E','Dm/F','Em/G','F/A','G/B','Am/C','Bdim/D'],['C/G','Dm/A','Em/B','F/C','G/D','Am/E','Bdim/F']],orders=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];let noteCases=0,intervalCases=0,chordCases=0,reviewRounds=0,audioClicks=0;
function setup(storedSound,storageAvailable=true,layout={}){const preferences=new Map(storedSound===undefined?[]:[['bobo-music-note-lab.sound',storedSound]]),localStorage={getItem(k){if(!storageAvailable)throw Error('storage unavailable');return preferences.get(k)??null},setItem(k,v){if(!storageAvailable)throw Error('storage unavailable');preferences.set(k,String(v))}};const els={},timers=new Map(),voices=[],voiceStarts=[],doc={activeElement:null};let timerId=0,clock=0;function element(id=''){let content='',buttons=[],scroller={scrollLeft:0};const e={style:{},attrs:{},get textContent(){return ['feedback','i-feedback','c-feedback','sound-toggle'].includes(id)?this.innerHTML.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'\"').replace(/&#39;/g,"'"):this._text||''},set textContent(value){this._text=String(value);if(id==='c-feedback')content=''},hidden:false,innerHTMLWrites:0,classList:{add(){},toggle(){}},setAttribute(k,v){this.attrs[k]=String(v)},removeAttribute(k){delete this.attrs[k]},focus(){doc.activeElement=this},querySelectorAll(q){return q==='[data-answer]'?buttons.filter(b=>b.dataset.answer!==undefined):q==='[data-ckey]'?buttons.filter(b=>b.dataset.ckey!==undefined):q==='[data-ikey]'?buttons.filter(b=>b.dataset.ikey!==undefined):q==='[data-canswer]'?buttons.filter(b=>b.dataset.canswer!==undefined):[]},querySelector(){return scroller},get innerHTML(){return ['feedback','i-feedback','c-feedback'].includes(id)?els[id+'-content']?.innerHTML??content:content},set innerHTML(value){this.innerHTMLWrites++;if(buttons.includes(doc.activeElement))doc.activeElement=null;content=value;buttons=[...value.matchAll(/<button class="([^"]*)" data-(ckey|ikey)="(\d+)" aria-label="([^"]*)" aria-pressed="(true|false)"><span class="key-number">([^<]*)<\/span>/g)].map(m=>{const attrs={'aria-pressed':m[5]},classes=new Set(m[1].split(' ')),number={textContent:m[6]};return {dataset:{[m[2]]:m[3]},attrs,classes,number,classList:{add(k){classes.add(k)},toggle(k,yes){yes?classes.add(k):classes.delete(k)}},setAttribute(k,v){attrs[k]=String(v)},querySelector(){return number},focus(){doc.activeElement=this}}});buttons.push(...[...value.matchAll(/<button class="([^"]*)"[^>]*data-answer="([^"]+)"[^>]*>([^<]*)<\/button>/g)].map(m=>{const attrs={},classes=new Set(m[1].split(' '));return {dataset:{answer:m[2]},attrs,classes,classList:{add(k){classes.add(k)},toggle(k,yes){yes?classes.add(k):classes.delete(k)}},setAttribute(k,v){attrs[k]=String(v)},focus(){doc.activeElement=this}}}));buttons.push(...[...value.matchAll(/<button class="([^"]*)" data-canswer="([^"]+)">([^<]+)<\/button>/g)].map(m=>{const attrs={},classes=new Set(m[1].split(' '));return {dataset:{canswer:m[2]},disabled:false,attrs,classes,classList:{toggle(k,yes){yes?classes.add(k):classes.delete(k)}},setAttribute(k,v){attrs[k]=String(v)},focus(){doc.activeElement=this}}}))}};return e}
const mapButtons=Array.from({length:3},(_,i)=>({...element(),dataset:{map:String(i+1)}}));Object.assign(doc,{getElementById:id=>els[id]??=element(id),querySelectorAll:q=>q==='[data-map]'?mapButtons:[],querySelector:q=>{const match=q.match(/^\[data-answer="([^"]+)"\]$/);return match?els.answers?.querySelectorAll('[data-answer]').find(b=>b.dataset.answer===match[1]):element()}});class AudioContext{constructor(){this.state='running';this.currentTime=0;this.sampleRate=48000;this.destination={}}resume(){return Promise.resolve()}createOscillator(){const o={frequency:{value:0},connect(){},disconnect(){},start(time){voices.push(o.frequency.value);voiceStarts.push(time??this.currentTime??0)},stop(time){if(time===undefined)o.onended?.()}};return o}createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}}
for(const id of ['reading-actions','i-reading-actions','c-reading-actions'])doc.getElementById(id);
const c={document:doc,window:{AudioContext,localStorage,...layout},setTimeout(fn,delay){const id=++timerId;timers.set(id,{fn,delay,due:clock+delay,cancelled:false,fired:false});return id},clearTimeout(id){if(timers.has(id))timers.get(id).cancelled=true}};vm.createContext(c);vm.runInContext(source,c);const run=s=>vm.runInContext(s,c);function advance(ms){const target=clock+ms;while(true){const t=[...timers.values()].filter(t=>!t.cancelled&&!t.fired&&t.due<=target).sort((a,b)=>a.due-b.due)[0];if(!t)break;clock=t.due;t.fired=true;t.fn()}clock=target}return {c,els,doc,mapButtons,timers,voices,voiceStarts,run,advance,preferences}}
const {run,advance,els,doc,mapButtons,timers,voices,voiceStarts}=setup();const state=game=>run(game+'.state()');const sum=cs=>cs.reduce((n,c)=>n+c.right+c.guided+c.retried,0);
// The reported E4/G4/B4 keys must still sound after the chord is complete.
{
 const env=setup();env.mapButtons[2].onclick();env.run('chordGame.start(4,0,2);chordGame.respond("answer","Em")');env.els['c-enter-keys'].onclick();
 const tap=midi=>{const key=env.els['c-keyboard'].querySelectorAll('[data-ckey]').find(b=>Number(b.dataset.ckey)===midi);assert.ok(key);env.els['c-keyboard'].onclick({target:{closest:()=>key}})};
 for(const midi of [71,64,67])tap(midi);
 assert.equal(env.run('chordGame.state().finished'),true);
 const before=env.voices.length;tap(71);tap(71);assert.equal(env.voices.length-before,8);
 for(let i=0;i<8;i++)assert.ok(Math.abs(env.voices[before+i]-493.8833012561241*(i%4+1))<1e-8);
 assert.equal(env.run('chordGame.state().selected.length'),3);
 env.els['sound-toggle'].onclick();const muted=env.voices.length;tap(71);
 assert.equal(env.voices.length,muted);assert.equal(env.els['c-audio-notice'].hidden,false);assert.ok(env.els['c-audio-notice'].textContent.includes('声音已关闭'));
 env.els['sound-toggle'].onclick();assert.equal(env.els['c-audio-notice'].hidden,true);tap(71);assert.equal(env.voices.length,muted+4);
 for(const prefix of ['', 'i-']){
  const quiet=setup('off');
  if(prefix===''){
   quiet.run('mode=2;group=4;reset();current=0;render()');
   const key=quiet.els.answers.querySelectorAll('[data-answer]').find(b=>b.dataset.answer==='0');
   quiet.els.answers.onclick({target:{closest:()=>key}});
  }else{
   quiet.mapButtons[1].onclick();quiet.run('intervalGame.start(4,2,3,0)');
   const key=quiet.els['i-keyboard'].querySelectorAll('[data-ikey]').find(b=>Number(b.dataset.ikey)===30);
   quiet.els['i-keyboard'].onclick({target:{closest:()=>key}});
  }
  assert.equal(quiet.voices.length,0);assert.equal(quiet.els[prefix+'audio-notice'].hidden,false);
  assert.ok(quiet.els[prefix+'audio-notice'].textContent.includes('声音已关闭'));
 }
 console.log('Reported B4 replay passed after chord completion; muted clicks explain how to enable sound across all three maps and retain scoring.');
}
// Layout APIs are simulated here; these are interaction checks, not a mobile browser test.
function mobileEnvironment({phone=true,reduced=false,visible=false}={}){
 const changes=[],media={matches:phone,addEventListener(type,fn){changes.push(fn)}};
 const env=setup(undefined,true,{matchMedia:q=>q.includes('max-width')?media:{matches:reduced},innerHeight:640}),frames=[],scrolls=[];
 for(const prefix of ['', 'i-', 'c-'])for(const target of ['feedback','question']){
   const e=env.els[prefix+target];e.getBoundingClientRect=()=>visible?{top:100,bottom:220}:{top:-160,bottom:-20};
   e.scrollIntoView=options=>scrolls.push({id:prefix+target,...options});
 }
 for(const id of ['answers','i-keyboard','c-keyboard'])env.els[id].querySelector=()=>null;
 env.c.window.requestAnimationFrame=fn=>frames.push(fn);
 return {...env,media,changes,frames,scrolls,flush(){while(frames.length)frames.shift()()}};
}
for(const prefix of ['', 'i-', 'c-']){
 const env=mobileEnvironment(),{run,els}=env;
 if(prefix==='')run('mode=1;group=4;reset();current=0;render()');
 else if(prefix==='i-'){env.mapButtons[1].onclick();run('intervalGame.start(4,0,3,0)')}
 else{env.mapButtons[2].onclick();run('chordGame.start(4,0,0)')}
 env.flush();env.scrolls.length=0;
 const respond=()=>prefix===''?run('answer(0)'):prefix==='i-'?run('intervalGame.respond("degree",3)'):run('chordGame.respond("answer","C")');
 respond();env.flush();assert.equal(env.scrolls.length,1);assert.equal(env.scrolls[0].id,prefix+'feedback');assert.equal(env.scrolls[0].behavior,'smooth');
 respond();env.flush();assert.equal(env.scrolls.length,1); // Replaying does not move the page again.
 if(prefix==='c-'){
   els['c-enter-keys'].onclick();env.flush();assert.equal(env.scrolls.at(-1).id,'c-question');
   assert.equal(run('chordGame.state().step'),1);assert.ok(els['c-relations'].innerHTML.includes('<details class="relation-details">'));
   assert.ok(els['c-relations'].innerHTML.includes('原位关系'));assert.ok(els['c-relations'].innerHTML.includes('本题排列'));
   const before=env.scrolls.length;run('chordGame.respond("key",67);chordGame.respond("key",60)');env.flush();assert.equal(env.scrolls.length,before);
   run('chordGame.respond("key",64)');env.flush();assert.equal(env.scrolls.at(-1).id,'c-feedback');assert.equal(run('chordGame.state().finished'),true);
 }
 const beforeNext=env.scrolls.length;els[prefix+'next'].onclick();env.flush();assert.equal(env.scrolls.length,beforeNext+1);assert.equal(env.scrolls.at(-1).id,prefix+'question');
 assert.equal(els[prefix+'next'].hidden,true);
}
for(const options of [{visible:true},{phone:false},{reduced:true}]){
 const env=mobileEnvironment(options);env.run('mode=1;reset();current=0;render()');env.flush();env.scrolls.length=0;env.run('answer(0)');env.flush();
 assert.equal(env.scrolls.length,options.reduced?1:0);if(options.reduced)assert.equal(env.scrolls[0].behavior,'auto');
}
const resetDuringFrame=mobileEnvironment();resetDuringFrame.run('mode=1;reset();current=0;render();answer(0);reset()');resetDuringFrame.flush();
assert.ok(resetDuringFrame.scrolls.every(s=>s.id==='question'));
const switchDuringFrame=mobileEnvironment();switchDuringFrame.run('mode=1;reset();current=0;render();answer(0)');switchDuringFrame.mapButtons[1].onclick();switchDuringFrame.flush();assert.equal(switchDuringFrame.scrolls.length,0);
const rotate=mobileEnvironment(),relationDetails={open:false};rotate.els['c-relations'].querySelector=()=>relationDetails;
rotate.media.matches=false;rotate.changes.forEach(fn=>fn());assert.equal(relationDetails.open,true);rotate.media.matches=true;rotate.changes.forEach(fn=>fn());assert.equal(relationDetails.open,false);
const observed=[],unobserved=[],resizeCallbacks=[],overflowFrames=[];
class ResizeObserver{constructor(fn){resizeCallbacks.push(fn)}observe(node){observed.push(node)}unobserve(node){unobserved.push(node)}}
const overflowEnv=setup(undefined,true,{ResizeObserver});overflowEnv.c.window.requestAnimationFrame=fn=>overflowFrames.push(fn);
function scrollNode(width,total){const classes=new Set(),listeners={};return {clientWidth:width,scrollWidth:total,scrollLeft:0,classes,listeners,classList:{toggle(k,on){on?classes.add(k):classes.delete(k)}},addEventListener(type,fn){listeners[type]=fn}}}
let scrollNodeNow=scrollNode(300,440);const overflowHint={hidden:true},layoutRoot={querySelector:q=>q==='.keyboard-scroll'?scrollNodeNow:overflowHint};overflowEnv.c.layoutRoot=layoutRoot;
const refresh=()=>{overflowEnv.run('refreshKeyboardHints(layoutRoot)');while(overflowFrames.length)overflowFrames.shift()()};refresh();
assert.equal(overflowHint.hidden,false);assert.equal(scrollNodeNow.classes.has('can-scroll-left'),false);assert.equal(scrollNodeNow.classes.has('can-scroll-right'),true);
scrollNodeNow.scrollLeft=70;scrollNodeNow.listeners.scroll();assert.equal(scrollNodeNow.classes.has('can-scroll-left'),true);assert.equal(scrollNodeNow.classes.has('can-scroll-right'),true);
scrollNodeNow.scrollLeft=140;scrollNodeNow.listeners.scroll();assert.equal(scrollNodeNow.classes.has('can-scroll-right'),false);
scrollNodeNow.clientWidth=480;resizeCallbacks[0]([{target:scrollNodeNow}]);assert.equal(overflowHint.hidden,true);assert.equal(scrollNodeNow.classes.size,0);
const oldScroller=scrollNodeNow;scrollNodeNow=scrollNode(0,0);refresh();assert.equal(overflowHint.hidden,true);assert.ok(unobserved.includes(oldScroller));
scrollNodeNow.clientWidth=280;scrollNodeNow.scrollWidth=352;resizeCallbacks[0]([{target:scrollNodeNow}]);assert.equal(overflowHint.hidden,false);assert.ok(observed.includes(scrollNodeNow));
scrollNodeNow=null;refresh();assert.ok(unobserved.length===2);
console.log('Phone layout interactions passed in DOM simulation: completion/next-step visibility, no repeated replay scrolling, reduced motion, reset/map-switch cancellation, responsive chord details, overflow hints, edge indicators and observer cleanup. Real-device layout, swipe and audio remain unverified.');
function solveNote(){run('while(!done){const stage=activeStage();answer(stage===0?(phase===0?(notes[current].line?"line":"space"):notes[current].pos):current)}')}
// Read the clef before its location, including intermediate combined-note feedback.
for(const [g,target,clef,position] of [
 [4,0,'高音谱表','下加一线'],[4,4,'高音谱表','第二线'],[3,0,'低音谱表','第二间'],
 [2,0,'低音谱表','下加二线'],[5,6,'高音谱表','上加二间'],[6,0,'高音谱表','上加二线'],[6,6,'高音谱表','上加五线']
])for(const level of [0,3]){
 const env=setup();env.run(`group=${g};mode=${level};reset();current=${target};render();answer(notes[current].line?'line':'space');answer(${JSON.stringify(position)})`);
 const spoken=env.els.feedback.textContent;
 assert.ok(spoken.includes('一起朗读：'+clef+position),`Reading sequence must be clef then location: ${spoken}`);
 assert.equal(env.els.next.hidden,level===3);
}
console.log('Position reading order passed 14 treble/bass/ledger cases in position and combined-note levels.');
// Finish the fourth combined-note step by clicking actual keyboard buttons.
// The continuation container must follow the same explicit ready state as its button.
let combinedContinuationCases=0;
for(const g of [2,3,4,5,6])for(let target=0;target<7;target++){
 const env=setup(),{run,els}=env;
 run(`group=${g};mode=3;reset();current=${target};render()`);
 for(const command of ['answer(notes[current].line?"line":"space")','answer(notes[current].pos)',`answer(${target})`]){
  run(command);assert.equal(els.next.hidden,true);assert.equal(els['reading-actions'].hidden,true);assert.equal(els.feedback.attrs['data-actions-ready'],'false');
 }
 assert.equal(run('phase'),3);assert.equal(els.step.textContent,'第4步 / 共4步 · 找琴键');
 const nodes=els.answers.querySelectorAll('[data-answer]'),correctKey=nodes.find(b=>Number(b.dataset.answer)===target),wrongKey=nodes.find(b=>Number(b.dataset.answer)!==target);
 els.answers.onclick({target:{closest:()=>wrongKey}});assert.equal(els.next.hidden,true);assert.equal(els['reading-actions'].hidden,true);
 els.answers.onclick({target:{closest:()=>correctKey}});
 assert.equal(run('done'),true);assert.equal(els.next.hidden,false);assert.equal(els.next.disabled,false);
 assert.equal(els['reading-actions'].hidden,false);assert.equal(els.feedback.attrs['data-actions-ready'],'true');assert.equal(els.feedback.attrs['data-actions-kind'],'next');
 assert.ok(els.feedback.textContent.includes(run('notes[current].name')));
 els.answers.onclick({target:{closest:()=>correctKey}});assert.equal(els.next.hidden,false);assert.equal(els['reading-actions'].hidden,false);
 els.next.onclick();assert.equal(els.next.hidden,true);assert.equal(els['reading-actions'].hidden,true);assert.equal(els.feedback.attrs['data-actions-ready'],'false');
 combinedContinuationCases++;
}
console.log(`Combined-note fourth-step continuation passed ${combinedContinuationCases} keyboard-click cases, including wrong key, correct key, replay and next-question reset.`);
function click(node){const start=voices.length,midi=Number(node.dataset.ckey);els['c-keyboard'].onclick({target:{closest:()=>node}});assert.equal(voices.length-start,4);const f=440*2**((midi-69)/12);for(let h=1;h<=4;h++)assert.ok(Math.abs(voices[start+h-1]-f*h)<1e-8);audioClicks++}
for(const g of [2,3,4,5,6])for(let l=0;l<4;l++)for(let r=0;r<7;r++)for(let variant=0;variant<4;variant++){
 run(`group=${g};mode=${l};reset();current=${r};render()`);assert.equal(run('usedHint'),false);if(variant===1||variant===3)run('hint();hint()');if(variant>=2)run('answer("wrong");answer("wrong")');solveNote();const cs=run('stats'),kind=variant===0?'right':variant===1?'guided':'retried';assert.equal(cs[r][kind],1);assert.equal(sum(cs),1);assert.equal(run('correct'),variant===0?1:0);assert.equal(cs[r].wrong,variant>=2?1:0);run('hint();answer("wrong")');assert.equal(sum(run('stats')),1);assert.ok(els.feedback.textContent.includes('一起朗读'));noteCases++
}
for(const g of [2,3,4,5,6])for(let l=0;l<4;l++)for(let degree=1;degree<=8;degree++)for(const dir of [-1,1])for(let variant=0;variant<4;variant++){
 run(`intervalGame.start(${g},${l},${degree},0,${dir})`);const p=state('intervalGame').pair;if(variant===1||variant===3)run('intervalGame.hint();intervalGame.hint()');if(variant>=2)run(`intervalGame.respond('${l<2||l===3?'degree':'key'}',-1);intervalGame.respond('${l<2||l===3?'degree':'key'}',-1)`);const seq=l===3?[['degree',degree],['key',p.a.d],['key',p.b.d]]:[[l<=1?'degree':'key',l<=1?degree:p.b.d]];for(const [t,v] of seq)run(`intervalGame.respond('${t}',${v})`);const st=state('intervalGame'),kind=variant===0?'right':variant===1?'guided':'retried';assert.equal(st.counters[degree-1][kind],1);assert.equal(sum(st.counters),1);assert.equal(st.score,variant===0?1:0);assert.equal(st.counters[degree-1].wrong,variant>=2?1:0);assert.equal(st.finished,true);run('intervalGame.hint();intervalGame.respond("degree",-1)');assert.equal(sum(state('intervalGame').counters),1);intervalCases++
}
for(const g of [2,3,4,5,6])for(let l=0;l<3;l++)for(let r=0;r<7;r++)for(const order of orders)for(let variant=0;variant<4;variant++){
 run(`chordGame.start(${g},${l},${r})`);if(variant===1||variant===3)run('chordGame.hint();chordGame.hint()');if(variant>=2)run('chordGame.respond("answer","wrong");chordGame.respond("answer","wrong")');run(`chordGame.respond('answer','${symbolForms[l][r]}')`);els['c-enter-keys'].onclick();const st=state('chordGame'),nodes=els['c-keyboard'].querySelectorAll('[data-ckey]'),writes=els['c-keyboard'].innerHTMLWrites,panel=els['c-relations'].innerHTML;
 const low=st.tones[0].d-1,expectedBlack=nodes.slice(0,-1).filter((_,i)=>[0,1,3,4,5].includes((low+i)%7)).length;assert.equal((els['c-keyboard'].innerHTML.match(/class="black" aria-hidden="true"/g)||[]).length,expectedBlack);assert.ok(!els['c-keyboard'].innerHTML.includes('data-cblack'));if(variant>=2){const wrong=nodes.find(n=>!st.tones.some(t=>t.midi===Number(n.dataset.ckey)));click(wrong);assert.equal(state('chordGame').selected.length,0)}
 for(let i=0;i<3;i++){const n=st.tones[order[i]],node=nodes.find(b=>Number(b.dataset.ckey)===n.midi);node.focus();click(node);assert.equal(doc.activeElement,node);assert.equal(els['c-keyboard'].innerHTMLWrites,writes);assert.equal(node.attrs['aria-pressed'],'true');assert.equal(node.number.textContent,'✓');assert.ok(node.classes.has('mark'));click(node);assert.equal(state('chordGame').selected.length,i+1);assert.equal(els['c-relations'].innerHTML,panel);assert.equal(state('chordGame').finished,i===2)}
 const done=state('chordGame'),kind=variant===0?'right':variant===1?'guided':'retried';assert.equal(done.counters[r][kind],1);assert.equal(sum(done.counters),1);assert.equal(done.score,variant===0?1:0);assert.equal(done.counters[r].wrong,variant>=2?1:0);assert.equal(els['c-next'].disabled,false);run('chordGame.hint()');assert.equal(sum(state('chordGame').counters),1);chordCases++
}
// Independent staff/key/label mapping, rather than assuming the generated MIDI is correct.
const letters=['C','D','E','F','G','A','B'],whiteSemitones=[0,2,4,5,7,9,11];
const expectedMidi=d=>12*(Math.floor(d/7)+1)+whiteSemitones[d%7];
const traditionalNotes=[
 ['C₂','D₂','E₂','F₂','G₂','A₂','B₂'],
 ['C₁','D₁','E₁','F₁','G₁','A₁','B₁'],
 ['C','D','E','F','G','A','B'],
 ['c','d','e','f','g','a','b'],
 ['c¹','d¹','e¹','f¹','g¹','a¹','b¹'],
 ['c²','d²','e²','f²','g²','a²','b²'],
 ['c³','d³','e³','f³','g³','a³','b³'],
 ['c⁴','d⁴','e⁴','f⁴','g⁴','a⁴','b⁴'],
 ['c⁵','d⁵','e⁵','f⁵','g⁵','a⁵','b⁵']
];
const expectedName=d=>traditionalNotes[Math.floor(d/7)][d%7];
const expectedKeyboardName=d=>letters[d%7]+Math.floor(d/7);
// Traditional pitch notation must reach the visible choices and structured reading card.
const notation=setup(),groupNames={2:'大字组',3:'小字组',4:'小字一组',5:'小字二组',6:'小字三组'};
for(const g of [2,3,4,5,6]){
 const label=`第${g}组（${groupNames[g]}）`;
 assert.equal(html.split(`${label}· C${g}—B${g}`).length-1,3);
 for(let i=0;i<7;i++){
  notation.run(`group=${g};mode=1;reset();current=${i};render();hint()`);
  const choices=[...notation.els.answers.innerHTML.matchAll(/data-answer="\d+">([^<]+)<\/button>/g)].map(m=>m[1]);
  assert.deepEqual(choices,traditionalNotes[g]);
  assert.ok(notation.els.feedback.textContent.includes(traditionalNotes[g].join('、')));
  assert.ok(notation.els.level.textContent.includes(label));
  assert.ok(notation.els.range.textContent.includes(`${label} ${traditionalNotes[g][0]}—${traditionalNotes[g][6]}`));
  const before=notation.voices.length;notation.run(`answer(${i})`);
  assert.equal(notation.voices.length,before+1);
  assert.ok(Math.abs(notation.voices[before]-440*2**((expectedMidi(g*7+i)-69)/12))<1e-8);
  const reading=notation.els['feedback-content'].innerHTML;
  assert.ok(reading.includes(`<strong class="reading-symbol">${traditionalNotes[g][i]}</strong>`));
  assert.ok(reading.includes('class="reading-solfege"'));assert.ok(reading.includes('class="reading-detail"'));
  assert.ok(notation.els.stats.innerHTML.includes(`<td>${traditionalNotes[g][i]} ·`));
 }
}
// Cross-group intervals cover lower subscripts, upper superscripts and both cases.
for(const [g,start,sign,a,b] of [[2,0,-1,'C','C₁'],[3,6,1,'b','b¹'],[4,0,-1,'c¹','c'],[6,6,1,'b³','b⁴']]){
 notation.run(`intervalGame.start(${g},0,8,${start},${sign});intervalGame.respond('degree',8)`);
 const reading=notation.els['i-feedback-content'].innerHTML;
 assert.ok(reading.includes(`<span class="reading-notes">${a} → ${b}</span>`));
 assert.ok(reading.includes('class="reading-detail"'));
}
for(const [g,bass,tones] of [[2,'E₁',['E₁','G₁','C']],[4,'e',['e','g','c¹']],[6,'e²',['e²','g²','c³']]]){
 notation.run(`chordGame.start(${g},1,0);chordGame.hint()`);
 assert.ok(notation.els['c-feedback'].textContent.includes(`最低音是${bass}`));
 assert.ok(notation.els['c-feedback'].textContent.includes('斜线后写大写字母E，不写音组'));
 notation.run('chordGame.respond("answer","C/E")');notation.els['c-enter-keys'].onclick();
 assert.ok(notation.els['c-relations'].innerHTML.includes(`<strong>${bass}</strong>`));
 const state=notation.run('chordGame.state()');
 assert.deepEqual(Array.from(state.tones,n=>n.name),tones);
 for(const n of state.tones)notation.run(`chordGame.respond('key',${n.midi})`);
 const reading=notation.els['c-feedback-content'].innerHTML;
 assert.ok(reading.includes('<strong class="reading-symbol">C/E</strong>'));
 assert.ok(reading.includes(`<span class="reading-notes">${tones.join(' · ')}</span>`));
 assert.ok(notation.els['c-stats'].innerHTML.includes(`C/E · 根音${traditionalNotes[g][0]}`));
}
console.log('Traditional pitch notation passed: all 15 group labels, 35 note choices/readings/frequencies, cross-group intervals including C₁ and b⁴, and inversion hints/readings with unchanged uppercase modern chord symbols.');
let independentMappings=0,retainedProgressCases=0;
for(const g of [2,3,4,5,6])for(let l=0;l<3;l++)for(let r=0;r<7;r++){
 run(`chordGame.start(${g},${l},${r})`);
 const expected=[0,2,4].map((offset,role)=>g*7+r+offset-((l===1&&role!==0||l===2&&role===2)?7:0)).sort((a,b)=>a-b),st=state('chordGame');
 assert.deepEqual(Array.from(st.tones,t=>t.midi),expected.map(expectedMidi));
 assert.deepEqual(Array.from(st.tones,t=>t.name),expected.map(expectedName));
 const staff=[...els['c-staff'].innerHTML.matchAll(/<ellipse data-note="([^"]+)" data-midi="(\d+)"/g)];
 assert.deepEqual(staff.map(m=>[m[1],Number(m[2])]),expected.map(d=>[expectedName(d),expectedMidi(d)]));
 const options=[...els['c-answers'].innerHTML.matchAll(/data-canswer="([^"]+)">([^<]+)<\/button>/g)];
 assert.deepEqual(options.map(m=>m[1]),symbolForms[l]);assert.deepEqual(options.map(m=>m[2]),symbolForms[l]);
 assert.ok(els['c-question'].textContent.includes('现代记号'));
 const correctSymbol=symbolForms[l][r];
 if(l>0){assert.equal(correctSymbol.split('/')[1],letters[expected[0]%7]);run(`chordGame.respond('answer','${symbols[r]}')`);assert.equal(state('chordGame').step,0)}
 const incorrectSymbol=l===0?symbols[(r+1)%7]:`${symbols[r]}/${letters[(expected[0]+1)%7]}`;
 run(`chordGame.respond('answer','${incorrectSymbol}')`);assert.equal(state('chordGame').step,0);assert.equal(els['c-next'].disabled,true);
 run(`chordGame.respond('answer','${symbolForms[l][r]}')`);els['c-enter-keys'].onclick();
 assert.equal(state('chordGame').step,1);assert.ok(els['c-feedback'].textContent.includes(correctSymbol));assert.ok(els['c-relations'].innerHTML.includes(correctSymbol));assert.ok(els['c-stats'].innerHTML.includes(correctSymbol));
 const low=expected[0]-1,nodes=els['c-keyboard'].querySelectorAll('[data-ckey]');
 nodes.forEach((node,j)=>{const d=low+j;assert.equal(Number(node.dataset.ckey),expectedMidi(d));assert.ok(els['c-keyboard'].innerHTML.includes(`aria-label="${expectedKeyboardName(d)}白键，点击听音"`));assert.ok(els['c-keyboard'].innerHTML.includes(`<span class="key-name">${expectedKeyboardName(d)}</span>`));independentMappings++});
 // All touch targets have a 44px minimum, with scrollable overflow rather than shrinking.
 assert.ok(els['c-keyboard'].innerHTML.includes(`--keyboard-width:${nodes.length*44}px`));
}
// A correct first-step answer plays the displayed voicing, then waits for manual entry.
let chordVoicingCases=0;
for(const g of [2,3,4,5,6])for(let l=0;l<3;l++)for(let r=0;r<7;r++){
 run(`chordGame.start(${g},${l},${r})`);
 const expected=[0,2,4].map((offset,role)=>g*7+r+offset-((l===1&&role!==0||l===2&&role===2)?7:0)).sort((a,b)=>a-b);
 const before=voices.length,startIndex=voiceStarts.length,oldEpoch=run('soundEpoch');
 els['c-answers'].onclick({target:{closest:()=>({dataset:{canswer:symbolForms[l][(r+1)%7]}})}});
 assert.equal(voices.length,before);assert.equal(state('chordGame').step,0);
 els['c-answers'].onclick({target:{closest:()=>({dataset:{canswer:symbolForms[l][r]}})}});
 assert.equal(voices.length-before,12);assert.equal(run('activeVoices.size'),12);assert.equal(run('soundEpoch'),oldEpoch+1);
 assert.equal(new Set(voiceStarts.slice(startIndex)).size,1);assert.equal(run('pendingSounds.size'),0);
 const expectedFrequencies=expected.flatMap(d=>[1,2,3,4].map(h=>440*2**((expectedMidi(d)-69)/12)*h));
 voices.slice(before).forEach((f,i)=>assert.ok(Math.abs(f-expectedFrequencies[i])<1e-8));
 assert.equal(state('chordGame').step,0);assert.equal(els['c-reading-actions'].hidden,false);assert.equal(els['c-enter-keys'].disabled,false);assert.equal(els['c-enter-keys'].hidden,false);assert.equal(els['c-next'].hidden,true);assert.equal(els['c-footer'].hidden,true);assert.equal(els['c-keyboard'].hidden,true);
 const answers=els['c-answers'].querySelectorAll('[data-canswer]'),correctButton=answers.find(b=>b.dataset.canswer===symbolForms[l][r]),writes=els['c-answers'].innerHTMLWrites;
 assert.equal(correctButton.disabled,false);assert.ok(correctButton.classes.has('answer-correct'));assert.equal(correctButton.attrs['aria-pressed'],'true');assert.ok(answers.filter(b=>b!==correctButton).every(b=>b.disabled));
 correctButton.focus();advance(60000);assert.equal(state('chordGame').step,0);assert.ok(els['c-feedback'].textContent.includes('一起朗读'));const repeatStart=voices.length;
 els['c-answers'].onclick({target:{closest:()=>correctButton}});assert.equal(voices.length-repeatStart,12);assert.equal(run('activeVoices.size'),12);
 voices.slice(repeatStart).forEach((f,i)=>assert.ok(Math.abs(f-expectedFrequencies[i])<1e-8));advance(60000);assert.equal(state('chordGame').step,0);
 assert.equal(doc.activeElement,correctButton);assert.equal(els['c-answers'].innerHTMLWrites,writes);assert.equal(sum(state('chordGame').counters),0);
 const lockedFeedback=els['c-feedback'].innerHTML,beforeWrong=voices.length;els['c-answers'].onclick({target:{closest:()=>answers.find(b=>b!==correctButton)}});assert.equal(voices.length,beforeWrong);assert.equal(els['c-feedback'].innerHTML,lockedFeedback);
 run('chordGame.hint()');assert.equal(els['c-feedback'].innerHTML,lockedFeedback);
 const entryVoices=voices.length;els['c-enter-keys'].focus();els['c-enter-keys'].onclick();assert.equal(voices.length,entryVoices);assert.equal(state('chordGame').step,1);assert.equal(els['c-keyboard'].hidden,false);assert.equal(els['c-reading-actions'].hidden,true);assert.equal(els['c-feedback'].attrs['data-actions-ready'],'false');assert.equal(els['c-enter-keys'].disabled,true);assert.equal(els['c-enter-keys'].hidden,true);assert.equal(els['c-footer'].hidden,false);assert.equal(doc.activeElement,els['c-staff']);assert.equal(state('chordGame').selected.length,0);assert.equal(state('chordGame').finished,false);assert.equal(state('chordGame').score,0);assert.equal(els['c-next'].disabled,true);const keyWrites=els['c-keyboard'].innerHTMLWrites;els['c-enter-keys'].onclick();assert.equal(els['c-keyboard'].innerHTMLWrites,keyWrites);
 assert.ok(els['c-relations'].innerHTML.includes('data-chord-listen'));assert.equal(els['c-staff'].attrs.role,'button');assert.equal(els['c-staff'].attrs.tabindex,'0');
 const replayBefore=voices.length;els['c-relations'].onclick({target:{closest:()=>({})}});assert.equal(voices.length-replayBefore,12);voices.slice(replayBefore).forEach((f,i)=>assert.ok(Math.abs(f-expectedFrequencies[i])<1e-8));
 const staffBefore=voices.length;els['c-staff'].onclick();assert.equal(voices.length-staffBefore,12);voices.slice(staffBefore).forEach((f,i)=>assert.ok(Math.abs(f-expectedFrequencies[i])<1e-8));
 let prevented=false;const keyBefore=voices.length;els['c-staff'].onkeydown({key:'Enter',preventDefault(){prevented=true}});assert.equal(prevented,true);assert.equal(voices.length-keyBefore,12);
 assert.equal(state('chordGame').selected.length,0);assert.equal(state('chordGame').score,0);assert.equal(els['c-next'].disabled,true);
 const nodes=els['c-keyboard'].querySelectorAll('[data-ckey]');
 for(let i=0;i<3;i++){
   click(nodes.find(n=>Number(n.dataset.ckey)===expectedMidi(expected[i])));
   const shown=[...els['c-staff'].innerHTML.matchAll(/<ellipse data-note="[^"]+" data-midi="(\d+)" data-role="\d+" data-diatonic="\d+" data-confirmed="(true|false)"[^>]+fill="([^"]+)"/g)];
   assert.deepEqual(shown.filter(m=>m[2]==='true').map(m=>Number(m[1])),expected.slice(0,i+1).map(expectedMidi));
   assert.ok(shown.filter(m=>m[2]==='true').every(m=>m[3]==='#147a58'));
   assert.ok(els['c-staff'].innerHTML.includes(' '+expectedName(expected[i])+'</text>'));
 }
 run('chordGame.next()');assert.equal(run('activeVoices.size'),0);chordVoicingCases++;
}
const quietChord=setup('off');quietChord.run('chordGame.start(4,1,0)');quietChord.els['c-answers'].onclick({target:{closest:()=>({dataset:{canswer:'C/E'}})}});
assert.equal(quietChord.voices.length,0);assert.equal(quietChord.run('chordGame.state().step'),0);quietChord.els['c-enter-keys'].onclick();assert.equal(quietChord.run('chordGame.state().step'),1);assert.equal(quietChord.run('chordGame.state().selected.length'),0);assert.equal(quietChord.els['c-next'].disabled,true);
const failedChord=setup();failedChord.run('chordGame.start(4,0,0);audio=undefined;window.AudioContext=undefined');failedChord.els['c-answers'].onclick({target:{closest:()=>({dataset:{canswer:'C'}})}});
assert.equal(failedChord.run('chordGame.state().step'),0);assert.equal(failedChord.els['c-audio-notice'].hidden,false);failedChord.els['c-enter-keys'].onclick();assert.equal(failedChord.run('chordGame.state().step'),1);assert.equal(failedChord.els['c-next'].disabled,true);
// Mute, resetting and switching maps immediately cancel the entire voicing.
const cancelChord=setup();cancelChord.run('chordGame.start(4,2,0);chordGame.respond("answer","C/G")');assert.equal(cancelChord.run('activeVoices.size'),12);
cancelChord.els['sound-toggle'].onclick();assert.equal(cancelChord.run('activeVoices.size'),0);cancelChord.els['sound-toggle'].onclick();cancelChord.run('chordGame.start(4,2,0);chordGame.respond("answer","C/G")');
cancelChord.mapButtons[1].onclick();assert.equal(cancelChord.run('activeVoices.size'),0);cancelChord.run('chordGame.start(4,2,0);chordGame.respond("answer","C/G");chordGame.reset()');assert.equal(cancelChord.run('activeVoices.size'),0);
console.log(`Passed ${chordVoicingCases} first-step chord audio cases: exact displayed pitches and inversions, simultaneous start, all three sustained notes, silent wrong answers, mute, audio failure, cancellation and second-step staff highlighting.`);
// Manual progression survives map switches and cannot skip an unanswered or reset question.
const manualChord=setup();manualChord.mapButtons[2].onclick();manualChord.run('chordGame.start(4,0,0)');
assert.equal(manualChord.els['c-reading-actions'].hidden,true);assert.equal(manualChord.els['c-enter-keys'].disabled,true);assert.equal(manualChord.els['c-enter-keys'].hidden,true);
const entryClick=manualChord.els['c-enter-keys'].onclick;entryClick();assert.equal(manualChord.run('chordGame.state().step'),0);
manualChord.run('chordGame.respond("answer","wrong")');assert.equal(manualChord.els['c-reading-actions'].hidden,true);entryClick();assert.equal(manualChord.run('chordGame.state().step'),0);
manualChord.run('chordGame.respond("answer","C")');manualChord.advance(60000);assert.equal(manualChord.run('chordGame.state().step'),0);
manualChord.mapButtons[0].onclick();assert.equal(manualChord.run('activeVoices.size'),0);manualChord.advance(60000);manualChord.mapButtons[2].onclick();
assert.equal(manualChord.run('chordGame.state().step'),0);assert.equal(manualChord.els['c-enter-keys'].disabled,false);assert.equal(manualChord.els['c-enter-keys'].hidden,false);assert.equal(manualChord.els['c-next'].hidden,true);assert.equal(manualChord.els['c-reading-actions'].hidden,false);
assert.ok(manualChord.els['c-feedback'].textContent.includes('一起朗读'));manualChord.advance(60000);assert.equal(manualChord.run('chordGame.state().step'),0);
manualChord.run('chordGame.start(3,1,0)');entryClick();assert.equal(manualChord.run('chordGame.state().step'),0);assert.equal(manualChord.run('chordGame.state().symbolConfirmed'),false);assert.equal(manualChord.els['c-reading-actions'].hidden,true);assert.equal(manualChord.els['c-footer'].hidden,false);
manualChord.run('chordGame.respond("answer","C/E")');manualChord.els['sound-toggle'].onclick();manualChord.advance(60000);assert.equal(manualChord.run('chordGame.state().step'),0);
const silentEntry=manualChord.voices.length;entryClick();assert.equal(manualChord.voices.length,silentEntry);assert.equal(manualChord.run('chordGame.state().step'),1);
const manualWrites=manualChord.els['c-keyboard'].innerHTMLWrites;entryClick();assert.equal(manualChord.els['c-keyboard'].innerHTMLWrites,manualWrites);assert.equal(manualChord.run('chordGame.state().selected.length'),0);
console.log('Manual progression passed: stays on step one until the button is clicked, repeat listening, locked alternatives, no duplicate scoring, focus transfer, double-click protection, reset guards, map-switch retention and mute-independent entry.');
// Errors between correct choices retain progress; repeating a found key clears misleading errors.
for(const order of orders)for(const failAt of [1,2]){
 run('chordGame.start(4,1,0);chordGame.respond("answer","C/E")');els['c-enter-keys'].onclick();
 const st=state('chordGame'),nodes=els['c-keyboard'].querySelectorAll('[data-ckey]'),writes=els['c-keyboard'].innerHTMLWrites;
 const wrong=nodes.find(n=>!st.tones.some(t=>t.midi===Number(n.dataset.ckey)));
 for(let i=0;i<3;i++){
  if(i===failAt){
   click(wrong);assert.equal(state('chordGame').selected.length,i);assert.equal(wrong.number.textContent,'×');assert.ok(wrong.classes.has('miss'));assert.equal(wrong.attrs['aria-pressed'],'false');assert.ok(els['c-feedback'].textContent.includes('不是本题'));assert.equal(els['c-next'].disabled,true);
   const already=nodes.find(n=>Number(n.dataset.ckey)===st.tones[order[0]].midi);click(already);assert.equal(state('chordGame').selected.length,i);assert.ok(els['c-feedback'].textContent.includes('不重复计数'));assert.ok(!wrong.classes.has('miss'));assert.equal(wrong.number.textContent,'');
  }
  const node=nodes.find(n=>Number(n.dataset.ckey)===st.tones[order[i]].midi);click(node);
  assert.ok(els['c-step'].textContent.endsWith(`${i+1} / 3`));assert.equal(els['c-next'].disabled,i<2);assert.ok(run('activeVoices.size')<=4);
 }
 assert.equal(els['c-keyboard'].innerHTMLWrites,writes);assert.equal(state('chordGame').score,0);assert.equal(state('chordGame').counters[0].retried,1);
 const feedback=els['c-feedback'].textContent;click(wrong);assert.equal(els['c-feedback'].textContent,feedback);assert.equal(state('chordGame').counters[0].wrong,1);
 const count=voices.length;els['c-keyboard'].onclick({target:{closest:()=>null}});assert.equal(voices.length,count);assert.equal(state('chordGame').selected.length,3);
 run('chordGame.next()');assert.equal(state('chordGame').selected.length,0);assert.equal(els['c-next'].disabled,true);assert.equal(run('activeVoices.size'),0);retainedProgressCases++;
}
// Audio failure must not prevent a correct answer or silently hide that sound is unavailable.
run('const originalAudioContext=window.AudioContext;chordGame.start(4,0,0);chordGame.respond("answer","C");audio=undefined;window.AudioContext=undefined');els['c-enter-keys'].onclick();
const silentNode=els['c-keyboard'].querySelectorAll('[data-ckey]').find(n=>Number(n.dataset.ckey)===60);
els['c-keyboard'].onclick({target:{closest:()=>silentNode}});
assert.equal(state('chordGame').selected.length,1);assert.equal(els['c-audio-notice'].hidden,false);assert.ok(els['c-audio-notice'].textContent.includes('声音未开启'));
run('window.AudioContext=originalAudioContext;audio=undefined');
// Both interval notes are scheduled from one recovered clock; future notes stop on map/reset.
mapButtons[1].onclick();run('intervalGame.start(4,0,3,0,1)');voices.length=0;voiceStarts.length=0;
run('intervalGame.respond("degree",3)');assert.equal(voices.length,2);assert.equal(voices[0],261.6255653005986);assert.equal(voices[1],329.6275569128699);assert.ok(Math.abs(voiceStarts[1]-voiceStarts[0]-.45)<1e-8);
assert.equal(run('activeVoices.size'),2);mapButtons[2].onclick();assert.equal(run('activeVoices.size'),0);const cancelledPairCount=voices.length;advance(5000);assert.equal(voices.length,cancelledPairCount);
mapButtons[1].onclick();run('intervalGame.start(4,0,3,0,1);intervalGame.respond("degree",3)');assert.equal(run('activeVoices.size'),2);run('intervalGame.reset()');assert.equal(run('activeVoices.size'),0);
// Actual interval click handlers must link the clicked key, staff position and immediate pitch.
let intervalClickCases=0;
const staffNotes=()=>[...els['i-staff'].innerHTML.matchAll(/<ellipse data-note="([^"]+)" data-diatonic="(\d+)" data-midi="(\d+)" data-confirmed="(true|false)" cx="[^"]+" cy="(-?\d+)"/g)].map(m=>({name:m[1],d:Number(m[2]),midi:Number(m[3]),confirmed:m[4]==='true',y:Number(m[5])}));
function intervalClick(node){
 const before=voices.length,d=Number(node.dataset.ikey);els['i-keyboard'].onclick({target:{closest:()=>node}});
 assert.equal(voices.length-before,4);const f=440*2**((expectedMidi(d)-69)/12);
 for(let h=1;h<=4;h++)assert.ok(Math.abs(voices[before+h-1]-f*h)<1e-8);
 assert.equal(run('pendingSounds.size'),0);assert.ok(run('activeVoices.size')<=4);
}
for(const g of [2,3,4,5,6])for(const l of [2,3])for(let degree=1;degree<=8;degree++)for(let start=0;start<7;start++)for(const dir of [-1,1]){
 run(`intervalGame.start(${g},${l},${degree},${start},${dir})`);
 const a=g*7+start,b=a+(degree-1)*dir,base=g<=3?18:30;
 if(l===2){assert.deepEqual(staffNotes().map(n=>n.d),[a]);assert.ok(!staffNotes().some(n=>n.confirmed))}
 else run(`intervalGame.respond('degree',${degree})`);
 const nodes=els['i-keyboard'].querySelectorAll('[data-ikey]'),writes=els['i-keyboard'].innerHTMLWrites,scroller=els['i-keyboard'].querySelector('.keyboard-scroll');scroller.scrollLeft=123;
 nodes.forEach(node=>{const d=Number(node.dataset.ikey),name=expectedKeyboardName(d);assert.ok(els['i-keyboard'].innerHTML.includes(`aria-label="${name}琴键，点击听音"`));assert.ok(els['i-keyboard'].innerHTML.includes(`<span>${name}</span></button>`))});
 assert.ok(els['i-keyboard'].innerHTML.includes(`--keyboard-width:${Math.max(308,nodes.length*44)}px`));
 if(l===3){
   const first=nodes.find(n=>Number(n.dataset.ikey)===a);first.focus();intervalClick(first);
   assert.equal(state('intervalGame').step,2);assert.equal(doc.activeElement,first);assert.equal(els['i-keyboard'].innerHTMLWrites,writes);assert.equal(scroller.scrollLeft,123);
   assert.ok(staffNotes().find(n=>n.d===a).confirmed);assert.equal(first.attrs['aria-pressed'],'true');assert.ok(first.classes.has('found'));
 }
 const target=nodes.find(n=>Number(n.dataset.ikey)===b);target.focus();intervalClick(target);
 assert.equal(state('intervalGame').finished,true);assert.equal(state('intervalGame').score,1);assert.equal(doc.activeElement,target);assert.equal(scroller.scrollLeft,123);assert.equal(els['i-keyboard'].innerHTMLWrites,writes);
 assert.deepEqual(staffNotes().map(n=>[n.name,n.d,n.midi,n.y,n.confirmed]),[a,b].map(d=>[expectedName(d),d,expectedMidi(d),160-(d-base)*10,true]));
 assert.ok(els['i-staff'].innerHTML.includes('① '+expectedName(a)));assert.ok(els['i-staff'].innerHTML.includes('② '+expectedName(b)));
 assert.equal(target.attrs['aria-pressed'],'true');assert.ok(target.number.textContent.includes('✓'));assert.ok(target.classes.has('found'));assert.equal(els['i-next'].disabled,false);
 const feedback=els['i-feedback'].innerHTML;intervalClick(target);assert.equal(sum(state('intervalGame').counters),1);assert.equal(els['i-feedback'].innerHTML,feedback);
 run('intervalGame.next()');assert.equal(run('activeVoices.size'),0);assert.ok(staffNotes().every(n=>!n.confirmed));assert.equal(els['i-next'].disabled,true);intervalClickCases++;
}
// Wrong keys sound at their own pitch but do not reveal the answer or discard a confirmed start.
run('intervalGame.start(4,2,3,0,1)');let intervalNodes=els['i-keyboard'].querySelectorAll('[data-ikey]');const badKey=intervalNodes.find(n=>Number(n.dataset.ikey)===29);
intervalClick(badKey);assert.deepEqual(staffNotes().map(n=>n.d),[28]);assert.equal(state('intervalGame').finished,false);assert.equal(els['i-next'].disabled,true);
intervalClick(intervalNodes.find(n=>Number(n.dataset.ikey)===30));assert.equal(state('intervalGame').counters[2].retried,1);
run('intervalGame.start(4,3,3,0,1);intervalGame.respond("degree",3)');intervalNodes=els['i-keyboard'].querySelectorAll('[data-ikey]');intervalClick(intervalNodes.find(n=>Number(n.dataset.ikey)===28));
intervalClick(intervalNodes.find(n=>Number(n.dataset.ikey)===29));assert.equal(state('intervalGame').step,2);assert.equal(staffNotes()[0].confirmed,true);assert.equal(staffNotes()[1].confirmed,false);
intervalClick(intervalNodes.find(n=>Number(n.dataset.ikey)===30));assert.equal(state('intervalGame').counters[2].retried,1);
const beforeBlack=voices.length;els['i-keyboard'].onclick({target:{closest:()=>null}});assert.equal(voices.length,beforeBlack);
// Muting and unavailable audio must leave staff confirmation and judgment usable.
const mutedInterval=setup('off');mutedInterval.run('intervalGame.start(4,2,3,0,1)');const mutedTarget=mutedInterval.els['i-keyboard'].querySelectorAll('[data-ikey]').find(n=>Number(n.dataset.ikey)===30);
mutedInterval.els['i-keyboard'].onclick({target:{closest:()=>mutedTarget}});assert.equal(mutedInterval.voices.length,0);assert.equal(mutedInterval.run('intervalGame.state().finished'),true);assert.ok(mutedInterval.els['i-staff'].innerHTML.includes('② e¹'));
mutedInterval.els['sound-toggle'].onclick();mutedInterval.els['i-keyboard'].onclick({target:{closest:()=>mutedTarget}});assert.equal(mutedInterval.voices.length,4);assert.equal(mutedInterval.voices[0],329.6275569128699);
run('intervalGame.start(4,2,3,0,1);audio=undefined;window.AudioContext=undefined');const failedIntervalTarget=els['i-keyboard'].querySelectorAll('[data-ikey]').find(n=>Number(n.dataset.ikey)===30);
els['i-keyboard'].onclick({target:{closest:()=>failedIntervalTarget}});assert.equal(state('intervalGame').finished,true);assert.equal(els['i-audio-notice'].hidden,false);assert.ok(staffNotes()[1].confirmed);
run('setSoundEnabled(false)');assert.equal(els['i-audio-notice'].hidden,true);run('window.AudioContext=originalAudioContext;audio=undefined;setSoundEnabled(true)');
assert.ok(html.includes('#i-keyboard .white{min-width:44px'));assert.ok(html.includes('#i-keyboard .black{pointer-events:auto}'));
console.log(`Passed ${intervalClickCases} interval click/staff/pitch cases across five groups, all starts, ascending/descending intervals and both keyboard levels, including unison, cross-octave notes, ledger positions, replay, mute, errors, audio failure and preserved focus/scroll.`);
// Review memory retains assistance/errors, is isolated by group/level/range, and falls with independent practice.
run('reviewMemory.clear();group=4;mode=1;reset();current=0;render();answer("wrong");answer(0)');assert.equal(run('difficulty(practiceKey(),7)[0]'),1);run('reset()');assert.equal(run('weakNotes[0]'),1);assert.equal(sum(run('stats')),0);assert.ok(run('weight(stats[0],weakNotes[0])')>run('weight(stats[1],weakNotes[1])'));run('group=3;reset()');assert.equal(run('weakNotes[0]'),0);for(let i=0;i<4;i++)run('group=4;reset();current=0;render();answer(0)');assert.equal(run('difficulty(practiceKey(),7)[0]'),0);
run('reviewMemory.clear();intervalGame.start(4,0,3,0,1,0);intervalGame.hint();intervalGame.respond("degree",3);intervalGame.reset()');assert.equal(state('intervalGame').weak[2],.5);run('intervalGame.start(4,0,3,0,1,3)');assert.equal(state('intervalGame').weak[2],0);run('intervalGame.start(4,1,3,0,1,0)');assert.equal(state('intervalGame').weak[2],0);
run('reviewMemory.clear();chordGame.start(4,0,0);chordGame.respond("answer","wrong");chordGame.reset()');assert.equal(state('chordGame').weak[0],1);run('chordGame.start(4,1,0)');assert.equal(state('chordGame').weak[0],0);run('chordGame.start(3,0,0)');assert.equal(state('chordGame').weak[0],0);
// Completing mixed-outcome rounds must always account for all 10 questions.
for(const game of ['notes','intervals','chords'])for(const g of [2,3,4,5,6]){
 let previous=null;for(let round=0;round<3;round++){
 if(game==='notes')run(`group=${g};mode=3;reset()`);else if(game==='intervals')run(`intervalGame.startRound(${g},3,3)`);else run(`chordGame.startRound(${g},2)`);const qs=[];
 for(let q=0;q<10;q++){const variant=q%3;if(game==='notes'){qs.push(run('current'));if(variant===1)run('hint()');if(variant===2)run('answer("wrong")');solveNote();els.next.onclick()}else if(game==='intervals'){const p=state('intervalGame').pair;qs.push(p.a.d+':'+p.b.d);if(variant===1)run('intervalGame.hint()');if(variant===2)run('intervalGame.respond("degree",-1)');run(`intervalGame.respond('degree',${p.degree});intervalGame.respond('key',${p.a.d});intervalGame.respond('key',${p.b.d});intervalGame.next()`)}else{const st=state('chordGame');qs.push(st.root);if(variant===1)run('chordGame.hint()');if(variant===2)run('chordGame.respond("answer","wrong")');run(`chordGame.respond('answer','${symbolForms[2][st.root]}')`);els['c-enter-keys'].onclick();for(const i of [2,0,1])run(`chordGame.respond('key',${st.tones[i].midi})`);run('chordGame.next()')}}
 const cs=game==='notes'?run('stats'):state(game==='intervals'?'intervalGame':'chordGame').counters;assert.equal(sum(cs),10);assert.equal(cs.reduce((n,c)=>n+c.right,0),4);assert.equal(cs.reduce((n,c)=>n+c.guided,0),3);assert.equal(cs.reduce((n,c)=>n+c.retried,0),3);const end=els[game==='notes'?'end':game==='intervals'?'i-end':'c-end'].innerHTML;assert.ok(end.includes('10 / 10 题已完成'));assert.ok(end.includes('独立答对 4 题 · 提示后答对 3 题 · 重试后答对 3 题'));assert.equal(doc.activeElement,els[game==='notes'?'again':game==='intervals'?'i-again':'c-again']);if(previous)qs.forEach((v,i)=>assert.notEqual(v,previous[i]));previous=qs;reviewRounds++}
}
// Exercise the visible sound control, persistence, scoring and delayed-audio cancellation.
const quiet=setup('off'),preferenceKey='bobo-music-note-lab.sound';
assert.equal(quiet.run('soundEnabled'),false);assert.equal(quiet.els['sound-toggle'].attrs['aria-pressed'],'false');assert.equal(quiet.els['sound-toggle'].textContent,'声音关');
quiet.run('chordGame.start(4,0,0);chordGame.respond("answer","C")');quiet.els['c-enter-keys'].onclick();
const quietKeys=quiet.els['c-keyboard'].querySelectorAll('[data-ckey]');
const quietClick=midi=>quiet.els['c-keyboard'].onclick({target:{closest:()=>quietKeys.find(n=>Number(n.dataset.ckey)===midi)}});
quietClick(60);assert.equal(quiet.voices.length,0);assert.equal(quiet.run('chordGame.state().selected.length'),1);
quiet.els['sound-toggle'].onclick();assert.equal(quiet.els['sound-toggle'].textContent,'声音开');assert.equal(quiet.els['sound-toggle'].attrs['aria-pressed'],'true');assert.equal(quiet.preferences.get(preferenceKey),'on');
quietClick(60);assert.equal(quiet.voices.length,4);assert.equal(quiet.run('chordGame.state().selected.length'),1);
quiet.els['sound-toggle'].onclick();assert.equal(quiet.run('activeVoices.size'),0);assert.equal(quiet.preferences.get(preferenceKey),'off');
quietClick(64);quietClick(67);assert.equal(quiet.voices.length,4);assert.equal(quiet.run('chordGame.state().finished'),true);assert.equal(quiet.run('chordGame.state().score'),1);assert.equal(quiet.els['c-next'].disabled,false);
quiet.run('sound(60);delayedSound(67,450)');assert.equal(quiet.voices.length,4);assert.equal(quiet.run('pendingSounds.size'),0);
quiet.mapButtons[1].onclick();assert.equal(quiet.run('soundEnabled'),false);assert.equal(quiet.els['sound-toggle'].textContent,'声音关');
quiet.run('group=4;mode=1;reset();current=0;render();answer(0)');assert.equal(quiet.run('done'),true);assert.equal(quiet.voices.length,4);
quiet.els['sound-toggle'].onclick();quiet.run('intervalGame.start(4,0,3,0,1);intervalGame.respond("degree",3)');
assert.equal(quiet.voices.length,6);assert.ok(Math.abs(quiet.voiceStarts.at(-1)-quiet.voiceStarts.at(-2)-.45)<1e-8);assert.equal(quiet.run('activeVoices.size'),2);
quiet.els['sound-toggle'].onclick();assert.equal(quiet.run('activeVoices.size'),0);
quiet.els['sound-toggle'].onclick();quiet.advance(5000);assert.equal(quiet.voices.length,6);quiet.run('pianoSound(69)');assert.equal(quiet.voices.length,10);assert.equal(quiet.voices[6],440);
assert.equal(setup(quiet.preferences.get(preferenceKey)).run('soundEnabled'),true);
quiet.els['sound-toggle'].onclick();assert.equal(setup(quiet.preferences.get(preferenceKey)).run('soundEnabled'),false);
const noStorage=setup(undefined,false);assert.equal(noStorage.run('soundEnabled'),true);noStorage.els['sound-toggle'].onclick();assert.equal(noStorage.run('soundEnabled'),false);noStorage.els['sound-toggle'].onclick();assert.equal(noStorage.run('soundEnabled'),true);
console.log('Sound control passed mute/unmute, immediate stop, delayed-audio race cancellation, silent scoring, all-map state, preference reload and unavailable-storage checks.');
assert.ok(html.includes('本阶段只认度数，暂不区分音程性质'));assert.ok(html.includes('不能只靠外形区分大、小、减'));assert.ok(!html.includes('首次答对'));console.log(`Passed ${noteCases} note, ${intervalCases} interval and ${chordCases} chord classification cases, ${audioClicks} correctly pitched key clicks, ${independentMappings} independent staff/key/name mappings, ${retainedProgressCases} interleaved-error cases and ${reviewRounds} mixed-outcome review rounds. Verified no keyboard replacement/focus loss in DOM simulation, black-key positioning guides, once-only counting, audio failure/cancellation/race protection and scoped adaptive review memory. All 21 modern chord symbols/options and inversion bass notes checked across five root groups. Mobile CSS and click delegation checked; actual mobile browser QA remains unverified.`);

// Browser-state recovery: no oscillators may be scheduled before audio resumes.
async function audioRecoveryChecks(){
 const resumed=setup();resumed.mapButtons[2].onclick();
 const deferred=`const NormalAudioContext=window.AudioContext;window.resumeRequests=[];window.AudioContext=class extends NormalAudioContext{constructor(){super();this.state='interrupted'}resume(){return new Promise((resolve,reject)=>window.resumeRequests.push({resolve,reject,context:this}))}};audio=undefined;`;
 resumed.run(deferred+'chordGame.start(6,1,4);chordGame.respond("answer","G/B")');
 assert.equal(resumed.voices.length,0);assert.equal(resumed.els['c-audio-notice'].hidden,false);
 resumed.run('audio.state="running";audio.currentTime=9;window.resumeRequests[0].resolve()');await Promise.resolve();await Promise.resolve();
 const f=[83,86,91].flatMap(m=>[1,2,3,4].map(h=>440*2**((m-69)/12)*h));assert.equal(resumed.voices.length,12);resumed.voices.forEach((v,i)=>assert.ok(Math.abs(v-f[i])<1e-8));assert.ok(resumed.voiceStarts.every(t=>Math.abs(t-9.01)<1e-8));assert.equal(resumed.els['c-audio-notice'].hidden,true);
 resumed.els['c-enter-keys'].onclick();const before=resumed.voices.length;resumed.els['c-relations'].onclick({target:{closest:()=>({})}});assert.equal(resumed.voices.length-before,12);
 resumed.els['sound-toggle'].onclick();assert.equal(resumed.els['c-listen'].textContent,'开启并听');const silent=resumed.voices.length;resumed.els['c-staff'].onclick();assert.equal(resumed.voices.length,silent);
 resumed.els['c-relations'].onclick({target:{closest:()=>({})}});assert.equal(resumed.run('soundEnabled'),true);assert.equal(resumed.voices.length-silent,12);assert.equal(resumed.els['c-listen'].textContent,'♪ 听和弦');assert.equal(resumed.run('chordGame.state().selected.length'),0);
 for(const cancel of ['mute','map','reset']){
   const env=setup();env.mapButtons[2].onclick();env.run(deferred+'chordGame.start(6,1,4);chordGame.respond("answer","G/B")');
   if(cancel==='mute')env.els['sound-toggle'].onclick();else if(cancel==='map')env.mapButtons[0].onclick();else env.run('chordGame.reset()');
   env.run('window.resumeRequests[0].context.state="running";window.resumeRequests[0].resolve()');await Promise.resolve();await Promise.resolve();assert.equal(env.voices.length,0);assert.equal(env.run('activeVoices.size'),0);
 }
 const latest=setup();latest.run(deferred+'chordGame.start(6,1,4);chordGame.respond("answer","G/B")');latest.els['c-enter-keys'].onclick();const b=latest.els['c-keyboard'].querySelectorAll('[data-ckey]').find(b=>Number(b.dataset.ckey)===83);
 latest.els['c-keyboard'].onclick({target:{closest:()=>b}});latest.run('window.resumeRequests[0].resolve()');await Promise.resolve();await Promise.resolve();assert.equal(latest.voices.length,0);
 latest.run('audio.state="running";audio.currentTime=7;window.resumeRequests[1].resolve()');await Promise.resolve();await Promise.resolve();assert.equal(latest.voices.length,4);assert.ok(Math.abs(latest.voices[0]-987.7666025122483)<1e-8);
 const rejected=setup();rejected.run(deferred+'chordGame.start(6,1,4);chordGame.respond("answer","G/B");window.resumeRequests[0].reject(new Error("blocked"))');await Promise.resolve();await Promise.resolve();await Promise.resolve();
 assert.equal(rejected.voices.length,0);assert.equal(rejected.els['c-audio-notice'].hidden,false);assert.ok(rejected.els['c-audio-notice'].textContent.includes('正确答案'));rejected.els['c-enter-keys'].onclick();assert.equal(rejected.run('chordGame.state().step'),1);assert.ok(rejected.els['c-audio-notice'].textContent.includes('听和弦'));assert.ok(!rejected.els['c-audio-notice'].textContent.includes('正确答案'));
 const stillPaused=setup();stillPaused.run(deferred+'chordGame.start(6,1,4);chordGame.respond("answer","G/B");window.resumeRequests[0].resolve()');await Promise.resolve();await Promise.resolve();assert.equal(stillPaused.voices.length,0);assert.equal(stillPaused.els['c-audio-notice'].hidden,false);
 const closed=setup();closed.run('pianoSound(83);audio.state="closed"');closed.voices.length=0;closed.run('pianoSound(83)');assert.equal(closed.voices.length,4);assert.equal(closed.run('audio.state'),'running');
 console.log('Reported high G/B voicing (B5, D6, G6) passed exact pitch and replay checks. Audio recovery passed interrupted/resumed clocks, rejected/still-paused states, closed-context replacement, latest-click priority and cancellation after mute/map/reset.');
}
audioRecoveryChecks().catch(error=>{console.error(error);process.exitCode=1});

// Continued practice controls persist while live feedback changes in all three maps.
for(const game of ['notes','intervals','chords'])for(const level of (game==='chords'?[0,1,2]:[0,1,2,3])){
 const env=setup(),{els,run,doc}=env,prefix=game==='notes'?'':game==='intervals'?'i-':'c-',card=prefix+'feedback',next=els[prefix+'next'],nextHandler=next.onclick;
 if(game==='notes')run(`mode=${level};group=4;reset()`);else if(game==='intervals')run(`intervalGame.start(4,${level},3,0)`);else run(`chordGame.start(4,${level},0)`);
 assert.equal(next.hidden,true);assert.equal(next.disabled,true);assert.equal(els[prefix+'footer'].hidden,false);
 assert.equal(els[prefix+'reading-actions'].hidden,true);assert.equal(els[card].attrs['data-actions-ready'],'false');
 if(game==='notes'){
   run('hint();answer("wrong")');assert.equal(next.hidden,true);
   run('while(!done){const stage=activeStage();answer(stage===0?(phase===0?(notes[current].line?"line":"space"):notes[current].pos):current)}');
 }else if(game==='intervals'){
   run('intervalGame.hint();intervalGame.respond("degree",-1)');assert.equal(next.hidden,true);
   const pair=run('intervalGame.state().pair');
   if(level<=1)run('intervalGame.respond("degree",3)');else if(level===2)run(`intervalGame.respond('key',${pair.b.d})`);else{
     run('intervalGame.respond("degree",3)');assert.equal(next.hidden,true);
     run(`intervalGame.respond('key',${pair.a.d})`);assert.equal(next.hidden,true);
     run(`intervalGame.respond('key',${pair.b.d})`);
   }
 }else{
   run(`chordGame.hint();chordGame.respond('answer','${symbolForms[level][0]}')`);
   const enter=els['c-enter-keys'],enterHandler=enter.onclick;
   assert.equal(enter.hidden,false);assert.equal(next.hidden,true);
   assert.equal(els['c-reading-actions'].hidden,false);assert.equal(els[card].attrs['data-actions-kind'],'enter');
   run(`chordGame.respond('answer','${symbolForms[level][0]}')`);assert.equal(enter.onclick,enterHandler);assert.equal(enter.hidden,false);
   enter.onclick();assert.equal(enter.hidden,true);assert.equal(next.hidden,true);
   assert.equal(els['c-reading-actions'].hidden,true);assert.equal(els[card].attrs['data-actions-ready'],'false');
   const tones=run('chordGame.state().tones');for(const i of [2,0,1])run(`chordGame.respond('key',${tones[i].midi})`);
 }
 assert.equal(next.hidden,false);assert.equal(next.disabled,false);assert.equal(els[prefix+'footer'].hidden,true);assert.ok(els[card].textContent.includes('一起朗读'));
 assert.equal(els[prefix+'reading-actions'].hidden,false);assert.equal(els[card].attrs['data-actions-ready'],'true');assert.equal(els[card].attrs['data-actions-kind'],'next');
 assert.equal(next.onclick,nextHandler);assert.equal(els[card].innerHTMLWrites,0);assert.ok(els[card+'-content'].innerHTMLWrites>1);
 next.focus();next.onclick();assert.equal(next.hidden,true);assert.equal(next.disabled,true);assert.equal(next.onclick,nextHandler);assert.equal(doc.activeElement,els[prefix+'question']);assert.equal(els[prefix+'footer'].hidden,false);
 assert.equal(els[prefix+'reading-actions'].hidden,true);assert.equal(els[card].attrs['data-actions-ready'],'false');
}
assert.ok(html.includes('.reading-actions{display:flex;justify-content:flex-end;'));
assert.ok(html.includes('min-height:44px;flex:none;margin:0}'));
assert.ok(html.includes('.reading-actions .primary{width:100%}'));
assert.ok(!/2\.5秒|最后一次点击|scheduleKeyStep|transitionTimer|stepDelay/.test(html));
console.log('All-map reading controls passed: live feedback preserves button nodes and handlers, only one continuation is visible, incomplete tasks cannot skip, completion/reset show the correct action, and next-question clicks move focus to the new question.');

// The note keyboard must play the clicked pitch, including wrong keys and completed-question replays.
function prepareNote(env,g,level,target){
 env.run('group='+g+';mode='+level+';reset();current='+target+';render()');
 if(level===3)env.run('while(phase<3){const stage=activeStage();answer(stage===0?(phase===0?(notes[current].line?"line":"space"):notes[current].pos):current)}');
}
function tapNoteAnswer(env,value){
 const node=env.els.answers.querySelectorAll('[data-answer]').find(b=>b.dataset.answer===String(value));
 assert.ok(node,'A real answer button is present');node.focus();
 env.els.answers.onclick({target:{closest:()=>node}});return node;
}
let noteKeyboardCases=0,noteKeyboardClicks=0;
const noteKeys=setup();
for(const g of [2,3,4,5,6])for(const level of [2,3])for(let target=0;target<7;target++)for(const mixed of [false,true]){
 prepareNote(noteKeys,g,level,target);
 const writes=noteKeys.els.answers.innerHTMLWrites,keys=noteKeys.els.answers.querySelectorAll('[data-answer]');
 assert.equal(keys.length,7);assert.equal((noteKeys.els.answers.innerHTML.match(/class="black" aria-hidden="true"/g)||[]).length,5);
 keys.forEach((_,i)=>assert.ok(noteKeys.els.answers.innerHTML.includes(`aria-label="${expectedKeyboardName(g*7+i)}白键，点击听音"`)));
 assert.ok(noteKeys.els.answers.innerHTML.includes(`data-answer="0">C${g}</button>`));
 const beforeBlack=noteKeys.voices.length;noteKeys.els.answers.onclick({target:{closest:()=>null}});assert.equal(noteKeys.voices.length,beforeBlack);assert.equal(noteKeys.run('done'),false);
 const sequence=mixed?[...Array(7).keys()].filter(k=>k!==target).concat(target,target):[target,target];
 for(const key of sequence){
  const before=noteKeys.voices.length,node=tapNoteAnswer(noteKeys,key),f=440*2**((12*(g+1)+whiteSemitones[key]-69)/12);
  assert.equal(noteKeys.voices.length-before,4);
  for(let h=1;h<=4;h++)assert.ok(Math.abs(noteKeys.voices[before+h-1]-f*h)<1e-8);
  assert.equal(noteKeys.doc.activeElement,node);assert.equal(noteKeys.els.answers.innerHTMLWrites,writes);
  assert.ok(noteKeys.run('activeVoices.size')<=4);noteKeyboardClicks++;
 }
 assert.equal(noteKeys.run('done'),true);assert.equal(sum(noteKeys.run('stats')),1);
 assert.equal(noteKeys.run('correct'),mixed?0:1);assert.equal(noteKeys.run('stats[current].'+(mixed?'retried':'right')),1);
 assert.ok(keys[target].classes.has('mark'));
 const staff=noteKeys.els.staff.innerHTML,step=g*7+target-(g<=3?18:30);
 assert.ok(staff.includes('cy="'+(160-step*10)+'"'));assert.ok(noteKeys.els.feedback.textContent.includes(expectedName(g*7+target)));
 const feedback=noteKeys.els.feedback.innerHTML,before=noteKeys.voices.length;tapNoteAnswer(noteKeys,(target+1)%7);
 assert.equal(noteKeys.voices.length-before,4);assert.equal(noteKeys.els.feedback.innerHTML,feedback);assert.equal(sum(noteKeys.run('stats')),1);
 noteKeyboardCases++;
}
const quietNote=setup('off');prepareNote(quietNote,4,2,0);tapNoteAnswer(quietNote,0);
assert.equal(quietNote.voices.length,0);assert.equal(quietNote.run('correct'),1);
quietNote.els['sound-toggle'].onclick();tapNoteAnswer(quietNote,0);assert.equal(quietNote.voices.length,4);assert.equal(quietNote.run('correct'),1);
assert.ok(html.includes('#answers .piano .black{pointer-events:auto}'));assert.ok(html.includes('#answers .piano .white{min-width:44px;'));
assert.ok(!html.includes('点击下方按钮'));assert.ok(!html.includes('读完后，点击“进入第二步 · 找琴键”。'));assert.ok(!html.includes('读完后，再点“下一题”。'));
console.log('Passed '+noteKeyboardCases+' note-keyboard cases and '+noteKeyboardClicks+' pitched clicks across all five groups and both keyboard levels: wrong-key audio, replay, once-only scoring, mute, staff mapping and preserved key focus. Black-key hit interception is checked in source; actual browser hit testing remains unverified.');

async function basicAudioRecoveryChecks(){
 const deferred='const WorkingAudioContext=window.AudioContext;window.resumeRequests=[];window.AudioContext=class extends WorkingAudioContext{constructor(){super();this.state="interrupted"}resume(){return new Promise((resolve,reject)=>window.resumeRequests.push({resolve,reject,context:this}))}};audio=undefined;';
 const jobs=[
  {name:'note keyboard',notice:'audio-notice',count:4,prepare:e=>prepareNote(e,4,2,0),tap:e=>tapNoteAnswer(e,0),reset:e=>e.run('reset()'),next:e=>e.els.next.onclick(),map:0},
  {name:'note name',notice:'audio-notice',count:1,prepare:e=>prepareNote(e,4,1,0),tap:e=>tapNoteAnswer(e,0),reset:e=>e.run('reset()'),next:e=>e.els.next.onclick(),map:0},
  {name:'note position',notice:'audio-notice',count:1,prepare:e=>{prepareNote(e,4,0,0);e.run('answer("line")')},tap:e=>tapNoteAnswer(e,e.run('notes[current].pos')),reset:e=>e.run('reset()'),next:e=>e.els.next.onclick(),map:0},
  ...[0,1].map(level=>({name:'interval level '+level,notice:'i-audio-notice',count:2,prepare:e=>{e.mapButtons[1].onclick();e.run('intervalGame.start(4,'+level+',3,0,1)')},tap:e=>e.els['i-answers'].onclick({target:{closest:()=>({dataset:{idegree:'3'}})}}),reset:e=>e.run('intervalGame.reset()'),next:e=>e.els['i-next'].onclick(),map:1}))
 ];
 const flush=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve()};
 for(const job of jobs){
  const env=setup();job.prepare(env);env.run(deferred);job.tap(env);
  assert.equal(env.voices.length,0,job.name);assert.equal(env.els[job.notice].hidden,false);
  env.run('audio.state="running";audio.currentTime=9;window.resumeRequests[0].resolve()');await flush();
  assert.equal(env.voices.length,job.count);assert.equal(env.els[job.notice].hidden,true);
  assert.ok(Math.abs(env.voiceStarts[0]-9.01)<1e-8);
  if(job.count===2){assert.ok(Math.abs(env.voiceStarts[1]-9.46)<1e-8);assert.equal(env.voices[1],329.6275569128699)}
  else if(job.count===4)for(let h=1;h<=4;h++)assert.ok(Math.abs(env.voices[h-1]-261.6255653005986*h)<1e-8);
  else assert.equal(env.voices[0],261.6255653005986);
  job.tap(env);assert.equal(env.voices.length,2*job.count);
  assert.equal(job.map===0?sum(env.run('stats')):sum(env.run('intervalGame.state().counters')),1);
  for(const cancel of ['mute','map','reset','next']){
   const cancelled=setup();job.prepare(cancelled);cancelled.run(deferred);job.tap(cancelled);
   if(cancel==='mute')cancelled.els['sound-toggle'].onclick();else if(cancel==='map')cancelled.mapButtons[job.map===0?1:0].onclick();else if(cancel==='reset')job.reset(cancelled);else job.next(cancelled);
   cancelled.run('window.resumeRequests[0].context.state="running";window.resumeRequests[0].resolve()');await flush();
   assert.equal(cancelled.voices.length,0,job.name+' cancels on '+cancel);assert.equal(cancelled.run('activeVoices.size'),0);
  }
  const rejected=setup();job.prepare(rejected);rejected.run(deferred);job.tap(rejected);
  rejected.run('window.resumeRequests[0].reject(new Error("blocked"))');await flush();
  assert.equal(rejected.voices.length,0);assert.equal(rejected.els[job.notice].hidden,false);
  assert.ok(rejected.els[job.notice].textContent.includes(job.count===4?'琴键':'正确答案'));
  rejected.run('audio.state="running"');job.tap(rejected);assert.equal(rejected.voices.length,job.count);assert.equal(rejected.els[job.notice].hidden,true);
  const paused=setup();job.prepare(paused);paused.run(deferred);job.tap(paused);
  paused.run('window.resumeRequests[0].resolve()');await flush();assert.equal(paused.voices.length,0);assert.equal(paused.els[job.notice].hidden,false);
  const closed=setup();job.prepare(closed);job.tap(closed);closed.run('const oldClosedContext=audio;audio.state="closed"');const before=closed.voices.length;
  job.tap(closed);assert.equal(closed.run('audio===oldClosedContext'),false);assert.equal(closed.run('audio.state'),'running');assert.equal(closed.voices.length-before,job.count);
  const failed=setup();job.prepare(failed);failed.run('const OldAudioContext=window.AudioContext;audio=undefined;window.AudioContext=undefined');job.tap(failed);
  assert.equal(failed.voices.length,0);assert.equal(failed.els[job.notice].hidden,false);
  failed.run('window.AudioContext=OldAudioContext');job.tap(failed);assert.equal(failed.voices.length,job.count);assert.equal(failed.els[job.notice].hidden,true);
 }
 const latest=setup();prepareNote(latest,4,2,0);latest.run(deferred);tapNoteAnswer(latest,0);tapNoteAnswer(latest,1);
 latest.run('window.resumeRequests[0].resolve()');await flush();assert.equal(latest.voices.length,0);
 latest.run('audio.state="running";audio.currentTime=7;window.resumeRequests[1].resolve()');await flush();
 assert.equal(latest.voices.length,4);assert.ok(Math.abs(latest.voices[0]-293.6647679174076)<1e-8);assert.equal(sum(latest.run('stats')),1);
 const renderFailure=setup();prepareNote(renderFailure,4,1,0);renderFailure.run(deferred);tapNoteAnswer(renderFailure,0);
 renderFailure.run('audio.state="running";audio.createOscillator=()=>{throw new Error("device unavailable")};window.resumeRequests[0].resolve()');await flush();
 assert.equal(renderFailure.els['audio-notice'].hidden,false);assert.equal(renderFailure.run('activeVoices.size'),0);
 console.log('Unified audio recovery passed note-key, note-name, note-position and both interval-answer paths: resume-before-play, recovered 450 ms spacing, rejection/paused/closed/unavailable states, working replay, latest-click priority, failed rendering and cancellation after mute/map/reset/next.');
}
basicAudioRecoveryChecks().catch(error=>{console.error(error);process.exitCode=1});
