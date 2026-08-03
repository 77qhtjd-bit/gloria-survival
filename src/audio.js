// Tiny WebAudio SFX (no assets).
// Moved verbatim from src/main.js (step 3: module split).

// tiny WebAudio SFX (no assets)
var AC=null;
export function actx(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){AC=null;}}return AC;}

function beep(freq,dur,type,vol,slideTo){var c=actx();if(!c)return;var o=c.createOscillator(),g=c.createGain();o.type=type||'square';o.frequency.value=freq;if(slideTo)o.frequency.exponentialRampToValueAtTime(Math.max(40,slideTo),c.currentTime+dur);g.gain.value=(vol||0.06);g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+dur);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+dur);}

export function sfxHit(){beep(420,0.08,'square',0.05,260);}

export function sfxKill(){beep(200,0.22,'sawtooth',0.08,60);setTimeout(function(){beep(110,0.22,'sawtooth',0.05,45);},45);}

export function sfxBackstab(){beep(900,0.06,'square',0.06,300);setTimeout(function(){beep(160,0.2,'sawtooth',0.08,50);},50);}

export function sfxHurt(){beep(140,0.2,'square',0.08,55);}

export function sfxEat(){beep(620,0.1,'triangle',0.06,880);}

export function sfxDash(){beep(520,0.08,'sine',0.04,760);}

export function sfxWhiff(){beep(300,0.05,'sine',0.025,220);}

export function sfxDread(){beep(70,0.5,'sine',0.05);}
