import mongoose from "mongoose";

const transferSchema = new mongoose.Schema({
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'food', required: true },
    materialName: { type: String, required: true },
    category: { type: String, default: '' },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    recipientSection: { type: String, required: true },
    status: { type: String, default: 'Completed' },
    date: { type: Date, default: Date.now }
});

const transferModel = mongoose.models.transfer || mongoose.model("transfer", transferSchema);

export default transferModel;
