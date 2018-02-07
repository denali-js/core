import { setupUnitTest } from 'denali';
import <%= singular.className %> from '../orm-adapters/<%= singular.dasherized %>';

const test = setupUnitTest();

test.todo('<%= className %> ORM Adapter');
