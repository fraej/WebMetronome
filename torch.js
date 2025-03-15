let mediaStream = null;
let track = null;
let torchEnabled = false;
let torchSupported = null; // Will be set after first check

/**
 * Attempts to enable or disable the device's flashlight/torch
 * @param {boolean} enable - Whether to turn the torch on (true) or off (false)
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
async function setTorch(enable) {
  try {
    // If we've already checked and know torch isn't supported, fail fast
    if (torchSupported === false) {
      console.warn("Torch not supported on this device.");
      return false;
    }
    
    // Initialize camera stream if not already done
    if (!mediaStream) {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "environment",
            advanced: [{ torch: true }] // Request torch capability
          }
        });
        track = mediaStream.getVideoTracks()[0];
        
        // Check if torch is supported
        const capabilities = track.getCapabilities();
        torchSupported = capabilities && capabilities.torch;
        
        if (!torchSupported) {
          console.warn("Torch not supported on this device.");
          return false;
        }
      } catch (streamError) {
        console.error("Error accessing camera:", streamError);
        torchSupported = false;
        return false;
      }
    }

    // Only apply constraints if the state has changed
    if (enable !== torchEnabled) {
      await track.applyConstraints({ advanced: [{ torch: enable }] });
      torchEnabled = enable;
      console.log(`Torch is now ${torchEnabled ? 'ON' : 'OFF'}`);
      return true;
    } else {
      console.log(`Torch is already ${torchEnabled ? 'ON' : 'OFF'}`);
      return true;
    }

  } catch (error) {
    console.error("Error setting torch:", error);
    if (error.name === "NotAllowedError") {
      console.error("Camera permission is required.");
    } else if (error.name === "NotFoundError") {
      console.error("No camera found with torch capability.");
      torchSupported = false;
    } else if (error.name === "NotReadableError") {
      console.error("Camera is already in use by another application.");
    }
    return false;
  }
}

/**
 * Checks if the device supports torch functionality
 * @returns {Promise<boolean>} - Whether torch is supported
 */
async function checkTorchSupport() {
  // If we've already checked, return the cached result
  if (torchSupported !== null) {
    return torchSupported;
  }
  
  try {
    const tempStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });
    
    const tempTrack = tempStream.getVideoTracks()[0];
    const capabilities = tempTrack.getCapabilities();
    
    // Clean up the temporary stream
    tempTrack.stop();
    
    torchSupported = capabilities && capabilities.torch;
    return torchSupported;
  } catch (error) {
    console.error("Error checking torch support:", error);
    torchSupported = false;
    return false;
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

// Check torch support when the page loads
window.addEventListener('DOMContentLoaded', async () => {
    const supported = await checkTorchSupport();
    const torchToggle = document.getElementById('torch-toggle');
    
    // Disable the torch toggle button if torch is not supported
    if (!supported && torchToggle) {
        torchToggle.disabled = true;
        torchToggle.title = "Flashlight not supported on this device";
        torchToggle.innerHTML = '<span class="material-icons">flashlight_off</span><span>Not Available</span>';
    }
});