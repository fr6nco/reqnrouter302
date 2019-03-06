import * as config from 'config';
import * as http from 'http';

import { AutoWired, Singleton, Inject } from 'typescript-ioc';
import { LoggerService } from '../LoggerModule/logger.service';
import { ControllerConnectorService } from '../ControllerEndpintConnectorModule/connector.services';
import { ControllerConnectorStore } from '../ControllerEndpintConnectorModule/store/models';

@AutoWired
@Singleton
export class HttpEnpointModule {
    host: string;
    port: number;
    domain: string;
    server: http.Server;

    serviceEngines: [{
        name: string;
        domain: string;
        ip: string;
        port: number
    }];

    @Inject logger: LoggerService;

    @Inject ccService: ControllerConnectorService;

    private listen() {
        this.server = http.createServer(async (req, res) => {
            if (
                'host' in req.headers &&
                this.domain &&
                req.headers['host'].startsWith(this.domain)
            ) {
                this.logger.debug(`Chosing a Service Engine from controller to ip ${req.socket.remoteAddress}`);
                this.ccService.getClosestSeToIP(req.socket.remoteAddress).then((ip: string) => {
                    this.logger.debug(`SE IP is ${ip}`);
                    const randomSE = this.serviceEngines.find((se) => {
                        return se.ip == ip;
                    });
                    this.logger.debug(`SE is ${randomSE}`);
                    res.writeHead(302, {
                        'Location': `http://${randomSE.domain}:${randomSE.port}/${req.url}`
                    });
                    res.end();
                })
                .catch((err) => {
                    this.logger.error(`Failed to get SE: ${err}`);
                    res.end('HTTP/1.1 400 Bad Request\r\n\r\n');
                })

            } else {
                this.logger.error(
                    'Request received for unknown domain. Rejecting'
                );
                this.logger.error(req.headers);
                res.end('HTTP/1.1 400 Bad Request\r\n\r\n');
            }
        });

        this.server.listen(this.port, this.host, () => {
            this.logger.info(`listening on port ${this.port}`);
        });
    }

    private connected() {

        this.ccService.fetchRRs().then((rrs) => {
            rrs.forEach((rr) => {
                this.domain = rr.domain;
            });
            this.listen();
        });

        this.ccService.fetchSes().then((ses) => {
            this.serviceEngines = ses;
        })
    }

    private disconnected() {
        this.logger.error('Disconnect not implemented yet');
    }

    constructor() {
        this.host = config.get('http.host');
        this.port = config.get('http.port');

        this.ccService.ccEvents.subscribe((ccEvents: ControllerConnectorStore) => {
            if (ccEvents.connected) {
                this.connected();
            } else {
                this.disconnected();
            }
        });
    }
}
