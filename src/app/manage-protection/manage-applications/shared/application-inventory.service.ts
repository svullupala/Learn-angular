import {Injectable} from '@angular/core';
import 'rxjs/Rx';
import {Observable} from 'rxjs/Observable';
import {RestService} from 'core';
import {BaThemeConfigProvider} from 'theme';
import {
  InventoryAggrCountResult,
  InventoryStatOptionsModel,
  InventoryTotalResult
} from 'inventory/inventory.model';
import {BehaviorSubject, Subject, Subscription} from 'rxjs';
import {AppServerModel} from 'appserver/appserver.model';
import {AppserverPayloadModel} from 'appserver/manage-appserver/registration-form/registration-form.component';
import {NvPairModel} from 'shared/models/nvpair.model';
import {AppServersModel} from 'appserver/appservers.model';
import {ErrorModel} from 'shared/models/error.model';
import {HttpErrorResponse} from '@angular/common/http';

export type ApplicationInventorySubjectType = 'registration' | 'stat'; // TODO: Add more types if necessary.
export type ApplicationInventoryWorkflow = 'db2' | 'exch' | 'office365' | 'mongo' | 'oracle' | 'sql';
export type ApplicationInventorySubjectModel<S extends string, T> =
  { workflow: ApplicationInventoryWorkflow, action: S, target: T };

export class ApplicationInventorySubject<T extends ApplicationInventorySubjectModel<string, any>>
  extends Subject<T> {
}

export class ApplicationInventoryBehaviorSubject<T extends ApplicationInventorySubjectModel<string, any>>
  extends BehaviorSubject<T> {
}

export type ApplicationRegistrationAction =
  'list' | 'register' | 'unregister';  // TODO: Add more actions if necessary.

export type ApplicationStatAction =
  'activate-view' | 'apply-options';  // TODO: Add more actions if necessary.

export type ApplicationRegistrationSubjectModel =
  ApplicationInventorySubjectModel<ApplicationRegistrationAction, AppServersModel | AppServerModel>;

export type ApplicationStatSubjectModel =
  ApplicationInventorySubjectModel<ApplicationStatAction, NvPairModel | InventoryStatOptionsModel>;

export type ApplicationRegistrationTarget = { appServer: AppServerModel, payload?: AppserverPayloadModel };

export class ApplicationRegistrationSubject extends ApplicationInventorySubject<ApplicationRegistrationSubjectModel> {
}

export class ApplicationStatSubject extends ApplicationInventoryBehaviorSubject<ApplicationStatSubjectModel> {
  constructor() {
    super(null);
  }
}

export type ApplicationInventoryCategoryLabel = 'Protected' | 'Unprotected' | 'Failed';

export class ApplicationInventoryCategory extends NvPairModel {
  constructor(public name: ApplicationInventoryCategoryLabel, public value: number, public applicationType: string) {
    super(name, value);
  }
}

export type ApplicationRegistrationError = {
  model: ApplicationRegistrationTarget,
  error: ErrorModel,
  raw: HttpErrorResponse
};

@Injectable()
export class ApplicationInventoryService {

  protected subs: {
    [key: string]:
      ApplicationInventorySubject<ApplicationInventorySubjectModel<string, any>> |
      {
        [workflow: string]: ApplicationInventoryBehaviorSubject<ApplicationInventorySubjectModel<string, any>>
      }
  } = {
    registration: new ApplicationRegistrationSubject(),
    // TODO: Add more subjects if necessary.
    stat: {
      db2: new ApplicationStatSubject(),
      exch: new ApplicationStatSubject(),
      office365: new ApplicationStatSubject(),
      mongo: new ApplicationStatSubject(),
      oracle: new ApplicationStatSubject(),
      sql: new ApplicationStatSubject()
    }
  };

  private dashcolors: any;
  private colors: string[] = [];

  get proxy(): RestService {
    return this.rest;
  }

  constructor(private rest: RestService, private theme: BaThemeConfigProvider) {
    this.initColor();
  }

  public subscribe<U extends ApplicationInventorySubjectModel<string, any>>(type: ApplicationInventorySubjectType,
                                                                            workflow?: ApplicationInventoryWorkflow,
                                                                            next?: (value: U) => void,
                                                                            error?: (error: any) => void,
                                                                            complete?: () => void): Subscription[] {
    let sub = this.subs[type], subscriptions: Subscription[] = [];
    if (sub) {
      if (sub instanceof ApplicationInventorySubject)
        subscriptions.push(sub.subscribe(next, error, complete));
      else if (workflow && sub[workflow] instanceof ApplicationInventoryBehaviorSubject)
        subscriptions.push(sub[workflow].subscribe(next, error, complete));
      else if (!workflow) {
        for (let subKey in sub) {
          if (sub.hasOwnProperty(subKey)) {
            subscriptions.push(sub[subKey].subscribe(next, error, complete));
          }
        }
      }
    }
    return subscriptions;
  }

