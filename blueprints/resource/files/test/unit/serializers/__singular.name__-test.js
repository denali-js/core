import { setupUnitTest } from '@denali-js/core';
import <%= singular.className %> from '../serializers/<%= singular.dasherized %>';

const test = setupUnitTest();

test.todo('<%= singular.className %>Serializer');
