const dotenv = require('dotenv');
dotenv.config();

const chokidar = require('chokidar');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// replace with you webhook (channel -> integrations -> webhooks -> create webhook)
const WEBHOOK_URL = process.env.WEBHOOKURL;

// folder to watch
const WATCH_PATH = process.env.FOLDERPATH;

// watch for new files
chokidar.watch(WATCH_PATH, { ignoreInitial: true }).on('add', async (filePath) => {
    const now = new Date();
    console.log("File uploaded at", now.toLocaleTimeString(), "on", now.toLocaleDateString());
    console.log("File path:", filePath);

    setTimeout(async () => {
        try {
            const form = new FormData();
            form.append('file', fs.createReadStream(filePath));
            form.append('payload_json', JSON.stringify({ content: `File Upload Successful :D` }));

            await axios.post(WEBHOOK_URL, form, {
                headers: form.getHeaders()
            });

            console.log("Uploaded to Discord!");
        } catch (err) {
            console.error("Upload failed:", err.message);
        }
    }, 2000); // delay because of weird protection on upload files
});

