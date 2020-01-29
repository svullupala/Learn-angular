import { Injectable } from '@angular/core';
import { SessionService } from 'core';
import { RestService } from 'core';
import { NodeService } from 'core';
import { AccessUserModel } from '../accounts/users/user.model';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class FeedbackService {

  constructor(private rest: RestService, private node: NodeService) {
  }

  /**
   * Save user's metadata.
   */
  setMetadata(initialLogin: number, lastShown: number) {
    let userModel = SessionService.getInstance().getUserModel(),
        metadata = {};

    Object.assign(metadata, userModel.metadata);

    metadata['initialLogin'] = initialLogin;
    metadata['feedbackLastShown'] = lastShown;
    // console.log('Saving : ' + metadata['initialLogin'] + ' + ' + metadata['feedbackLastShown']);

    let observable =
      userModel.doAction<AccessUserModel>(AccessUserModel, 'changeMetadata', { 'metadata': metadata }, this.rest);
    if (observable) {
      observable.subscribe(
        record => {
          // console.log('User metadata saved successfully!');
        },
        err => {
          // console.error('Failed to save user metadata!');
        }
      );
    }
  }

  /**
   * Returns True if URL is responsive
   */
  ping(targetUrl: string): Observable<boolean> {
    let request:any = {};
    request.url = targetUrl;
    return this.node.post('ngp/ping', request).map(
      res => {
        if (res && res.ping && res.ping === true) {
          return true;
        }
        return false;
      }
    );
  }

  /**
   * Retrieve user's preference on showing this Quick Start window.
   */
  getLastShown(): number {
    let userModel = SessionService.getInstance().getUserModel(),
        lastShown = userModel.metadata.feedbackLastShown;

    // console.log('Getting : ' + lastShown);
    return lastShown;
  }

  /**
   * Retrieve user's preference on showing this Quick Start window.
   */
  getInitialLogin(): number {
    let userModel = SessionService.getInstance().getUserModel(),
      initialLogin = userModel.metadata.initialLogin;

    // console.log('Getting : ' + initialLogin);
    return initialLogin;
  }

  shouldShowFeedback(): boolean {
    let initialLogin = this.getInitialLogin(),
        lastShown = this.getLastShown();

    // if the field is undefined, this is the first time user logs into SPP
    if (initialLogin === undefined) {
      // set initial login value.  no need to show feedback.
      this.setMetadata(Date.now(), undefined);
      return false;
    }

    // Test if the popup was ever shown to the user.  Check lastShown variable if it is defined.
    // If the popup was shown before, we need to show it every 90 days.
    // Otherwise, we need to show every 30 days.
    if (lastShown === undefined) {
      // Check 30 days from initial date
      return this.passDays(initialLogin, 30);
    } else {
      // Check 90 days from last shown date
      return this.passDays(lastShown, 90);
    }
  }

  /**
   * This is called when the popup is shown.  We need to reset counter.
   */
  popupShown() {
    this.setMetadata(this.getInitialLogin(), Date.now());
  }

  private passDays(testValue: number, numOfDays: number): boolean {
    let now = Date.now(),
        compareValue = now - numOfDays * 24 * 60 * 60 * 1000;
    return testValue < compareValue;
  }
}
