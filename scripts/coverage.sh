set -e
nyc report --reporter=text-lcov | codeclimate-test-reporter
