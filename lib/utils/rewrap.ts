import unwrap from './unwrap';
import wrap from 'wordwrap';
import tty from 'tty';
import {
  flatten,
  zip
} from 'lodash';

export default function rewrap(strings: TemplateStringsArray, ...expressions: any[]): string {
  let text = unwrap(strings, ...expressions);
  text = wrap(text, Math.min(100, (<tty.WriteStream>process.stdout).columns));
  return text;
}