import express from "express";
import multer from "multer";
import { verifyToken } from "../middlewares/AuthMiddleware.js";
import ShopController from "../controllers/ShopController.js";
import PaymentController from "../controllers/PaymentController.js";

const router = express.Router();
const upload = multer({ dest: "upload/products/" });

router.get("/products", verifyToken, ShopController.ListProducts);
router.get("/products/mine", verifyToken, ShopController.GetMyProducts);
router.get("/products/:id", verifyToken, ShopController.GetProduct);
router.post("/products", verifyToken, ShopController.CreateProduct);
router.patch("/products/:id", verifyToken, ShopController.UpdateProduct);
router.delete("/products/:id", verifyToken, ShopController.DeleteProduct);
router.post("/products/upload-image", verifyToken, upload.single("file"), ShopController.UploadProductImage);

router.get("/cart", verifyToken, ShopController.GetCart);
router.post("/cart", verifyToken, ShopController.AddToCart);
router.patch("/cart", verifyToken, ShopController.UpdateCartItem);
router.delete("/cart/:productId", verifyToken, ShopController.RemoveFromCart);

router.get("/payments/config", verifyToken, PaymentController.PaymentConfig);
router.post("/payments/validate-coupon", verifyToken, PaymentController.ValidateCoupon);
router.get("/payments/vnpay/return", PaymentController.VnpayReturn);
router.get("/payments/vnpay/ipn", PaymentController.VnpayIpn);
router.post("/orders/:id/pay-vnpay", verifyToken, PaymentController.RetryVnpay);

router.post("/orders/checkout", verifyToken, ShopController.Checkout);
router.get("/orders/mine", verifyToken, ShopController.GetMyOrders);
router.get("/orders/sales", verifyToken, ShopController.GetSalesOrders);
router.get("/orders/:id", verifyToken, ShopController.GetOrder);
router.patch("/orders/:id/status", verifyToken, ShopController.UpdateOrderStatus);

export default router;
