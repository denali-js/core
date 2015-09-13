import Application from './runtime/application';
import Controller from 'foraker';
import { Serializer } from 'blackburn';

export default function start(applicationDir = process.cwd()) {
  let application = new Application({ root: applicationDir });
  return application.start();
}

export { Controller, Serializer };
