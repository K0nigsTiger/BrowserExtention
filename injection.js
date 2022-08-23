function getCourseBestChange(binCourses, cbrCourses){
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
      for(let value of binCourses){
        if(value["name"] == course_array[0].in_name) inRub = parseFloat(value["price"]); // получаем значение курса в рублях отдаваемой валюты           
        else if(value["name"] == course_array[0].out_name) outRub = parseFloat(value["price"]); // получаем значение курса в рублях получаемой валюты
        else{
          if(course_array[0].in_name.startsWith(value["name"])) inRub = parseFloat(value["price"]);
          if(course_array[0].out_name.startsWith(value["name"])) outRub = parseFloat(value["price"]);
        }
        if(inRub !== undefined && outRub !== undefined) break  
      }
      cbrCourses.forEach(value => {
        if(course_array[0].in_name.startsWith(value["name"])) inRub = parseFloat(value["price"]);
        if(course_array[0].out_name.startsWith(value["name"])) outRub = parseFloat(value["price"]);
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
      span_percent.innerText = " " + exchange.percent;
      span_percent.className = "ExtVal";
      span_percent.style.cssText = exchange.percent.includes('-') ? 'color:red;' : 'color:green;';
      if(ExchangeRow[1].querySelector('span') != null){
          const e = ExchangeRow[1].querySelector('span');
          e.parentElement.removeChild(e);
      }
      ExchangeRow[1].appendChild(span_percent);
    }  
};
function getArrays(){
  chrome.storage.local.get('BinCourses', ({ BinCourses }) => {
    chrome.storage.local.get('CbrCourses', ({CbrCourses}) => {
      getCourseBestChange(BinCourses, CbrCourses)
    })
  })
}
let observer = new MutationObserver(getArrays)
observer.observe(document.querySelector('#rates_block'), {
    childList: true,
    subtree: true,
    characterData: true
});
getArrays()