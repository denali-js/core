import { Tree } from "./builder";
import { Watcher } from 'broccoli/lib';
import { resolve } from 'bluebird';
import {
  noop
} from 'lodash';

export default class PausingWatcher extends Watcher {

  readyForRebuild = false;
  prebuildInProgress = false;
  beforeRebuild: () => Promise<void> | void;

  constructor(tree: Tree, options: { beforeRebuild: () => Promise<void> | void, interval: number }) {
    super(tree, options);
    this.beforeRebuild = options.beforeRebuild || noop;
  }

  detectChanges() {
    let changedDirs = super.detectChanges();
    if (changedDirs.length > 0) {
      if (!this.readyForRebuild) {
        if (!this.prebuildInProgress) {
          this.prebuildInProgress = true;
          resolve(this.beforeRebuild()).then(() => {
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

  emit: (e: string) => void;
  on: (e: string, cb: (...args: any[]) => void) => void;

}
