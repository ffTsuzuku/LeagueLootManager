"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const fs = require("fs");
const https = require("https");
/**
 * Parses the lock file of the riot client  and returns the client port and pass
 *
 * @returns An error message if file isn't found or an object containing the
 * client port and authentication password.
 */
function parseLockFile() {
    const lockFilePath = 'C:/Riot\ Games/League\ of\ Legends/lockfile';
    let clientPort;
    let clientPass;
    // Attempt to connect to the open client, else enable offline mode. 
    try {
        const data = fs.readFileSync(lockFilePath, 'utf8');
        const apiParams = data.split(":");
        clientPort = apiParams[2];
        clientPass = apiParams[3];
        return { clientPort, clientPass };
    }
    catch (err) {
        throw new Error(err);
    }
}
/**
 * This function fetches a players loot data from the client.
 *
 * @param clientPort : The port number where the client api is hosted
 * @param clientPass : The authentication password for the client
 * @returns : Returns an Object containing the loot data.
 */
async function fetchLootData(clientPort, clientPass) {
    const apiURL = `https://127.0.0.1:${clientPort}/lol-loot/v1/player-loot`;
    const agent = new https.Agent({
        rejectUnauthorized: false
    });
    const auth = {
        username: 'riot',
        password: clientPass,
    };
    const response = await axios_1.default.get(apiURL, { httpsAgent: agent, auth });
    return response.data;
}
/**
 * This function will return cached loot data.
 *
 * @returns Returns cached loot data.
 */
async function fetchLocalLootCache(cachePath) {
    let data;
    try {
        data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    }
    catch (err) {
        data = [];
    }
    return data;
}
async function cacheLootData(lootData, cachePath) {
    let cached;
    try {
        const fileContents = JSON.stringify(lootData);
        const ws = fs.createWriteStream(cachePath);
        ws.write(fileContents);
        cached = true;
    }
    catch (err) {
        cached = false;
    }
    return cached;
}
async function main() {
    const cachePath = process.cwd() + '/cache/cache';
    let lootData;
    try {
        const { clientPort, clientPass } = parseLockFile();
        console.log('Client Detected. Fetching Loot Data.');
        lootData = await fetchLootData(clientPort, clientPass);
        console.log('Attempting to Cache Loot Data.');
        const cached = await cacheLootData(lootData, cachePath);
        if (cached) {
            console.log('Successfully cached data');
        }
        else {
            console.log('Failed to Cache Data');
        }
    }
    catch (err) {
        console.error('Error cannot detect client');
        console.log('Checking for cache...');
        lootData = await fetchLocalLootCache(cachePath);
        if (lootData.length > 0) {
            console.log('Loaded Cache Data.');
        }
        else {
            console.log('No Cache Found Terminating.');
            process.exit(-1);
        }
    }
    /**
    let totalEssence = 0;
    for (const loot of lootData) {
        if (loot.displayCategories === 'CHAMPION') {
            totalEssence += loot.value * loot.count;
        }
    }

    console.log(totalEssence)

    **/
}
main();
