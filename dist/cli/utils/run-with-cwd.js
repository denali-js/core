export default function runWithCwd(cwd, fn, ...args) {
  let originalCwd = process.cwd();
  process.chdir(cwd);
  fn(...args);
  process.chdir(originalCwd);
}
