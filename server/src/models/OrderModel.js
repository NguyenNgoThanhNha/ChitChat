import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, default: "" }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    couponCode: { type: String, default: "" },
    status: {
        type: String,
        enum: ["awaiting_payment", "pending", "confirmed", "shipped", "completed", "cancelled"],
        default: "pending"
    },
    paymentMethod: { type: String, enum: ["COD", "VNPAY"], default: "COD" },
    paymentStatus: {
        type: String,
        enum: ["unpaid", "pending", "paid", "failed", "refunded"],
        default: "unpaid"
    },
    vnpayTxnRef: { type: String, default: "" },
    vnpayTransactionNo: { type: String, default: "" },
    paidAt: { type: Date, default: null },
    shippingAddress: { type: String, required: true, maxlength: 500 },
    phone: { type: String, required: true, maxlength: 30 },
    note: { type: String, default: "", maxlength: 500 }
}, { timestamps: true });

orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ "items.seller": 1, createdAt: -1 });
orderSchema.index({ vnpayTxnRef: 1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;
