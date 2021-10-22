function getSettings(){
    chrome.storage.sync.get("BinUpdateInterval", ({ BinUpdateInterval }) => {
        document.getElementById('BinanceUpdate').value = BinUpdateInterval;
    });
    chrome.storage.sync.get("CbrUpdateInterval", ({ CbrUpdateInterval }) => {
        document.getElementById('CbrUpdate').value = CbrUpdateInterval;
    });
    chrome.storage.sync.get("BinUpdateTime", ({ BinUpdateTime }) => {
        document.getElementById('BinTime').innerText = BinUpdateTime;
    });
    chrome.storage.sync.get("CBRUpdateTime", ({ CBRUpdateTime }) => {
        document.getElementById('CbrTime').innerText = CBRUpdateTime;
    });
    chrome.storage.sync.get("ApplicationStatus", ({ ApplicationStatus }) => {
        if(ApplicationStatus == "Start"){
            document.getElementById('AppStatus').innerText = "Расширение Активно";
        }
        else{
            document.getElementById('AppStatus').innerText = "Расширение Остановлено";
        }   
    });
};

document.getElementById("RunEx").addEventListener("click", function(){ 
    chrome.runtime.sendMessage("Start", function(response){
        chrome.storage.sync.set({ ApplicationStatus: "Start" });
        console.log(response);
        getSettings();
    });
});

document.getElementById("StopEx").addEventListener("click", function(){
    chrome.runtime.sendMessage("Stop", function(response){
        chrome.storage.sync.set({ ApplicationStatus: "Stop" });
        console.log(response);
        getSettings();
    });   
});

document.getElementById("saveUpdateValues").addEventListener("click", function(){
    let bin = parseFloat(document.getElementById("BinanceUpdate").value.replace(",", "."));
    let cbr = parseFloat(document.getElementById("CbrUpdate").value.replace(",", "."));
    chrome.storage.sync.set({ BinUpdateInterval: bin });
    chrome.storage.sync.set({ CbrUpdateInterval: cbr });
    chrome.runtime.sendMessage("Stop", function(response){
        chrome.storage.sync.set({ ApplicationStatus: "Stop" });
        console.log(response);
        getSettings();
    }); 
});

getSettings();