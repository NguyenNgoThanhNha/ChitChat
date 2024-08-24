import { Server as SocketIoServer } from "socket.io"

const setupSocket = (server) => {
    const io = new SocketIoServer(server, {
        cors: {
            origin: process.env.ORIGIN,
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    const userSocketMap = new Map();

    const disconnect = (socket) => {
        console.log(`Client Disconnected: ${socket.id}`);
        for (const [userId, socketId] of userSocketMap.entries()) {
            if (socketId === socket.id) {
                // delete from map
                userSocketMap.delete(userId)
                break;
            }
        }
    }

    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;

        if (userId) {
            // set id to map
            userSocketMap.set(userId, socket.id)
            console.log(`User Connected: ${userId} with socket Id: ${socket.id}`)
        } else {
            console.log("User Id not found during connection")
        }
        socket.on("disconnect", () => disconnect(socket))
    })

}
export default setupSocket