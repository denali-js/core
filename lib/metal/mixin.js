export default function mixin(base, ...mixins) {
  return mixins.reduce((applied, nextMixin) => {
    if (!(nextMixin instanceof Mixin)) {
      throw new Error('You must use Mixin.create to build a mixin.');
    }
    return nextMixin(applied);
  }, base);
}
