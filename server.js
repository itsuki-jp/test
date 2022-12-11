const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listEvents(auth) {
    const calendar = google.calendar({ version: 'v3', auth });
    const maxResults = 100;
    const res = await calendar.events.list({
        calendarId: 'primary',
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime',

        // Todo:引数をいい感じに設定できるようにする
        timeMin: new Date(2022, 11, 12).toISOString(),
        timeMax: new Date(2022, 11, 15).toISOString(),
        timeZone: "Asia/Tokyo",
    });
    const events = res.data.items;
    if (!events || events.length === 0) {
        console.log('No upcoming events found.');
        return;
    }
    const isBooked = [];
    events.map((event) => {
        if (!event.end.dateTime) { return; }
        const start = event.start.dateTime || event.start.date;
        const end = event.end.dateTime || event.end.date;
        isBooked.push({ start: start, end: end, startDateObj: new Date(start), endDateObj: new Date(end) });
    });
    return isBooked;
}

function returnStartEnd(startO, endO) {
    return {
        start: {
            year: startO.getFullYear(),
            month: startO.getMonth() + 1,
            day: startO.getDate(),
            hr: startO.getHours(),
            min: startO.getMinutes(),

        },
        end: {
            year: endO.getFullYear(),
            month: endO.getMonth() + 1,
            day: endO.getDate(),
            hr: endO.getHours(),
            min: endO.getMinutes(),
        }
    }
}

function getFreeTime(data, minTime, maxTime) {
    const res = [];
    let now = minTime;
    for (let i = 0; i < data.length; i++) {
        res.push(returnStartEnd(now, data[i].endDateObj));
        now = data[i].endDateObj;
    }
    if (data[data.length - 1].endDateObj < maxTime) { res.push(returnStartEnd(now, maxTime)) }
    return res;
}
// ---------------------------------------------

const express = require('express')
const serveStatic = require('serve-static')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 3000

if (process.env.NODE_ENV !== 'production') {
    app.use(cors())
}

app.use(serveStatic(__dirname + '/dist'))

app.get('/api/message', (req, res) => {
    res.send('get message')
})

app.get('/api/getData', (req, res) => {
    authorize()
        .then(listEvents)
        .then(data => {
            const result = getFreeTime(data, new Date(2022, 11, 12), new Date(2022, 11, 15));
            res.send(result);
        })
        .catch(console.error);

})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))