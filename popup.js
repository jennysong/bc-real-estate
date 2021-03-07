$(function() {
    const loadPopup = () => {
        let unitAddress, assessment, BCAGetByAddress, assessmentLink, cachedTime, currentTime, shouldExpireCache
        chrome.storage.sync.get(['bcre-address', 'bcre-price', 'bcAssessment', 'bcACacheDate'], function(result) {
            unitAddress = result['bcre-address']
            if (!unitAddress) {
                return
            } 
            // todo - add this price in the popup.
            alert(result['bcre-price'])

            cachedTime = result['bcACacheDate']
            currentTime = new Date().getTime()
            shouldExpireCache = cachedTime && cachedTime+604800000 < currentTime
            if (!shouldExpireCache && result['bcAssessment'] && Array.isArray(result['bcAssessment'])) {
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
                        const storedAssessment = shouldExpireCache? []: result['bcAssessment'] || []
                        chrome.storage.sync.set({
                            'bcAssessment': storedAssessment.concat(assessment),
                            'bcACacheDate': shouldExpireCache? currentTime : cachedTime || currentTime
                        })
                        insertInfo(assessment)
                    })             
            }
        })
    }

    const collectDataFromBCADoc = (doc, map) => {
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
                            output[key] = null
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
    
    const propertyIdMap = {
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
        },
        extraInformation: {
            yearBuilt: "lblYearBuilt",
            description: "lblDescription",
            bedrooms: "lblBedrooms",
            bathrooms: "lblBathRooms",
            carports: "lblCarPorts",
            garages: "lblGarages",
            landSize: "lblLandSize",
            firstFloorArea: "lblFirstFloorArea",
            secondFloorArea: "lblSecondFloorArea",
            basementFinishArea: "lblBasementFinishArea",
            strataArea: "lblStrataTotalArea",
            buildingStoreys: "lblStoriesBuilding",
            numberOfApartmentUnits: "lblNumberUnitApartment",
        }
    }
    
    const extraInformationLabels = {
        address: "Address",
        yearBuilt: "Year Built",
        description: "Description",
        landSize: "Land Size",
        strataArea: "Strata sqft",
        numberOfApartmentUnits: "No.of Units",
        firstFloorArea: "1st Floor sqft",
        secondFloorArea: "2nd Floor sqft",
        basementFinishArea: "Basement sqft",
        buildingStoreys: "Storeys",
        bedrooms: "Bedrooms",
        bathrooms: "Bathrooms",
        carports: "Carports",
        garages: "Garages",
    }

    const convertToInt = (string) => {
        return parseInt(string.replace(/[^0-9.]/g, ''))
    }
    
    const getChanges = (current, previous) => {
        if (!current || !previous) {
            return null
        }
        
        let style, prefix
        const value = convertToInt(current) / convertToInt(previous) * 100 - 100
        
        if (value === 0) {
            return null
        }
        
        if (value > 0) {
            style = 'positive',
            prefix = '+'
        } else if (value < 0) {
            style = 'negative'
            prefix = ''
        } 
        return { style, value: `${prefix}${value.toFixed(1)}%` }
    }
    

    const insertInfo = (assessment) => {
        if (assessment) {
            if (!assessment.address) {
                //TODO: show not found here. 
                alert('not found')
            }
            $('body').removeClass('loading')
            
            let hasDetailedValuation = false
            const { address, latest, previous, extraInformation, origAddress, link } = assessment
            const totalChanges = getChanges(latest.totalValue, previous.totalValue)
            const landChanges = getChanges(latest.landValue, previous.landValue)
            const buildingChanges = getChanges(latest.buildingValue, previous.buildingValue)
            
            $('.total.valuation .value').text(latest.totalValue)
            $('.total.valuation .previous-value .amount').text(previous.totalValue)
            
            if (totalChanges) {
                $('.total.valuation .changes')
                    .addClass(totalChanges.style)
                    .text(totalChanges.value)
            }
            
            if(latest.landValue) {
                $('.land.valuation .value').text(latest.landValue)    
                $('.land.valuation .previous-value .amount').text(previous.landValue)
                hasDetailedValuation = true
                
                if (landChanges) {
                    $('.land.valuation .changes')
                        .addClass(landChanges.style)
                        .text(landChanges.value)
                }
            } else {
                $('.land.valuation').addClass('unknown')
            }
            
            if(latest.buildingValue) {
                $('.building.valuation .value').text(latest.buildingValue)
                $('.building.valuation .previous-value .amount').text(previous.buildingValue)
                hasDetailedValuation = true
                
                if (buildingChanges) {
                    $('.building.valuation .changes')
                        .addClass(buildingChanges.style)
                        .text(buildingChanges.value)
                }
            } else {
                $('.building.valuation').addClass('unknown')
            }
            
            if (hasDetailedValuation) {
                $('.valuations').addClass('has-detailed-valuation')
            }
            
            if(address) {
                $('.original-address.value').text(address)
            }

            $(".home-detail").remove()
            const $extraItemList = $(".extra-item-list")
            _(extraInformationLabels).each((label, key) => {
                let extraValue = s(extraInformation[key]).trim().value()
                if (extraValue) {
                    if (label=='Land Size') {
                        const aLandInfo = extraValue.match(new RegExp(/(\d+) x (\d+)(.+)/)) 
                        if (aLandInfo) {
                            extraValue += ` (${aLandInfo[1]* aLandInfo[2] + aLandInfo[3]})`
                        }
                    }
                    const $extraItem = $("<div class='extra-item home-detail'>")
                    $extraItem.append($("<div class='label'>").text(label))
                    $extraItem.append($("<div class='value'>").text(extraValue))
                    $extraItemList.append($extraItem)
                }
            })
            
            $('.view-on-bc-assessment.btn').click(function() {
                chrome.tabs.create({url: link})
            })
        }
    }
    
    $('.refresh-storage').click(function() {
        chrome.storage.sync.set({
            'bcAssessment': [],
            'bcACacheDate': new Date().getTime()
        }, () => {
            loadPopup()
        })
    })

    loadPopup()
})
