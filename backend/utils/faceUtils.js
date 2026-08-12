const path = require('path');
// MOCKED for Windows without C++ build tools
// const faceapi = require('@vladmandic/face-api');
// const tf = require('@tensorflow/tfjs');
// const jpeg = require('jpeg-js');

async function loadModels() {
  console.log('Face-API models loaded (MOCKED).');
}

/**
 * Detects exactly one face in an image buffer and returns its embedding.
 * @param {Buffer} imageBuffer - The image buffer to process
 * @returns {Promise<{embedding: number[], detection: any}>}
 */
async function detectSingleFace(imageBuffer) {
  console.log('detectSingleFace called (MOCKED). Returning dummy embedding.');
  // Return a dummy 128-dimensional embedding
  return {
    embedding: new Array(128).fill(0.1),
    detection: { box: { x: 0, y: 0, width: 100, height: 100 }, score: 0.99 }
  };
}

/**
 * Calculates the Euclidean distance between two face embeddings.
 * @param {number[]} emb1 
 * @param {number[]} emb2 
 * @returns {number} Distance (lower is more similar)
 */
function compareEmbeddings(emb1, emb2) {
  // Always return 0 (perfect match) for testing the camera flow
  return 0.2; 
}

module.exports = {
  loadModels,
  detectSingleFace,
  compareEmbeddings
};

