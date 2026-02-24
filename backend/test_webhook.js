const webhookUrl = "https://discord.com/api/webhooks/1342226847849943141/5uFv9_C2G94D7M1gO2Jj_G4_n7n21oY4ZfU35K95A1Pj_D0_k7R8e9y1fN4r20"; // replace with the user's or just a placeholder to check syntax
// Since I don't know the user's webhook securely, I will just print the node version and test fetch availability.
console.log("Node version:", process.version);
if (typeof fetch !== 'undefined') {
    console.log("Fetch is available!");
} else {
    console.log("Fetch is NOT available!");
}
