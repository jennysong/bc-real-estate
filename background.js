var REDFIN_REGEX = new RegExp(/https:\/\/www.redfin.ca\/bc\/.+\/.+\/home\/.+/)
var REALTOR_REGEX = new RegExp(/https:\/\/www.realtor.ca\/real-estate\/.+\/.+/)
var ZOLO_REGEX = new RegExp(/https:\/\/www.zolo.ca\/.+\/.+/)

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
        chrome.storage.sync.set({'address': a})
    }
    // Realtor.ca
    if (url.match(REALTOR_REGEX)) {
        var a = address.split('For sale: ')[1].split(', British Columbia')[0]
        chrome.storage.sync.set({'address': a})
    }
    // Todo: Zolo
    if (url.match(ZOLO_REGEX)) {
        var a = address.split(' — For Sale')[0]
        chrome.storage.sync.set({'address': a})
    }
}