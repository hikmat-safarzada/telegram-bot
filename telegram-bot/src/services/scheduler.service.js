const cron = require("node-cron");
const mentorService = require("./mentor.service");
const { sendDelivery } = require("./telegram.service");

const runDuePushes = async (bot, date = new Date()) => {
    let preferences;
    try {
        preferences = await mentorService.getDuePreferences(date);
    } catch (error) {
        console.error("Daily push check failed:", error.message);
        return;
    }
    for (const preference of preferences) {
        try {
            const result = await mentorService.createDailyDelivery(preference, preference.user_id, date);
            if (!result.alreadySent) {
                await sendDelivery(bot, preference.user_id, result.delivery);
            }
        } catch (error) {
            console.error(`Daily push failed for preference ${preference._id}:`, error.message);
        }
    }
};

const startScheduler = (bot) => {
    const task = cron.schedule("* * * * *", () => runDuePushes(bot), { noOverlap: true });
    console.log("Daily mentor scheduler started");
    return task;
};

module.exports = { runDuePushes, startScheduler };