  public next<U extends ApplicationInventorySubjectModel<string, any>>(type: ApplicationInventorySubjectType,
                                                                       value: U,
                                                                       workflow?: ApplicationInventoryWorkflow): void {
    let sub = this.subs[type];
    if (!workflow)
      workflow = value.workflow;

    if (sub) {
      if (sub instanceof ApplicationInventorySubject)
        return sub.next(value);
      else if (workflow && sub[workflow] instanceof ApplicationInventoryBehaviorSubject)
        return sub[workflow].next(value);
    }
  }

  public getColor(order: number): string {
    if (order < this.colors.length) {
      return this.colors[order];
    }

    return 'grey';
  }

  public getHighlightColor(): string {
    return 'yellow';
  }

  public getUnprotectedColor(distinctive?: boolean): string {
    return distinctive ? '#FF4085' : '#E6D6FF';
  }

  public getProtectedColor(distinctive?: boolean): string {
    return distinctive ? '#008BDD' : '#1191E6';
  }

  public getFailedColor(distinctive?: boolean): string {
    return distinctive ? '#8A3FFC' : '#D0B0FF';
  }

  public getAggrCount(api: string, field: string, type: string): Observable<InventoryAggrCountResult> {
    this.rest.setNoAuditHeader(true);
    return this.rest.post(api + '?action=aggregate', this.createAggrCountPostBody(field, type)).map(
      res => {
        let retVal: InventoryAggrCountResult = new InventoryAggrCountResult();
        let body = res;
        retVal.responseJson = body;
        if (body.results.length > 0) {
          retVal.count = body.results[0].count;
        } else {
          retVal.count = 0;
        }

        return retVal;
      }
    ).catch(this.handleError);
  }


  public getAggrGroupCount(api: string, field: string, group: string,
                           type: string, isProtected?: boolean): Observable<InventoryAggrCountResult[]> {
    this.rest.setNoAuditHeader(true);
    return this.rest.post(api + '?action=aggregate',
      this.createAggrGroupCountPostBody(field, group, type, isProtected)).map(
      res => {
        let retVal: InventoryAggrCountResult[] = [];
        let body = res;
        let result: InventoryAggrCountResult;
        for (let i = 0; i < body.results.length; i++) {
          result = new InventoryAggrCountResult();
          result.count = body.results[i].count;
          result.group = this.getValue(body.results[i]._id, group);
          if (result.group !== undefined && result.count !== undefined) {
            retVal.push(result);
          }
        }

        return retVal;
      }
    ).catch(this.handleError);
  }


  public getTotal(api: string, filter: any): Observable<InventoryTotalResult> {
    this.rest.setNoAuditHeader(true);
    return this.rest.getAll(api, [filter]).map(
      res => {
        let retVal: InventoryTotalResult = new InventoryTotalResult();
        let body = res;
        retVal.responseJson = body;
        retVal.total = body.total;

        return retVal;
      }
    );
  }

  private createAggrCountPostBody(field: string, type: string): any {
    return {
      'op': [
        {
          'operation': 'count',
          'fieldname': field,
          'outputname': 'count'
        }
      ],
      'filter': [
        {
          'op': '=',
          'property': 'applicationType',
          'value': type
        }
      ]
    };
  }

  private createAggrGroupCountPostBody(field: string, group: string, type: string, isProtected?: boolean): any {
    const body = {
      'op': [
        {
          'operation': 'count',
          'fieldname': field,
          'outputname': 'count'
        }
      ],
      'filter': [
        {
          'op': '=',
          'property': 'applicationType',
          'value': type
        }
      ],
      'group': [group]
    };

    if (isProtected !== undefined) {
      body.filter = [
        ...body.filter,
        {
          'op': '=',
          'property': 'isProtected',
          'value': String(isProtected),
        }
      ];
    }

    return body;
  }

  private initColor() {
    this.dashcolors = this.theme.get().colors.dashboard;
    this.colors.push(this.dashcolors.gossip);
    this.colors.push(this.dashcolors.orange);
    this.colors.push(this.dashcolors.teal);
    this.colors.push(this.dashcolors.olive);
    this.colors.push(this.dashcolors.blueStone);
    this.colors.push(this.dashcolors.green);
    this.colors.push(this.dashcolors.purple);
    this.colors.push(this.dashcolors.surfieGreen);
    this.colors.push(this.dashcolors.ecxgold);
    this.colors.push(this.dashcolors.ecxsilver);
    this.colors.push(this.dashcolors.ecxbronze);
  }

  private getValue(value: any, field: string): any {
    let retVal: any = value;
    let fields: string [] = field.split('.');
    for (let i = 0; i < fields.length; i++) {
      retVal = retVal[fields[i]];
    }
    return retVal;
  }

  private handleError(error: any) {
    return Observable.throw(error);
  }
}
