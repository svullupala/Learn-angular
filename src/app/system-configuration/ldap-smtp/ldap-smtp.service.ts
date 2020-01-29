import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import 'rxjs/Rx';
import { NodeService } from 'core';
import { RestService } from 'core';
import { Observable } from 'rxjs/Observable';
import { LdapsModel } from './ldaps.model';
import { LdapModel } from './ldap.model';
import { SmtpsModel } from './smtps.model';
import { SmtpModel } from './smtp.model';
import { UserModel } from './user.model';

import { JsonConvert } from 'json2typescript';
import { LdapGroupsModel } from './ldapGroups.model';
import { SorterModel } from 'shared/models/sorter.model';
import { FilterModel } from 'shared/models/filter.model';

import { SharedService} from 'shared/shared.service';


@Injectable()
export class LdapSmtpService {
  private ldapApi: string = 'api/ldap';
  private smtpApi: string = 'api/smtp';
  private ldapNodeApi: string = 'ngp/ldap';
  private smtpNodeApi: string = 'ngp/smtp';
  private identityApi: string = 'api/identity/user';

  constructor(private rest: RestService, private node: NodeService) { }

  public getUsers(): Observable<UserModel[]> {
    return this.rest.getAll(this.identityApi)
      .map((res: any) => {
        let retVal: UserModel[] = [];
        let entities: any[] = res.users;
        for (let i = 0; i < entities.length; i++) {
          retVal.push(JsonConvert.deserializeObject(entities[i], UserModel));
        }

        return retVal;
      }).catch(this.handleError);
  }

  public getSmtpEntries(): Observable<SmtpsModel> {
    return Observable.create(observer => {
      this._getSmtpEntries().subscribe(
        smtpEntries => {
          let entries: Array<SmtpModel> = smtpEntries.getRecords();
          for (var i = 0; i < entries.length; i++) {
            let entry: SmtpModel = entries[i];
            if (entry.user) {
              this.getUsername(entry.user.href).subscribe(
                name => {
                  entry.username = name;
                },
                err => {
                  this.handleError(err);
                }
              );
            }

            this._getSmtpDetail(entry.getUrl('self')).subscribe(
              detail => {
                entry.portNumber = detail.portNumber;
                entry.timeout = detail.timeout;
                entry.fromAddress = detail.fromAddress;
                entry.subjectPrefix = detail.subjectPrefix;
              },
              err => {
                this.handleError(err);
              }
            );

          }

          smtpEntries.smtps = entries;
          observer.next(smtpEntries);
          observer.complete();
        },
        err => {
          this.handleError(err);
        }
      );

    });
  }

  public getLdapEntries(): Observable<LdapsModel> {
    return this.rest.getAll(this.ldapApi, null, null, null, null)
      .map((res: Object) => {
        return JsonConvert.deserializeObject(res, LdapsModel);
      }).catch(this.handleError);
  }

  public getLdapGroups(ldap: LdapModel, namePattern?: string, relativePath?: string): Observable<LdapGroupsModel> {
    let sorters: SorterModel = new SorterModel('name', 'ASC'),
      filters: FilterModel = new FilterModel('provisioned', 'false'), url;
 
    url = this.buildUrl(ldap.getUrl('groups'), namePattern, relativePath);

    return this.rest.getByUrl(url, [filters], [sorters], null, null)
      .map((res: Object) => {
        return JsonConvert.deserializeObject(res, LdapGroupsModel);
      }).catch(this.handleError);
  }

  private buildUrl(url: string, namePattern?: string, relativePath?: string) {
    let retVal = new URL(url);
   
    if (namePattern) {
      retVal.searchParams.append('search', '*' + namePattern + '*');
    } 

    if (relativePath) {
      retVal.searchParams.append('relativebase', relativePath);
    }
    
    return retVal;
  }

  public getUsername(href: string): Observable<string> {
    return this.rest.getByUrl(href).map(this.extractUsername).catch(this.handleError);
  }

  public registerSmtp(values: any): Observable<Object> {
    values = this.processUserCredentials(values);
    values = this.processFromAddress(values);
    return this.node.post(this.smtpNodeApi, values);
  }

  public registerLdap(values: any): Observable<Object> {
    values = this.processUserCredentials(values);
    return this.node.post(this.ldapNodeApi, values);
  }

  public unregisterSmtp(id: number): Observable<Object> {
    return this.rest.delete(this.smtpApi, id.toString());
  }

  public unregisterLdap(id: number): Observable<Object> {
    return this.rest.delete(this.ldapApi, id.toString());
  }

  public updateLdap(values: any): Observable<Object> {
    values = this.processUserCredentials(values);
    return this.node.put(this.ldapNodeApi, values.id, values);
  }

  public updateSmtp(values: any): Observable<Object> {
    values = this.processUserCredentials(values);
    values = this.processFromAddress(values);
    return this.node.put(this.smtpNodeApi, values.id, values);
  }

  public testSMTP(smtp: SmtpModel, values: any): Observable<Object> {
    return this.rest.postByUrl(smtp.getUrl('test'), values);
  }

  public getSMTPTest(url: string): Observable<Object> {
    return this.rest.getByUrl(url);
  }

  private processFromAddress(values: any): any {
    if (values.fromAddress) {
      values.fromAddress = values.fromAddress.trim();
    }

    return values;
  }

  private processUserCredentials(values: any): any {
    if (values.existingUser) {
      values.username = values.existingUser;
      delete values.password;
    }

    return values;
  }

  private _getSmtpEntries(): Observable<SmtpsModel> {
    return this.rest.getAll(this.smtpApi, null, null, RestService.pageSize, null)
      .map((res: Object) => {
        return JsonConvert.deserializeObject(res, SmtpsModel);
      }).catch(this.handleError);
  }

  private _getSmtpDetail(href: string): Observable<SmtpModel> {
    return this.rest.getByUrl(href).map(this.extractData).catch(this.handleError);
  }

  private extractUsername(res: any) {
    let body = res;
    return body.username || {};
  }

  private extractData(res: any) {
    let body = res;
    return body || {};
  }

  private handleError(error: any) {
    return Observable.throw(error);
  }


}
