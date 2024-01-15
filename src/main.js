// ELEMENT DEFINITIONS

//images
let displayImage = document.getElementById("display");
let controlImage = document.getElementById("controlImage");
//button navigation
let homeButton = document.getElementById("homeChannel");
let channelBackButton = document.getElementById("channelBack");
let subchannelBackButton = document.getElementById("subchannelBack");
let channelForwardButton = document.getElementById("channelForward");
let subchannelForwardButton = document.getElementById("subchannelForward");
//region selector
let regionSelector = document.getElementById("regionSelector");

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
    //channelInput.value = cCurrent;
    //subChannelInput.value = scCurrent;
    //maxSubChannelSpan.value = scCurrentMax;
}

//find next/previous valid channel depending on step
const surfChannels = async (step) => {
    region = regionSelector.value;
    let cNext = cCurrent + step;
    while (cNext > 100 && cNext < 899) {
        console.log("stepping");
        if (!(await exists(cNext, 1, region))) {
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

const resetChannel = () => {
    region = regionSelector.value;
    cCurrent = region == "Nazionale" ? 100 : 300;
    scCurrent = 1;
    updateContainer();
}


// NAVIGATION LOGIC

homeButton.addEventListener("click", resetChannel);
channelForwardButton.addEventListener("click", () => surfChannels(1));
subchannelForwardButton.addEventListener("click", () => surfSubChannels(1));
channelBackButton.addEventListener("click", () => surfChannels(-1));
subchannelBackButton.addEventListener("click", () => surfSubChannels(-1));

regionSelector.addEventListener("change", resetChannel);
updateContainer();