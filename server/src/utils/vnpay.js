import crypto from "crypto";
import qs from "querystring";

const sortObject = (obj) => {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    keys.forEach((key) => {
        sorted[key] = obj[key];
    });
    return sorted;
};

export const isVnpayConfigured = () =>
    !!(process.env.VNPAY_TMN_CODE && process.env.VNPAY_HASH_SECRET);

export const buildVnpayPaymentUrl = ({
    amount,
    orderId,
    orderInfo,
    ipAddr = "127.0.0.1",
    locale = "vn"
}) => {
    const tmnCode = process.env.VNPAY_TMN_CODE;
    const secret = process.env.VNPAY_HASH_SECRET;
    const vnpUrl = process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    const returnUrl = process.env.VNPAY_RETURN_URL;
    const ipnUrl = process.env.VNPAY_IPN_URL;

    if (!tmnCode || !secret || !returnUrl) {
        throw new Error("VNPay is not configured");
    }

    const createDate = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const vnp_CreateDate =
        `${createDate.getFullYear()}${pad(createDate.getMonth() + 1)}${pad(createDate.getDate())}` +
        `${pad(createDate.getHours())}${pad(createDate.getMinutes())}${pad(createDate.getSeconds())}`;

    const txnRef = `${orderId}_${Date.now()}`;

    let vnp_Params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: tmnCode,
        vnp_Amount: Math.round(amount * 100),
        vnp_CurrCode: "VND",
        vnp_TxnRef: txnRef,
        vnp_OrderInfo: orderInfo.slice(0, 255),
        vnp_OrderType: "other",
        vnp_Locale: locale,
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate
    };

    if (ipnUrl) {
        vnp_Params.vnp_IpnUrl = ipnUrl;
    }

    vnp_Params = sortObject(vnp_Params);
    const signData = qs.stringify(vnp_Params, { encode: false });
    const secureHash = crypto.createHmac("sha512", secret).update(signData).digest("hex");
    vnp_Params.vnp_SecureHash = secureHash;

    return {
        paymentUrl: `${vnpUrl}?${qs.stringify(vnp_Params, { encode: true })}`,
        txnRef
    };
};

export const verifyVnpayCallback = (query) => {
    const secret = process.env.VNPAY_HASH_SECRET;
    if (!secret) return { valid: false, params: {} };

    const params = { ...query };
    const secureHash = params.vnp_SecureHash;
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;

    const sorted = sortObject(params);
    const signData = qs.stringify(sorted, { encode: false });
    const checkHash = crypto.createHmac("sha512", secret).update(signData).digest("hex");

    return {
        valid: secureHash === checkHash,
        params: sorted,
        responseCode: sorted.vnp_ResponseCode,
        txnRef: sorted.vnp_TxnRef,
        transactionNo: sorted.vnp_TransactionNo,
        amount: sorted.vnp_Amount ? Number(sorted.vnp_Amount) / 100 : 0
    };
};

export const parseOrderIdFromTxnRef = (txnRef) => {
    if (!txnRef) return null;
    const id = String(txnRef).split("_")[0];
    return id;
};
