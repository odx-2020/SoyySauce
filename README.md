# Soyy Sauce
WebSec Team Project

Team Members: 
Sim Yu Cheng          | 2102520 
Olivia Delores Xavier | 2102528
Nguyen Yen Nhi        | 2102628
Tan Jia Jia, Serene   | 2103021

Project Video: https://youtu.be/qG4cpU7MdX8

Soyy Sauce is a Google Chrome extension SQLi tool with GUI that enumerate the webpage to retrieve the database name, version, the list of tables, and the table values and form injection to check if a form or input field is vulnerable to SQLi.

## Installation
1. Download the chrome extension.
2. Unzip the extension.
3. Visit `chrome://extensions`.
4. Enable `Developer mode`.
5. Click on the `Load Unpacked` and select the unzip folder.

## Usage
#### For database enumeration
1. Visit a webpage. For example `http://testphp.vulnweb.com/artists.php?artist=1`.
2. Click 'Start' to enumerate the webpage.
#### For form-based injection
1. Visit a webpage. For example `https://demo.testfire.net/login.jsp`.
2. Click 'Get Input Field' to start attacking.

