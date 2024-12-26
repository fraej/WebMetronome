let mediaStream = null;
let track = null;
let torchEnabled = false;

async function setTorch(enable) {
  try {
    if (!mediaStream) {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      track = mediaStream.getVideoTracks()[0];
    }

    const capabilities = track.getCapabilities();
    if (!capabilities.torch) {
      console.warn("Torch not supported on this device.");
      return;
    }

    if (enable !== torchEnabled) { // Only apply constraints if the state has changed
      await track.applyConstraints({ advanced: [{ torch: enable }] });
      torchEnabled = enable;
      console.log(`Torch is now ${torchEnabled ? 'ON' : 'OFF'}`);
    } else {
        console.log(`Torch is already ${torchEnabled ? 'ON' : 'OFF'}`);
    }

  } catch (error) {
    console.error("Error setting torch:", error);
    if (error.name === "NotAllowedError") {
      console.error("Camera permission is required.");
    }
  }
}

// // Example usage:
// // Turn the torch ON:
// setTorch(true);

// // After some time (e.g., using setTimeout):
// setTimeout(() => {
//   // Turn the torch OFF:
//   setTorch(false);
// }, 5000); // Turn off after 5 seconds

// //Or to toggle:
// function toggleTorch(){
//     setTorch(!torchEnabled);
// }

//Clean up on unload
window.addEventListener('beforeunload', () => {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
});