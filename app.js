var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var fs = require('fs');
var xreg = require('xregexp');

app.use(express.static(__dirname + '/node_modules'));
app.use(express.static(__dirname + '/public'));
app.get('/', function(req,res,next) {
	res.sendFile(__dirname + '/index.html');
});

//load config file
var filename = fs.readFile('./settings.inc', 'utf-8', function(err,data) {
	if(err) {
		return console.log(err);
	}
	filename = data.toString().split('\n').map(function(line) {
		return line.trim();
	}).filter(Boolean);
	readLogFile(filename[0].replace(/\\/g,'\\\\'));
});

function readLogFile(filename) {
	var options = {
		// logFile: './test.txt',
		logFile: `${filename}`,
		endOfLineChar: require('os').EOL
	};
	// Obtain the initial size of the log file before we begin watching it.
	var fileSize = fs.statSync(options.logFile).size;

	io.on('connection', function(client) {
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

		});

	});
}

function parseBuffer (buffer,client) {
	var pattern1 = xreg('^[0-9]','x');;
	var pattern2 = xreg('{executed','x');
	var start = 0;
	var query = '';
	// Iterate over each line in the buffer.
	buffer.toString().split(/(?:\r\n|\r|\n)/g).forEach(function (line) {
		if(pattern1.test(line) == true){
			line = line.replace(/(^\d+\.)(.*)/, '$2');
			start = 1;
		}
		if(pattern2.test(line) == true && start === 1) {
			line = line.replace(/(.*)({executed.*)/, '$1');
			query += line + '\n';
			client.emit('query', query);
			query = '';
			start = 0;
		}
		if(start == 1) {
			query += line + '\n';
		}
	});
}

function stop () {
	fs.unwatchFile(options.logFile);
};

server.listen(4200);

