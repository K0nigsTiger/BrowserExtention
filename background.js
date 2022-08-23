let green = '#3aa757', red = "#e8453c";
let CryptoPairs = [
  "USDTRUB", "BTCUSDT", "ETHUSDT",
  "LTCUSDT", "XRPUSDT", "XMRUSDT",
  "DOGEUSDT", "DASHUSDT", "ZECUSDT",
  "USDCUSDT", "TUSDUSDT", "PAXUSDT", 
  "DAIUSDT", "BUSDUSDT", "XEMUSDT",
  "NEOUSDT", "ADAUSDT", "XLMUSDT",
  "TRXUSDT", "BNBUSDT", "BTTUSDT",
  "ATOMUSDT", "LINKUSDT", "ETCUSDT"];
let fiat = ["USD", "EUR"];
let url, serviceName, usdtRubPrice, binCourses = [], cbrCourses = [];

const getData = async(url, serviceName) => {
  const response = await fetch(url)
  const json = await response.json()
  if(serviceName === "Binance"){
    CryptoPairs.forEach(pair => {
      for(var i = 0; i < json.length; i++){
        if(json[i].symbol === pair){
          if(pair === "USDTRUB"){
            usdtRubPrice = parseFloat(json[i].price)
            binCourses.push({ name: "USDT", price: usdtRubPrice }) // сохраняем курс usdt в рублях             
          }
          else{
            binCourses.push({ name: pair.replace("USDT", ""), price: parseFloat(json[i].price) * usdtRubPrice}) // приводим курс к рублю и сохраняем
          }
          break;
        }
      }
    })
    chrome.storage.local.set({ BinCourses: binCourses })
    chrome.storage.sync.set({ BinUpdateTime: new Date().toLocaleTimeString() });
  }else if(serviceName === "CBR"){
    fiat.forEach(elem => {
      cbrCourses.push({name: elem, price: json["Valute"][elem].Value }) // сохраняем курс в рублях по данным цб
    })
    cbrCourses.push({name: "RUB", price: 1 })
    chrome.storage.local.set({CbrCourses: cbrCourses})
    chrome.storage.sync.set({ CBRUpdateTime: new Date().toLocaleTimeString() });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ 
    BinUpdateInterval: 0.5,
    CbrUpdateInterval: 1,
    ApplicationStatus: "Stop",
    CBRUpdateTime: "",
    BinUpdateTime: ""
   });
});

chrome.runtime.onMessage.addListener(
  function(message){
    chrome.storage.sync.get("ApplicationStatus", ({ ApplicationStatus }) => {
      if(message == "Start" && ApplicationStatus == "Stop"){
        chrome.storage.sync.get("BinUpdateInterval", ({ BinUpdateInterval }) => {
          chrome.alarms.create("BinUpdate", { delayInMinutes: 0, periodInMinutes: BinUpdateInterval });
        });
        chrome.storage.sync.get("CbrUpdateInterval", ({ CbrUpdateInterval }) => {
          chrome.alarms.create("CbrUpdate", { delayInMinutes: 0, periodInMinutes: CbrUpdateInterval });
        });
        console.log("Start");
      }
      else if(message == "Stop" && ApplicationStatus == "Start"){     
        chrome.alarms.clear("BinUpdate");
        chrome.alarms.clear("CbrUpdate");
        console.log("Stop");    
      }
    })
  }
);

chrome.alarms.onAlarm.addListener(function(alarm){
  if(alarm.name == "BinUpdate"){   
    url = 'https://api.binance.com/api/v3/ticker/price'
    serviceName = 'Binance'
  }
  else if(alarm.name == "CbrUpdate"){
    url = 'https://www.cbr-xml-daily.ru/daily_json.js'
    serviceName = 'CBR'
  }
  getData(url, serviceName)
    .then(console.log(serviceName + ' %cUpdate Successful', `color: ${green}`))
    .catch(error => console.error(error))
});

chrome.tabs.onUpdated.addListener(
  function(tabId, {}, tab){
    if(tab.url.startsWith("https://www.bestchange")){
      chrome.storage.sync.get("ApplicationStatus", ({ ApplicationStatus }) => {
        if(ApplicationStatus == "Start" && tab.url.toString().endsWith(".html") && tab.status == "complete"){
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['injection.js'],
          });            
        }            
      })
    }
  }
);