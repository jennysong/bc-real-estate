if (site == 'redfin') {
    priceSection = document.getElementsByClassName("price-section")[0] ||
        document.getElementsByClassName("info-block price")[0]
    priceElement = priceSection
        .getElementsByClassName("statsValue")[0]
        .firstElementChild
        .lastElementChild
    
    price = priceElement? priceElement.innerHTML : null
}

if (site == 'zolo') {
    price = document.getElementsByClassName("listing-price")[0]
        .getElementsByClassName("bold")[0]
        .firstElementChild
        .innerHTML
}

if (site == 'realtor') {
    price = document.getElementById('listingPrice').innerHTML
}

chrome.storage.sync.set({'bcre-price': price? price.replace(/" "|\$|\n/g, "") : null})