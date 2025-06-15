const express = require('express');
const app = express();
const fs = require('fs');
const { generateSensorData, generateGPSData, generateAirQualityData, sendToServer ,bitStringToBuffer,bufferToBitString} = require('./services');
const { connectMongo } = require('./connection');
const dataModel = require('./dataModel');
const path = require('path');
const { execFile } = require('child_process');
const port = 5000;

//connecting to database
const url = "mongodb://localhost:27017"
connectMongo(url).then(() => { console.log("connected to database") }).catch((err) => { console.log(err) });

//parse json
app.use(express.json());

//set ejs as view engine for server side rendering
app.set('view engine', 'ejs');


//test route for genrating data and send to /data
app.get('/', (req, res) => {
  const reading = generateAirQualityData()
  sendToServer(reading);
  res.send("done");
});

//get req for dashboard
app.get('/dashboard', async (req, res) => {
  const allData = await dataModel.find();

  const totalEntries = allData.length;
  const totalOriginalSize = allData.reduce((acc, doc) => acc + doc.dataSize, 0);
  const totalCompressedSize = allData.reduce((acc, doc) => acc + doc.compressedDataSize, 0);
  const averageCompressionRatio = totalEntries > 0 
    ? (totalCompressedSize / totalOriginalSize).toFixed(2)
    : 0;
  const compressionEfficiency = totalEntries > 0 
    ? (((1 - (totalCompressedSize / totalOriginalSize)) * 100).toFixed(2))
    : 0;

  res.render('dashboard', {
    totalEntries,
    totalOriginalSize,
    totalCompressedSize,
    averageCompressionRatio,
    compressionEfficiency
  });
});

//managing and storing data in database 
app.post('/data', async (req, res) => {
  //storing original data and size
  const originalData = JSON.stringify(req.body);
  const originalBytes = Buffer.byteLength(originalData, 'utf8');
  //path for input and output file of cpp program
  const inputPath = path.join(__dirname, 'compressionAlgorithms/input.txt');
  const outputPath = path.join(__dirname, 'compressionAlgorithms/output.txt');
  const cwd = 'compressionAlgorithms';
  //writing original data to compressionAlgorithms/input.txt
  fs.writeFile(inputPath, originalData, (err) => {
    if (err) {
      console.error('Error writing input file:', err);
      return res.status(500).send('Failed to write input');
    }

    //running compiled huffman code
     execFile(path.join(__dirname, 'compressionAlgorithms', 'a.exe'), 
    { cwd: path.join(__dirname, 'compressionAlgorithms') }, 
    (error, stdout, stderr) => {
      if (error) {
        console.error('Compression failed:', stderr || error.message);
        return res.status(500).send('Compression error');
      }
      //reading compressionAlgorithms/output.txt 
      fs.readFile(outputPath, 'utf-8', async (err, data) => {
        if (err) {
          console.log('Error reading compressed file:', err);
          return res.status(500).send('Failed to read compressed data');
        }
        //storing the compressed data which in the form of - "01010101101001",string of bits
        const compressedData = bitStringToBuffer(data);   //converting string of bits to bits
        const compressedBytes = Buffer.byteLength(compressedData, 'utf8');  // storing compressed data size
        //creating new entry in database
        try {
          await dataModel.create({
            data: originalData,
            dataSize: originalBytes,
            compressedData: compressedData,
            compressedDataSize: compressedBytes,
          });

          res.status(200).send({
            message: 'Data compressed and saved successfully',
            originalSize: originalBytes,
            compressedSize: compressedBytes,
          });

        } catch (dbErr) {
          console.error('Database error:', dbErr);
          res.status(500).send('Failed to save to database');
        }
      });
    });
  });
});

app.listen(port, console.log(`server running on port : ${port}`));
