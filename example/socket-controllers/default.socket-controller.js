const { SocketController } = require('../../dist/index');

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
