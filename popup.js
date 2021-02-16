$(function() {
 
    let unitAddress, assessment, BCAGetByAddress, assessmentLink

    chrome.storage.sync.get(['redfin', 'bcAssessment'], function(result) {
        unitAddress = result['redfin'].address
        
        if (!unitAddress) {
            return
        }
        if (result['bcAssessment'] && Array.isArray(result['bcAssessment'])) {
            assessment = result['bcAssessment'].find(assess => assess.origAddress == unitAddress)
            insertInfo(assessment)
        }
        if (!assessment) {
            BCAGetByAddress = 'https://www.bcassessment.ca/Property/Search/GetByAddress?addr=' + encodeURIComponent(unitAddress)
            fetch(BCAGetByAddress)
                .then(response => response.json())
                .then(data => {
                    assessmentLink = 'https://www.bcassessment.ca//Property/Info/' + data[0].value
                    return fetch(assessmentLink) 
                })
                .then(response => response.text())
                .then(data => {
                    const parser = new DOMParser()
                    const bcaDoc = parser.parseFromString(data, 'text/html')
                    if (bcaDoc.getElementById('usage-validation-region')) {
                        window.open(assessmentLink)
                        return
                    }
                    
                    assessment = {
                        ...collectDataFromBCADoc(bcaDoc, propertyIdMap),
                        origAddress: unitAddress,
                        link: assessmentLink
                    }
                    const storedAssessment = result['bcAssessment'] || []
                    chrome.storage.sync.set({'bcAssessment': storedAssessment.concat(assessment)})
                    insertInfo(assessment)
                })             
        }
    })

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

    let insertInfo = (assessment) => {
        if (assessment) {
            $('#address').text(assessment.address)
            $('.latest.total.value').text(assessment.latest.totalValue)
            $('.latest.land.value').text(assessment.latest.landValue)
            $('.latest.building.value').text(assessment.latest.buildingValue)
            $('.previous.total.value').text(assessment.previous.totalValue)
            $('.previous.land.value').text(assessment.previous.landValue)
            $('.previous.building.value').text(assessment.previous.buildingValue)
            $('#assessmentLink').click(function() {
                chrome.tabs.create({url: assessment.link})
            })
        }
    }  
})