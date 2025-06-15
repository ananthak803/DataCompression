const mongoose=require('mongoose');

const dataSchema=new mongoose.Schema({
    // deviceId:{
    //     type:String,
    // },
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
    // transmissionTime:{
    //     type:Date,
    // },

},{timestamps:true})

const dataModel=mongoose.model("dataModel",dataSchema);
module.exports=dataModel;