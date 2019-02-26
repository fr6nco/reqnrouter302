import { Container } from 'typescript-ioc';
import { RequestRouter302Launcher } from './launcher';

const launcher = Container.get(RequestRouter302Launcher);
launcher.run();