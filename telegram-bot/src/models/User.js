const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    telegramId: {
        type: String,
        required: true,
        unique: true
    },
    chatId: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        trim: true
    },
    timezone: {
        type: String,
        default: "Asia/Baku"
    }
}, 
{
    timestamps : true
})
module.exports = mongoose.model("User", userSchema);
