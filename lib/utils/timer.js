export default function timer() {
  let start = process.hrtime();
  return {
    start,
    stop() {
      let [ sec, ns ] = process.hrtime(start);
      return (sec + (ns / 1e9)).toFixed(3);
    }
  };
}
