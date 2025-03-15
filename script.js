const bpmSlider = document.getElementById('bpm-slider');
const bpmDisplay = document.getElementById('bpm-value');
const playButton = document.getElementById('play-button');
const soundToggle = document.getElementById('sound-toggle');
const torchToggle = document.getElementById('torch-toggle');
const body = document.querySelector('body');
const appContainer = document.querySelector('.app-container');

let isPlaying = false;
let useSynth = true;
let currentHue = 0;
let isTorchOn = false;

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

// Load WAV files as players
const hiPlayer = new Tone.Player("hi.wav").toDestination();
const lowPlayer = new Tone.Player("low.wav").toDestination();

// Function to generate material design compatible colors
function generateMaterialColor() {
    // Increment hue by 30 degrees for each beat to cycle through colors
    currentHue = (currentHue + 30) % 360;
    
    // Check if we're in dark mode
    const isDarkMode = document.body.classList.contains('dark-theme');
    
    // Generate colors differently based on mode
    if (isDarkMode) {
        // For dark mode, generate deeper, richer colors
        return `hsl(${currentHue}, 70%, 25%)`;
    } else {
        // For light mode, generate brighter, more vibrant colors
        return `hsl(${currentHue}, 70%, 75%)`;
    }
}

// Create Tone.js loop
let loop = new Tone.Loop(time => {
    if (useSynth) {
        synth.triggerAttackRelease('32n', time);
    } else {
        // Alternate between hi and low sounds
        if (Tone.Transport.position.split(':')[2] === '0') {
            hiPlayer.start(time);
        } else {
            lowPlayer.start(time);
        }
    }
    
    // Generate a new material design color
    const newColor = generateMaterialColor();
    
    // Apply color to background with transition
    appContainer.style.backgroundColor = newColor;
    
    // Add a subtle visual feedback
    playButton.classList.add('pulse');
    setTimeout(() => {
        playButton.classList.remove('pulse');
    }, 100);
    
    // Flash the torch in sync with the beat if torch is enabled
    if (isTorchOn) {
        // Toggle torch on each beat for a flash effect
        setTorch(true);
        setTimeout(() => {
            if (isTorchOn) { // Check if still enabled
                setTorch(false);
            }
        }, 100); // Short flash duration
    }
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
        playButton.innerHTML = '<span class="material-icons">stop</span><span>Stop</span>';
        playButton.classList.add('playing');
        isPlaying = true;
        
        // Set initial background color
        appContainer.style.backgroundColor = generateMaterialColor();
        
        // Start audio
        loop.start(0);
        Tone.Transport.start();
    } else {
        playButton.innerHTML = '<span class="material-icons">play_arrow</span><span>Start</span>';
        playButton.classList.remove('playing');
        isPlaying = false;
        
        // Stop audio
        Tone.Transport.stop();
        loop.stop();
        
        // Reset background color
        appContainer.style.backgroundColor = '';
        
        // Turn off torch if it was on
        if (isTorchOn) {
            setTorch(false);
        }
    }
});

// Handle sound toggle button
soundToggle.addEventListener('click', () => {
    useSynth = !useSynth;
    if (useSynth) {
        soundToggle.innerHTML = '<span class="material-icons">music_note</span><span>Synth</span>';
        soundToggle.classList.remove('wav');
    } else {
        soundToggle.innerHTML = '<span class="material-icons">graphic_eq</span><span>WAV</span>';
        soundToggle.classList.add('wav');
    }
    localStorage.setItem("useSynth", useSynth);
});

// Handle torch toggle button
torchToggle.addEventListener('click', async () => {
    isTorchOn = !isTorchOn;
    
    if (isTorchOn) {
        // Update button appearance
        torchToggle.innerHTML = '<span class="material-icons">flashlight_on</span><span>On</span>';
        torchToggle.classList.add('torch-on');
        
        try {
            // Request camera permission if playing
            if (isPlaying) {
                await setTorch(true);
            }
        } catch (error) {
            console.error("Failed to enable torch:", error);
            // Reset state if failed
            isTorchOn = false;
            torchToggle.innerHTML = '<span class="material-icons">flashlight_off</span><span>Off</span>';
            torchToggle.classList.remove('torch-on');
            
            // Show error message to user
            alert("Could not access flashlight. Make sure your device supports it and you've granted camera permission.");
        }
    } else {
        // Turn off torch
        torchToggle.innerHTML = '<span class="material-icons">flashlight_off</span><span>Off</span>';
        torchToggle.classList.remove('torch-on');
        
        // Turn off the torch if it was on
        await setTorch(false);
    }
    
    localStorage.setItem("isTorchOn", isTorchOn);
});

// Check if device supports dark mode and apply if preferred
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark-theme');
}

// Toggle dark mode on color scheme change
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (e.matches) {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    
    // If currently playing, reset the background color to match new theme
    if (isPlaying) {
        appContainer.style.backgroundColor = generateMaterialColor();
    } else {
        // Reset background color if not playing
        appContainer.style.backgroundColor = '';
    }
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

// Set initial sound type
const savedSoundType = localStorage.getItem("useSynth");
if (savedSoundType !== null) {
    useSynth = savedSoundType === "true";
    if (!useSynth) {
        soundToggle.innerHTML = '<span class="material-icons">graphic_eq</span><span>WAV</span>';
        soundToggle.classList.add('wav');
    }
}

// Set initial torch state
const savedTorchState = localStorage.getItem("isTorchOn");
if (savedTorchState === "true") {
    // Don't automatically turn on torch, just update UI
    isTorchOn = true;
    torchToggle.innerHTML = '<span class="material-icons">flashlight_on</span><span>On</span>';
    torchToggle.classList.add('torch-on');
}

// Add ripple effect to buttons
const buttons = document.querySelectorAll('.md-button');
buttons.forEach(button => {
    button.addEventListener('click', function(e) {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});
