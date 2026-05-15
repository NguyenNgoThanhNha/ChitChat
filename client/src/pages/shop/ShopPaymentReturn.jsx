import { apiClient } from "@/lib/api.client";
import { SHOP_ORDER_ROUTE } from "@/utils/constant";
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiXCircle } from "react-icons/fi";

const formatPrice = (n) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);

const ShopPaymentReturn = () => {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const success = params.get("success") === "1";
    const orderId = params.get("orderId");
    const [order, setOrder] = useState(null);

    useEffect(() => {
        if (!orderId) return;
        (async () => {
            try {
                const res = await apiClient.get(SHOP_ORDER_ROUTE(orderId), { withCredentials: true });
                setOrder(res.data.order);
            } catch {
                /* ignore */
            }
        })();
    }, [orderId]);

    return (
        <div className="min-h-[100dvh] bg-[#0f0f13] text-white flex flex-col items-center justify-center p-6">
            {success ? (
                <FiCheckCircle className="text-6xl text-emerald-400 mb-4" />
            ) : (
                <FiXCircle className="text-6xl text-red-400 mb-4" />
            )}
            <h1 className="text-2xl font-semibold mb-2">
                {success ? "Payment successful" : "Payment failed or cancelled"}
            </h1>
            <p className="text-white/60 text-center max-w-md mb-6">
                {success
                    ? "Your VNPay payment was received. The seller will prepare your order."
                    : params.get("message") || "You can retry payment from My orders."}
            </p>
            {order && (
                <div className="rounded-xl border border-[#2f303b] bg-[#1a1b23] p-4 w-full max-w-sm mb-6 text-sm">
                    <p>Order #{String(order._id).slice(-8)}</p>
                    <p className="text-[#c4b5fd] font-medium">{formatPrice(order.total)}</p>
                    <p className="text-white/50">Status: {order.paymentStatus}</p>
                </div>
            )}
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={() => navigate("/shop/orders")}
                    className="px-5 py-2.5 rounded-xl bg-[#8417ff] hover:bg-[#741bda] font-medium"
                >
                    My orders
                </button>
                <button
                    type="button"
                    onClick={() => navigate("/shop")}
                    className="px-5 py-2.5 rounded-xl border border-[#2f303b] flex items-center gap-2"
                >
                    <FiArrowLeft /> Shop
                </button>
            </div>
        </div>
    );
};

export default ShopPaymentReturn;
