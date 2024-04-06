// GLOBAL VARS

let cCurrent = 100;
let scCurrent = 1;
let scCurrentMax = 11;
let region = "Nazionale";

// HELPER FUNCTIONS

const URL = (c, sc, region) => {
    if (!sc || sc == 1) {
        sc = "";
    } else {
        sc = "." + sc;
    }

    return `https://www.televideo.rai.it/televideo/pub/tt4web/${region}/16_9_page-${c}${sc}.png`;
};

// check local storage for channel information
// resolve a promise early if valid, otherwise return a "cache and resolve" function
const checkCache = (url, resolveFunction) => {
    let now = Date.now();

    // listen to cache only if the channel exists or was checked under 2 months ago
    let cachedInfo = JSON.parse(localStorage.getItem(url));
    if (cachedInfo) {
        let checkedRecently = (now - cachedInfo.lastChecked) < (1000 * 60 * 60 * 24 * 30 * 2);
        if (cachedInfo.exists || checkedRecently) {
            resolveFunction(cachedInfo.exists);
        }
    }

    return (bool) => {
        let channelInfo = { exists: bool, lastChecked: now }
        localStorage.setItem(url, JSON.stringify(channelInfo));
        resolveFunction(bool);
    }
}

//return a boolean if an image exists (to get around CORS)
const exists = async (c, sc, region) => new Promise((resolve) => {
    let url = URL(c, sc, region);

    let cacheAndResolve = checkCache(url, resolve);
    if (!cacheAndResolve) return;

    let controlImage = new Image();
    controlImage.onload = () => cacheAndResolve(true);
    controlImage.onerror = () => cacheAndResolve(false);
    controlImage.src = url;
});

//update user interface (this assumes a valid URL)
const updateContainer = () => {
    window.display.src = URL(cCurrent, scCurrent, region);
    window.channelInput.value = cCurrent;
    window.subchannelInput.value = scCurrent;
}

const determineMaxSubchannel = async () => {
    window.maxSubchannelSpan.innerText = "...";

    // create an array of subchannels, null if they dont exist
    let subChannelExistsArray = await Promise.all(Array(29).fill().map(async (_, sci) => {
        return await exists(cCurrent, sci + 1, region) ? sci + 1 : null;
    }));

    //return the maximum value
    scCurrentMax = window.maxSubchannelSpan.innerText = Math.max(...subChannelExistsArray);
}

//find next/previous valid channel depending on step
const surfChannels = async (step) => {
    region = window.regionSelector.value;
    let cNext = cCurrent + step;
    while (cNext > 100 && cNext < 899) {
        if (!(await exists(cNext, 1, region))) {
            //if a region is selected, try the generic regional variant
            if ((region != "Nazionale") && await exists(cNext, 1, "Regionali")) {
                region = "Regionali";
                break;
            }
            cNext += step;
        } else break;
    }
    cCurrent = cNext;
    scCurrent = 1;

    updateContainer();
    determineMaxSubchannel();
};

//find next/previous valid subchannel depending on step
const surfSubChannels = async (step) => {
    let scNext = scCurrent + step;
    while (!(await exists(cCurrent, scNext, region))) {
        if (scNext < 1 || scNext > scCurrentMax) return;
        scNext += step;
    }

    scCurrent = scNext;
    updateContainer();
};

//try to fetch the desired channel
const tryFetchChannel = async (c, sc, r) => {
    let updated = false;
    //first try the desired channel-subchannel pair, then just the channel without subchannel, then just don't
    if (await exists(c, sc, r)) {
        updated = true;
        cCurrent = c;
        scCurrent = sc;
        region = r;
    } else if (await exists(c, 1, r)) {
        updated = true;
        cCurrent = c;
        scCurrent = 1;
        region = r;
    } else if (region != "Nazionale") {
        //if a region is selected, try the generic regional variant
        if (await exists(c, sc, "Regionali")) {
            updated = true;
            cCurrent = c;
            scCurrent = sc;
            region = "Regionali";
        } else if (await exists(c, 1, "Regionali")) {
            updated = true;
            cCurrent = c;
            scCurrent = 1;
            region = "Regionali";
        }
    };
    if (updated) {
        updateContainer();
        determineMaxSubchannel();
    } else {
        window.maxSubchannelSpan.innerText = scCurrentMax;
    }
}

const resetChannel = () => {
    region = window.regionSelector.value;
    cCurrent = region == "Nazionale" ? 100 : 300;
    scCurrent = 1;
    scCurrentMax = 11;
    updateContainer();
}


// NAVIGATION LOGIC

//buttons
window.homeChannelButton.addEventListener("click", resetChannel);
window.channelForwardButton.addEventListener("click", () => surfChannels(1));
window.subchannelForwardButton.addEventListener("click", () => surfSubChannels(1));
window.channelBackButton.addEventListener("click", () => surfChannels(-1));
window.subchannelBackButton.addEventListener("click", () => surfSubChannels(-1));

//region selector
window.regionSelector.addEventListener("change", resetChannel);

//text input
window.textInputEnter.addEventListener("click", () => {
    region = window.regionSelector.value;
    let ci = Number(window.channelInput.value);
    let sci = Number(window.subchannelInput.value);
    if (ci == cCurrent && sci == scCurrent) return;
    tryFetchChannel(ci, sci, region);
});
window.channelInput.addEventListener("change", () => {
    window.maxSubchannelSpan.innerText = 15;
})

updateContainer();
determineMaxSubchannel();