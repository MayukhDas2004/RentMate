require("dotenv").config();

const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
);

oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN
});

const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client
});

async function sendGmail({ to, subject, text }) {

    const message = [
        `From: RentMate <${process.env.GMAIL_USER}>`,
        `To: ${to}`,
        `Subject: ${subject}`,
        "Content-Type: text/plain; charset=utf-8",
        "",
        text
    ].join("\r\n");

    const encodedMessage = Buffer
        .from(message)
        .toString("base64url");

    const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
            raw: encodedMessage
        }
    });

    return response.data;
}

module.exports = sendGmail;
