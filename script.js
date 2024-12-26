const bpmSlider = document.getElementById('bpm-slider');
const bpmDisplay = document.getElementById('bpm-value');
const playButton = document.getElementById('play-button');
const body = document.querySelector('body');

let isPlaying = false;


// Initialize Tone.js synth with higher pitch settings
const synth = new Tone.NoiseSynth({
    noise: {
        type: 'white'
    },
    envelope: {
        attack: 0.001,
        decay: 0.05,
        sustain: 0,
        release: 0.01
    }
}).toDestination();

// Add a filter to shape the noise into a click
const filter = new Tone.Filter({
    frequency: 11400,
    type: 'lowpass',
    Q: 5
}).toDestination();

synth.connect(filter);
synth.volume.value = 0;

// Create Tone.js loop
let loop = new Tone.Loop(time => {
    synth.triggerAttackRelease('32n', time);
    body.style.backgroundColor = 'hsl(' + Math.random() * 360 + ', 100%, 50%)';
}, '4n');

// Update BPM display when slider changes
bpmSlider.addEventListener('input', (e) => {
    const bpm = e.target.value;
    bpmDisplay.textContent = bpm;
    Tone.Transport.bpm.value = bpm;
    localStorage.setItem("bpm", bpm);
});

// Handle play/stop button
playButton.addEventListener('click', async () => {
    // Start audio context on first click (required by browsers)
    if (Tone.context.state !== 'running') {
        await Tone.start();
    }

    if (!isPlaying) {
        playButton.textContent = 'Stop';
        playButton.classList.add('playing');
        loop.start(0);
        Tone.Transport.start();
    } else {
        playButton.textContent = 'Start';
        playButton.classList.remove('playing');
        Tone.Transport.stop();
        loop.stop();
    }
    isPlaying = !isPlaying;
});

// Set initial BPM
const savedBpm = localStorage.getItem("bpm");
if (savedBpm) {
    bpmSlider.value = savedBpm;
    bpmDisplay.textContent = savedBpm;
} else {
    bpmSlider.value = 120;
    bpmDisplay.textContent = 120;
}
Tone.Transport.bpm.value = bpmSlider.value;
