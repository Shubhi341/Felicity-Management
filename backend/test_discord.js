const axios = require('axios');

const webhookUrl = "https://discord.com/api/webhooks/1342226847849943141/5uFv9_C2G94D7M1gO2Jj_G4_n7n21oY4ZfU35K95A1Pj_D0_k7R8e9y1fN4r20"; // User's webhook from screenshot

const message = {
    content: `🎉 **Testing Axios Webhook!** ��\nThis is a test to verify webhook execution from the backend.`
};

axios.post(webhookUrl, message)
    .then(res => {
        console.log("Success! Status:", res.status);
        process.exit(0);
    })
    .catch(err => {
        console.error("Failed!", err.response ? err.response.data : err.message);
        process.exit(1);
    });
