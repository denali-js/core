import chalk from 'chalk';

const prefixColors = {
  info: 'blue',
  warn: 'yellow',
  error: 'red'
};

export default function log(level, msg) {
  if (!msg) {
    msg = level;
    level = 'info';
  }
  level = level.toLowerCase();
  let prefixColor = prefixColors[level];
  let parts = [];
  parts.push((new Date()).toISOString());
  parts.push(chalk[prefixColor]('[' + level.toUpperCase() + ']'));
  parts.push(msg);
  console.log(parts.join(' '));
}
