/*
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

// --------------------------------------------------
// Vars
// --------------------------------------------------

const BASE_URL = "https://publisher.assetstore.unity3d.com";
const SALES_URL = BASE_URL + "/sales.html";
const PUBLISHER_OVERVIEW_URL = BASE_URL + "/api/publisher/overview.json";

const ALARM = "refresh";

var pollInterval = 30;  // minutes

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
// Notifications
// --------------------------------------------------

function playNotificationSound() {
    var sound = new Audio('audio/coin.mp3');
    sound.play();
}

function showRevenueNotification(revenue) {
    var opt = {
        type: "basic",
        title: "Asset Store Checker",
        message: "+ " + revenue.toString() + "$",
        iconUrl: "icon.128.png"
    };
    chrome.notifications.create(opt);
    playNotificationSound();
}

// --------------------------------------------------
// Storage
// --------------------------------------------------

function checkRevenueDiff(revenue, callback) {
    chrome.storage.local.get(['revenue'], function (old) {
        var diff = revenue - old.revenue;
        if (diff > 0) {
            callback(diff);
            chrome.storage.local.set({'revenue': revenue});
        }
    });
}

// --------------------------------------------------
// HTTP Requests
// --------------------------------------------------

function getCurrentPeriodUrl(id) {
    return BASE_URL + "/api/publisher-info/months/" + id + ".json";
}

function getCurrentRevenueUrl(id, period) {
    return BASE_URL + "/api/publisher-info/sales/"+ id + "/" + period + ".json";
}

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
                    var revenue= 0.0;
                    for(var i in arr) {
                        revenue += parseFloat(arr[i][5].replace(/\$|,/g, ''));
                    }
                    revenue = Math.round(revenue * 0.7);
                    showRevenueBadge(revenue);
                    checkRevenueDiff(revenue, showRevenueNotification);
                }, chainError);
        }, chainError);
    }, chainError);
}

function chainError(err) {
    showErrorBadge();
    return Promise.reject(err);
}

// --------------------------------------------------
// Alarms
// --------------------------------------------------

function scheduleRefreshAlarm() {
    chrome.alarms.clear(ALARM);
    chrome.alarms.create(ALARM, {periodInMinutes: pollInterval});
}

// --------------------------------------------------
// Actions
// --------------------------------------------------

chrome.alarms.onAlarm.addListener(function(alarm) {
    getCurrentRevenue();
});

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.create({ url: SALES_URL });
    scheduleRefreshAlarm();
    getCurrentRevenue();
});

// --------------------------------------------------
// Init
// --------------------------------------------------

function onInit() {
    scheduleRefreshAlarm();
    getCurrentRevenue();
}

// --------------------------------------------------
// Main
// --------------------------------------------------

onInit();