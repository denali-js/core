import { setupUnitTest } from 'denali';
import <%= singular.className %> from '../serializers/<%= singular.dasherized %>';

const test = setupUnitTest();

test.todo('<%= className %>Serializer');
