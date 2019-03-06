import { Inject, AutoWired, Singleton, Container } from 'typescript-ioc';
import { LoggerService } from './LoggerModule/logger.service';

import { HttpEnpointModule } from './HttpEndpointModule/httpendpoint.service';
import { ControllerConnectorService } from './ControllerEndpintConnectorModule/connector.services';

@AutoWired
@Singleton
export class RequestRouter302Launcher {

    @Inject
    logger: LoggerService;

    private services = [
        Container.get(HttpEnpointModule),
        Container.get(ControllerConnectorService)
    ];

    public async run(): Promise<void> {
        try {
            this.logger.debug('beginning server bootstrap');
            for (const service of this.services) {
                if ("initialize" in service) {
                    await service.initialize();
                }
            }
        } catch(error) {
            this.logger.error("server startup failed: " + error.message || "unknown error while initializing services");
            process.exit(1);        
        }
    }
}