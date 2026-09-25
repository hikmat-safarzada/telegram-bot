const { Bot } = require("node-telegram-bot-api");
const Category = require("../models/Category");
const Subcategory = require("../models/Subcategory");
const Delivery = require("../models/MentorDelivery");
const mentorService = require("./mentor.service");

const PUSH_TIMES = ["08:00", "09:00", "10:00", "18:00", "20:00", "21:00"];

const messageText = (text) => `🌱 Bugünkü kiçik addımın:\n\n${text}\n\nKiçik addımlar böyük dəyişikliklər yaradır. ✨`;

const deliveryKeyboard = (deliveryId) => ({
    inline_keyboard: [[
        { text: "❤️ Bəyəndim — +5%", callback_data: `LIKE:${deliveryId}` },
        { text: "🔄 Digər", callback_data: `OTHER:${deliveryId}` }
    ]]
});

const sendDelivery = async (bot, user, delivery) => {
    const sent = await bot.api.sendMessage({
        chat_id: user.chatId,
        text: messageText(delivery.message_id.text),
        reply_markup: deliveryKeyboard(delivery._id.toString())
    });
    await Delivery.findByIdAndUpdate(delivery._id, { $set: { telegram_message_id: String(sent.message_id) } });
    return sent;
};

const categoryKeyboard = (categories) => ({
    inline_keyboard: categories.map((category) => [{
        text: category.name,
        callback_data: `CAT:${category._id}`
    }])
});

const subcategoryKeyboard = (subcategories) => ({
    inline_keyboard: subcategories.map((subcategory) => [{
        text: subcategory.name,
        callback_data: `SUB:${subcategory._id}`
    }])
});

const timeKeyboard = (subcategoryId) => ({
    inline_keyboard: PUSH_TIMES.map((time) => ([{
        text: time,
        callback_data: `TIME:${subcategoryId}:${time.replace(":", "")}`
    }]))
});

const clearKeyboard = async (bot, callback) => {
    if (callback.message) {
        await bot.api.editMessageReplyMarkup({
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: { inline_keyboard: [] }
        });
    }
};

const safelyClearKeyboard = async (bot, callback) => {
    try {
        await clearKeyboard(bot, callback);
    } catch (error) {
        console.error("Telegram keyboard could not be cleared:", error.message);
    }
};

const createTelegramBot = (token) => {
    if (!token) {
        console.warn("Telegram bot is disabled. Set TELEGRAM_BOT_TOKEN to enable it.");
        return null;
    }

    const bot = new Bot(token);

    bot.command("start", async (context) => {
        try {
            await mentorService.ensureUser({
                telegramId: context.from.id,
                chatId: context.chat.id,
                firstName: context.from.first_name
            });
            const categories = await Category.find().sort({ name: 1 }).lean();
            await context.reply("Salam! Hansı sahə üzərində işləmək istəyirsən?", {
                reply_markup: categoryKeyboard(categories)
            });
        } catch (error) {
            console.error("Telegram /start failed:", error.message);
            await context.reply("Hazırda seçimləri aça bilmirəm. Bir az sonra yenidən yoxla.");
        }
    });

    bot.on("callback_query", async (context) => {
        const callback = context.callbackQuery;
        try {
            const telegramId = context.from.id;
            const chatId = context.chat?.id || context.from.id;
            const data = callback.data || "";

            if (data.startsWith("CAT:")) {
                const categoryId = data.slice(4);
                const subcategories = await Subcategory.find({ category_id: categoryId }).sort({ name: 1 }).lean();
                await context.answerCallbackQuery();
                await bot.api.sendMessage({ chat_id: chatId, text: "İndi subkateqoriyanı seç:", reply_markup: subcategoryKeyboard(subcategories) });
                return;
            }

            if (data.startsWith("SUB:")) {
                const subcategoryId = data.slice(4);
                await context.answerCallbackQuery();
                await bot.api.sendMessage({ chat_id: chatId, text: "Gündəlik mesajı hansı saatda almaq istəyirsən?",
                    reply_markup: timeKeyboard(subcategoryId)
                });
                return;
            }

            if (data.startsWith("TIME:")) {
                const [, subcategoryId, compactTime] = data.split(":");
                const pushTime = `${compactTime.slice(0, 2)}:${compactTime.slice(2)}`;
                const result = await mentorService.configurePreference({
                    telegramId,
                    chatId,
                    firstName: callback.from.first_name,
                    subcategoryId,
                    pushTime
                });
                const daily = await mentorService.createDailyDelivery(result.preference, result.user);
                await context.answerCallbackQuery({ text: `Hər gün ${pushTime}-da göndərəcəyəm.` });
                await safelyClearKeyboard(bot, callback);
                if (!daily.alreadySent) {
                    await sendDelivery(bot, result.user, daily.delivery);
                }
                return;
            }

            if (data.startsWith("LIKE:") || data.startsWith("OTHER:")) {
                const [action, deliveryId] = data.split(":");
                const result = await mentorService.applyAction({ telegramId, deliveryId, action });
                await safelyClearKeyboard(bot, callback);
                await context.answerCallbackQuery({
                    text: action === "LIKE" ? `Progress: ${result.progress.progress}%` : "Başqa addım seçildi."
                });

                if (action === "LIKE") {
                    const text = result.completed
                        ? "Təbriklər, bu subkateqoriyanı tamamladın!"
                        : `Əla! Progressin ${result.progress.progress}% oldu.`;
                    await bot.api.sendMessage({ chat_id: chatId, text });
                } else {
                    const alternative = await Delivery.findById(result.nextDelivery.deliveryId).populate("message_id");
                    const user = await mentorService.getUserByTelegramId(telegramId);
                    await sendDelivery(bot, user, alternative);
                }
                return;
            }

            await context.answerCallbackQuery({ text: "Bu seçim artıq etibarlı deyil." });
        } catch (error) {
            console.error("Telegram callback failed:", error.message);
            await context.answerCallbackQuery({ text: error.message, show_alert: true }).catch(() => {});
        }
    });

    bot.catch((error) => console.error("Telegram update failed:", error.message));
    bot.startPolling().catch((error) => console.error("Telegram polling error:", error.message));
    return bot;
};

module.exports = { createTelegramBot, sendDelivery };
