const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const source=html.slice(html.indexOf('function trackVoice('),html.indexOf('function delayedSound('));
const voices=[];
class AudioContext {
  constructor(){this.state='running';this.currentTime=0;this.sampleRate=48000;this.destination={}}
  createOscillator(){
    const o={frequency:{value:0},connect(g){this.g=g},disconnect(){},start(t){this.startTime=t;voices.push(this)},stop(t){this.stopTime=t;if(t===undefined){this.stopped=true;this.onended?.()}}};
    return o;
  }
  createGain(){return {gain:{events:[],setValueAtTime(v,t){this.events.push({v,t})},exponentialRampToValueAtTime(v,t){this.events.push({v,t})}},connect(to){this.output=to},disconnect(){}}}
  createWaveShaper(){return {connect(to){this.output=to}}}
}
const context={window:{AudioContext}};vm.createContext(context);
vm.runInContext(`let audio,soundEnabled=true,soundEpoch=0;const activeVoices=new Set();function stopAudio(){soundEpoch++;for(const o of activeVoices)o.stop();activeVoices.clear()}`+source,context);
const run=code=>vm.runInContext(code,context);
const play=code=>{const start=voices.length;run(code);return voices.slice(start)};
const peak=o=>Math.max(...o.g.gain.events.map(e=>e.v));
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const single=play('pianoSound(69)');
assert.equal(single.length,4);single.forEach((o,i)=>{close(o.frequency.value,440*(i+1));close(peak(o),[.36,.1152,.0576,.0288][i])});
const master=single[0].g.output,limiter=master.output;
close(master.gain.value,1.65);
assert.ok(single.every(o=>o.g.output===master));
assert.equal(limiter.oversample,'4x');assert.equal(limiter.curve.length,8193);
assert.equal(limiter.output,run('audio.destination'));
for(let i=0;i<limiter.curve.length;i++){
 const x=i*2/(limiter.curve.length-1)-1,y=limiter.curve[i];
 assert.ok(Number.isFinite(y)&&Math.abs(y)<.98);
 if(i)assert.ok(y>=limiter.curve[i-1]);
 assert.ok(Math.abs(y+limiter.curve[limiter.curve.length-1-i])<1e-6);
 if(Math.abs(x)<=.7)assert.ok(Math.abs(y-x)<1e-6);
}
close(peak(single[0])/.18,2);assert.ok(single.reduce((sum,o)=>sum+peak(o),0)<.9);
const triad=play('pianoVoicing([60,64,67])');
assert.equal(triad.length,12);close(triad.reduce((sum,o)=>sum+peak(o),0),.9);
assert.ok(triad.every(o=>o.g.output===master));
assert.ok(peak(triad[0])/(.18/Math.sqrt(3))>1.84);assert.ok(peak(triad[0])/(.18/Math.sqrt(3))<1.86);
assert.ok(single.every(o=>o.stopped));assert.equal(new Set(triad.map(o=>o.startTime)).size,1);
let checked=0;
for(const notes of [[60],[60,64],[60,64,67],[48,52,55,59],[36,40,43,47,50],[60,60,64,67]]){
  const played=play(`pianoVoicing(${JSON.stringify(notes)})`);
  assert.equal(played.length,new Set(notes).size*4);
  assert.ok(played.reduce((sum,o)=>sum+peak(o),0)<=.9+1e-9);
  assert.ok(played.every(o=>o.g.gain.events.every(e=>e.v>0&&Number.isFinite(e.v))));checked++;
}
// Every MIDI pitch keeps its exact fundamental, and ultrasonic harmonics are omitted.
for(let midi=0;midi<=127;midi++){
  const played=play(`pianoSound(${midi})`),f=440*2**((midi-69)/12);
  close(played[0].frequency.value,f);
  played.forEach((o,i)=>{close(o.frequency.value,f*(i+1));assert.ok(o.frequency.value<24000)});
  assert.ok(played.reduce((sum,o)=>sum+peak(o),0)<=.9);checked++;
}
const answer=play('sound(69)');assert.equal(answer.length,1);close(peak(answer[0]),.44);close(answer[0].frequency.value,440);
assert.equal(answer[0].g.output,master);
const interval=play('intervalSound(60,67)');assert.equal(interval.length,2);close(interval[1].startTime-interval[0].startTime,.45);
assert.ok(interval.reduce((sum,o)=>sum+peak(o),0)<.9);
const count=voices.length;run('stopAudio();soundEnabled=false;pianoSound(69);sound(69);intervalSound(60,67)');
assert.equal(voices.length,count);assert.equal(run('activeVoices.size'),0);assert.ok(interval.every(o=>o.stopped));
console.log(`Audio gain checks passed: shared 1.65x output boost (+4.35 dB before peak limiting), bounded odd monotonic soft limiter, ${checked} pitch/voicing cases, exact frequencies, replay cancellation and mute. Device listening is not simulated.`);
