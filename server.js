const express = require('express');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const {
  bitStringToBuffer,
  bufferToBitString,
  codesJSON,
  readTextFile,
  writeTextFile,
  jsonToRawCodes,
  newDBEntry,
} = require('./services');
const { connectMongo } = require('./connection');
const dataModel = require('./dataModel');

const app = express();
const port = 5000;

// MongoDB Connection
const url = "mongodb://localhost:27017";
connectMongo(url)
  .then(() => console.log("Connected to database"))
  .catch((err) => console.log(err));

// Middleware
app.use(express.json());
app.set('view engine', 'ejs');


// Paths for input/output files
const cppDir = path.join(__dirname, 'cpp');
const inputPath = path.join(cppDir, 'original_data.txt');
const encodedPath = path.join(cppDir, 'encoded.txt');
const codesPath = path.join(cppDir, 'codes.txt');
const decodedPath = path.join(cppDir, 'decoded.txt');

// Dashboard stats
app.get('/dashboard', async (req, res) => {
  //fetching all entries from db
  const allData = await dataModel.find({}, { dataSize: 1, compressedDataSize: 1 });
  //fetching latest five compressed data and codes from db
  const lastFiveFull = await dataModel
    .find({}, { compressedData: 1, codes: 1, createdAt: 1 })
    .sort({ createdAt: -1 })
    .limit(5);

  //processing latest five entries (decoding)
  const latestFive = lastFiveFull;
  const recentEntries = [];
  let i = 0;
  for (const data of latestFive) {
    try {
      //buffer to bitstring
      const bitString = bufferToBitString(data.compressedData.buffer, data.compressedData.length);
      //writing bitstrint to encoded.txt
      await writeTextFile(encodedPath, bitString);

      //huffman code from json format to text and writing to codes.txt
      const rawCodes = jsonToRawCodes(data.codes);
      await writeTextFile(codesPath, rawCodes);

      // wrap execFile in a Promise to wait for its result
      await new Promise((resolve, reject) => {
        //running huffmanDecoder.exe
        execFile(path.join(cppDir, 'huffmanDecoder.exe'), { cwd: cppDir }, async (error) => {
          if (error) {
            console.error('Decoder execution failed:', error);
            return reject(error);
          }

          try {
            //reading decoded json data in string format
            const decoded = await readTextFile(decodedPath);
            // pushing to recentEntries after converting from string to json
            recentEntries.push(JSON.parse(decoded));
            resolve();
          } catch (readErr) {
            console.error("Error reading decoded file:", readErr);
            reject(readErr);
          }
        });
      });

    } catch (err) {
      console.error("Error processing a compressed entry:", err);
    }
  }

  //data stats calculation
  const totalEntries = allData.length;
  const totalOriginalSize = allData.reduce((acc, doc) => acc + doc.dataSize, 0);
  const totalCompressedSize = allData.reduce((acc, doc) => acc + doc.compressedDataSize, 0);

  const averageCompressionRatio = totalEntries > 0
    ? (totalCompressedSize / totalOriginalSize).toFixed(2)
    : 0;

  const compressionEfficiency = totalEntries > 0
    ? (((1 - (totalCompressedSize / totalOriginalSize)) * 100).toFixed(2))
    : 0;

  //rendering dashboard.ejs and passing data to frontend
  res.render('dashboard', {
    totalEntries,
    totalOriginalSize: (totalOriginalSize / 1024).toFixed(2),
    totalCompressedSize: (totalCompressedSize / 1024).toFixed(2),
    averageCompressionRatio,
    compressionEfficiency,
    recentEntries,
  });
});

// POST route to receive and process sensor data
app.post('/data', async (req, res) => {
  const sensorData = JSON.stringify(req.body);
  const sensorDataBytes = Buffer.byteLength(sensorData, 'utf8');

  // Write original data to file original_data.txt
  fs.writeFile(inputPath, sensorData, async (err) => {
    execFile(path.join(cppDir, 'huffmanEncode.exe'), { cwd: cppDir }, async (error) => {
      if (error) {
        console.error('Compression failed:', error);
        return res.status(500).send('Compression error');
      }

      // Read compressed output from encoded.txt
      const encodedData = await readTextFile(encodedPath);
      const { buffer, length } = bitStringToBuffer(encodedData);
      const compressedBytes = Buffer.byteLength(buffer, 'utf8');

      //read raw huffman codes from codes.txt and convert to json
      const codes = await readTextFile(codesPath);
      if (!codes) {
        console.error('Failed to read codes');
        return res.status(500).send('Failed to read codes');
      }
      const codesInJSON = codesJSON(codes);

      // Save to DB
      await newDBEntry(codesInJSON, sensorDataBytes, { buffer, length }, compressedBytes);
      res.status(200).send('Data received, compressed and stored.');
    });
  });
});

app.listen(port, () => console.log(`Server running on port: ${port}`));
