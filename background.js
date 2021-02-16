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