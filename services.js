// simulator.js
const axios = require('axios');

//iot data generators
function generateSensorData() {
  return {
    timestamp: new Date().toISOString(),
    temperature: (Math.random() * 40).toFixed(2),
    humidity: (Math.random() * 100).toFixed(2),
    pressure: (950 + Math.random() * 100).toFixed(2),
  };
}

function generateGPSData() {
  return {
    timestamp: new Date().toISOString(),
    latitude: (28 + Math.random()).toFixed(6),  
    longitude: (77 + Math.random()).toFixed(6),
    speed: (Math.random() * 80).toFixed(2),        
    direction: (Math.random() * 360).toFixed(2),   
  };
}

function generateAirQualityData() {
  return {
    timestamp: new Date().toISOString(),
    pm25: (Math.random() * 300).toFixed(2),        
    co2: (400 + Math.random() * 1000).toFixed(2),  
    voc: (0 + Math.random() * 5).toFixed(2),       
    temperature: (18 + Math.random() * 10).toFixed(2), 
  };
}

//sends the data to server at /data
async function sendToServer(data) {
  try {
    await axios.post('http://localhost:5000/data', data);
    console.log('Sent:', data);
  } catch (err) {
    console.error('Error sending data:', err.message);
  }
}

// string of bits to bits converter
function bitStringToBuffer(bitString) {
  const bytes = [];
  for (let i = 0; i < bitString.length; i += 8) {
    const byteStr = bitString.slice(i, i + 8).padEnd(8, '0'); 
    const byte = parseInt(byteStr, 2);
    bytes.push(byte);
  }
  return Buffer.from(bytes);
}

// bits to string of bits converter
function bufferToBitString(buffer) {
  let bitString = '';
  for (const byte of buffer) {
    bitString += byte.toString(2).padStart(8, '0');
  }
  return bitString;
}

module.exports = {
  generateSensorData,
  generateGPSData,
  generateAirQualityData,
  sendToServer,
  bitStringToBuffer,
  bufferToBitString,
}
