// simulator.js
const axios = require('axios');
const fs = require('fs');
const dataModel = require('./dataModel');


//iot data generators
// function generateSensorData() {
//   return {
//     timestamp: new Date().toISOString(),
//     temperature: (Math.random() * 40).toFixed(2),
//     humidity: (Math.random() * 100).toFixed(2),
//     pressure: (950 + Math.random() * 100).toFixed(2),
//   };
// }

// function generateGPSData() {
//   return {
//     timestamp: new Date().toISOString(),
//     latitude: (28 + Math.random()).toFixed(6),  
//     longitude: (77 + Math.random()).toFixed(6),
//     speed: (Math.random() * 80).toFixed(2),        
//     direction: (Math.random() * 360).toFixed(2),   
//   };
// }

function generateAirQualityData() {
  return {
    timestamp: new Date().toISOString(),
    pm25: (Math.random() * 300).toFixed(2),
    co2: (400 + Math.random() * 1000).toFixed(2),
    voc: (0 + Math.random() * 5).toFixed(2),
    temperature: (18 + Math.random() * 10).toFixed(2),
  };
}

// sends the data to server at /data
async function sendToServer(data) {
  try {
    await axios.post('http://localhost:5000/data', data);
    console.log('Sent:', data);
  } catch (err) {
    console.error('Error sending data:', err.message);
  }
}


// async function readCodes(path) {
//   try {
//     const codes = await fs.readFile(path, 'utf-8');
//     return JSON.stringify(JSON.parse(codes));
//   }
//   catch (err) {
//     console.log("error in readCodes function : ", err);
//   }
// }

function readCodes(path) {
  try {
    const lines = fs.readFileSync(path, 'utf-8').split(/\r?\n/);
    const codes = {};

    for (let line of lines) {
      if (!line.trim()) continue;

      const [char, code] = line.trim().split(/\s+/);
      if (!char || !code) continue;

      let actualChar = char;
      if (char === '\\n') actualChar = '\n';
      else if (char === '\\s') actualChar = ' ';
      else if (char === '\\"') actualChar = '"';

      codes[actualChar] = code;
    }

    return JSON.stringify(codes);
  } catch (err) {
    console.error("Error in readCodes function:", err);
    return null;
  }
}


// async function readEncoded(path) {
//   try {
//     const bitString = await fs.readFile(path, 'utf-8');
//     return bitString.trim();
//   }
//   catch (err) {
//     console.log("error in readCodes function : ", err);
//   }
// }
function readEncoded(path) {
  try {
    const content = fs.readFileSync(path, 'utf-8');
    return content.replace(/\r?\n/g, '');  // remove all newlines
  } catch (err) {
    console.error("error in readEncoded function : ", err);
    return null;
  }
}




async function newDBEntry(codes, dataSize, { buffer, length }, compressedDataSize) {
  console.log(length);
  try {
    await dataModel.create({
      // data: originalData,
      codes: codes,
      dataSize: dataSize,
      compressedData: {
        buffer: buffer.toString('base64'),
        length: length
      },
      compressedDataSize: compressedDataSize,

    });
  } catch (dbErr) {
    console.error('Database error:', dbErr);
  }

}

// Converts bit string to Buffer
function bitStringToBuffer(binaryString) {
  if (!binaryString || typeof binaryString !== 'string') {
    throw new Error("Invalid binary string passed to bitStringToBuffer()");
  }
  const padLength = (8 - (binaryString.length % 8)) % 8;
  const padded = binaryString + '0'.repeat(padLength);
  const byteChunks = padded.match(/.{8}/g);
  const byteArray = byteChunks.map(b => parseInt(b, 2));
  return {
    buffer: Buffer.from(byteArray),
    length: binaryString.length // store original length to remove padding later
  };
}

function bufferToBitString(base64Str, originalLength) {
  const buffer = Buffer.from(base64Str, 'base64');
  const binaryString = [...buffer]
    .map(byte => byte.toString(2).padStart(8, '0'))
    .join('');
  return binaryString.slice(0, originalLength);
}


module.exports = {
  bitStringToBuffer,
  bufferToBitString,
  generateAirQualityData,
  sendToServer,
  readCodes,
  readEncoded,
  newDBEntry
}
