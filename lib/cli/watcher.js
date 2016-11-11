import { Watcher } from 'broccoli/lib';
import Promise from 'bluebird';
import noop from 'lodash/noop';

export default class PausingWatcher extends Watcher {

  readyForRebuild = false;
  prebuildInProgress = false;

  constructor(tree, options) {
    super(...arguments);
    this.beforeRebuild = options.beforeRebuild || noop;
  }

  detectChanges() {
    let changedDirs = super.detectChanges();
    if (changedDirs.length > 0) {
      if (!this.readyForRebuild) {
        if (!this.prebuildInProgress) {
          this.prebuildInProgress = true;
          Promise.resolve(this.beforeRebuild()).then(() => {
            this.readyForRebuild = true;
            this.prebuildInProgress = false;
          });
        }
      } else {
        this.readyForRebuild = false;
        this.emit('buildstart');
        return changedDirs;
      }
    }
    return [];
  }

}
