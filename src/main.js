// ELEMENT DEFINITIONS

//images
let displayImage = document.getElementById("display");
let controlImage = document.getElementById("controlImage");
let subControlImage = document.getElementById("subControlImage");
//button navigation
let homeButton = document.getElementById("homeChannel");
let channelBackButton = document.getElementById("channelBack");
let subchannelBackButton = document.getElementById("subchannelBack");
let channelForwardButton = document.getElementById("channelForward");
let subchannelForwardButton = document.getElementById("subchannelForward");
//region selector
let regionSelector = document.getElementById("regionSelector");
//text navigation
let channelInput = document.getElementById("channelInput");
let subChannelInput = document.getElementById("subchannelInput");
let maxSubChannelSpan = document.getElementById("maxSubchannel");
let enterButton = document.getElementById("textInputEnter");

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
        sc = `.${sc}`;
    }
    return `https://www.televideo.rai.it/televideo/pub/tt4web/${region}/16_9_page-${c}${sc}.png`
};

//return a boolean if an image exists (to get around CORS)
const exists = async (c, sc, r) => new Promise((resolve) => {
    controlImage.onload = () => resolve(true);
    controlImage.onerror = () => resolve(false);
    controlImage.src = URL(c, sc, r);
});

//update user interface (this assumes a valid URL)
const updateContainer = () => {
    displayImage.src = URL(cCurrent, scCurrent, region);
    channelInput.value = cCurrent;
    subChannelInput.value = scCurrent;
}

const determineMaxSubchannel = async () => {
    let maxSC;
    for (maxSC = 15; maxSC > 1; maxSC--) {
        let subChannelExists = await new Promise((resolve) => {
            subControlImage.onload = () => resolve(true);
            subControlImage.onerror = () => resolve(false);
            subControlImage.src = URL(cCurrent, maxSC, region);
        });
        if (subChannelExists) break;
    }

    scCurrentMax = maxSubChannelSpan.innerText = maxSC;
}

//find next/previous valid channel depending on step
const surfChannels = async (step) => {
    region = regionSelector.value;
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
        maxSubChannelSpan.innerText = scCurrentMax;
    }
}

const resetChannel = () => {
    region = regionSelector.value;
    cCurrent = region == "Nazionale" ? 100 : 300;
    scCurrent = 1;
    updateContainer();
}


// NAVIGATION LOGIC

//buttons
homeButton.addEventListener("click", resetChannel);
channelForwardButton.addEventListener("click", () => surfChannels(1));
subchannelForwardButton.addEventListener("click", () => surfSubChannels(1));
channelBackButton.addEventListener("click", () => surfChannels(-1));
subchannelBackButton.addEventListener("click", () => surfSubChannels(-1));

//region selector
regionSelector.addEventListener("change", resetChannel);

//text input
enterButton.addEventListener("click", () => {
    region = regionSelector.value;
    let ci = Number(channelInput.value);
    let sci = Number(subChannelInput.value);
    if (ci == cCurrent && sci == scCurrent) return;
    tryFetchChannel(ci, sci, region);
});
channelInput.addEventListener("change", () => {
    maxSubChannelSpan.innerText = 15;
})

updateContainer();