import axios from 'axios';
import * as fs from 'fs';
import * as https from 'https';

interface Loot {
    asset: string,
    count: number,
    disenchantLootName: string,
    disenchantValue: number,
    displayCategories: number | string,
    expiryTime: number,
    isNew: boolean,
    isRental: boolean,
    itemDesc: string,
    itemStatus: string,
    localizedDescription: string,
    localizedName: string,
    localizedRecipeSubtitle: string,
    localizedRecipeTitle: string,
    lootId: string,
    lootName: string,
    parentItemStatus: string,
    parentStoreItemId: number,
    rarity: string,
    redeemableStatus: string,
    refId: string,
    rentalGames: number,
    rentalSeconds: number,
    shadowPath: string,
    splashPath: string,
    storeItemId: number,
    tags: string,
    tilePath: string,
    type: string,
    upgradeEssenceName: string,
    upgradeEssenceValue: number,
    upgradeLootName: string,
    value: number
}
/**
 * Parses the lock file of the riot client  and returns the client port and pass
 * 
 * @returns An error message if file isn't found or an object containing the
 * client port and authentication password. 
 */
function parseLockFile()  : {clientPort: string, clientPass: string } {
    const lockFilePath = 'C:/Riot\ Games/League\ of\ Legends/lockfile';
    let clientPort : string;
    let clientPass : string;

    // Attempt to connect to the open client, else enable offline mode. 
    try {
        const data = fs.readFileSync(lockFilePath, 'utf8');
        const apiParams = data.split(":");
        clientPort = apiParams[2];
        clientPass = apiParams[3];

        return {clientPort, clientPass};
    } catch(err) {
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
async function fetchLootData(
    clientPort: string, 
    clientPass: string
):Promise<Loot[]>  
{    
    const apiURL = `https://127.0.0.1:${clientPort}/lol-loot/v1/player-loot`;
    const agent = new https.Agent({
        rejectUnauthorized: false
    });
    const auth = { 
        username: 'riot', 
        password: clientPass, 
    };
    const response  = await axios.get(apiURL, {httpsAgent: agent, auth});

    return response.data;
}

/**
 * This function will return cached loot data. 
 * 
 * @returns Returns cached loot data. 
 */
async function fetchLocalLootCache(cachePath: string):Promise<Loot[]> {
    let data : Loot[];

    try {
        data = JSON.parse(fs.readFileSync(cachePath, 'utf8')) as Loot[];
    } catch (err) {
        data = [];
    }

    return data;
}

async function cacheLootData(
    lootData : Loot[], 
    cachePath: string
): Promise<boolean> 
{
    let cached : boolean;

    try {
        const fileContents = JSON.stringify(lootData);
        const ws = fs.createWriteStream(cachePath);
        ws.write(fileContents);
        cached = true;
    } catch (err) {
        cached = false;
    }

    return cached;
}

async function main() { 
    const cachePath = process.cwd() + '/cache/cache';
    let lootData : Loot[];
    try {
        const {clientPort, clientPass } = parseLockFile();
        console.log('Client Detected. Fetching Loot Data.');
        lootData = await fetchLootData(clientPort, clientPass);
        console.log('Attempting to Cache Loot Data.');
        const cached  = await cacheLootData(lootData, cachePath);

        if (cached) {
            console.log('Successfully cached data');
        } else {
            console.log('Failed to Cache Data');
        }

    } catch (err) {
        console.error('Error cannot detect client');
        console.log('Checking for cache...');
        lootData = await fetchLocalLootCache(cachePath);

        if (lootData.length > 0) {
            console.log('Loaded Cache Data.');
        } else {
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




