import mongoose from "mongoose";
import dotenv from "dotenv";
import Coupon from "../src/models/CouponModel.js";

dotenv.config();

const coupons = [
    { code: "WELCOME10", description: "10% off first order", discountType: "percent", value: 10, minOrder: 50000, maxDiscount: 100000 },
    { code: "SAVE50K", description: "50,000 VND off", discountType: "fixed", value: 50000, minOrder: 200000 }
];

async function run() {
    await mongoose.connect(process.env.DATABASE_URL);
    for (const c of coupons) {
        await Coupon.findOneAndUpdate({ code: c.code }, c, { upsert: true, new: true });
        console.log("Coupon:", c.code);
    }
    await mongoose.disconnect();
    process.exit(0);
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
