$(function() {
    let collectDataFromBCADoc = (doc, map) => {
        let output = {}
        if (doc) {
            Object.keys(map).forEach(key => {
                switch(typeof(map[key])) {
                    case "string":
                        let targetElement = doc.getElementById(map[key])
                        if (targetElement)
                            output[key] = targetElement.textContent
                        else {
                            console.warn(`cannot find element by id: ${map[key]}`)
                            output[key] = 'Unknown'   
                        }
                        break;
                    case "object":
                        output[key] = collectDataFromBCADoc(doc, map[key])
                        break;
                    default:
                        console.warn(`unexpected type: ${typeof(map[key])}`)
                }
            })
        }
        return output
    }
    
    let propertyIdMap = {
        address: "mainaddresstitle",
        latest: {
            totalValue: "lblTotalAssessedValue",
            landValue: "lblTotalAssessedLand",
            buildingValue: "lblTotalAssessedBuilding"
        },
        previous: {
            totalValue: "lblPreviousAssessedValue",
            landValue: "lblPreviousAssessedLand",
            buildingValue: "lblPreviousAssessedBuilding"
        }
    }
    
    var unitAddress, BCAGetByAddress, assessmentLink

    chrome.storage.sync.get(['redfin'], function(result) {
        unitAddress = result['redfin'].address
        $('#address').text(unitAddress)
        
        BCAGetByAddress = 'https://www.bcassessment.ca/Property/Search/GetByAddress?addr=' + encodeURIComponent(unitAddress);
        fetch(BCAGetByAddress)
            .then(response => response.json())
            .then(data => {
                assessmentLink = 'https://www.bcassessment.ca//Property/Info/' + data[0].value
                return fetch(assessmentLink) 
            })
            .then(response => response.text())
            .then(data => {
                var parser = new DOMParser()
                var bcaDoc = parser.parseFromString(data, 'text/html')
                if (bcaDoc.getElementById('usage-validation-region')) {
                    window.open('https://www.bcassessment.ca//Property/Info/' + obj.homeId)
                    return
                }
                
                let { address, latest, previous } = collectDataFromBCADoc(bcaDoc, propertyIdMap)

                $('#address').text(address)
                $('.latest.total.value').text(latest.totalValue)
                $('.latest.land.value').text(latest.landValue)
                $('.latest.building.value').text(latest.buildingValue)
                $('.previous.total.value').text(previous.totalValue)
                $('.previous.land.value').text(previous.landValue)
                $('.previous.building.value').text(previous.buildingValue)
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
