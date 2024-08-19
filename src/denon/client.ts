import {once} from "events";
import {Socket, SocketConstructorOpts} from "net";
import {SocketConnectOpts} from "node:net";

export type Endpoint = [string, number];

export class AsyncSocket {
    private readonly socket: Socket;

    constructor(options?: SocketConstructorOpts) {
        this.socket = new Socket(options);
    }

    connect(options: SocketConnectOpts): Promise<void> {
        let promiseResolve: () => void = () => {};
        let promiseReject: (error: Error) => void = () => {};

        const promise = new Promise<void>((resolve, reject) => {
            promiseResolve = resolve;
            promiseReject = reject;
        });

        const errorCallback = (error: Error) => {
            this.socket.removeListener("error", errorCallback);
            promiseReject(error);
        };

        const connectCallback = () => {
            this.socket.removeListener("connect", connectCallback);
            promiseResolve();
        }

        this.socket.addListener("error", errorCallback);
        this.socket.addListener("connect", connectCallback);
        this.socket.connect(options);

        return promise;
    }

    write(buffer: Uint8Array | string): Promise<void> {
        let promiseResolve: () => void = () => {};
        let promiseReject: (error: Error) => void = () => {};

        const promise = new Promise<void>((resolve, reject) => {
            promiseResolve = resolve;
            promiseReject = reject;
        });

        const errorCallback = (error: Error) => {
            this.socket.removeListener("error", errorCallback);
            promiseReject(error);
        };

        this.socket.addListener("error", errorCallback);
        this.socket.write(buffer, () => {
            promiseResolve();
        });

        return promise;
    }

    getRawSocket(): Socket {
        return this.socket;
    }
}

export class DenonAVRClient {
    static async exchange(endpoint: Endpoint, command: string): Promise<string[]> {
        const [host, port] = endpoint;
        const socket = new AsyncSocket();
        await socket.connect({
            host,
            port
        });

        await socket.write(`${command}\r`);

        socket.getRawSocket().destroy();
        return [];
    }
}