Real Time Data Compression for Iot Devices using Huffman Algorithm

**Instructions
1."git clone https://github.com/ananthak803/DataCompression.git"  or download this repo.

2.npm install

3.Download MongoDB

4.run server.js :"node server.js"
-If you see this in your terminal then server is running and DB is connected.
"server running on port : 5000"
"connected to database"

5.Open browser and go to following routes
-"localhost:5000/" : generates data , compress the data with huffman and stores in database.
-"localhost:5000/dashboard" : displays the dashboard.

**Note

-Huffman compression is implemented in C++ and executed via Node.js using child_process.

-Data is converted between bit strings and buffers for storage.

-EJS is used for rendering the dashboard UI.