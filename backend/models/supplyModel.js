import mongoose from "mongoose";

const supplySchema = new mongoose.Schema({
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'food', required: true },
    materialName: { type: String, required: true },
    supplierName: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    date: { type: Date, default: Date.now }
});

const supplyModel = mongoose.models.supply || mongoose.model("supply", supplySchema);

export default supplyModel;
