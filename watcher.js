const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const axios = require("axios");
const FormData = require("form-data");
const fileType = require("file-type");
const chokidar = require("chokidar");
const zlib = require("zlib");
const readline = require("readline");

const WATCH_PATH = process.env.FOLDERPATH;

chokidar.watch(WATCH_PATH, {
    ignoreInitial: true, ignored: /\.gz$/,
    awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 100 },
}).on("add", async (addedPath) => {
    let compFlag = false;
    let uploadPath = addedPath;
    let contentTxt = "File Upload Successful :D";

    const now = new Date();
    console.log("File detected at", now.toLocaleTimeString(), "on", now.toLocaleDateString());
    console.log("Path:", addedPath);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (q) => new Promise((res) => rl.question(q, res));
    const answer = (await ask("Do you want to compress your File? (Y/N) ")).trim().toLowerCase();

    if (answer === "y") {
        console.log("Compressing file...");
        const outPath = `${addedPath}.gz`;
        await new Promise((resolve, reject) => {
            const gzip = zlib.createGzip();
            fs.createReadStream(addedPath)
                .pipe(gzip)
                .pipe(fs.createWriteStream(outPath))
                .on("finish", resolve)
                .on("error", reject);
        });
        compFlag = true;
        uploadPath = outPath;
        console.log(`Compressed to: ${outPath}`);
    } else if (answer === "n") {
        console.log("Skipping compression.");
    } else {
        console.log("Invalid input, skipping compression.");
    }

    let WEBHOOK_URL;
    if (compFlag) {
        WEBHOOK_URL = process.env.ZIPPEDWEBHOOKURL;
    } else {
        let type;
        try {
            type = await fileType.fromFile(uploadPath);
        } catch { }

        if (type?.mime?.startsWith("image/")) {
            console.log("Image file detected:", type.mime);
            WEBHOOK_URL = process.env.IMAGEWEBHOOKURL;
        } else if (type?.mime?.startsWith("video/")) {
            console.log("Video file detected:", type.mime);
            WEBHOOK_URL = process.env.VIDEOWEBHOOKURL;
        } else if (type?.mime?.startsWith("audio/")) {
            console.log("Audio file detected:", type.mime);
            WEBHOOK_URL = process.env.AUDIOWEBHOOKURL;
        } else if (type?.mime?.startsWith("application/")) {
            console.log("Application file detected:", type.mime);
            WEBHOOK_URL = process.env.APPWEBHOOKURL;
        } else {
            const ext = path.extname(uploadPath).toLowerCase();
            if ([".txt", ".md", ".log", ".json", ".csv", ".html"].includes(ext)) {
                console.log("Hit extra hard coded testcases:", ext);
                WEBHOOK_URL = process.env.TEXTWEBHOOKURL;
            } else {
                console.log("Unknown file type, skipping:", uploadPath);
                rl.close();
                return;
            }
        }
    }

    if (!WEBHOOK_URL) {
        console.error("No webhook URL resolved. Check your .env values.");
        rl.close();
        return;
    }

    try {
        const { size } = fs.statSync(uploadPath);
        console.log("Upload size:", size, "bytes (~", (size / 1024 / 1024).toFixed(2), "MB)");

        const answer2 = (await ask("Do you want to add a message? (Y/N) ")).trim().toLowerCase();
        if (answer2 === "y") {
            contentTxt = (await ask("Enter your message: ")).trim();
            if (!contentTxt) {
                console.log("No message provided, using default.");
            }
        }
        else if (answer2 === "n") {
            console.log("No message provided, using default.");
        } else {
            console.log("Invalid input, using default message.");
        }

        rl.close();

        const form = new FormData();
        form.append("file", fs.createReadStream(uploadPath));
        form.append("payload_json", JSON.stringify({ content: contentTxt }));

        await axios.post(WEBHOOK_URL, form, { headers: form.getHeaders() });
        console.log("Uploaded to Discord!");
    } catch (err) {
        console.error("Upload failed:", err.message);
    }
});
