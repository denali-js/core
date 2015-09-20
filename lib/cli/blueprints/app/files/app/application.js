import path from 'path';
import { Application } from 'denali';

export default new Application({
  rootDir: path.join(__dirname, '..'),
  environment: process.env.DENALI_ENV || process.env.NODE_ENV || 'development'
});
