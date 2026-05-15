import Product from "../models/ProductModel.js";
import Cart from "../models/CartModel.js";
import Coupon from "../models/CouponModel.js";

export const calcCouponDiscount = (coupon, subtotal) => {
    if (!coupon || subtotal < coupon.minOrder) return 0;
    let discount = 0;
    if (coupon.discountType === "percent") {
        discount = Math.floor((subtotal * coupon.value) / 100);
        if (coupon.maxDiscount != null) {
            discount = Math.min(discount, coupon.maxDiscount);
        }
    } else {
        discount = Math.floor(coupon.value);
    }
    return Math.min(discount, subtotal);
};

export const validateCoupon = async (code, subtotal) => {
    if (!code?.trim()) return { coupon: null, discount: 0 };
    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), isActive: true });
    if (!coupon) throw new Error("Invalid coupon code");
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        throw new Error("Coupon has expired");
    }
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
        throw new Error("Coupon usage limit reached");
    }
    if (subtotal < coupon.minOrder) {
        throw new Error(`Minimum order ${coupon.minOrder.toLocaleString("vi-VN")} VND for this coupon`);
    }
    const discount = calcCouponDiscount(coupon, subtotal);
    return { coupon, discount };
};

export const buildCartCheckout = async (userId, { reserveStock = false } = {}) => {
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart?.items?.length) {
        throw new Error("Cart is empty");
    }

    const orderItems = [];
    let subtotal = 0;
    const stockUpdates = [];

    for (const item of cart.items) {
        const product = item.product;
        if (!product || !product.isActive) {
            throw new Error("A product in your cart is no longer available");
        }
        if (product.seller.toString() === userId) {
            throw new Error("Cannot buy your own product");
        }
        if (product.stock < item.quantity) {
            throw new Error(`Not enough stock for ${product.title}`);
        }

        const lineTotal = product.price * item.quantity;
        subtotal += lineTotal;
        orderItems.push({
            product: product._id,
            seller: product.seller,
            title: product.title,
            price: product.price,
            quantity: item.quantity,
            image: product.image || ""
        });

        if (reserveStock) {
            product.stock -= item.quantity;
            stockUpdates.push(product);
        }
    }

    if (reserveStock) {
        await Promise.all(stockUpdates.map((p) => p.save()));
    }

    return { cart, orderItems, subtotal };
};

export const restoreOrderStock = async (order) => {
    for (const item of order.items) {
        if (!item.product) continue;
        await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity }
        });
    }
};

export const deductOrderStock = async (order) => {
    for (const item of order.items) {
        if (!item.product) continue;
        const product = await Product.findById(item.product);
        if (!product) continue;
        if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${item.title}`);
        }
        product.stock -= item.quantity;
        await product.save();
    }
};
