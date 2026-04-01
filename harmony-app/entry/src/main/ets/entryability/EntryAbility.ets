import UIAbility from '@ohos.app.ability.UIAbility';
import window from '@ohos.window';
import storageService from '../services/StorageService';

export default class EntryAbility extends UIAbility {
  onCreate(want, launchParam) {
    console.info('[EntryAbility] onCreate');
    // 初始化存储服务
    storageService.init(this.context);
  }

  onDestroy() {
    console.info('[EntryAbility] onDestroy');
  }

  onWindowStageCreate(windowStage: window.WindowStage) {
    console.info('[EntryAbility] onWindowStageCreate');

    windowStage.loadContent('pages/Index', (err, data) => {
      if (err.code) {
        console.error('Failed to load the content. Cause: ' + JSON.stringify(err));
        return;
      }
      console.info('Succeeded in loading the content. Data: ' + JSON.stringify(data));
    });
  }

  onWindowStageDestroy() {
    console.info('[EntryAbility] onWindowStageDestroy');
  }

  onForeground() {
    console.info('[EntryAbility] onForeground');
  }

  onBackground() {
    console.info('[EntryAbility] onBackground');
  }
}
