export interface Timer {
  start: [ number, number ];
  stop: () => string;
}

export default function timer(): Timer {
  let start = process.hrtime();
  return {
    start,
    stop() {
      let [ sec, ns ] = process.hrtime(start);
      return (sec + (ns / 1e9)).toFixed(3);
    }
  };
}
