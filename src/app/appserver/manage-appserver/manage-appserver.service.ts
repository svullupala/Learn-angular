import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { AppServerModel } from '../appserver.model';
import { AppServerService } from '../appserver.service';
import {RestService} from 'core';
import {FilterModel} from 'shared/models/filter.model';

@Injectable()
export class ManageAppServerService {

  public updateAppserversSubject = new Subject<AppServerModel[]>();
  public editAppserverSubject = new Subject<Object> ();
  public refreshAppserversSubject = new Subject<undefined> ();
  public resetRegistrationFormSubject = new Subject<undefined>();

  get proxy(): RestService {
    return this.appserverService.proxy;
  }

  constructor(private appserverService: AppServerService) {}


  public updateAppservers(appServers: AppServerModel[]): void {
    if (appServers) {
      this.updateAppserversSubject.next(appServers);
    }
  }

  public resetRegistrationForm(): void {
    this.resetRegistrationFormSubject.next();
  }

  public refreshAppservers(): void {
    this.refreshAppserversSubject.next();
  }

  public editAppserver(appServer: AppServerModel): void {
    if (appServer) {
      this.editAppserverSubject.next(appServer);
    }
  }

  public getAppservers(filters?: Array<FilterModel>): Observable<any> {
   return this.appserverService.getAppservers(filters);
  }

  public unregisterAppserver(appServer: AppServerModel, type: string): Observable<any> {
    return appServer && this.appserverService.unregisterAppserver(appServer, type);
  }
}
