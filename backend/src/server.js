import dotenv from "dotenv"
import { connectDB } from "./lib/db.js";
import "./index.js";
import { server } from "./lib/socket.js";

dotenv.config();
const port = process.env.PORT || 5000;
console.log('PORT from env:', process.env.PORT, 'using port:', port);

server.listen(port, () => {
    console.log(`Server is running on Port: ${port}`);
    connectDB();
});