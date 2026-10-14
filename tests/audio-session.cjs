// Audio-session selection and graceful fallback; no physical device or audible output.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const audit=fs.readFileSync(path.join(__dirname,'audit-fixes.cjs'),'utf8'),harness={require,__dirname};
vm.runInNewContext(audit.slice(0,audit.indexOf('const {run,advance,els,doc,mapButtons'))+';globalThis.makeEnvironment=setup;',harness);
const env=harness.makeEnvironment();
env.run(`window.navigator={audioSession:{type:'ambient'}};window.sessionAtConstruction=[];
 const NativeContext=window.AudioContext;
 window.AudioContext=class extends NativeContext{constructor(){super();window.sessionAtConstruction.push(window.navigator.audioSession.type)}};`);
env.mapButtons[2].onclick();env.run("chordGame.start(4,0,5);chordGame.respond('answer','Am')");
assert.deepEqual(Array.from(env.run('window.sessionAtConstruction')),['playback']);
assert.equal(env.voices.length,12);env.els['c-enter-keys'].onclick();
const key=env.els['c-keyboard'].querySelectorAll('[data-ckey]').find(b=>Number(b.dataset.ckey)===69);
const count=env.voices.length;env.els['c-keyboard'].onclick({target:{closest:()=>key}});
assert.deepEqual(Array.from(env.voices.slice(count)),[440,880,1320,1760]);
assert.equal(env.run('chordGame.state().selected.length'),1);
env.els['c-keyboard'].onclick({target:{closest:()=>key}});
assert.equal(env.voices.length,count+8);assert.equal(env.run('chordGame.state().selected.length'),1);
env.els['sound-toggle'].onclick();env.run("window.navigator.audioSession.type='ambient'");
env.els['c-keyboard'].onclick({target:{closest:()=>key}});
assert.equal(env.run('window.navigator.audioSession.type'),'ambient');assert.equal(env.voices.length,count+8);
env.els['sound-toggle'].onclick();env.els['c-keyboard'].onclick({target:{closest:()=>key}});
assert.equal(env.run('window.navigator.audioSession.type'),'playback');assert.equal(env.voices.length,count+12);
for(const setup of [
 'window.navigator=undefined',
 'window.navigator={}',
 'window.navigator={get audioSession(){throw Error("restricted")}}',
 'window.navigator={audioSession:{get type(){return "ambient"},set type(v){throw Error("read only")}}}'
]){
 const fallback=harness.makeEnvironment();fallback.run(setup+';pianoSound(69)');
 assert.deepEqual(Array.from(fallback.voices),[440,880,1320,1760]);
}
console.log('Audio-session checks passed: playback selected before context creation; exact A4 click/replay; mute and re-enable; unsupported/restricted APIs preserve sound generation. Real iOS silent-mode output remains unverified.');
