import { setupUnitTest } from 'denali';
import <%= singular.className %> from '../services/<%= singular.dasherized %>';

const test = setupUnitTest();

test.todo('<%= className %>Service');
