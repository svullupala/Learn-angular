import {Injectable} from '@angular/core';
import 'rxjs/Rx';
import {Observable} from 'rxjs/Observable';
import {RestService} from 'core';
import {BaThemeConfigProvider} from 'theme';

@Injectable()
export class DashboardService {
  private dashcolors: any;
  private colors: string[] = [];
  private dbAggregateApi: string = 'api/endeavour/catalog/application/database?action=aggregate';
  private dbProtectedApi: string = 'api/endeavour/catalog/recovery/applicationdatabase?action=aggregate';

  get proxy(): RestService {
    return this.rest;
  }

  constructor(private rest: RestService, private theme: BaThemeConfigProvider) {
    this.initColor();
  }

  public getColor(order: number): string {
    if (order < this.colors.length) {
      return this.colors[order];
    }

    return 'grey';
  }

  public getGoldColor(): string {
    return this.dashcolors.ecxgold;
  }

  public getSilverColor(): string {
    return this.dashcolors.ecxsilver;
  }

  public getBronzeColor(): string {
    return this.dashcolors.ecxbronze;
  }

  public getPrimaryColor(): string {
    return this.theme.get().colors.primary;
  }

  public getWarningColor(): string {
    return this.theme.get().colors.warning;
  }

  public getDangerColor(): string {
    return this.theme.get().colors.danger;
  }

  public getSuccessColor(): string {
    return this.theme.get().colors.dashboard.successColor;
  }

  public getFailedStatusColor(): string {
    return this.theme.get().colors.dashboard.failedColor;
  }

  public getWarningStatusColor(): string {
    return this.theme.get().colors.dashboard.warningColor;
  }

  public getSuccessLightColor(): string {
    return this.theme.get().colors.dashboard.successLight;
  }

  public getFailedLightColor(): string {
    return this.theme.get().colors.dashboard.failedLight;
  }

  public getWarningLightColor(): string {
    return this.theme.get().colors.dashboard.warningLight;
  }

  public getAggrCount(api: string, field: string): Observable<AggrCountResult> {
    this.rest.setNoAuditHeader(true);
    return this.rest.post(api + '?action=aggregate', this.createAggrCountPostBody(field)).map(
      res => {
        let retVal: AggrCountResult = new AggrCountResult();
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

  public getDbAggrCount(field: string, type: string = 'aggregate',
                        getGroupPostBody: boolean = false): Observable<any> {
    let api: string,
        group: string = 'protectionInfo.storageProfileName',
        postBody: object = getGroupPostBody
          ? (this.createAggrGroupCountPostBody(field, group))
          : (this.createAggrCountPostBody(field));
    api = this.dbAggregateApi;
    this.rest.setNoAuditHeader(true);
    if (type === 'protection') {
      api = this.dbProtectedApi;
    }
    return this.rest.post(api, postBody).map(
      res => {
        // this is horrible but we going to scrap this post 10.1.1 anyway :)
        if (getGroupPostBody) {
          let retVal: AggrCountResult[] = [];
          let body = res;
          let result: AggrCountResult;
          for (let i = 0; i < body.results.length; i++) {
            result = new AggrCountResult();
            result.count = body.results[i].count;
            result.group = this.getValue(body.results[i]._id, group);
            if (result.group !== undefined && result.count !== undefined) {
              retVal.push(result);
            }
          }
          return retVal;
        } else {
          let retVal: AggrCountResult = new AggrCountResult();
          let body = res;
          retVal.responseJson = body;
          if (body.results.length > 0) {
            retVal.count = body.results[0].count;
          } else {
            retVal.count = 0;
          }

          return retVal;
        }
      }
    ).catch(this.handleError);
  }

  public getAggrGroupCount(api: string, field: string, group: string): Observable<AggrCountResult[]> {
    this.rest.setNoAuditHeader(true);
    return this.rest.post(api + '?action=aggregate', this.createAggrGroupCountPostBody(field, group)).map(
      res => {
        let retVal: AggrCountResult[] = [];
        let body = res;
        let result: AggrCountResult;
        for (let i = 0; i < body.results.length; i++) {
            result = new AggrCountResult();
            result.count = body.results[i].count;
            result.group = this.getValue(body.results[i]._id, group);
            if (result.group !== undefined && result.count !== undefined) {
              retVal.push(result);
            }
        }

        return retVal;
      }
    ).catch(this.handleError);

    /*  TODO DUMMY DATA
    return Observable.of([new AggrCountResult()]).map(
      () => {
        let retVal: AggrCountResult[] = [];
        let i: AggrCountResult = new AggrCountResult();
        i.count = this.getRandom();
        i.group = 'Gold';
        retVal.push(i);

        i = new AggrCountResult();
        i.count = this.getRandom();
        i.group = 'Silver';
        retVal.push(i);

        i = new AggrCountResult();
        i.count = this.getRandom();
        i.group = 'Bronze';
        retVal.push(i);


        i = new AggrCountResult();
        i.count = this.getRandom();
        i.group = 'Finance';
        retVal.push(i);

        i = new AggrCountResult();
        i.count = this.getRandom();
        i.group = 'Support';
        retVal.push(i);

        i = new AggrCountResult();
        i.count = this.getRandom();
        i.group = 'Development';
        retVal.push(i);

        return retVal;
      }
    );
    */
  }


  public getTotal(api: string, filter: any): Observable<TotalResult> {
    this.rest.setNoAuditHeader(true);
    return this.rest.getAll(api, [filter]).map(
      res => {
        let retVal: TotalResult = new TotalResult();
        let body = res;
        retVal.responseJson = body;
        retVal.total = body.total;

        return retVal;
      }
    );
  }

  private createAggrCountPostBody(field: string): any {
    return {
      'op': [
        {
          'operation': 'count',
          'fieldname': field,
          'outputname': 'count'
        }
      ]
    };
  }

  private createAggrGroupCountPostBody(field: string, group: string): any {
    return {
      'op': [
        {
          'operation': 'count',
          'fieldname': field,
          'outputname': 'count'
        }
      ],
      'group': [group]
    };
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
    let retVal: any =  value;
    let fields: string [] = field.split('.');
    for (let i = 0; i < fields.length; i++) {
      retVal = retVal[fields[i]];
    }

    return retVal;
  }

  /*  TODO DUMMY DATA
  private getRandom(): number {
    return Math.floor(Math.random() * 500);
  }
   */

  private handleError(error: any) {
    return Observable.throw(error);
  }
}

export class AggrCountResult {
  public group: string = undefined;
  public count: number = undefined;
  public responseJson: any = undefined;
}

export class TotalResult {
  public total: number = undefined;
  public responseJson: any = undefined;
}
