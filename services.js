const fs = require('fs').promises;
const dataModel = require('./dataModel');

// read text from file
async function readTextFile(path) {
  try {
    const content = await fs.readFile(path, 'utf-8');
    return content;
  } catch (err) {
    console.error(`error in reading ${path} `, err);
    return null;
  }
}


// Convert bit string to Buffer
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
    length: binaryString.length // Store original length to remove padding later
  };
}

// Convert Buffer back to bit string
function bufferToBitString(base64Str, originalLength) {
  const buffer = Buffer.from(base64Str, 'base64');
  const binaryString = [...buffer]
    .map(byte => byte.toString(2).padStart(8, '0'))
    .join('');
  return binaryString.slice(0, originalLength);
}


//writing data in a text file
async function writeTextFile(filePath,data) {
  try {
    await fs.writeFile(filePath, data, 'utf-8');
  } catch (err) {
    console.error("error writing codes:", err.message);
  }
}

//raw codes to json
function codesJSON(data) {
  const json = {}
  data.split('\n').forEach(line => {
    const parts = line.trim().split(/\s+/);
    if (parts.length !== 2) return;

    let [rawKey, value] = parts;

    // Skip if key or value is missing
    if (!rawKey || !value) return;

    // Handle escaped characters
    if (rawKey === '\\n') rawKey = '\n';
    if (rawKey === '\\"' || rawKey === '\\\"') rawKey = '"';

    json[rawKey] = value;
  });
  return JSON.stringify(json);
}


//json to raw codes
function jsonToRawCodes(codesObject) {
  const codes = typeof codesObject === 'string' ? JSON.parse(codesObject) : codesObject;

  const escapeChar = (char) => {
    if (char === '\n') return '\\n';
    if (char === '"') return '\\"';
    if (char === '{') return '\\{';
    if (char === '}') return '\\}';
    return char;
  };

  const lines = Object.entries(codes)
    .filter(([char, code]) => typeof code === 'string' && code.length > 0) // skip malformed
    .map(([char, code]) => `${escapeChar(char)} ${code}`)
    .join('\n');

  return lines;
}

// Insert compressed data into DB
async function newDBEntry(codes, dataSize, { buffer, length }, compressedDataSize) {
  try {
    await dataModel.create({
      codes,
      dataSize,
      compressedData: {
        buffer: buffer.toString('base64'),
        length
      },
      compressedDataSize
    });
    console.log("Database entry saved.");
  } catch (err) {
    console.error('Database error:', err);
  }
}

module.exports = {
  readTextFile,
  bitStringToBuffer,
  bufferToBitString,
  writeTextFile,
  codesJSON,
  jsonToRawCodes,
  newDBEntry
};
