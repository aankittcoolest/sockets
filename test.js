
var xreg = require('xregexp');

var line = "10 SELECT";
	var pattern1 = xreg('[0-9]','x');;

if(pattern1.test(line) == true) {
	console.log(line);
}

