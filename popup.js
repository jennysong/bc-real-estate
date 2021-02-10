$(function() {

    var address, BCAGetByAddress, assessmentLink,
        assessmentAddress, totalAssessment, landAssessment, buildingAssessment

    chrome.storage.sync.get(['redfin'], function(result) {
        address = result['redfin'].address
        $('#address').text(address)
        
        BCAGetByAddress = 'https://www.bcassessment.ca/Property/Search/GetByAddress?addr=' + encodeURIComponent(address);
        fetch(BCAGetByAddress)
            .then(response => response.json())
            .then(data => {
                assessmentLink = 'https://www.bcassessment.ca//Property/Info/' + data[0].value
                return fetch(assessmentLink) 
            })
            .then(response => response.text())
            .then(data => {
                var parser = new DOMParser()
                var htmldoc = parser.parseFromString(data, 'text/html')
                if (htmldoc.getElementById('usage-validation-region')) {
                    window.open('https://www.bcassessment.ca//Property/Info/' + obj.homeId)
                    return
                }
                if (htmldoc) {
                    console.log(htmldoc)
                    assessmentAddress = htmldoc.getElementById('mainaddresstitle').textContent
                    totalAssessment = htmldoc.getElementById('lblTotalAssessedValue').textContent
                    if (htmldoc.getElementById('lblTotalAssessedLand')) {
                        landAssessment = htmldoc.getElementById('lblTotalAssessedLand').textContent    
                    }
                    if (htmldoc.getElementById('lblTotalAssessedBuilding')) {
                        buildingAssessment = htmldoc.getElementById('lblTotalAssessedBuilding').textContent  
                    }
                    $('#address').text(assessmentAddress)
                    $('#totalAssessment').text(totalAssessment)
                    $('#landAssessment').text(landAssessment)
                    $('#buildingAssessment').text(buildingAssessment)
                    $('#assessmentLink').click(function() {
                        chrome.tabs.create({url: assessmentLink})
                    })

                    // chrome.storage.sync.set({'bcAssessment': {
                    //     assessmentAddress: assessmentAddress,
                    //     totalAssessment: totalAssessment,
                    //     landAssessment: landAssessment,
                    //     buildingAssessment: buildingAssessment,
                    //     assessmentLink: assessmentLink
                    // }})
                }
            })
    })

            
        


    // chrome.storage.sync.get(['bcAssessment', 'redfin-clean'], function(result) {
    //     if ('bcAssessment' in result) {
    //         $('#address').text(result['bcAssessment'].assessmentAddress)
    //         $('#totalAssessment').text(result['bcAssessment'].totalAssessment)
    //         $('#landAssessment').text(result['bcAssessment'].landAssessment)
    //         $('#buildingAssessment').text(result['bcAssessment'].buildingAssessment)
    //         $('#assessmentLink').click(function() {
    //             chrome.tabs.create({url: result['bcAssessment'].assessmentLink})
    //         })
    //     }
    //     if ('redfin-clean' in result) {
    //         $('#removeMortgage').prop('checked', result['redfin-clean'].removeMortgage)
    //     }
    // })

    // $('#removeMortgage').click(function() {
    //     chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    //         chrome.tabs.sendMessage(tabs[0].id, {type:'removeMortgage', value: $('#removeMortgage')[0].checked});
    //     });  
    // })


// var extractAssessInfo = (obj) => {
//     var parser = new DOMParser()
//     var htmldoc = parser.parseFromString(obj.doc, 'text/html')
//     var assessmentLink = obj.assessmentLink

//     if (htmldoc.getElementById('usage-validation-region')) {
//         window.open('https://www.bcassessment.ca//Property/Info/' + obj.homeId)
//         return
//     }
//     if (htmldoc) {
//         assessmentAddress = htmldoc.getElementById('mainaddresstitle').textContent
//         totalAssessment = htmldoc.getElementById('lblTotalAssessedValue').textContent
//         landAssessment = htmldoc.getElementById('lblTotalAssessedLand').textContent
//         buildingAssessment = htmldoc.getElementById('lblTotalAssessedBuilding').textContent
//         chrome.storage.sync.set({'bcAssessment': {
//             assessmentAddress: assessmentAddress,
//             totalAssessment: totalAssessment,
//             landAssessment: landAssessment,
//             buildingAssessment: buildingAssessment,
//             assessmentLink: assessmentLink
//         }})
//         createAssessInfo()
//     }
    
})
