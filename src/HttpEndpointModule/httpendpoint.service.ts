import * as config from 'config';
import * as http from 'http';

import { AutoWired, Singleton, Inject } from 'typescript-ioc';
import { LoggerService } from '../LoggerModule/logger.service';

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

    private listen() {
        this.server = http.createServer(async (req, res) => {
            if (
                'host' in req.headers &&
                this.domain &&
                req.headers['host'].startsWith(this.domain)
            ) {
                const randomSE = this.serviceEngines[Math.floor((Math.random()*this.serviceEngines.length))];
                this.logger.info(randomSE);
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

    constructor() {
        this.host = config.get('http.host');
        this.port = config.get('http.port');
        this.domain = config.get('http.domain');

        this.serviceEngines = config.get('serviceEngines');

        this.listen();
    }
}
