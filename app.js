var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var fs = require('fs');
var xreg = require('xregexp');

// app.use(express.static(__dirname + '/node_modules'));
// app.get('/', function(req,res,next) {
// 	res.sendFile(__dirname + '/index.html');
// });
//
// io.on('connection', function(client) {
// 	fs.watchFile('messages.text', (curr, prev) => {
// 		var test = [];
// 		test.push(curr.mtime);
// 		test.push(prev.mtime);
// 		client.emit('messages', test);
// 	});
//
// });
//
//
// server.listen(4200);
	
// fs.readFile('messages.text', 'utf8', function(err, contents) {
// 	xreg.forEach(contents, /SELECT[\s\S]/, (match, i) => {
// 		console.log(i);
// 	
// 	});
// });

var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream('GIS_APPLICATION.log')
});

	var pattern1 = xreg('SELECT','x');
var pattern2 = xreg('\^date','x');
var start = 0;
var arr = [];
var query = '';
lineReader.on('line', function (line) {
	if(pattern1.test(line) == true){
		start = 1;
	}
	 if(pattern2.test(line) == true && start === 1){
		arr.push(query);
		console.log(query);
		query = '';
		start = 0;
	} if(start == 1) {
		query += line + '\n';
	}
});
