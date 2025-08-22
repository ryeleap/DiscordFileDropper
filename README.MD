# Discord File Dropper

This script watches a folder for new files and automatically uploads them to different Discord channels (via webhooks) based on file type. This is TOS compliant and cannot upload file exceeding defined limits (though the limits can change based on server boost level.)

## How it Works
- Uses chokidar to watch a folder for new files.
- Detects file type using file-type.  
  - Falls back to file extension for plain text formats like .txt, .md, .log, .json, .csv, .html.
- Routes the upload to the correct Discord webhook based on MIME type (image, video, audio, text, application).
- Uploads the file with a short, configurable message .

## Setup
1. Clone this project with ```git clone https://github.com/ryeleap/LilligantHelper.git``` 
2. Install dependencies with ```npm install```
3. Create a .env file in the project root:
   ```FOLDERPATH=C:/InsertFolderPathHere
   IMAGEWEBHOOKURL=https://discord.com/api/webhooks/xxx/yyy
   VIDEOWEBHOOKURL=https://discord.com/api/webhooks/xxx/yyy
   AUDIOWEBHOOKURL=https://discord.com/api/webhooks/xxx/yyy
   TEXTWEBHOOKURL=https://discord.com/api/webhooks/xxx/yyy
   APPWEBHOOKURL=https://discord.com/api/webhooks/xxx/yyy
   ZIPPEDWEBHOOKURL = https://discord.com/api/webhooks/xxx/yyy
   ```

   - Note: **Make absolute sure that your file path has forward slashes instead of back slashes, will break otherwise**
   - Note 2: These don't NEED to be seperate webhooks, just my personal preference
   - Replace the webhook URLs with ones from your Discord server.

4. Run the script:
   node watcher.js

## Notes
- Upload limits: Discord enforces 8 MB max file size for free servers. Larger files will fail with a 413 Request Entity Too Large error unless your server is boosted or you use Nitro-supported webhooks. The zipping functionality is an attempt to improve the flexibility of this system, but it isn't perfect and won't function well on most video or installer files, as they are already well optimized
- Stability settings: Files are only uploaded once they’ve stopped changing for 2 seconds (stabilityThreshold) to avoid grabbing files mid-write.  
- Supports images, videos, audio, text (text is hard coded for now), and applications. Unknown file types are skipped.

## To Do List
- Ways to get around rigidity with videos
- Creating zip file only on runtime/in memory rather than creating and keeping it
- Fixing wonkiness when a folder is copy pasted in
