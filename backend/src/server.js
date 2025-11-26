import { app } from "./index.js";
import dotenv from "dotenv"
import { connectDB } from "./lib/db.js";

dotenv.config();
const port = process.env.PORT;

app.listen(port, () => {
    console.log(`Server is running on Port: http:localhost:/${port}`);
    connectDB();
});