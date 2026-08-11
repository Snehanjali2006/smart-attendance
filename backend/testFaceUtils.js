const fs = require('fs');
const faceUtils = require('./utils/faceUtils');
const path = require('path');

async function run() {
    try {
        console.log('Loading models...');
        await faceUtils.loadModels();
        console.log('Models loaded.');
        
        // We need a dummy image to test
        const canvas = require('canvas');
        const c = canvas.createCanvas(100, 100);
        const ctx = c.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 100, 100);
        
        const buffer = c.toBuffer('image/jpeg');
        
        console.log('Detecting face (expecting NO_FACE_DETECTED)...');
        try {
            await faceUtils.detectSingleFace(buffer);
        } catch(e) {
            console.log('Got error (as expected):', e.message);
        }
        console.log('Test complete!');
    } catch (e) {
        console.error('Test failed:', e);
    }
}
run();
