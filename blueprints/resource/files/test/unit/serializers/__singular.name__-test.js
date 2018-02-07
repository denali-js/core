import { setupUnitTest } from 'denali';
import <%= singular.className %> from '../serializers/<%= singular.dasherized %>';

const test = setupUnitTest();

test.todo('<%= singular.className %>Serializer');
