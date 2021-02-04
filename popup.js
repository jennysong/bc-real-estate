$(function() {
    chrome.storage.sync.get(['redfin'], function(result) {
        if ('redfin' in result) {
            $('#totalAssessment').text(result['redfin'].totalAssessment)
            $('#landAssessment').text(result['redfin'].landAssessment)
            $('#buildingAssessment').text(result['redfin'].buildingAssessment)
            $('#assessmentLink').click(function() {
                chrome.tabs.create({url: result['redfin'].assessmentLink});
            })
        }
    })
})