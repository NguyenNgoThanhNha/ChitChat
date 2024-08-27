import Message from './../models/MessageModel.js';
import { mkdirSync, renameSync } from 'fs'
const GetMessages = async (req, res) => {
    try {
        const user1 = req.userId;
        const user2 = req.body.id;

        // Check if both user IDs are provided
        if (!user1 || !user2) {
            return res.status(400).json({ error: "Both user IDs are required." });
        }

        // Fetch messages between user1 and user2, sorted by timestamp
        const messages = await Message.find({
            $or: [
                { sender: user1, recipient: user2 },
                { sender: user2, recipient: user1 }
            ]
        }).sort({ timestamp: 1 });

        // Return the messages in the response
        return res.status(200).json({ messages });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const UploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "File is required." });
        }
        const date = Date.now();
        const fileDir = `upload/files/${date}`;
        const fileName = `${fileDir}/${req.file.originalname}`;
        // Create the directory structure if it doesn't exist, using recursive to create any necessary parent directories
        mkdirSync(fileDir, { recursive: true });

        // Move the uploaded file from its temporary path to the final destination
        renameSync(req.file.path, fileName);
        return res.status(200).json({ filePath: fileName });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

export default {
    GetMessages,
    UploadFile
};
