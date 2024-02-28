var audioCtx;
var globalGain;
var gainSum = 0;


const brookButton = document.getElementById('brook');
const alarmButton = document.getElementById('alarm');

brookButton.addEventListener('click', function () {
    if(!audioCtx){
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        globalGain = audioCtx.createGain(); //this will control the volume of all notes
        globalGain.gain.setValueAtTime(0.8, audioCtx.currentTime)
        globalGain.connect(audioCtx.destination);
    }
    startBrook();
})

alarmButton.addEventListener('click', function(){
    if(!audioCtx){
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        globalGain = audioCtx.createGain(); //this will control the volume of all notes
        globalGain.gain.setValueAtTime(0.8, audioCtx.currentTime)
        globalGain.connect(audioCtx.destination);
    }
    startAlarm();
})

function startBrook() {
    // create brown noise
    var bufferSize = 10 * audioCtx.sampleRate,
    noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate),
    output = noiseBuffer.getChannelData(0);

    var lastOut = 0;
    for (var i = 0; i < bufferSize; i++) {
        var brown = Math.random() * 2 - 1;
    
        output[i] = (lastOut + (0.02 * brown)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
    }

    brownNoise = audioCtx.createBufferSource();
    brownNoise.buffer = noiseBuffer;
    brownNoise.loop = true;

    // make lowpass filters
    let lowPass1 = makeLPF(400);
    let lowPass2 = makeLPF(14);

    brownNoise.connect(lowPass1);
    brownNoise.connect(lowPass2);

    let gainNode = audioCtx.createGain();
    gainNode.gain.value = 400;
    gainSum += gainNode.gain.value;
    lowPass2.connect(gainNode);

    // make rhpf
    let rhpf = makeRHPF(150, 17);
    lowPass1.connect(rhpf);
    gainNode.connect(rhpf.frequency);

    globalGain.gain.setValueAtTime(0.8, audioCtx.currentTime);
    updateGain();
    rhpf.connect(globalGain);

    brownNoise.start(0);

    setTimeout(() => {
        globalGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
        brownNoise.stop(0);
    }, 10000);

}

function makeLPF(cutoff) {
    var lpf = audioCtx.createBiquadFilter();
    lpf.frequency.value = cutoff;
    lpf.type = "lowpass";
    return lpf;
}

function makeRHPF(q, gain) {
    var newRhpf = audioCtx.createBiquadFilter();
    newRhpf.Q.value = q;
    newRhpf.gain.value = gain;
    newRhpf.type = "highpass";
    gainSum += newRhpf.gain.value;
    return newRhpf;
}

function updateGain() {
    let gs = Math.max(1, gainSum);
    let newGlobalGain = 0.8 / gs;
    globalGain.gain.setValueAtTime(newGlobalGain, audioCtx.currentTime);
}

function startAlarm() {
    const osc = audioCtx.createOscillator();
    osc.frequency.value = 800;
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.1;
    osc.connect(gainNode);
    gainNode.connect(globalGain);
    osc.start();

    let count = 0;
    function modulate() {
        count++;
        if (count % 3 === 0) {
            osc.frequency.setValueAtTime(800, audioCtx.currentTime); 
        } else if (count % 3== 1) {
            osc.frequency.setValueAtTime(700, audioCtx.currentTime); 
        } else {
            osc.frequency.setValueAtTime(600, audioCtx.currentTime); 
        }
    }
    interval = setInterval(modulate, 140);

    setTimeout(() => {
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
        clearInterval(interval);
        osc.stop();
    }, 10000);
}