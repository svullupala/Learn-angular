import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { CredentialService } from 'identity/shared/credentials/credential.service';
import { AppServerService } from '../../appserver.service';
import { AppServerModel } from '../appserver.model';

@Injectable()
export class ApplicationRegistrationFormService {

  constructor(private appserverService: AppServerService,
              private credentialService: CredentialService) {}

  public getCredentials(): Observable<any> {
    return this.credentialService.getCredentials();
  }

  public registerAppserver(postPayload: Object): Observable<any> {
    return this.appserverService.registerAppserver(postPayload);
  }

  public updateAppserver(url: string, putPayload: Object) {
    return this.appserverService.updateAppserver(url, putPayload);
  }

  public getInstances(payload: Object) {
    return this.appserverService.getInstances(payload);
  }

  public getRegisteredInstances(payload: Object) {
    return this.appserverService.getRegisteredInstances(payload);
  }
}
