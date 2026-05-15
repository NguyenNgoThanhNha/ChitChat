import { apiClient } from "@/lib/api.client";
import { openChatWithUser } from "@/lib/openChatWithUser";
import { useAppStore } from "@/store/store";
import {
    HOST,
    SHOP_CART_ROUTE,
    SHOP_PRODUCTS_ROUTE,
    SHOP_PRODUCT_ROUTE
} from "@/utils/constant";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getColor } from "@/lib/utils";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FiArrowLeft, FiShoppingCart, FiSearch, FiMessageCircle } from "react-icons/fi";
import { HiOutlineShoppingBag } from "react-icons/hi";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";
import { AnimatedPage, AnimatedPageHeader, AnimatedPageMain, staggerStyle } from "@/components/layout/AnimatedPage";

const formatPrice = (n) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);

const Shop = () => {
    const navigate = useNavigate();
    const store = useAppStore();
    const { userInfo } = store;
    const [products, setProducts] = useState([]);
    const [q, setQ] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [qty, setQty] = useState(1);

    const loadProducts = useCallback(async (p = 1, query = search) => {
        setLoading(true);
        try {
            const res = await apiClient.get(SHOP_PRODUCTS_ROUTE, {
                params: { page: p, limit: 12, q: query || undefined },
                withCredentials: true
            });
            setProducts(res.data.products || []);
            setPage(res.data.page || p);
            setTotalPages(res.data.totalPages || 1);
        } catch {
            toast.error("Could not load products");
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        loadProducts(1, search);
    }, [search, loadProducts]);

    const addToCart = async (productId, quantity = 1) => {
        try {
            await apiClient.post(SHOP_CART_ROUTE, { productId, quantity }, { withCredentials: true });
            toast.success("Added to cart");
        } catch (e) {
            toast.error(e.response?.data?.message || "Could not add to cart");
        }
    };

    const openProduct = async (id) => {
        try {
            const res = await apiClient.get(SHOP_PRODUCT_ROUTE(id), { withCredentials: true });
            setSelected(res.data.product);
            setQty(1);
        } catch {
            toast.error("Product not found");
        }
    };

    const chatSeller = async (seller) => {
        if (!seller?._id) return;
        if (String(seller._id) === String(userInfo.id)) {
            toast.info("This is your product");
            return;
        }
        await openChatWithUser(navigate, seller, store);
    };

    return (
        <AnimatedPage>
            <AnimatedPageHeader className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => navigate("/chat")} className="p-2 rounded-lg hover:bg-accent" aria-label="Back">
                        <FiArrowLeft className="text-xl" />
                    </button>
                    <h1 className="text-xl font-semibold flex items-center gap-2">
                        <HiOutlineShoppingBag className="text-[#8417ff]" /> Shop
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggleButton />
                    <button type="button" onClick={() => navigate("/shop/sell")} className="text-sm px-3 py-2 rounded-lg border border-violet-500/50 text-violet-700 dark:text-violet-300 hover:bg-violet-500/10">
                        Sell
                    </button>
                    <button type="button" onClick={() => navigate("/shop/orders")} className="text-sm px-3 py-2 rounded-lg border border-border hover:bg-accent">
                        Orders
                    </button>
                    <button type="button" onClick={() => navigate("/shop/cart")} className="p-2 rounded-lg bg-[#8417ff] hover:bg-[#741bda]" aria-label="Cart">
                        <FiShoppingCart className="text-xl" />
                    </button>
                </div>
            </AnimatedPageHeader>

            <AnimatedPageMain className="max-w-6xl mx-auto p-4">
                <form
                    className="flex gap-2 mb-6"
                    onSubmit={(e) => {
                        e.preventDefault();
                        setSearch(q.trim());
                    }}
                >
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/80" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search products…"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border focus:outline-none focus:ring-1 focus:ring-[#8417ff]/50"
                        />
                    </div>
                    <button type="submit" className="px-4 py-2 rounded-xl bg-[#8417ff] hover:bg-[#741bda] font-medium">
                        Search
                    </button>
                </form>

                {loading ? (
                    <p className="text-center text-muted-foreground py-12">Loading…</p>
                ) : products.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">No products yet. Be the first to sell!</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.map((p, idx) => (
                            <article
                                key={p._id}
                                style={staggerStyle(idx)}
                                className="page-stagger-item rounded-xl border border-border bg-card overflow-hidden hover:border-violet-500/40 hover:shadow-md transition-all duration-200 cursor-pointer"
                                onClick={() => openProduct(p._id)}
                            >
                                <div className="aspect-[4/3] bg-background flex items-center justify-center overflow-hidden">
                                    {p.image ? (
                                        <img src={`${HOST}/${p.image}`} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <HiOutlineShoppingBag className="text-5xl text-muted-foreground/50" />
                                    )}
                                </div>
                                <div className="p-4">
                                    <h2 className="font-medium truncate">{p.title}</h2>
                                    <p className="text-violet-700 dark:text-violet-300 font-semibold mt-1">{formatPrice(p.price)}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Stock: {p.stock}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => loadProducts(page - 1)}
                            className="px-3 py-1 rounded border border-border disabled:opacity-40"
                        >
                            Prev
                        </button>
                        <span className="px-3 py-1 text-muted-foreground">{page} / {totalPages}</span>
                        <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() => loadProducts(page + 1)}
                            className="px-3 py-1 rounded border border-border disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                )}
            </AnimatedPageMain>

            {selected && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 dark:bg-black/60 animate-in fade-in duration-200" onClick={() => setSelected(null)}>
                    <div
                        className="page-modal-in w-full max-w-lg rounded-2xl bg-card border border-border p-5 max-h-[90vh] overflow-y-auto shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {selected.image && (
                            <img src={`${HOST}/${selected.image}`} alt="" className="w-full rounded-lg max-h-56 object-cover mb-4" />
                        )}
                        <h2 className="text-xl font-semibold">{selected.title}</h2>
                        <p className="text-violet-700 dark:text-violet-300 text-lg font-semibold mt-1">{formatPrice(selected.price)}</p>
                        <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">{selected.description || "No description"}</p>
                        <p className="text-xs text-muted-foreground mt-2">Stock: {selected.stock}</p>

                        <div className="flex items-center gap-3 mt-4">
                            <span className="text-sm text-muted-foreground">Qty</span>
                            <input
                                type="number"
                                min={1}
                                max={selected.stock}
                                value={qty}
                                onChange={(e) => setQty(Math.max(1, Math.min(selected.stock, parseInt(e.target.value, 10) || 1)))}
                                className="w-20 px-2 py-1 rounded bg-background border border-border"
                            />
                        </div>

                        <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-background">
                            <Avatar className="h-9 w-9">
                                {selected.seller?.image ? (
                                    <AvatarImage src={`${HOST}/${selected.seller.image}`} alt="" />
                                ) : (
                                    <AvatarFallback className={getColor(selected.seller?.color)}>
                                        {(selected.seller?.firstName || selected.seller?.email || "?").charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            <span className="text-sm flex-1 truncate">
                                {selected.seller?.firstName
                                    ? `${selected.seller.firstName} ${selected.seller.lastName || ""}`.trim()
                                    : selected.seller?.email}
                            </span>
                            <button
                                type="button"
                                onClick={() => chatSeller(selected.seller)}
                                className="flex items-center gap-1 text-sm text-violet-700 dark:text-violet-300 hover:text-foreground"
                            >
                                <FiMessageCircle /> Chat
                            </button>
                        </div>

                        <div className="flex gap-2 mt-5">
                            <button
                                type="button"
                                className="flex-1 py-2.5 rounded-xl bg-[#8417ff] hover:bg-[#741bda] font-medium"
                                onClick={() => addToCart(selected._id, qty)}
                            >
                                Add to cart
                            </button>
                            <button type="button" className="px-4 py-2.5 rounded-xl border border-border" onClick={() => setSelected(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AnimatedPage>
    );
};

export default Shop;
