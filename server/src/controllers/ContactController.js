import User from "../models/UserModel.js";

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



export default {
    SearchContacts
}