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
    chrome.storage.sync.set({ BinUpdateTime: new Date().toLocaleTimeString() });
  }else if(serviceName === "CBR"){
    fiat.forEach(elem => {
      cbrCourses.push({name: elem, price: json["Valute"][elem].Value }) // сохраняем курс в рублях по данным цб
    })
    cbrCourses.push({name: "RUB", price: 1 })
    chrome.storage.sync.set({ CBRUpdateTime: new Date().toLocaleTimeString() });
  }
}

function TableCheck(binCourses, cbrCourses){
  let startChecker = setInterval(function(){
    let spanCheck = document.body.querySelector('#content_table tbody span.ExtVal'); // проверка на существующее значение процента
    if(spanCheck == null){
      function getCourseBestChange(){
        let TableContent = document.body.querySelectorAll('#content_table tbody tr[onclick]'); // сбор всех строк из таблицы
        let course_array = []; // массив объектов с данными из строк таблицы
        for(let element of TableContent){
            let courseValues = element.querySelectorAll('td.bi'); // содержит значения из поля отдаете
            let exchange_info = { // заполнение свойств объекта значениями из таблицы
                key: element.getAttribute('onclick'), 
                in_name: courseValues[0].querySelector('div.fs small').innerHTML, 
                out_name: courseValues[1].querySelector('small').innerHTML,
                in: parseFloat(courseValues[0].querySelector('div.fs').innerHTML.replaceAll(" ", "")), 
                out: parseFloat(courseValues[1].innerHTML.replaceAll(" ", "")),
                percent: null
            };
            course_array.push(exchange_info);
        }         
        function getCourse(){
          let inRub, outRub;
          binCourses.forEach(value => {
            if(value["name"] == course_array[0].in_name) inRub = parseFloat(value["price"]); // получаем значение курса в рублях отдаваемой валюты           
            else if(value["name"] == course_array[0].out_name) outRub = parseFloat(value["price"]); // получаем значение курса в рублях получаемой валюты
            else{
              if(course_array[0].in_name.startsWith(value["name"])) inRub = parseFloat(value["price"]);
              if(course_array[0].out_name.startsWith(value["name"])) outRub = parseFloat(value["price"]);
            }                   
          })
          cbrCourses.forEach(value => {
            if(course_array[0].in_name == value["name"]) inRub = parseFloat(value["price"]);
            if(course_array[0].out_name == value["name"]) outRub = parseFloat(value["price"]);
          })
          return [inRub, outRub]
        }
        let [incourse, outcourse] = getCourse()
        for(let exchange of course_array){
          let ExchangeRow = document.body.querySelectorAll('#content_table tbody tr[onclick="' + exchange.key + '"] td.bi');            
          let span_percent = document.createElement('span');
          incourse > outcourse 
                    ? exchange.percent = ((exchange.out * 100 / (incourse/outcourse)) - 100).toFixed(2) + "%"
                    : exchange.percent = (100 - (exchange.in * 100 / (outcourse/incourse))).toFixed(2) + "%"  
          span_percent.innerText = exchange.percent;
          span_percent.className = "ExtVal";
          span_percent.style.cssText = exchange.percent.includes('-') ? 'color:red;' : 'color:green;';
          if(ExchangeRow[1].querySelector('span') != null){
              const e = ExchangeRow[1].querySelector('span');
              e.parentElement.removeChild(e);
          }
          ExchangeRow[1].appendChild(span_percent);
        }  
      };
      getCourseBestChange();    
    } 
  }, 500);
};

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
            function: TableCheck,
            args: [binCourses, cbrCourses],
          });            
        }            
      })
    }
  }
);

