const wsc = require('rpc-websockets').Client;
// import * as rpc from 'rpc-websockets';
import * as config from 'config';
import { Subject } from 'rxjs';
import { Singleton, AutoWired, Inject } from 'typescript-ioc';

import { ControllerConnectorStore } from './store/models';
import { LoggerService } from '../LoggerModule/logger.service';

export enum NodeType {
    rr ='rr',
    se ='se'
}

/**
 * Service class, actual magic happens here
 */
@AutoWired
@Singleton
export class ControllerConnectorService {
    moduleName: string;
    contollerIp: string;
    controllerPort: number;
    wsurl: string;
    url: string;
    wsClient: any;
    connected: boolean;

    @Inject
    logger: LoggerService;

    public ccEvents: Subject<ControllerConnectorStore>;

    private connect() {
        this.wsClient = new wsc(this.url, {
            max_reconnects: 0
        });

        this.wsClient.on('open', () => {
            this.ccEvents.next({
                connected: true,
                connectorUrl: this.url
            });
            this.connected =  true;
            this.logger.log('Controller Connector service connected to endpoint');
        });

        this.wsClient.on('close', () => {
            this.ccEvents.next({
                connected: false,
                connectorUrl: ''
            });
            this.connected = false;
            this.logger.log('Controller Connector service disconnected from endpoint');
        });
    }

    public async fetchRRs() {
        try{
            const res: {code: number; res: [{ name: string; domain: string; ip: string; port: number}]} = await this.wsClient.call('getrrs')
            if (res.code == 200) {
                return res.res
            } else { 
                throw res.res
            }
        } catch(err) {
            throw err;
        }
    }

    public async fetchSes() {
        try {
            const res: {code: number; res: [{ name: string; domain: string; ip: string; port: number}]} = await this.wsClient.call('getses');
            if (res.code == 200) {
                return res.res;
            } else {
                throw res.res;
            }
        } catch(err) {
            throw err;
        }
    }

    public async getClosestSeToIP(ip: string) {
        try {
            const res: {code: number; res: string} = await this.wsClient.call('getclosestse', [ip]);
            if (res.code == 200) {
                return res.res;
            } else {
                throw res.res;
            }
        } catch(err) {
            throw err;
        }
    }

    constructor() {
        this.contollerIp = config.get('connector.ip');
        this.controllerPort = config.get('connector.port');
        this.connected = false;
        this.wsurl = config.get('connector.url');
        this.url = `http://${this.contollerIp}:${this.controllerPort}/${
            this.wsurl
        }`;

        this.ccEvents = new Subject<ControllerConnectorStore>();
        this.connect();
    }
}
