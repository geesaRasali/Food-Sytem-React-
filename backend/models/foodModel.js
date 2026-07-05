import mongoose from "mongoose";

const foodSchema = new mongoose.Schema(
    {
        name: {type:String,required:true},
        description: {type:String,required:true},
        price:{type:Number,required:true},
        image:{type:String,required:true},
        category:{type:String,required:true},
        supplier:{type:String},
        quantity:{type:Number,required:false,default:0},
        unit:{type:String,required:false,default:'units'},
        expiryDate:{type:Date,required:false}
    }
)

const foodModel = mongoose.models.food || mongoose.model("food",foodSchema);

export default foodModel;