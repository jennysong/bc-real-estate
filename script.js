var totalAssessment, landAssessment, buildingAssessment
var address = document.getElementsByClassName("street-address")[0].innerHTML;

chrome.runtime.sendMessage(
    {contentScriptQuery: "getBCAssessment", address: address},
    (response) => extractAssessInfo(response)
);

var extractAssessInfo = (obj) => {
    var parser = new DOMParser();
	var htmldoc = parser.parseFromString(obj.doc, 'text/html');

    if (htmldoc.getElementById('usage-validation-region')) {
        window.open('https://www.bcassessment.ca//Property/Info/' + obj.homeId)
        return;
    }
    if (htmldoc) {
        totalAssessment = htmldoc.getElementById('lblTotalAssessedValue').textContent
        landAssessment = htmldoc.getElementById('lblTotalAssessedLand').textContent
        buildingAssessment = htmldoc.getElementById('lblTotalAssessedBuilding').textContent
        console.log(totalAssessment)
        console.log(landAssessment)
        console.log(buildingAssessment)
        createAssessInfo()
    }
    
}


var createAssessInfo = () => {
    // Total 
    var totalAssess = document.createElement("div");
    var totalAssessTitleSpan = document.createElement("span");
    var totalAssessTitle = document.createTextNode("Total Assessment");
    var totalAssessPriceSpan = document.createElement("span");
    var totalAssessPrice = document.createTextNode(totalAssessment);   
    totalAssessTitleSpan.appendChild(totalAssessTitle);
    totalAssessPriceSpan.appendChild(totalAssessPrice);
    totalAssess.appendChild(totalAssessTitleSpan);
    totalAssess.appendChild(totalAssessPriceSpan);
    totalAssess.classList.add("keyDetail");
    totalAssess.classList.add("font-weight-roman");
    totalAssess.classList.add("font-size-base");
    totalAssessTitleSpan.classList.add("header");
    totalAssessTitleSpan.classList.add("font-color-gray-light");
    totalAssessTitleSpan.classList.add("inline-block");
    totalAssessPriceSpan.classList.add("content");
    totalAssessPriceSpan.classList.add("text-right");
    // Land
    var landAssess = document.createElement("div");
    var landAssessTitleSpan = document.createElement("span");
    var landAssessTitle = document.createTextNode("Land Assessment");
    var landAssessPriceSpan = document.createElement("span");
    var landAssessPrice = document.createTextNode(landAssessment);   
    landAssessTitleSpan.appendChild(landAssessTitle);
    landAssessPriceSpan.appendChild(landAssessPrice);
    landAssess.appendChild(landAssessTitleSpan);
    landAssess.appendChild(landAssessPriceSpan);
    landAssess.classList.add("keyDetail");
    landAssess.classList.add("font-weight-roman");
    landAssess.classList.add("font-size-base");
    landAssessTitleSpan.classList.add("header");
    landAssessTitleSpan.classList.add("font-color-gray-light");
    landAssessTitleSpan.classList.add("inline-block");
    landAssessPriceSpan.classList.add("content");
    landAssessPriceSpan.classList.add("text-right");
    // Building
    var buildingAssess = document.createElement("div");
    var buildingAssessTitleSpan = document.createElement("span");
    var buildingAssessTitle = document.createTextNode("Building Assessment");
    var buildingAssessPriceSpan = document.createElement("span");
    var buildingAssessPrice = document.createTextNode(buildingAssessment);   
    buildingAssessTitleSpan.appendChild(buildingAssessTitle);
    buildingAssessPriceSpan.appendChild(buildingAssessPrice);
    buildingAssess.appendChild(buildingAssessTitleSpan);
    buildingAssess.appendChild(buildingAssessPriceSpan);
    buildingAssess.classList.add("keyDetail");
    buildingAssess.classList.add("font-weight-roman");
    buildingAssess.classList.add("font-size-base");
    buildingAssessTitleSpan.classList.add("header");
    buildingAssessTitleSpan.classList.add("font-color-gray-light");
    buildingAssessTitleSpan.classList.add("inline-block");
    buildingAssessPriceSpan.classList.add("content");
    buildingAssessPriceSpan.classList.add("text-right");
    // Append
    var parentNode = document.getElementsByClassName("keyDetailsList")[0];
    parentNode.appendChild(totalAssess);
    parentNode.appendChild(landAssess);
    parentNode.appendChild(buildingAssess);
}


// https://www.bcassessment.ca/Property/Search/GetByAddress?addr=319%20Prior%20St
// https://www.bcassessment.ca//Property/Info/QTAwMDAwMU1OQw==




