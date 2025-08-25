import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    url: { type: String, required: true },
    prompt: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const ImageModel = mongoose.model.Image || mongoose.model("Image", imageSchema);

export default ImageModel;
