# socket.io-controllers

## Description

Use ES6 Class with Socket.IO

## Installation

```bash
$ npm install socket.io-controllers --save
```

## Usage

Let's say that our application will be using Koa and Socket.IO.

- app.js

```javascript

const http = require('http');
const path = require('path');
const Koa = require('koa');
const SocketIO = require('socket.io');
const { setupSocketIOControllers } = require('socket.io-controllers');

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

```
Create a socket-controllers folder (inside we will define our Socket Controller Classes)
- socket-controllers/default.socket-controller.js
```javascript
const { SocketController } = require('socket.io-controllers');

class DefaultSocketController extends SocketController {
	/**
	 * The "use" function will be our socket middleware.
	 * 
	 * Call this.next() anytime to continue.
	 * 
	 * Or call this.next(new Error('some error')) to deny access.
	 */
	use() {
		const { socket, next } = this;
		const { authToken } = socket.handshake.query;

		// Here we can do some check with the token
		if (authToken === '123456') {
			this.next();
		} else {
			this.next(new Error('Authentication Failed.'));
		}
	}

	/**
	 * We define our socket event handler like the following.
	 * 
	 * On client side for example:
	 * 
	 * socket.emit('SomeCustomEvent', payload)
	 * 
	 * or with acknowledgement
	 * 
	 * socket.emit('SomeCustomEvent', payload, ack => console.log(ack))
	 *
	 * You have access to socket.io server (io) and current socket (socket)
	 */
	onSomeCustomEvent(payload) {
		const { io, socket } = this;
	}

	onSomeCustomEvent2(payload, fn) {}
}

exports.DefaultSocketController = DefaultSocketController;


```
What about namespacing?
```javascript
class DefaultSocketController extends SocketController {} // io.of('/')

class AuthSocketController extends SocketController {} // io.of('/auth')

class ChatSocketController extends SocketController {} // io.of('/chat')
```

## LICENSE
MIT