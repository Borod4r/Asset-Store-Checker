// --------------------------------------------------
// Vars
// --------------------------------------------------

const BASE_URL = "https://publisher.assetstore.unity3d.com";
const PUBLISHER_OVERVIEW_URL = BASE_URL + "/api/publisher/overview.json";;

var pollInterval = 30;  // minutes

// --------------------------------------------------
// Init
// --------------------------------------------------

function onInit() {
    chrome.alarms.create('refresh', {periodInMinutes: pollInterval});
    getCurrentRevenue();
}

// --------------------------------------------------
// Actions
// --------------------------------------------------

// chrome.runtime.onInstalled.addListener(onInit);

chrome.alarms.onAlarm.addListener(function(alarm) {
    getCurrentRevenue();
});

chrome.browserAction.onClicked.addListener(function(tab) {
    getCurrentRevenue();
});

// --------------------------------------------------
// URLs
// --------------------------------------------------

function getCurrentPeriodUrl(id) {
    return BASE_URL + "/api/publisher-info/months/" + id + ".json";
}

function getCurrentRevenueUrl(id, period) {
    return BASE_URL + "/api/publisher-info/sales/"+ id + "/" + period + ".json";
}

// --------------------------------------------------
// HTTP Requests
// --------------------------------------------------

function get(url) {
    return new Promise(function(resolve, reject) {
        const xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function() {
            if (xhr.readyState !== 4) return;
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.responseText);
            } else {
                reject(xhr.statusText);
                showErrorBadge();
            }
        };

        xhr.open('GET', url, true);
        xhr.send();
    });
}

function getPublisherId() {
    var id = get(PUBLISHER_OVERVIEW_URL)
        .then(JSON.parse)
        .then(function (result) {
            return result.overview.id;
        });

    return id;
}

function getCurrentPeriod(id) {

    var period = get(getCurrentPeriodUrl(id))
        .then(JSON.parse)
        .then(function (result) {
            return result.periods[0].value;
        });

    return period;
}

function getCurrentRevenue() {
    showLoadingBadge();
    getPublisherId().then(function(id) {
        getCurrentPeriod(id).then(function(period) {
            get(getCurrentRevenueUrl(id, period))
                .then(JSON.parse)
                .then(function (result) {
                        var arr = result.aaData;
                        var total= 0.0;
                        for(var i in arr) {
                            total += parseFloat(arr[i][5].replace(/\$|,/g, ''));
                        }
                        total = Math.round(total * 0.7);
                        showRevenueBadge(total);
                }, chainError);
        }, chainError);
    }, chainError);
}

function chainError(err) {
    showErrorBadge();
    return Promise.reject(err);
}

// --------------------------------------------------
// Visual
// --------------------------------------------------

function showLoadingBadge() {
    chrome.browserAction.setBadgeBackgroundColor({color:[125,125,125,255]});
    chrome.browserAction.setBadgeText({ text: ". . ." } );
}

function showRevenueBadge(revenue) {
    chrome.browserAction.setBadgeBackgroundColor({color:[0,125,100,255]});
    chrome.browserAction.setBadgeText({ text: revenue.toString() + "$" } );
}

function showErrorBadge() {
	chrome.browserAction.setBadgeBackgroundColor({color:[255,0,0,255]});
    chrome.browserAction.setBadgeText({ text: "ERR" } );
}

// --------------------------------------------------
// Main
// --------------------------------------------------

onInit();