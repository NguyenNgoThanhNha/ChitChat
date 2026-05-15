import { apiClient } from "@/lib/api.client";
import { openChatWithUser } from "@/lib/openChatWithUser";
import { useAppStore } from "@/store/store";
import {
    HOST,
    SHOP_ORDERS_MINE_ROUTE,
    SHOP_ORDERS_SALES_ROUTE,
    SHOP_ORDER_STATUS_ROUTE,
    SHOP_PAY_VNPAY_ROUTE
} from "@/utils/constant";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FiArrowLeft, FiMessageCircle } from "react-icons/fi";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";
import { AnimatedPage, AnimatedPageHeader, AnimatedPageMain, staggerStyle } from "@/components/layout/AnimatedPage";

const formatPrice = (n) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);

const statusLabel = {
    awaiting_payment: "Awaiting payment",
    pending: "Pending",
    confirmed: "Confirmed",
    shipped: "Shipped",
    completed: "Completed",
    cancelled: "Cancelled"
};

const paymentLabel = {
    unpaid: "Unpaid",
    pending: "Processing",
    paid: "Paid",
    failed: "Failed",
    refunded: "Refunded"
};

const ShopOrders = () => {
    const navigate = useNavigate();
    const store = useAppStore();
    const { userInfo } = store;
    const [tab, setTab] = useState("buy");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const url = tab === "buy" ? SHOP_ORDERS_MINE_ROUTE : SHOP_ORDERS_SALES_ROUTE;
            const res = await apiClient.get(url, { withCredentials: true });
            setOrders(res.data.orders || []);
        } catch {
            toast.error("Could not load orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [tab]);

    const retryVnpay = async (orderId) => {
        try {
            const res = await apiClient.post(SHOP_PAY_VNPAY_ROUTE(orderId), {}, { withCredentials: true });
            if (res.data.paymentUrl) {
                window.location.href = res.data.paymentUrl;
            }
        } catch (e) {
            toast.error(e.response?.data?.message || "Could not start payment");
        }
    };

    const updateStatus = async (orderId, status) => {
        try {
            await apiClient.patch(SHOP_ORDER_STATUS_ROUTE(orderId), { status }, { withCredentials: true });
            toast.success("Status updated");
            load();
        } catch (e) {
            toast.error(e.response?.data?.message || "Update failed");
        }
    };

    const chatUser = async (user) => {
        if (!user?._id) return;
        await openChatWithUser(navigate, user, store);
    };

    return (
        <AnimatedPage>
            <AnimatedPageHeader className="border-b border-border px-4 py-3 flex items-center gap-3">
                <button type="button" onClick={() => navigate("/shop")} className="p-2 rounded-lg hover:bg-accent">
                    <FiArrowLeft className="text-xl" />
                </button>
                <h1 className="text-xl font-semibold flex-1">Orders</h1>
                <ThemeToggleButton />
            </AnimatedPageHeader>

            <div className="flex border-b border-border max-w-lg mx-auto page-content-in">
                <button
                    type="button"
                    onClick={() => setTab("buy")}
                    className={`flex-1 py-3 text-sm ${tab === "buy" ? "border-b-2 border-violet-600 dark:border-[#8417ff] text-foreground" : "text-muted-foreground"}`}
                >
                    My purchases
                </button>
                <button
                    type="button"
                    onClick={() => setTab("sell")}
                    className={`flex-1 py-3 text-sm ${tab === "sell" ? "border-b-2 border-violet-600 dark:border-[#8417ff] text-foreground" : "text-muted-foreground"}`}
                >
                    Sales
                </button>
            </div>

            <AnimatedPageMain className="max-w-lg mx-auto p-4 space-y-4">
                {loading ? (
                    <p className="text-center text-muted-foreground py-12">Loading…</p>
                ) : orders.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">No orders</p>
                ) : (
                    orders.map((order, idx) => {
                        const myItems =
                            tab === "sell"
                                ? order.items.filter((i) => String(i.seller?._id ?? i.seller) === String(userInfo.id))
                                : order.items;

                        return (
                            <article key={order._id} style={staggerStyle(idx)} className="page-stagger-item rounded-xl border border-border bg-card p-4">
                                <div className="flex justify-between items-start gap-2 mb-2">
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(order.createdAt).toLocaleString("vi-VN")}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-700 dark:text-violet-300">
                                        {statusLabel[order.status] || order.status}
                                    </span>
                                </div>
                                <ul className="space-y-2 text-sm">
                                    {myItems.map((item, idx) => (
                                        <li key={idx} className="flex gap-2">
                                            {item.image && (
                                                <img src={`${HOST}/${item.image}`} alt="" className="h-10 w-10 rounded object-cover" />
                                            )}
                                            <div className="flex-1">
                                                <p>{item.title} × {item.quantity}</p>
                                                <p className="text-violet-700 dark:text-violet-300">{formatPrice(item.price * item.quantity)}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <div className="text-right text-sm mt-2 space-y-0.5">
                                    {order.discount > 0 && (
                                        <p className="text-emerald-400">
                                            −{formatPrice(order.discount)}
                                            {order.couponCode ? ` (${order.couponCode})` : ""}
                                        </p>
                                    )}
                                    <p className="font-semibold">{formatPrice(order.total)}</p>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                                    {order.paymentMethod && (
                                        <span className="px-2 py-0.5 rounded-full bg-muted">
                                            {order.paymentMethod === "VNPAY" ? "VNPay" : "COD"}
                                        </span>
                                    )}
                                    {order.paymentStatus && (
                                        <span className="px-2 py-0.5 rounded-full bg-muted">
                                            {paymentLabel[order.paymentStatus] || order.paymentStatus}
                                        </span>
                                    )}
                                </div>
                                {tab === "buy" && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {order.shippingAddress} · {order.phone}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-2 mt-3">
                                    {tab === "buy" &&
                                        (order.status === "pending" || order.status === "awaiting_payment") && (
                                        <button
                                            type="button"
                                            onClick={() => updateStatus(order._id, "cancelled")}
                                            className="text-xs px-2 py-1 rounded border border-red-400/50 text-red-300"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    {tab === "buy" &&
                                        order.paymentMethod === "VNPAY" &&
                                        order.paymentStatus !== "paid" &&
                                        order.status !== "cancelled" && (
                                        <button
                                            type="button"
                                            onClick={() => retryVnpay(order._id)}
                                            className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-300"
                                        >
                                            Pay with VNPay
                                        </button>
                                    )}
                                    {tab === "sell" && order.status === "pending" && (
                                        <button
                                            type="button"
                                            onClick={() => updateStatus(order._id, "confirmed")}
                                            className="text-xs px-2 py-1 rounded bg-violet-500/30"
                                        >
                                            Confirm
                                        </button>
                                    )}
                                    {tab === "sell" && order.status === "confirmed" && (
                                        <button
                                            type="button"
                                            onClick={() => updateStatus(order._id, "shipped")}
                                            className="text-xs px-2 py-1 rounded bg-violet-500/30"
                                        >
                                            Mark shipped
                                        </button>
                                    )}
                                    {tab === "sell" && order.status === "shipped" && (
                                        <button
                                            type="button"
                                            onClick={() => updateStatus(order._id, "completed")}
                                            className="text-xs px-2 py-1 rounded bg-violet-500/30"
                                        >
                                            Complete
                                        </button>
                                    )}
                                    {tab === "buy" && myItems[0]?.seller && (
                                        <button
                                            type="button"
                                            onClick={() => chatUser(typeof myItems[0].seller === "object" ? myItems[0].seller : { _id: myItems[0].seller })}
                                            className="text-xs flex items-center gap-1 text-violet-700 dark:text-violet-300"
                                        >
                                            <FiMessageCircle /> Chat seller
                                        </button>
                                    )}
                                    {tab === "sell" && order.buyer && (
                                        <button
                                            type="button"
                                            onClick={() => chatUser(order.buyer)}
                                            className="text-xs flex items-center gap-1 text-violet-700 dark:text-violet-300"
                                        >
                                            <FiMessageCircle /> Chat buyer
                                        </button>
                                    )}
                                </div>
                            </article>
                        );
                    })
                )}
            </AnimatedPageMain>
        </AnimatedPage>
    );
};

export default ShopOrders;
