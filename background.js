// var timer = new Date().getTime()
// chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
//     if (changeInfo.status != 'complete' || tab.status != 'complete' || tab.url == undefined || lessThanOneMin()) {
//         return;
//     } 
//     timer = new Date().getTime();
//     setTimeout(() => {
//         var REDFIN_REGEX = new RegExp(/https:\/\/www.redfin.ca\/bc\/.+\/.+\/home\/.+/);
//         if (tab.url.match(REDFIN_REGEX)) {     
//             chrome.tabs.executeScript({
//                 // file: 'script.js'
//                 code: 'alert("hi")'
//             });
//         }
//     }, 500);
// }); 
// var lessThanOneMin = () => {
//     return new Date().getTime() < timer + 1000
// }

var REDFIN_REGEX = new RegExp(/https:\/\/www.redfin.ca\/bc\/.+\/.+\/home\/.+/);

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.title) {
        openScript(tab.url, changeInfo.title)
    }
})
 

chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function(tab){
        openScript(tab.url, tab.title)
    })
})


openScript = (url, address) => {
    // Redfin
    if (url.match(REDFIN_REGEX)) { 
        var a = address.split(', BC')[0]
        var i = a.indexOf('#')
        if (i > 0) {
            var j = a.indexOf(',') 
            a = a.substring(i+1,j) + '-' + a.substring(0,i-1) + a.substring(j+1)
        }
        chrome.storage.sync.set({'redfin': {address: a}})
    }
    // Todo: Zolo
}


chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.contentScriptQuery == "getBCAssessment") {
            var homeId, assessmentLink;
            var BCAGetByAddress = 'https://www.bcassessment.ca/Property/Search/GetByAddress?addr=' + encodeURIComponent(request.address);
            fetch(BCAGetByAddress)
                .then(response => response.json())
                .then(data => {
                    homeId = data[0].value
                    assessmentLink = 'https://www.bcassessment.ca//Property/Info/' + homeId
                    return fetch(assessmentLink)
                })
                .then(response => response.text())
                .then(assessInfo => sendResponse({doc: assessInfo, homeId: homeId, assessmentLink: assessmentLink}))
            return true;
        }
    }
);