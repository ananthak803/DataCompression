const mongoose=require('mongoose');

const dataSchema=new mongoose.Schema({
    // deviceId:{
    //     type:String,
    // },
    data:{
        type:String,
    },
    dataSize:{
        type:Number,
    },
    compressedData:{
        type:String,
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