const mongoose = require('mongoose');
const Participant = require('./models/Participant');

async function check() {
    await mongoose.connect('mongodb://127.0.0.1:27017/mern-app');
    const org = await Participant.findOne({ role: 'organizer' });
    if(org) {
        org.discordWebhook = "https://discord.com/api/webhooks/1342226847849943141/5uFv9_C2G94D7M1gO2Jj_G4_n7n21oY4ZfU35K95A1Pj_D0_k7R8e9y1fN4r20";
        await org.save();
        console.log("Saved Webhook:", org.discordWebhook);
    }
    process.exit(0);
}

check();
