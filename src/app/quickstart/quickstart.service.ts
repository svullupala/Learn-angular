import { Injectable } from '@angular/core';
import { SessionService } from 'core';
import { RestService } from 'core';
import { HelpService } from 'core';
import { AccessUserModel } from '../accounts/users/user.model';

@Injectable()
export class QuickStartService {
  constructor(private rest: RestService, private helpService: HelpService) {
  }


  /**
   * set the quick start flag
   * @param flag
   */
  setFlag(flag: boolean) {
    this.setUserMetadataFlag(flag);
  }

  setUserMetadataFlag(flag: boolean) {
    let userModel = SessionService.getInstance().getUserModel();
    userModel.updateMetadata('quickStartAtLogin', flag, this.rest);
  }

  /**
   *  get show quick start flag
   * @returns {boolean}
   */
  getFlag(): boolean {
    return this.getUserMetadataFlag() && this.getQuickstartViewPermission();
  }

  getUserMetadataFlag(): boolean {
    let userModel = SessionService.getInstance().getUserModel();

    if (userModel.metadata !== undefined && userModel.metadata.quickStartAtLogin !== undefined) {
      return userModel.metadata.quickStartAtLogin;
    } else {
      return true;
    }
  }

  getQuickstartViewPermission(): boolean {
    let screens = SessionService.getInstance().screens;
    for (let screen of screens) {
      if (screen['name'] === 'Dashboard'){
        return true;
      }
    }
  }

  openOnlineHelp() {
    console.log('Help URL: ' + this.helpService.getHelp('quickstart'));
    this.openUrl(this.helpService.getHelp('quickstart'), '');
  }

  openUrl(url: string, frameName: string) {
    let popup,
        windowParams = 'directories=no,location=no,menubar=no,resizable=yes,scrollbars=yes,toolbar=yes,titlebar=yes';
    popup = window.open(url, frameName, windowParams);
    if (popup) {
      popup.focus();
    }
  }


}
