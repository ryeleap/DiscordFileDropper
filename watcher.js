const fs = require("fs");
const path = require("path");
const dotenv = require('dotenv');
dotenv.config();

const axios = require("axios");
const FormData = require("form-data");
const fileType = require("file-type");
const chokidar = require("chokidar");

// folder to watch
const WATCH_PATH = process.env.FOLDERPATH;

// webhook URL to discord 
var WEBHOOK_URL;

// watch for new files, threshold is minimum time that file must be stable, polling interval is how often to check for those changes
chokidar.watch(WATCH_PATH, { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 100 } }).on('add', async (filePath) => {
    const now = new Date();
    console.log("File uploaded at", now.toLocaleTimeString(), "on", now.toLocaleDateString());
    console.log("File path:", filePath, '\n');

    const type = await fileType.fromFile(filePath);

    if (type?.mime) {
        if (type.mime.startsWith("image/")) {
            console.log("Image file detected:", type.mime);
            WEBHOOK_URL = process.env.IMAGEWEBHOOKURL;
        } else if (type.mime.startsWith("video/")) {
            console.log("Video file detected:", type.mime);
            WEBHOOK_URL = process.env.VIDEOWEBHOOKURL;
        } else if (type.mime.startsWith("audio/")) {
            console.log("Audio file detected:", type.mime);
            WEBHOOK_URL = process.env.AUDIOWEBHOOKURL;
        } else if (type.mime.startsWith("application/")) {
            console.log("Application file detected:", type.mime);
            WEBHOOK_URL = process.env.APPWEBHOOKURL;
        } else {
            console.log("Unsupported MIME type (I either haven't added it yet or it's obscure and you can add it yourself!):", type.mime);
            return;
        }
    } else {
        const ext = path.extname(filePath).toLowerCase();
        if (ext === ".txt" || ext === ".md" || ext === ".log" || ext === ".json" || ext === ".csv" || ext === ".html") {
            console.log("Text file detected (hardcoded fallback for certain extensions):", ext);
            WEBHOOK_URL = process.env.TEXTWEBHOOKURL;
        } else {
            console.log("Unknown file type, skipping:", filePath);
            return;
        }
    }

    try {
        const { size } = fs.statSync(filePath);
        console.log('Upload size:', size, 'bytes (~', (size / 1024 / 1024).toFixed(2), 'MB)');

        const form = new FormData();
        // append the file to the form data
        form.append('file', fs.createReadStream(filePath));
        // message content payload
        form.append('payload_json', JSON.stringify({ content: `File Upload Successful :D` }));

        // post the form data to the Discord webhook URL
        await axios.post(WEBHOOK_URL, form, { headers: form.getHeaders() });

        console.log("Uploaded to Discord!");
    } catch (err) {
        console.error("Upload failed:", err.message);
    }
});

