import Order from "../models/OrderModel.js";
import Coupon from "../models/CouponModel.js";
import {
    buildVnpayPaymentUrl,
    isVnpayConfigured,
    parseOrderIdFromTxnRef,
    verifyVnpayCallback
} from "../utils/vnpay.js";
import { deductOrderStock, restoreOrderStock } from "../utils/orderCheckout.js";

const populateOrder = [
    { path: "buyer", select: "firstName lastName email image color _id" },
    { path: "items.seller", select: "firstName lastName email image color _id" }
];

const markOrderPaid = async (order, vnpayTransactionNo = "") => {
    if (order.paymentStatus === "paid") return order;

    await deductOrderStock(order);

    order.paymentStatus = "paid";
    if (order.paymentMethod === "VNPAY") {
        order.status = "confirmed";
    }
    order.vnpayTransactionNo = vnpayTransactionNo || order.vnpayTransactionNo;
    order.paidAt = new Date();
    await order.save();

    if (order.couponCode) {
        await Coupon.findOneAndUpdate(
            { code: order.couponCode },
            { $inc: { usedCount: 1 } }
        );
    }

    return order;
};

export const createVnpayUrlForOrder = async (order, ipAddr) => {
    const { paymentUrl, txnRef } = buildVnpayPaymentUrl({
        amount: order.total,
        orderId: order._id.toString(),
        orderInfo: `Thanh toan don hang ${order._id}`,
        ipAddr
    });
    order.vnpayTxnRef = txnRef;
    order.paymentStatus = "pending";
    await order.save();
    return paymentUrl;
};

const VnpayReturn = async (req, res) => {
    try {
        const { valid, params, responseCode, txnRef, transactionNo } = verifyVnpayCallback(req.query);
        const orderId = parseOrderIdFromTxnRef(txnRef);
        const frontend = process.env.ORIGIN || "http://localhost:5173";
        const base = `${frontend}/shop/payment/return`;

        if (!valid || !orderId) {
            return res.redirect(`${base}?success=0&message=invalid_signature`);
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.redirect(`${base}?success=0&message=order_not_found`);
        }

        if (responseCode === "00") {
            await markOrderPaid(order, transactionNo);
            return res.redirect(`${base}?success=1&orderId=${orderId}`);
        }

        order.paymentStatus = "failed";
        await order.save();
        return res.redirect(`${base}?success=0&orderId=${orderId}&code=${responseCode}`);
    } catch (error) {
        console.error(error);
        const frontend = process.env.ORIGIN || "http://localhost:5173";
        return res.redirect(`${frontend}/shop/payment/return?success=0&message=error`);
    }
};

const VnpayIpn = async (req, res) => {
    try {
        const { valid, responseCode, txnRef, transactionNo, amount } = verifyVnpayCallback(req.query);

        if (!valid) {
            return res.status(200).json({ RspCode: "97", Message: "Invalid signature" });
        }

        const orderId = parseOrderIdFromTxnRef(txnRef);
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(200).json({ RspCode: "01", Message: "Order not found" });
        }

        if (Math.round(order.total) !== Math.round(amount)) {
            return res.status(200).json({ RspCode: "04", Message: "Invalid amount" });
        }

        if (order.paymentStatus === "paid") {
            return res.status(200).json({ RspCode: "02", Message: "Already confirmed" });
        }

        if (responseCode === "00") {
            await markOrderPaid(order, transactionNo);
            return res.status(200).json({ RspCode: "00", Message: "Confirm Success" });
        }

        order.paymentStatus = "failed";
        await order.save();
        return res.status(200).json({ RspCode: "00", Message: "Updated failed status" });
    } catch (error) {
        console.error(error);
        return res.status(200).json({ RspCode: "99", Message: "Unknown error" });
    }
};

const RetryVnpay = async (req, res) => {
    try {
        if (!isVnpayConfigured()) {
            return res.status(503).json({ message: "VNPay is not configured on server" });
        }

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.buyer.toString() !== req.userId) {
            return res.status(403).json({ message: "Not allowed" });
        }
        if (order.paymentMethod !== "VNPAY") {
            return res.status(400).json({ message: "Not a VNPay order" });
        }
        if (order.paymentStatus === "paid") {
            return res.status(400).json({ message: "Order already paid" });
        }
        if (order.status === "cancelled") {
            return res.status(400).json({ message: "Order cancelled" });
        }

        const ipAddr = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "127.0.0.1";
        const paymentUrl = await createVnpayUrlForOrder(order, ipAddr);
        return res.status(200).json({ paymentUrl, order });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message || "Something went wrong" });
    }
};

const ValidateCoupon = async (req, res) => {
    try {
        const { code, subtotal } = req.body;
        const { validateCoupon } = await import("../utils/orderCheckout.js");
        const result = await validateCoupon(code, Number(subtotal) || 0);
        return res.status(200).json({
            code: result.coupon.code,
            discount: result.discount,
            discountType: result.coupon.discountType,
            value: result.coupon.value
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

const PaymentConfig = async (req, res) => {
    return res.status(200).json({
        vnpay: isVnpayConfigured(),
        methods: [
            { id: "COD", label: "Cash on delivery (COD)", online: false },
            { id: "VNPAY", label: "VNPay (ATM / QR / Card)", online: true, enabled: isVnpayConfigured() }
        ]
    });
};

export default {
    VnpayReturn,
    VnpayIpn,
    RetryVnpay,
    ValidateCoupon,
    PaymentConfig,
    markOrderPaid,
    createVnpayUrlForOrder
};
