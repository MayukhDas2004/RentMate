const fs = require("fs");
const path = require("path");
const http = require("http");
const { google } = require("googleapis");

const credentialsPath = path.join(__dirname, "google-oauth.json");

const credentials = JSON.parse(
    fs.readFileSync(credentialsPath, "utf8")
);

const { client_id, client_secret } = credentials.web;

const REDIRECT_URI = "http://localhost:3000/oauth2callback";

const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    REDIRECT_URI
);

const SCOPES = [
    "https://www.googleapis.com/auth/gmail.send"
];

const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent"
});

const server = http.createServer(async (req, res) => {

    if (req.url.startsWith("/oauth2callback")) {

        const url = new URL(
            req.url,
            "http://localhost:3000"
        );

        const code = url.searchParams.get("code");

        if (!code) {
            res.writeHead(400);
            res.end("Authorization code not found.");
            return;
        }

        try {
            const { tokens } = await oauth2Client.getToken(code);

            console.log("\nAuthorization successful!\n");

            console.log("REFRESH TOKEN:");
            console.log(tokens.refresh_token);

            res.writeHead(200, {
                "Content-Type": "text/html"
            });

            res.end(`
                <h2>RentMate Gmail authorization successful!</h2>
                <p>You can close this browser tab.</p>
            `);

            server.close();

        } catch (error) {

            console.error("Token exchange failed:", error);

            res.writeHead(500);
            res.end("Authorization failed.");
        }

        return;
    }

    res.writeHead(404);
    res.end("Not found.");
});

server.listen(3000, () => {

    console.log("\nOpen this URL in your browser:\n");
    console.log(authUrl);
    console.log("\nWaiting for Google authorization...");
});