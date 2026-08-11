const path = require('path');
const faceapi = require('@vladmandic/face-api');
const tf = require('@tensorflow/tfjs');
const jpeg = require('jpeg-js');

const modelsPath = path.join(__dirname, '..', 'public', 'models');

let modelsLoaded = false;

async function loadModels() {
  if (modelsLoaded) return;
  
  try {
    // Monkey patch faceapi to use node environment
    faceapi.env.monkeyPatch({
      Canvas: class {},
      Image: class {},
      ImageData: class {},
      createCanvasElement: () => {},
      createImageElement: () => {}
    });

    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);
    modelsLoaded = true;
    console.log('Face-API models loaded successfully.');
  } catch (err) {
    console.error('Failed to load Face-API models:', err.message);
    throw err;
  }
}

/**
 * Detects exactly one face in an image buffer and returns its embedding.
 * @param {Buffer} imageBuffer - The image buffer to process
 * @returns {Promise<{embedding: number[], detection: any}>}
 */
async function detectSingleFace(imageBuffer) {
  await loadModels();
  
  try {
    // Decode JPEG
    const imgData = jpeg.decode(imageBuffer, { useTArray: true });
    
    // Create tensor directly from pixel data
    const tensor = tf.tidy(() => {
      // jpeg-js returns RGBA layout, we need RGB
      const numPixels = imgData.width * imgData.height;
      const rgbValues = new Int32Array(numPixels * 3);
      
      for (let i = 0; i < numPixels; i++) {
        rgbValues[i * 3] = imgData.data[i * 4];         // R
        rgbValues[i * 3 + 1] = imgData.data[i * 4 + 1]; // G
        rgbValues[i * 3 + 2] = imgData.data[i * 4 + 2]; // B
      }
      return tf.tensor3d(rgbValues, [imgData.height, imgData.width, 3], 'int32');
    });

    const detections = await faceapi.detectAllFaces(tensor).withFaceLandmarks().withFaceDescriptors();
    
    // Free tensor memory
    tensor.dispose();
    
    if (detections.length === 0) {
      throw new Error('NO_FACE_DETECTED');
    }
    
    if (detections.length > 1) {
      throw new Error('MULTIPLE_FACES_DETECTED');
    }
    
    return {
      embedding: Array.from(detections[0].descriptor),
      detection: detections[0].detection
    };
  } catch (err) {
    if (err.message !== 'NO_FACE_DETECTED' && err.message !== 'MULTIPLE_FACES_DETECTED') {
        console.error('Detection error:', err);
    }
    throw err;
  }
}

/**
 * Calculates the Euclidean distance between two face embeddings.
 * @param {number[]} emb1 
 * @param {number[]} emb2 
 * @returns {number} Distance (lower is more similar)
 */
function compareEmbeddings(emb1, emb2) {
  if (!emb1 || !emb2 || emb1.length !== emb2.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < emb1.length; i++) {
    const diff = emb1[i] - emb2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

module.exports = {
  loadModels,
  detectSingleFace,
  compareEmbeddings
};
