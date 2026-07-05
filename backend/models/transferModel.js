import mongoose from "mongoose";

const transferSchema = new mongoose.Schema({
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'food', required: true },
    materialName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    recipientSection: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

const transferModel = mongoose.models.transfer || mongoose.model("transfer", transferSchema);

export default transferModel;
