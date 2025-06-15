const express = require('express');
const app = express();
const fs = require('fs');
const { generateAirQualityData, sendToServer, bitStringToBuffer, bufferToBitString, readCodes, readEncoded, newDBEntry } = require('./services');
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
  const allDataStats = await dataModel.find({}, { dataSize: 1, compressedDataSize: 1 }); // For totals only


  const totalEntries = allDataStats.length;
  const totalOriginalSize = allDataStats.reduce((acc, doc) => acc + doc.dataSize, 0);
  const totalCompressedSize = allDataStats.reduce((acc, doc) => acc + doc.compressedDataSize, 0);
  const averageCompressionRatio = totalEntries > 0
    ? (totalCompressedSize / totalOriginalSize).toFixed(2)
    : 0;
  const compressionEfficiency = totalEntries > 0
    ? (((1 - (totalCompressedSize / totalOriginalSize)) * 100).toFixed(2))
    : 0;

  res.render('dashboard', {
    totalEntries,
    totalOriginalSize: (totalOriginalSize / 1024).toFixed(2),
    totalCompressedSize: (totalCompressedSize / 1024).toFixed(2),
    averageCompressionRatio,
    compressionEfficiency,
  });
});

app.get('/test',async (req,res)=>{
  const data = await dataModel.findOne({},{compressedData:1,codes:1});
  console.log(data);
  const s=bufferToBitString(data.compressedData.buffer,data.compressedData.length);
  console.log(s);
  res.send("done");
})

//managing and storing data in database 
app.post('/data', async (req, res) => {
  //storing original data and size
  const originalData = JSON.stringify(req.body);
  const originalBytes = Buffer.byteLength(originalData, 'utf8');
  //path for input and output file of cpp program
  const inputPath = path.join(__dirname, 'cpp/original_data.txt');
  const outputPath = path.join(__dirname, 'cpp/encoded.txt');
  const codesPath = path.join(__dirname, 'cpp/codes.txt');
  const cwd = 'cpp';
  //writing original data to compressionAlgorithms/input.txt
  fs.writeFile(inputPath, originalData, (err) => {
    if (err) {
      console.error('Error writing input file:', err);
      return res.status(500).send('Failed to write input');
    }

    //running compiled huffman code
    execFile(path.join(__dirname, 'cpp', 'huffmanEncode.exe'),
      { cwd: path.join(__dirname, 'cpp') },
      async (error, stdout, stderr) => {
        if (error) {
          console.error('Compression failed:');
          return res.status(500).send('Compression error');
        }

        //reading encoded.txt
        const encodedData = readEncoded(outputPath);
        console.log(typeof(encodedData))
        const {buffer,length} = bitStringToBuffer(encodedData);
        const compressedBytes = Buffer.byteLength(buffer, 'utf8');
        //reading codes.txt
        const codes = readCodes(codesPath);
        if (!codes) {
          console.log('failed to call readCodes');
          return;
        }
        //creating new entry in database
        await newDBEntry(codes, originalBytes, {buffer,length}, compressedBytes);
      });
  });
});

app.listen(port, console.log(`server running on port : ${port}`));
