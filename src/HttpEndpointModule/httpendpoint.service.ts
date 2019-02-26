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

    @Inject logger: LoggerService;

    private listen() {
        this.server = http.createServer(async (req, res) => {
            if (
                'host' in req.headers &&
                this.domain &&
                req.headers['host'].startsWith(this.domain)
            ) {
                //TODO redirect randomly
            } else {
                this.logger.error(
                    'Request received for unknown domain. Rejecting'
                );
                this.logger.error(req.headers);
                res.end('HTTP/1.0 400 Bad Request\r\n\r\n');
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

        this.listen();
    }
}
