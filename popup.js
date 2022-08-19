'use strict'
const settingsData = () => chrome.storage.sync.get(['BinUpdateInterval', 'CbrUpdateInterval', 'ApplicationStatus', 'CBRUpdateTime', 'BinUpdateTime'], (items) => getSettings(items)) // get app settings from chrome storage
function getSettings(items){ 
    Object.keys(items).forEach(key => {
        console.log(items[key])   
        key !== "ApplicationStatus"
            ? document.getElementById(key).value = items[key]
            : document.getElementById(key).innerText = getStatus(items[key])               
    })
    function getStatus(data){
        if(data === "Start") return "Расширение Активно"  
        return "Расширение Остановлено"
    }
}
function messageStartStop(message){ // Send message to Listener in background.js
    chrome.runtime.sendMessage(message, () => {
        chrome.storage.sync.set({ ApplicationStatus: message }); // Save application status
        settingsData();
    });   
}
document.getElementById("Start").addEventListener("click", () => messageStartStop("Start"))
document.getElementById("Stop").addEventListener("click", () => messageStartStop("Stop"))
document.getElementById("saveUpdateValues").addEventListener("click", function(){ 
    const getNumber = (numberInputId) => parseFloat(document.getElementById(numberInputId).value) //convert to Float by input Id
    let intervalsObj = {binance: getNumber("BinUpdateInterval"), centralBank: getNumber("CbrUpdateInterval")} // Save floats in object
    chrome.storage.sync.set({ BinUpdateInterval: intervalsObj.binance, CbrUpdateInterval: intervalsObj.centralBank })
    messageStartStop("Stop")
});
settingsData();