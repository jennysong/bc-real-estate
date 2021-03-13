$(function() {
    const $body = $('body')
    
    const loadPopup = () => {
        $body.attr('class', '')
        $body.addClass('show-loading')
        let unitAddress, assessment, BCAGetByAddress, assessmentLink, cachedTime, currentTime, shouldExpireCache, fetchedFromBCA
        chrome.storage.sync.get(['bcre-address', 'bcre-price', 'bcAssessment', 'bcACacheDate'], function(result) {
            unitAddress = result['bcre-address']
            if (!unitAddress) {
                return
            } 
            const listingPrice = result['bcre-price']

            cachedTime = result['bcACacheDate']
            currentTime = new Date().getTime()
            shouldExpireCache = cachedTime && cachedTime+604800000 < currentTime
            
            if (!shouldExpireCache && result['bcAssessment'] && Array.isArray(result['bcAssessment'])) {
                assessment = result['bcAssessment'].find(assess => assess.origAddress == unitAddress)
                if (assessment) {
                    insertInfo(assessment, { listingPrice })
                }
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
                        fetchedFromBCA = true
                        insertInfo(assessment, { listingPrice, fetchedFromBCA })
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
        // bedrooms: "Bedrooms",
        // bathrooms: "Bathrooms",
        // carports: "Carports",
        // garages: "Garages",
    }

    const convertToInt = (string) => {
        return parseInt(string.replace(/[^0-9.]/g, ''))
    }
    
    const getDifference = (current, previous) => {
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
        return { style, value, visibleValue: `${prefix}${value.toFixed(1)}%` }
    }
    

    const insertInfo = (assessment, { listingPrice, fetchedFromBCA }) => {
        if (assessment) {
            const { address, origAddress } = assessment
            
            $body.removeClass('show-loading')
            
            if (address) {
                renderValuationsView(assessment, { listingPrice, fetchedFromBCA })
            } else if (origAddress) {
                renderNotFoundView({ origAddress })
            } else {
                // todo: render search view
            }
        }
    }
    
    const renderNotFoundView = ({ origAddress }) => {
        $body.addClass('show-not-found-view')
        $('.search.field').val(origAddress)
        
    }
    
    const renderValuationsView = (assessment, { listingPrice, fetchedFromBCA }) => {
        const { address, latest, previous, extraInformation, origAddress, link } = assessment
        
        $body.addClass('show-valuations')
        
        let hasDetailedValuation = false
        let renderedNotSearchableView = false

        const totalDifference = getDifference(latest.totalValue, previous.totalValue)
        const landDifference = getDifference(latest.landValue, previous.landValue)
        const buildingDifference = getDifference(latest.buildingValue, previous.buildingValue)
        
        $('.total.valuation .value').text(latest.totalValue)
        $('.total.valuation .previous-value .amount').text(previous.totalValue)
        
        if (totalDifference) {
            $('.total.valuation .changes')
                .addClass(totalDifference.style)
                .text(totalDifference.visibleValue)
        }
        
        const listingComparison = getDifference(listingPrice, latest.totalValue)
        
        if (listingComparison) {
            let style
            let messageStyle
            
            switch(true) {
                case listingComparison.value > 20:
                    style = 'greedy'
                    messageStyle = 'higher'
                    break
                case listingComparison.value > 5:
                    style = 'thinking'
                    messageStyle = 'higher'
                    break
                case listingComparison.value > 0.5:
                    style = 'fair'
                    messageStyle = 'higher'
                    break
                case listingComparison.value >= 0:
                    style = 'fair'
                    messageStyle = 'equal'
                    break
                case listingComparison.value < 0:
                    style = 'fair'
                    messageStyle = 'lower'
                    break
            }
            Object.assign(listingComparison, { style, messageStyle })
            hasListingPrice = true
        }
        
        if(latest.landValue) {
            $('.land.valuation .value').text(latest.landValue)    
            $('.land.valuation .previous-value .amount').text(previous.landValue)
            hasDetailedValuation = true
            
            if (landDifference) {
                $('.land.valuation .changes')
                    .addClass(landDifference.style)
                    .text(landDifference.visibleValue)
            }
        } else {
            $('.land.valuation').addClass('unknown')
        }
        
        if(latest.buildingValue) {
            $('.building.valuation .value').text(latest.buildingValue)
            $('.building.valuation .previous-value .amount').text(previous.buildingValue)
            hasDetailedValuation = true
            
            if (buildingDifference) {
                $('.building.valuation .changes')
                    .addClass(buildingDifference.style)
                    .text(buildingDifference.visibleValue)
            }
        } else {
            $('.building.valuation').addClass('unknown')
        }
        
        if (hasDetailedValuation) {
            $body.addClass('has-detailed-valuation')
        }
        
        if (fetchedFromBCA) {
            $body.addClass('has-fetched-from-bca')
        }
        
        if (hasListingPrice) {
            const { value, visibleValue, style, messageStyle } = listingComparison
            const $listentComparison = $('.listing-comparison')
            const $difference = $listentComparison.find(`.${messageStyle}.message .difference`)
            
            $body.addClass('has-listing-price')
            
            $listentComparison
                .addClass(style)
                .addClass(messageStyle)
            
            $listentComparison
                .find('.listing-price .amount')
                .text(`$${listingPrice}`)
            
            $difference.addClass(style)
            $difference.find('.amount').text(visibleValue)
        }
        
        if(address) {
            $('.original-address.value').text(address)
        }

        $('.home-detail').remove()
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
    
    $('.open-bc-assessment').click(function() {
        chrome.tabs.create({url: 'https://www.bcassessment.ca'})
    })

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
