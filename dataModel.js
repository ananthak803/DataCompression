const mongoose=require('mongoose');

const dataSchema=new mongoose.Schema({
    codes:{
        type:String,
    },
    dataSize:{
        type:Number,
    },
    compressedData:{
        buffer:String,
        length:Number,
    },
    compressedDataSize:{
        type:Number,
    },
},{timestamps:true})

const dataModel=mongoose.model("dataModel",dataSchema);
module.exports=dataModel;