// --------------------------------------------------
// URLs
// --------------------------------------------------

function getBaseUrl() {
  return "https://publisher.assetstore.unity3d.com";
}

function getPublisherOverviewUrl() {
    return getBaseUrl() + "/api/publisher/overview.json";
}

function getCurrentPeriodUrl(id) {
    return getBaseUrl() + "/api/publisher-info/months/" + id + ".json";
}

function getCurrentRevenueUrl(id, period) {
    return getBaseUrl() + "/api/publisher-info/sales/"+ id + "/" + period + ".json";
}

// --------------------------------------------------
// HTTP Requests
// --------------------------------------------------

function getPublisherId() {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", getPublisherOverviewUrl(), true);
	xhr.onreadystatechange = function() {
	  if (xhr.readyState == 4) {
		var resp = JSON.parse(xhr.responseText);
		getCurrentPeriod(resp.overview.id)
	  }
	};
	xhr.send();
}

function getCurrentPeriod(id) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", getCurrentPeriodUrl(id), true);
	xhr.onreadystatechange = function() {
	  if (xhr.readyState == 4) {
		var resp = JSON.parse(xhr.responseText);
		getCurrentRevenue(id, resp.periods[0].value);
	  }
	};
	xhr.send();
}

function getCurrentRevenue(id, period) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", getCurrentRevenueUrl(id, period), true);
	xhr.onreadystatechange = function() {
	  if (xhr.readyState == 4) {
		var resp = JSON.parse(xhr.responseText);
		var arr = resp.aaData;
		var total= 0.0;
		for(var i in arr) {
			total += parseFloat(arr[i][5].replace(/\$|,/g, ''));
		}
		
		total *= 0.7;
		chrome.browserAction.setBadgeText({ text: total.toString() + "$" } );
	  }
	};
	xhr.send();
}

// --------------------------------------------------
// Actions
// --------------------------------------------------

chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.browserAction.setBadgeText({ text: "..." } );
  getPublisherId();
});