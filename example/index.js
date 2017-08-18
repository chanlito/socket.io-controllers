const http = require('http');
const path = require('path');
const Koa = require('koa');
const SocketIO = require('socket.io');
const { setupSocketIOControllers } = require('../dist/index');

const app = new Koa();
const server = http.createServer(app.callback());

app.context.io = setupSocketIOControllers({
	server,
	controllers: {
		dir: path.resolve(__dirname, 'socket-controllers')
		// suffix: '.sc.js' // Default: .socket-controller.
	}
});

server.listen(3000, () => console.log('Server running on port 3000'));
