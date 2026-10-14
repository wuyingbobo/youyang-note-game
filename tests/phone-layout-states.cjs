const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const audit=fs.readFileSync(path.join(__dirname,'audit-fixes.cjs'),'utf8'),harness={require,__dirname};
vm.runInNewContext(audit.slice(0,audit.indexOf('const {run,advance,els,doc,mapButtons'))+';globalThis.makeEnvironment=setup;',harness);
const fixtures=[];
function snapshot(env,map,prefix,name){
 const nodes={};
 for(const key of ['play','feedback','feedback-content','reading-actions','next','footer','question','step','staff','answers','keyboard','relations','audio-notice','enter-keys']){
  const id=prefix+key,e=env.els[id];if(!e)continue;
  nodes[id]={attrs:{...e.attrs},className:e.className,hidden:e.hidden,disabled:e.disabled,content:e.innerHTML,text:e._text};
 }
 fixtures.push({map,prefix,name,nodes});
}
let steps=0;
for(const group of [2,3,4,5,6]){
 const env=harness.makeEnvironment();env.run(`mode=3;group=${group};reset();current=5;render()`);
 env.run('answer(notes[current].line?"line":"space");answer(notes[current].pos)');
 assert.equal(env.run('phase'),2);assert.equal(env.els.next.hidden,true);
 const before=env.run('index');env.els.next.onclick();assert.equal(env.run('index'),before);assert.equal(env.run('phase'),2);
 if(group===4)snapshot(env,'note-map','','note-name-position-feedback');
 env.run('answer(current)');assert.equal(env.run('phase'),3);assert.equal(env.els.next.hidden,true);
 if(group===4)snapshot(env,'note-map','','note-key-name-feedback');
 env.run('answer(current)');assert.equal(env.els.next.hidden,false);
 if(group===4)snapshot(env,'note-map','','note-complete');steps+=3;
 const interval=harness.makeEnvironment();interval.mapButtons[1].onclick();interval.run(`intervalGame.start(${group},3,3,0,1,0);intervalGame.respond('degree',3)`);
 assert.equal(interval.run('intervalGame.state().step'),1);assert.equal(interval.els['i-next'].hidden,true);
 interval.els['i-next'].onclick();assert.equal(interval.run('intervalGame.state().step'),1);
 if(group===4)snapshot(interval,'interval-map','i-','interval-start-reading');
 const pair=interval.run('intervalGame.state().pair');interval.run(`intervalGame.respond('key',${pair.a.d})`);
 assert.equal(interval.els['i-next'].hidden,true);
 if(group===4)snapshot(interval,'interval-map','i-','interval-target-reading');
 interval.run(`intervalGame.respond('key',${pair.b.d})`);assert.equal(interval.els['i-next'].hidden,false);
 if(group===4)snapshot(interval,'interval-map','i-','interval-complete');steps+=3;
 const chord=harness.makeEnvironment();chord.mapButtons[2].onclick();chord.run(`chordGame.start(${group},0,2)`);
 if(group===4)snapshot(chord,'chord-map','c-','chord-question');
 chord.run("chordGame.respond('answer','Em')");
 assert.equal(chord.run('chordGame.state().step'),0);
 assert.equal(chord.els['c-enter-keys'].hidden,false);
 assert.equal(chord.els['c-next'].hidden,true);
 assert.ok(chord.els['c-feedback-content'].innerHTML.includes('E小三和弦 · 原位和弦'));
 assert.ok(!/再点正确答案|读完后/.test(chord.els['c-feedback-content'].innerHTML));
 if(group===4)snapshot(chord,'chord-map','c-','chord-symbol');
 chord.els['c-enter-keys'].onclick();assert.equal(chord.els['c-next'].hidden,true);
 if(group===4)snapshot(chord,'chord-map','c-','chord-keys-entry');
 const tones=Array.from(chord.run('chordGame.state().tones'),t=>t.midi);
 chord.run(`chordGame.respond('key',${tones[2]})`);
 if(group===4)snapshot(chord,'chord-map','c-','chord-partial');
 chord.run(`chordGame.respond('key',${tones[0]});chordGame.respond('key',${tones[1]})`);assert.equal(chord.els['c-next'].hidden,false);
 assert.ok(!chord.els['c-feedback-content'].innerHTML.includes('reading-detail'));
 assert.ok(chord.els['c-feedback-content'].innerHTML.includes('reading-notes'));
 if(group===4)snapshot(chord,'chord-map','c-','chord-complete');steps+=4;
}
for(const [level,symbol] of [[1,'Bdim/D'],[2,'Bdim/F']]){
 const chord=harness.makeEnvironment();chord.mapButtons[2].onclick();chord.run(`chordGame.start(4,${level},6)`);
 snapshot(chord,'chord-map','c-',`chord-question-inversion-${level}`);
 chord.run(`chordGame.respond('answer','${symbol}')`);
 assert.equal(chord.run('chordGame.state().step'),0);
 assert.equal(chord.els['c-enter-keys'].hidden,false);
 snapshot(chord,'chord-map','c-',`chord-symbol-inversion-${level}`);
}
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(fixtures));
console.log(`Phone state checks passed ${steps} note/interval/chord step states, premature-next guards and completion across five groups. Captured ${fixtures.length} actual DOM-harness states for CSS checks; no browser rendering.`);
