const injectionFlag = Symbol.for('denali:injection-flag');

export default function injectService(serviceName) {
  return {
    _injection: injectionFlag,
    type: 'services',
    value: serviceName
  };
}
