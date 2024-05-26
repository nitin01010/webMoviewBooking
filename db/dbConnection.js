const mongoose = require("mongoose");
const dbURI = process.env.dbURI;
const dbConnect = async () => {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
};

dbConnect();

module.exports = dbConnect;