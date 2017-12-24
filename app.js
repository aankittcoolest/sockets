var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var fs = require('fs');
var xreg = require('xregexp');

app.use(express.static(__dirname + '/node_modules'));
app.get('/', function(req,res,next) {
	res.sendFile(__dirname + '/index.html');
});

var options = {
	logFile: './test.txt',
	endOfLineChar: require('os').EOL
};
// Obtain the initial size of the log file before we begin watching it.
var fileSize = fs.statSync(options.logFile).size;

io.on('connection', function(client) {
	// fs.watchFile('messages.text', (curr, prev) => {
	// 	var test = [];
	// 	test.push(curr.mtime);
	// 	test.push(prev.mtime);
	// 	client.emit('messages', test);
	// });
fs.watchFile(options.logFile, function (current, previous) {
	// Check if file modified time is less than last time.
	// If so, nothing changed so don't bother parsing.
	if (current.mtime <= previous.mtime) { return; }

	// We're only going to read the portion of the file that
	// we have not read so far. Obtain new file size.
	var newFileSize = fs.statSync(options.logFile).size;
	// Calculate size difference.
	var sizeDiff = newFileSize - fileSize;
	// If less than zero then Hearthstone truncated its log file
	// since we last read it in order to save space.
	// Set fileSize to zero and set the size difference to the current
	// size of the file.
	if (sizeDiff < 0) {
		fileSize = 0;
		sizeDiff = newFileSize;
	}
	// Create a buffer to hold only the data we intend to read.
	var buffer = new Buffer(sizeDiff);
	// Obtain reference to the file's descriptor.
	var fileDescriptor = fs.openSync(options.logFile, 'r');
	// Synchronously read from the file starting from where we read
	// to last time and store data in our buffer.
	fs.readSync(fileDescriptor, buffer, 0, sizeDiff, fileSize);
	fs.closeSync(fileDescriptor); // close the file
	// Set old file size to the new size for next read.
	fileSize = newFileSize;

	// Parse the line(s) in the buffer.
	parseBuffer(buffer, client);

	// var pattern1 = xreg('SELECT','x');;
	// var pattern2 = xreg('\^date','x');
	// var start = 0;
	// var arr = [];
	// var query = '';
	// // Iterate over each line in the buffer.
	// buffer.toString().split(options.endOfLineChar).forEach(function (line) {
	// 		console.log(line);
	// 		client.emit('messages', line);
	// 	if(pattern1.test(line) == true){
	// 		start = 1;
	// 	}
	// 	if(pattern2.test(line) == true && start === 1){
	// 		arr.push(query);
	// 		console.log(query);
	// 		console.log("ok");
	// 		query = '';
	// 		start = 0;
	// 	} if(start == 1) {
	// 		query += line + '\n';
	// 	}
	// });
});

});
server.listen(4200);




function stop () {
	fs.unwatchFile(options.logFile);
};

function parseBuffer (buffer,client) {
	var pattern1 = xreg('^[0-9]','x');;
	var pattern2 = xreg('\^date','x');
	var pattern3 = xreg('{executed','x');
	var start = 0;
	var arr = [];
	var query = '';
	var i =0;
	// Iterate over each line in the buffer.
	buffer.toString().split(/(?:\r\n|\r|\n)/g).forEach(function (line) {
		if(pattern1.test(line) == true){
			line = line.replace(/(^\d+\.)(.*)/, '$2');
			start = 1;
		}
		if(pattern3.test(line) == true && start === 1) {
			line = line.replace(/(.*)({executed.*)/, '$1');
			query += line + '\n';
			arr.push(query);
			console.log(query);
			client.emit('messages', query);
			query = '';
			start = 0;
		}
		// if(pattern2.test(line) == true && start === 1){
		// 	arr.push(query);
		// 	console.log(query);
		// 	client.emit('messages', query);
		// 	query = '';
		// 	start = 0;
		// } 
		if(start == 1) {
			query += line + '\n';
		}
	});
}
