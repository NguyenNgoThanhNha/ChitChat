import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", maxlength: 2000 },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 1 },
    image: { type: String, default: "" },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ seller: 1 });

const Product = mongoose.model("Product", productSchema);
export default Product;
