import { apiClient } from "@/lib/api.client";
import {
    HOST,
    SHOP_PRODUCTS_ROUTE,
    SHOP_PRODUCT_UPLOAD_ROUTE,
    SHOP_PRODUCTS_MINE_ROUTE,
    SHOP_PRODUCT_ROUTE
} from "@/utils/constant";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FiArrowLeft, FiTrash2 } from "react-icons/fi";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";
import { AnimatedPage, AnimatedPageHeader, AnimatedPageMain, staggerStyle } from "@/components/layout/AnimatedPage";

const formatPrice = (n) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);

const ShopSell = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("1");
    const [image, setImage] = useState("");
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [mine, setMine] = useState([]);

    const loadMine = async () => {
        try {
            const res = await apiClient.get(SHOP_PRODUCTS_MINE_ROUTE, { withCredentials: true });
            setMine(res.data.products || []);
        } catch {
            /* ignore */
        }
    };

    useEffect(() => {
        loadMine();
    }, []);

    const onImage = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await apiClient.post(SHOP_PRODUCT_UPLOAD_ROUTE, fd, {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" }
            });
            setImage(res.data.filePath);
            toast.success("Image uploaded");
        } catch {
            toast.error("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await apiClient.post(
                SHOP_PRODUCTS_ROUTE,
                {
                    title,
                    description,
                    price: Number(price),
                    stock: Number(stock),
                    image
                },
                { withCredentials: true }
            );
            toast.success("Product listed");
            setTitle("");
            setDescription("");
            setPrice("");
            setStock("1");
            setImage("");
            loadMine();
        } catch (err) {
            toast.error(err.response?.data?.message || "Could not create product");
        } finally {
            setSaving(false);
        }
    };

    const remove = async (id) => {
        try {
            await apiClient.delete(SHOP_PRODUCT_ROUTE(id), { withCredentials: true });
            toast.success("Product removed");
            loadMine();
        } catch {
            toast.error("Could not remove");
        }
    };

    return (
        <AnimatedPage mesh>
            <AnimatedPageHeader className="border-b border-border px-4 py-3 flex items-center gap-3">
                <button type="button" onClick={() => navigate("/shop")} className="p-2 rounded-lg hover:bg-accent">
                    <FiArrowLeft className="text-xl" />
                </button>
                <h1 className="text-xl font-semibold flex-1">Sell a product</h1>
                <ThemeToggleButton />
            </AnimatedPageHeader>

            <AnimatedPageMain className="max-w-lg mx-auto p-4 space-y-8">
                <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-card p-5">
                    <input
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Product title"
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border"
                    />
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description"
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            required
                            type="number"
                            min={0}
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="Price (VND)"
                            className="px-3 py-2 rounded-lg bg-background border border-border"
                        />
                        <input
                            required
                            type="number"
                            min={0}
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            placeholder="Stock"
                            className="px-3 py-2 rounded-lg bg-background border border-border"
                        />
                    </div>
                    <div>
                        <input type="file" accept="image/*" onChange={onImage} disabled={uploading} className="text-sm" />
                        {image && (
                            <img src={`${HOST}/${image}`} alt="" className="mt-2 h-32 rounded-lg object-cover" />
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-2.5 rounded-xl bg-[#8417ff] hover:bg-[#741bda] font-medium disabled:opacity-50"
                    >
                        {saving ? "Saving…" : "List product"}
                    </button>
                </form>

                <section>
                    <h2 className="font-medium mb-3 text-foreground/80">Your listings</h2>
                    {mine.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No products yet</p>
                    ) : (
                        <ul className="space-y-2">
                            {mine.map((p, idx) => (
                                <li key={p._id} style={staggerStyle(idx)} className="page-stagger-item flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                                    {p.image ? (
                                        <img src={`${HOST}/${p.image}`} alt="" className="h-12 w-12 rounded object-cover" />
                                    ) : (
                                        <div className="h-12 w-12 rounded bg-background" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{p.title}</p>
                                        <p className="text-sm text-violet-700 dark:text-violet-300">{formatPrice(p.price)} · Stock {p.stock}</p>
                                    </div>
                                    <button type="button" onClick={() => remove(p._id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded">
                                        <FiTrash2 />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </AnimatedPageMain>
        </AnimatedPage>
    );
};

export default ShopSell;
