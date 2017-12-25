
var socket = io.connect('http://127.0.0.1:4200');
var i = 0;
var background_class='';

socket.on('query', function(data) {
	i++;
	if(i%2==0) {
		background_class = 'striped';

	}
	else {
		background_class = '';
	}
	var html = '';
	html = `<button class="fa fa-clipboard pull-right" onClick="copyToClipboard('#p${i}')" ></button> <p id="p${i}"class=${background_class}> ${data} </p>`;
	$(".sql-list").prepend(html);
});
