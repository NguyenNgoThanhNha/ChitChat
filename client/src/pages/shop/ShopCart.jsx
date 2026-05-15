import { apiClient } from "@/lib/api.client";
import {
    HOST,
    SHOP_CART_ROUTE,
    SHOP_CART_ITEM_ROUTE,
    SHOP_CHECKOUT_ROUTE,
    SHOP_PAYMENT_CONFIG_ROUTE,
    SHOP_VALIDATE_COUPON_ROUTE
} from "@/utils/constant";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FiArrowLeft, FiTrash2 } from "react-icons/fi";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";
import { AnimatedPage, AnimatedPageHeader, AnimatedPageMain, staggerStyle } from "@/components/layout/AnimatedPage";

const formatPrice = (n) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);

const ShopCart = () => {
    const navigate = useNavigate();
    const [cart, setCart] = useState({ items: [] });
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [note, setNote] = useState("");
    const [couponCode, setCouponCode] = useState("");
    const [discount, setDiscount] = useState(0);
    const [appliedCoupon, setAppliedCoupon] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("COD");
    const [vnpayEnabled, setVnpayEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [checkingOut, setCheckingOut] = useState(false);
    const [validatingCoupon, setValidatingCoupon] = useState(false);

    const subtotal = (cart.items || []).reduce((sum, row) => {
        const p = row.product;
        if (!p) return sum;
        return sum + p.price * row.quantity;
    }, 0);
    const total = Math.max(0, subtotal - discount);

    const load = async () => {
        setLoading(true);
        try {
            const [cartRes, cfgRes] = await Promise.all([
                apiClient.get(SHOP_CART_ROUTE, { withCredentials: true }),
                apiClient.get(SHOP_PAYMENT_CONFIG_ROUTE, { withCredentials: true })
            ]);
            setCart(cartRes.data.cart || { items: [] });
            const vnpay = cfgRes.data?.methods?.find((m) => m.id === "VNPAY");
            setVnpayEnabled(!!vnpay?.enabled);
        } catch {
            toast.error("Could not load cart");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const updateQty = async (productId, quantity) => {
        try {
            const res = await apiClient.patch(
                SHOP_CART_ROUTE,
                { productId, quantity },
                { withCredentials: true }
            );
            setCart(res.data.cart);
        } catch (e) {
            toast.error(e.response?.data?.message || "Update failed");
        }
    };

    const remove = async (productId) => {
        try {
            const res = await apiClient.delete(SHOP_CART_ITEM_ROUTE(productId), { withCredentials: true });
            setCart(res.data.cart);
        } catch {
            toast.error("Could not remove");
        }
    };

    const applyCoupon = async () => {
        if (!couponCode.trim()) return;
        setValidatingCoupon(true);
        try {
            const res = await apiClient.post(
                SHOP_VALIDATE_COUPON_ROUTE,
                { code: couponCode.trim(), subtotal },
                { withCredentials: true }
            );
            setDiscount(res.data.discount || 0);
            setAppliedCoupon(res.data.code);
            toast.success(`Coupon applied: -${formatPrice(res.data.discount)}`);
        } catch (e) {
            setDiscount(0);
            setAppliedCoupon("");
            toast.error(e.response?.data?.message || "Invalid coupon");
        } finally {
            setValidatingCoupon(false);
        }
    };

    const checkout = async (e) => {
        e.preventDefault();
        if (!cart.items?.length) return;
        if (paymentMethod === "VNPAY" && !vnpayEnabled) {
            toast.error("VNPay is not available");
            return;
        }
        setCheckingOut(true);
        try {
            const res = await apiClient.post(
                SHOP_CHECKOUT_ROUTE,
                {
                    shippingAddress: address,
                    phone,
                    note,
                    paymentMethod,
                    couponCode: appliedCoupon || undefined
                },
                { withCredentials: true }
            );

            if (res.data.paymentUrl) {
                window.location.href = res.data.paymentUrl;
                return;
            }

            toast.success("Order placed (COD)");
            navigate("/shop/orders");
        } catch (err) {
            toast.error(err.response?.data?.message || "Checkout failed");
        } finally {
            setCheckingOut(false);
        }
    };

    return (
        <AnimatedPage mesh>
            <AnimatedPageHeader className="border-b border-border px-4 py-3 flex items-center gap-3">
                <button type="button" onClick={() => navigate("/shop")} className="p-2 rounded-lg hover:bg-accent">
                    <FiArrowLeft className="text-xl" />
                </button>
                <h1 className="text-xl font-semibold flex-1">Cart</h1>
                <ThemeToggleButton />
            </AnimatedPageHeader>

            <AnimatedPageMain className="max-w-lg mx-auto p-4 pb-10">
                {loading ? (
                    <p className="text-muted-foreground text-center py-12">Loading…</p>
                ) : !cart.items?.length ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground mb-4">Your cart is empty</p>
                        <button type="button" onClick={() => navigate("/shop")} className="text-violet-700 dark:text-violet-300 hover:underline">
                            Browse shop
                        </button>
                    </div>
                ) : (
                    <>
                        <ul className="space-y-3 mb-6">
                            {cart.items.map((row, idx) => {
                                const p = row.product;
                                if (!p) return null;
                                return (
                                    <li key={p._id} style={staggerStyle(idx)} className="page-stagger-item flex gap-3 p-3 rounded-xl bg-card border border-border">
                                        {p.image ? (
                                            <img src={`${HOST}/${p.image}`} alt="" className="h-16 w-16 rounded object-cover" />
                                        ) : (
                                            <div className="h-16 w-16 rounded bg-background" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{p.title}</p>
                                            <p className="text-sm text-violet-700 dark:text-violet-300">{formatPrice(p.price)}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={p.stock}
                                                    value={row.quantity}
                                                    onChange={(e) => {
                                                        const q = parseInt(e.target.value, 10) || 1;
                                                        updateQty(p._id, q);
                                                    }}
                                                    className="w-16 px-2 py-1 text-sm rounded bg-background border border-border"
                                                />
                                                <button type="button" onClick={() => remove(p._id)} className="p-1 text-red-400">
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-sm font-medium">{formatPrice(p.price * row.quantity)}</p>
                                    </li>
                                );
                            })}
                        </ul>

                        <div className="rounded-xl border border-border bg-card p-4 mb-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatPrice(subtotal)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-emerald-400">
                                    <span>Discount ({appliedCoupon})</span>
                                    <span>-{formatPrice(discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-semibold pt-2 border-t border-border">
                                <span>Total</span>
                                <span className="text-violet-700 dark:text-violet-300">{formatPrice(total)}</span>
                            </div>
                        </div>

                        <form onSubmit={checkout} className="space-y-3 rounded-xl border border-border bg-card p-4">
                            <p className="text-sm font-medium text-foreground/80">Payment method</p>
                            <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer has-[:checked]:border-[#8417ff]">
                                <input
                                    type="radio"
                                    name="pay"
                                    value="COD"
                                    checked={paymentMethod === "COD"}
                                    onChange={() => setPaymentMethod("COD")}
                                />
                                <div>
                                    <p className="font-medium">Cash on delivery (COD)</p>
                                    <p className="text-xs text-muted-foreground">Pay when you receive the goods</p>
                                </div>
                            </label>
                            <label
                                className={`flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer has-[:checked]:border-[#8417ff] ${!vnpayEnabled ? "opacity-50 pointer-events-none" : ""}`}
                            >
                                <input
                                    type="radio"
                                    name="pay"
                                    value="VNPAY"
                                    checked={paymentMethod === "VNPAY"}
                                    onChange={() => setPaymentMethod("VNPAY")}
                                    disabled={!vnpayEnabled}
                                />
                                <div>
                                    <p className="font-medium">VNPay (online)</p>
                                    <p className="text-xs text-muted-foreground">
                                        {vnpayEnabled ? "ATM, QR, domestic & international cards" : "Not configured on server"}
                                    </p>
                                </div>
                            </label>

                            <p className="text-sm font-medium text-foreground/80 pt-2">Coupon</p>
                            <div className="flex gap-2">
                                <input
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    placeholder="e.g. WELCOME10"
                                    className="flex-1 px-3 py-2 rounded-lg bg-background border border-border uppercase"
                                />
                                <button
                                    type="button"
                                    onClick={applyCoupon}
                                    disabled={validatingCoupon}
                                    className="px-4 py-2 rounded-lg border border-[#8417ff]/50 text-violet-700 dark:text-violet-300 shrink-0"
                                >
                                    Apply
                                </button>
                            </div>

                            <input
                                required
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Shipping address"
                                className="w-full px-3 py-2 rounded-lg bg-background border border-border"
                            />
                            <input
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Phone number"
                                className="w-full px-3 py-2 rounded-lg bg-background border border-border"
                            />
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Note (optional)"
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg bg-background border border-border"
                            />
                            <button
                                type="submit"
                                disabled={checkingOut}
                                className="w-full py-2.5 rounded-xl bg-[#8417ff] hover:bg-[#741bda] font-medium disabled:opacity-50"
                            >
                                {checkingOut
                                    ? "Processing…"
                                    : paymentMethod === "VNPAY"
                                      ? "Pay with VNPay"
                                      : "Place order (COD)"}
                            </button>
                        </form>
                    </>
                )}
            </AnimatedPageMain>
        </AnimatedPage>
    );
};

export default ShopCart;
