var timer = new Date().getTime()
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status != 'complete' || tab.status != 'complete' || tab.url == undefined || lessThanOneMin()) {
        return;
    } 
    timer = new Date().getTime();
    setTimeout(() => {
        var regex = new RegExp(/https:\/\/www.redfin.ca\/bc\/.+\/.+\/home\/.+/);
        if (tab.url.match(regex)) {     
            chrome.tabs.executeScript({
                file: 'script.js'
            });
        }
    }, 500);
}); 


chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.contentScriptQuery == "getBCAssessment") {
            var homeId;
            var BCAGetByAddress = 'https://www.bcassessment.ca/Property/Search/GetByAddress?addr=' + encodeURIComponent(request.address);
            fetch(BCAGetByAddress)
                .then(response => response.json())
                .then(data => {
                    homeId = data[0].value
                    return fetch('https://www.bcassessment.ca//Property/Info/' + homeId)
                })
                .then(response => response.text())
                .then(assessInfo => sendResponse({doc: assessInfo, homeId: homeId}))
            return true;
        }
    }
);

var lessThanOneMin = () => {
    return new Date().getTime() < timer + 1000
}