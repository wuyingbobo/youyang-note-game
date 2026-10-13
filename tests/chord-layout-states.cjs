const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
// Reuse the existing DOM harness, without executing its regression suite.
const audit=fs.readFileSync(path.join(__dirname,'audit-fixes.cjs'),'utf8');
const harness={require,__dirname};
vm.runInNewContext(audit.slice(0,audit.indexOf('const {run,advance,els,doc,mapButtons'))+';globalThis.makeEnvironment=setup;',harness);
const symbols=['C','Dm','Em','F','G','Am','Bdim'];
const forms=[symbols,['C/E','Dm/F','Em/G','F/A','G/B','Am/C','Bdim/D'],['C/G','Dm/A','Em/B','F/C','G/D','Am/E','Bdim/F']];
const snapshots=[];let cases=0;
function snapshot(env,name){
 const ids=['c-play','c-feedback','c-feedback-content','c-reading-actions','c-next','c-enter-keys','c-footer','c-question','c-step','c-staff','c-relations','c-answers','c-keyboard','c-audio-notice'];
 const nodes={};for(const id of ids){const e=env.els[id];nodes[id]={attrs:{...e.attrs},className:e.className,hidden:e.hidden,disabled:e.disabled,content:e.innerHTML,text:e._text}}
 snapshots.push({name,nodes});
}
for(const group of [2,3,4,5,6])for(let level=0;level<3;level++)for(let root=0;root<7;root++){
 const env=harness.makeEnvironment(undefined,true,{matchMedia(){return {matches:true,addEventListener(){}}}});
 env.mapButtons[2].onclick();env.run(`chordGame.start(${group},${level},${root})`);
 assert.equal(env.els['c-play'].attrs['data-chord-stage'],'symbol');
 env.run(`chordGame.respond('answer','${forms[level][root]}')`);
 assert.equal(env.els['c-play'].attrs['data-chord-stage'],'symbol');
 env.els['c-enter-keys'].onclick();assert.equal(env.els['c-play'].attrs['data-chord-stage'],'keys');
 assert.ok(env.els['c-relations'].innerHTML.includes('class="relation-identity"'));
 assert.ok(!env.els['c-relations'].innerHTML.includes('open data-auto-open'));
 const summary={focused:false,focus(){this.focused=true}},details={open:true,querySelector(){return summary}};
 const relations=env.els['c-relations'],originalQuery=relations.querySelector;
 relations.querySelector=()=>details;
 const beforeClose=env.voices.length;
 relations.onclick({target:{closest:selector=>selector==='[data-relation-close]'?{}:null}});
 assert.equal(details.open,false);assert.equal(summary.focused,true);assert.equal(env.voices.length,beforeClose);
 relations.querySelector=originalQuery;
 const capture=group===4&&root===2||group===6&&root===6||group===2&&root===5;
 const name=`${group}:${forms[level][root]}`;
 if(capture)snapshot(env,name+':entry');
 const state=env.run('chordGame.state()');
 const tap=midi=>{const b=env.els['c-keyboard'].querySelectorAll('[data-ckey]').find(x=>Number(x.dataset.ckey)===midi);assert.ok(b);env.els['c-keyboard'].onclick({target:{closest:()=>b}})};
 tap(state.tones[2].midi);if(capture)snapshot(env,name+':partial');
 const wrong=env.els['c-keyboard'].querySelectorAll('[data-ckey]').find(b=>!Array.from(state.tones).some(t=>t.midi===Number(b.dataset.ckey)));
 tap(Number(wrong.dataset.ckey));if(capture)snapshot(env,name+':wrong');
 tap(state.tones[0].midi);tap(state.tones[1].midi);
 assert.equal(env.els['c-play'].attrs['data-chord-stage'],'keys');assert.equal(env.els['c-next'].hidden,false);
 if(capture)snapshot(env,name+':complete');
 env.els['sound-toggle'].onclick();tap(state.tones[1].midi);if(capture)snapshot(env,name+':muted');
 env.els['c-next'].onclick();assert.equal(env.els['c-play'].attrs['data-chord-stage'],'symbol');assert.equal(env.els['c-relations'].hidden,true);cases++;
}
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(snapshots));
console.log(`Chord layout state checks passed ${cases} questions across all groups/forms: manual entry, partial/wrong/complete/muted states and next-question reset. Generated ${snapshots.length} CSS fixtures. Browser layout is not simulated.`);
