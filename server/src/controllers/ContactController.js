import mongoose from "mongoose";
import User from "../models/UserModel.js";
import Message from "../models/MessageModel.js";

const SearchContacts = async (req, res) => {
    try {
        let { searchTerm } = req.body;

        searchTerm = searchTerm?.trim();
        if (!searchTerm) {
            return res.status(400).send("SearchTerm is required");
        }

        const sanitizedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(sanitizedSearchTerm, "i");

        const contacts = await User.find({
            _id: { $ne: req.userId },
            $or: [
                { firstName: regex },
                { lastName: regex },
                { email: regex },
            ],
        });

        // Trả về kết quả
        return res.status(200).json({ contacts });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const GetContactsForDirectMessagesList = async (req, res) => {
    try {
        let { userId } = req;
        userId = new mongoose.Types.ObjectId(userId);
        const contacts = await Message.aggregate([ // Sử dụng aggregation pipeline để truy vấn và xử lý dữ liệu
            {
                $match: { // Bước đầu tiên: lọc các tin nhắn liên quan đến userId
                    $or: [{ sender: userId }, { recipient: userId }] // Tin nhắn gửi từ userId hoặc nhận bởi userId
                }
            },
            {
                $sort: { timestamp: -1 } // Sắp xếp tin nhắn theo thời gian (mới nhất trước)
            },
            {
                $group: { // Nhóm các tin nhắn để lấy tin nhắn cuối cùng với mỗi người liên hệ
                    _id: { // Xác định người liên hệ bằng cách kiểm tra ai là người gửi hoặc người nhận
                        $cond: { // Điều kiện kiểm tra xem userId là người gửi hay người nhận
                            if: { $eq: ["$sender", userId] }, // Nếu userId là người gửi
                            then: "$recipient", // Lấy recipient là người liên hệ
                            else: "$sender" // Nếu không, lấy sender là người liên hệ
                        }
                    },
                    lastMessageTime: { $first: "$timestamp" } // Lấy thời gian của tin nhắn gần nhất
                }
            },
            {
                $lookup: { // Kết nối dữ liệu với collection "users" để lấy thông tin người liên hệ
                    from: "users", // Tên collection chứa thông tin người dùng
                    localField: "_id", // Trường `_id` từ kết quả $group được sử dụng để đối chiếu
                    foreignField: "_id", // Đối chiếu với trường `_id` trong collection "users"
                    as: "contactInfo" // Thêm thông tin người dùng vào dưới tên "contactInfo"
                }
            },
            {
                $unwind: "$contactInfo" // Tách mảng "contactInfo" để dễ dàng truy cập vào thông tin của một người
            },
            {
                $project: { // Lựa chọn các trường muốn trả về trong kết quả
                    _id: 1, // Trả về `_id` của người liên hệ
                    lastMessageTime: 1, // Trả về thời gian của tin nhắn cuối cùng
                    email: "$contactInfo.email", // Trả về email của người liên hệ
                    firstName: "$contactInfo.firstName", // Trả về tên của người liên hệ
                    lastName: "$contactInfo.lastName", // Trả về họ của người liên hệ
                    image: "$contactInfo.image", // Trả về ảnh của người liên hệ
                    color: "$contactInfo.color", // Trả về màu của người liên hệ (nếu có)
                }
            },
            {
                $sort: { // Sắp xếp kết quả theo thời gian tin nhắn cuối cùng (mới nhất trước)
                    lastMessageTime: -1
                }
            }
        ]);

        return res.status(200).json({ contacts });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};



export default {
    SearchContacts,
    GetContactsForDirectMessagesList
}