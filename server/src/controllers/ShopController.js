import Product from "../models/ProductModel.js";
import Cart from "../models/CartModel.js";
import Order from "../models/OrderModel.js";
import { mkdirSync, renameSync } from "fs";
import {
    buildCartCheckout,
    restoreOrderStock,
    validateCoupon
} from "../utils/orderCheckout.js";
import { isVnpayConfigured } from "../utils/vnpay.js";
import PaymentController from "./PaymentController.js";

const populateProduct = [
    { path: "seller", select: "firstName lastName email image color _id" }
];

const getOrCreateCart = async (userId) => {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        cart = await Cart.create({ user: userId, items: [] });
    }
    return cart;
};

const populateCart = async (cart) => {
    return Cart.findById(cart._id)
        .populate({
            path: "items.product",
            populate: { path: "seller", select: "firstName lastName email image color _id" }
        })
        .lean();
};

const ListProducts = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;
        const q = (req.query.q || "").trim();

        const filter = { isActive: true };
        if (q) {
            filter.$or = [
                { title: { $regex: q, $options: "i" } },
                { description: { $regex: q, $options: "i" } }
            ];
        }

        const [products, total] = await Promise.all([
            Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(populateProduct),
            Product.countDocuments(filter)
        ]);

        return res.status(200).json({
            products,
            page,
            totalPages: Math.ceil(total / limit) || 1,
            total
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const GetProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, isActive: true }).populate(populateProduct);
        if (!product) return res.status(404).json({ message: "Product not found" });
        return res.status(200).json({ product });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const CreateProduct = async (req, res) => {
    try {
        const { title, description, price, stock, image } = req.body;
        if (!title?.trim()) return res.status(400).json({ message: "Title is required" });
        const numPrice = Number(price);
        const numStock = Number(stock);
        if (!Number.isFinite(numPrice) || numPrice < 0) {
            return res.status(400).json({ message: "Invalid price" });
        }
        if (!Number.isFinite(numStock) || numStock < 0) {
            return res.status(400).json({ message: "Invalid stock" });
        }

        const product = await Product.create({
            title: title.trim(),
            description: (description || "").trim(),
            price: numPrice,
            stock: numStock,
            image: image || "",
            seller: req.userId
        });

        const populated = await Product.findById(product._id).populate(populateProduct);
        return res.status(201).json({ product: populated });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const UpdateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        if (product.seller.toString() !== req.userId) {
            return res.status(403).json({ message: "Not allowed" });
        }

        const { title, description, price, stock, image, isActive } = req.body;
        if (title !== undefined) product.title = String(title).trim();
        if (description !== undefined) product.description = String(description).trim();
        if (price !== undefined) {
            const numPrice = Number(price);
            if (!Number.isFinite(numPrice) || numPrice < 0) {
                return res.status(400).json({ message: "Invalid price" });
            }
            product.price = numPrice;
        }
        if (stock !== undefined) {
            const numStock = Number(stock);
            if (!Number.isFinite(numStock) || numStock < 0) {
                return res.status(400).json({ message: "Invalid stock" });
            }
            product.stock = numStock;
        }
        if (image !== undefined) product.image = image;
        if (isActive !== undefined) product.isActive = !!isActive;

        await product.save();
        const populated = await Product.findById(product._id).populate(populateProduct);
        return res.status(200).json({ product: populated });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const DeleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        if (product.seller.toString() !== req.userId) {
            return res.status(403).json({ message: "Not allowed" });
        }
        product.isActive = false;
        await product.save();
        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const UploadProductImage = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "Image is required" });
        const date = Date.now();
        const safeName = req.file.originalname.replace(/[^\w.\- ()\[\]]+/g, "_");
        const fileDir = `upload/products/${date}`;
        const fileName = `${fileDir}/${safeName}`;
        mkdirSync(fileDir, { recursive: true });
        renameSync(req.file.path, fileName);
        return res.status(200).json({ filePath: fileName });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const GetMyProducts = async (req, res) => {
    try {
        const products = await Product.find({ seller: req.userId })
            .sort({ createdAt: -1 })
            .populate(populateProduct);
        return res.status(200).json({ products });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const GetCart = async (req, res) => {
    try {
        const cart = await getOrCreateCart(req.userId);
        const populated = await populateCart(cart);
        return res.status(200).json({ cart: populated });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const AddToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const qty = Math.max(1, parseInt(quantity, 10) || 1);
        const product = await Product.findOne({ _id: productId, isActive: true });
        if (!product) return res.status(404).json({ message: "Product not found" });
        if (product.seller.toString() === req.userId) {
            return res.status(400).json({ message: "Cannot add your own product to cart" });
        }
        if (product.stock < qty) {
            return res.status(400).json({ message: "Not enough stock" });
        }

        const cart = await getOrCreateCart(req.userId);
        const idx = cart.items.findIndex((i) => i.product.toString() === productId);
        if (idx >= 0) {
            const newQty = cart.items[idx].quantity + qty;
            if (newQty > product.stock) {
                return res.status(400).json({ message: "Not enough stock" });
            }
            cart.items[idx].quantity = newQty;
        } else {
            cart.items.push({ product: productId, quantity: qty });
        }
        await cart.save();
        const populated = await populateCart(cart);
        return res.status(200).json({ cart: populated });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const UpdateCartItem = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const qty = parseInt(quantity, 10);
        if (!productId || !Number.isFinite(qty) || qty < 1) {
            return res.status(400).json({ message: "productId and quantity (>=1) required" });
        }

        const product = await Product.findOne({ _id: productId, isActive: true });
        if (!product) return res.status(404).json({ message: "Product not found" });
        if (qty > product.stock) return res.status(400).json({ message: "Not enough stock" });

        const cart = await getOrCreateCart(req.userId);
        const idx = cart.items.findIndex((i) => i.product.toString() === productId);
        if (idx < 0) return res.status(404).json({ message: "Item not in cart" });
        cart.items[idx].quantity = qty;
        await cart.save();
        const populated = await populateCart(cart);
        return res.status(200).json({ cart: populated });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const RemoveFromCart = async (req, res) => {
    try {
        const { productId } = req.params;
        const cart = await getOrCreateCart(req.userId);
        cart.items = cart.items.filter((i) => i.product.toString() !== productId);
        await cart.save();
        const populated = await populateCart(cart);
        return res.status(200).json({ cart: populated });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const Checkout = async (req, res) => {
    try {
        const { shippingAddress, phone, note, paymentMethod = "COD", couponCode } = req.body;
        if (!shippingAddress?.trim() || !phone?.trim()) {
            return res.status(400).json({ message: "Shipping address and phone are required" });
        }

        const method = String(paymentMethod).toUpperCase();
        if (!["COD", "VNPAY"].includes(method)) {
            return res.status(400).json({ message: "paymentMethod must be COD or VNPAY" });
        }
        if (method === "VNPAY" && !isVnpayConfigured()) {
            return res.status(503).json({ message: "VNPay is not configured on server" });
        }

        const reserveStock = method === "COD";
        const { cart, orderItems, subtotal } = await buildCartCheckout(req.userId, { reserveStock });

        let discount = 0;
        let appliedCode = "";
        if (couponCode?.trim()) {
            const c = await validateCoupon(couponCode, subtotal);
            discount = c.discount;
            appliedCode = c.coupon.code;
        }

        const total = Math.max(0, subtotal - discount);

        const order = await Order.create({
            buyer: req.userId,
            items: orderItems,
            subtotal,
            discount,
            total,
            couponCode: appliedCode,
            shippingAddress: shippingAddress.trim(),
            phone: phone.trim(),
            note: (note || "").trim(),
            paymentMethod: method,
            paymentStatus: method === "COD" ? "unpaid" : "unpaid",
            status: method === "VNPAY" ? "awaiting_payment" : "pending"
        });

        if (method === "COD" && appliedCode) {
            const Coupon = (await import("../models/CouponModel.js")).default;
            await Coupon.findOneAndUpdate({ code: appliedCode }, { $inc: { usedCount: 1 } });
        }

        cart.items = [];
        await cart.save();

        let paymentUrl = null;
        if (method === "VNPAY") {
            const ipAddr = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "127.0.0.1";
            paymentUrl = await PaymentController.createVnpayUrlForOrder(order, ipAddr);
        }

        const populated = await Order.findById(order._id)
            .populate("buyer", "firstName lastName email image color _id")
            .populate("items.seller", "firstName lastName email image color _id");

        return res.status(201).json({ order: populated, paymentUrl });
    } catch (error) {
        console.error(error);
        return res.status(400).json({ message: error.message || "Something went wrong" });
    }
};

const GetOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("buyer", "firstName lastName email image color _id")
            .populate("items.seller", "firstName lastName email image color _id");
        if (!order) return res.status(404).json({ message: "Order not found" });
        const isBuyer = order.buyer._id.toString() === req.userId;
        const isSeller = order.items.some((i) => i.seller._id.toString() === req.userId);
        if (!isBuyer && !isSeller) return res.status(403).json({ message: "Not allowed" });
        return res.status(200).json({ order });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const GetMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ buyer: req.userId })
            .sort({ createdAt: -1 })
            .populate("buyer", "firstName lastName email image color _id")
            .populate("items.seller", "firstName lastName email image color _id");
        return res.status(200).json({ orders });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const GetSalesOrders = async (req, res) => {
    try {
        const orders = await Order.find({ "items.seller": req.userId })
            .sort({ createdAt: -1 })
            .populate("buyer", "firstName lastName email image color _id")
            .populate("items.seller", "firstName lastName email image color _id");
        return res.status(200).json({ orders });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const UpdateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ["pending", "confirmed", "shipped", "completed", "cancelled"];
        if (!allowed.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        const isBuyer = order.buyer.toString() === req.userId;
        const isSeller = order.items.some((i) => i.seller.toString() === req.userId);

        if (status === "cancelled" && !isBuyer && !isSeller) {
            return res.status(403).json({ message: "Not allowed" });
        }
        if (status !== "cancelled" && !isSeller) {
            return res.status(403).json({ message: "Only seller can update order status" });
        }
        const cancellable = ["pending", "confirmed", "awaiting_payment"];
        if (status === "cancelled" && !cancellable.includes(order.status)) {
            return res.status(400).json({ message: "Cannot cancel this order" });
        }

        if (status === "cancelled") {
            if (order.paymentMethod === "COD" && order.paymentStatus !== "paid") {
                await restoreOrderStock(order);
            }
            if (order.paymentMethod === "VNPAY" && order.paymentStatus !== "paid") {
                /* stock was never deducted */
            }
            if (order.paymentMethod === "VNPAY" && order.paymentStatus === "paid") {
                await restoreOrderStock(order);
                order.paymentStatus = "refunded";
            }
        }

        order.status = status;
        await order.save();

        const populated = await Order.findById(order._id)
            .populate("buyer", "firstName lastName email image color _id")
            .populate("items.seller", "firstName lastName email image color _id");

        return res.status(200).json({ order: populated });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

export default {
    ListProducts,
    GetProduct,
    CreateProduct,
    UpdateProduct,
    DeleteProduct,
    UploadProductImage,
    GetMyProducts,
    GetCart,
    AddToCart,
    UpdateCartItem,
    RemoveFromCart,
    Checkout,
    GetOrder,
    GetMyOrders,
    GetSalesOrders,
    UpdateOrderStatus
};
