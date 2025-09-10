import Resolver from '@forge/resolver';
import { App } from './App';

const resolver = new Resolver();

resolver.define('main', (req) => {
  return <App />;
});

export const handler = resolver.getDefinitions();