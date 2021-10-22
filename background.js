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

  function getCourseBinance(){ 
    fetch('https://api.binance.com/api/v3/ticker/price').then(function(response){
        return response.json();
    }).then((json) => {
        let binanceCourses = [];
        chrome.storage.sync.set({ BinUpdateTime: new Date().toTimeString() });
        for(let valute of CryptoPairs)
        {
          for (var i = 0; i < json.length; i++) {         
            if(json[i].symbol == valute)
            {   
                var usdtPrice;      
                if(valute == "USDTRUB"){
                  binanceCourses.push({name: "USDT", price: parseFloat(json[i].price)});
                  usdtPrice = parseFloat(json[i].price);
                }
                else{
                  binanceCourses.push({name: valute.replace("USDT", ""), price: parseFloat(json[i].price) * usdtPrice});
                }          
                break;
            }
          } 
        }
        chrome.storage.sync.set({ BinCourses: binanceCourses });
        console.log('Binance Courses %cUpdate Successful', `color: ${green}`);
    }).catch((error) => {
        console.warn('Binance Courses %cUpdate Error: ' + error, `color: ${red}`);
    });
  };

  function getCBRCourse(){
    fetch('https://www.cbr-xml-daily.ru/daily_json.js').then(function(response){
        return response.json();
    }).then((json) => {
        let cbrCourses = [];
        chrome.storage.sync.set({ CBRUpdateTime: new Date().toTimeString() });
        for(let valute of fiat){
          cbrCourses.push({name: valute, price: json["Valute"][valute].Value });
        }
        cbrCourses.push({name: "RUB", price: 1 });
        chrome.storage.sync.set({ CBRCourses: cbrCourses });
        console.log('CBR Courses %cUpdate Successful', `color: ${green}`);
    }).catch((error) => {
        console.warn('CBR Courses %cUpdate Error: ' + error, `color: ${red}`);
    });
  };

  function TableCheck(){
    let startChecker = setInterval(function(){
    let spanCheck = document.body.querySelector('#content_table tbody span.ExtVal');
        if(spanCheck == null){
            function getCourseBestChange(){
                let TableContent = document.body.querySelectorAll('#content_table tbody tr[onclick]');
                let course_array = [];
                for(let element of TableContent){
                    let courseValues = element.querySelectorAll('td.bi');
                    let exchange_info = { 
                        key: element.getAttribute('onclick'), 
                        in_name: courseValues[0].querySelector('div.fs small').innerHTML, 
                        out_name: courseValues[1].querySelector('small').innerHTML,
                        in: parseFloat(courseValues[0].querySelector('div.fs').innerHTML.replaceAll(" ", "")), 
                        out: parseFloat(courseValues[1].innerHTML.replaceAll(" ", "")),
                        percent: null
                    };
                    course_array.push(exchange_info);
                }  
                chrome.storage.sync.get("BinCourses", ({ BinCourses }) => {
                    var incourse, outcourse;
                    for(var i = 0; i < BinCourses.length; i++){
                        if(BinCourses[i].name == course_array[0].in_name){
                            incourse = parseFloat(BinCourses[i].price);
                        }
                        else if(BinCourses[i].name == course_array[0].out_name){
                            outcourse = parseFloat(BinCourses[i].price);
                        }
                        else{
                            if(course_array[0].in_name.startsWith(BinCourses[i].name)){
                                incourse = parseFloat(BinCourses[i].price);
                            }
                            if(course_array[0].out_name.startsWith(BinCourses[i].name)){
                                outcourse = parseFloat(BinCourses[i].price);
                            }
                        }
                    }
                    chrome.storage.sync.get("CBRCourses", ({ CBRCourses }) => {
                        for(var i = 0; i < CBRCourses.length; i++){
                            if(course_array[0].in_name.startsWith(CBRCourses[i].name)){
                                incourse = parseFloat(CBRCourses[i].price);
                            }
                            if(course_array[0].out_name.startsWith(CBRCourses[i].name)){
                                outcourse = parseFloat(CBRCourses[i].price);
                            }
                        }
                        //console.log(incourse, outcourse);
                        let calc_direction = incourse > outcourse ? true : false;
                        for(let exchange of course_array){     
                            let ExchangeRow = document.body.querySelectorAll('#content_table tbody tr[onclick="' + exchange.key + '"] td.bi');            
                            var span_percent = document.createElement('span');
                            if(calc_direction){
                                exchange.percent = ((exchange.out * 100 / (incourse/outcourse)) - 100).toFixed(2) + "%";
                            }
                            else{
                                exchange.percent = (100 - (exchange.in * 100 / (outcourse/incourse))).toFixed(2) + "%";
                            }    
                            span_percent.innerText = exchange.percent;
                            span_percent.className = "ExtVal";
                            span_percent.style.cssText = exchange.percent.includes('-') ? 'color:red;' : 'color:green;';
                            if(ExchangeRow[1].querySelector('span') != null){
                                const e = ExchangeRow[1].querySelector('span');
                                e.parentElement.removeChild(e);
                            }
                            ExchangeRow[1].appendChild(span_percent);
                        }
                        //console.log(course_array);      
                    });                                          
                });
            };
            getCourseBestChange();
        } 
    }, 500);
  };

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ BinUpdateInterval: 0.5 });
  chrome.storage.sync.set({ CbrUpdateInterval: 1 });
  chrome.storage.sync.set({ ApplicationStatus: "Stop" });
});

chrome.runtime.onMessage.addListener(
  function(message, sender, sendResponse){
    if(message == "Start"){
      chrome.storage.sync.get("BinUpdateInterval", ({ BinUpdateInterval }) => {
        chrome.alarms.create("BinUpdate", { delayInMinutes: 0, periodInMinutes: BinUpdateInterval });
      });
      chrome.storage.sync.get("CbrUpdateInterval", ({ CbrUpdateInterval }) => {
        chrome.alarms.create("CbrUpdate", { delayInMinutes: 0, periodInMinutes: CbrUpdateInterval });
      });
      console.log("Start");
      sendResponse("Application Started");
    }
    else if(message == "Stop"){
      chrome.alarms.clear("BinUpdate");
      chrome.alarms.clear("CbrUpdate");
      console.log("Stop");
      sendResponse("Application Stopped");
    }
  }
);

chrome.alarms.onAlarm.addListener(function(alarm){
  if(alarm.name == "BinUpdate"){
    getCourseBinance();
  }
  else if(alarm.name == "CbrUpdate"){
    getCBRCourse();
  }
});

chrome.tabs.onUpdated.addListener(
  function(tabId){
    chrome.storage.sync.get("ApplicationStatus", ({ ApplicationStatus }) => {
      if(ApplicationStatus == "Start"){
        chrome.tabs.get(tabId, function(tab){
          var url = tab.url.toString();
          if(url.startsWith("https://www.bestchange") && url.endsWith(".html")){
            if(tab.status == "complete"){
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: TableCheck,
              });
            }
          }
        });   
      }
    })
  }
);

