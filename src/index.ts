import * as _ from 'lodash';
import * as debug from 'debug';
import * as fs from 'fs';
import * as http from 'http';
import * as SocketIO from 'socket.io';

const log = debug('socket.io-controllers');
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export function setupSocketIOControllers(options: SetupSocketIOControllersOptions): SocketIO.Server {
	const { server, controllers: { dir, suffix = '.socket-controller.' } } = options;
	log('socket controllers directory', dir);
	log('using suffix', suffix);

	if (!(server instanceof http.Server)) {
		throw new SocketIoControllersError('An HTTP server instance is required.');
	}

	const io = SocketIO(server);

	fs.readdirSync(dir).filter((ctrl) => ctrl.indexOf(suffix) > -1).forEach((ctrl) => {
		const importedCtrl = require(`${dir}/${ctrl}`);
		const InstanceName = _.keys(importedCtrl)[0];
		const InstanceStatic: any = _.values(importedCtrl)[0];

		let [ namespace ] = InstanceName.toLocaleLowerCase().split('socketcontroller');
		if (namespace === 'default') namespace = '';
		log('namespace', namespace);

		const instance = new InstanceStatic();
		const instanceFuncNames = Object.getOwnPropertyNames(InstanceStatic.prototype).filter(
			(fn) => fn !== 'constructor' && fn.indexOf('on') > -1
		);

		const eventNames = instanceFuncNames.map((fn) => fn.split(/on(.+)/)[1]);
		const builtInIoEventNames = [ 'connection', 'Connection' ];
		const builtInSocketEventNames = [ 'disconnect', 'disconnecting', 'error' ];
		const builtInSocketEventNamesCap = builtInSocketEventNames.map((e) => capitalize(e));
		const socketEventNames = _.difference(eventNames, [ ...builtInIoEventNames, ...builtInSocketEventNamesCap ]);

		if (!instance.onConnection) {
			throw new Error(`${InstanceStatic.name} doesn't implement onConnection function`);
		}

		if (instance.use) io.of(namespace).use((socket, next) => instance.use.call({ io, socket, next }));

		io.of(namespace).on('connection', (socket) => {
			const context = { io, socket };

			instance.onConnection.call(context, socket);

			for (let e of builtInSocketEventNames) {
				socket.on(e, (payload, fn) => instance[`on${capitalize(e)}`].call(context, payload, fn));
			}

			for (let e of socketEventNames) {
				socket.on(e, (payload, fn) => instance[`on${e}`].call(context, payload, fn));
			}
		});
	});

	return io;
}

export class SocketController implements SocketControllerHandling {
	use(this: SocketControllerMiddleware) {
		this.next();
	}
	onConnection(this: SocketControllerHandler) {
		log(`onConnection:`, `${this.socket.id} connected.`);
	}
	onDisconnect(this: SocketControllerHandler) {
		log('onDisconnect:', `${this.socket.id} disconnected.`);
	}
	onDisconnecting(this: SocketControllerHandler, reason: any) {
		log('onDisconnecting:', `${this.socket.id} is disconnecting due to ${reason}.`);
	}
	onError(reason: any) {
		log('onError:', reason);
	}
	[x: string]: (this: SocketControllerHandler, payload: any, fn: Function) => void;
}

export interface SocketControllerHandling {
	onConnection: (this: SocketControllerHandler) => void;
	onDisconnect: (this: SocketControllerHandler) => void;
	onDisconnecting: (this: SocketControllerHandler, reason: any) => void;
	onError: (this: SocketControllerHandler, reason: any) => void;
	[x: string]: (this: SocketControllerHandler, payload: any, fn: Function) => void;
}

export interface SetupSocketIOControllersOptions {
	server: http.Server;
	controllers: {
		dir: string;
		suffix?: string;
	};
}

export interface SocketControllerMiddleware {
	io: SocketIO.Server;
	socket: SocketIO.Socket;
	next: (arg?: any) => void;
}

export interface SocketControllerHandler {
	io: SocketIO.Server;
	socket: SocketIO.Socket;
}

class SocketIoControllersError extends Error {
	constructor(message: string) {
		super();
		this.name = 'SocketIoControllersError';
		this.message = message;
	}
}
