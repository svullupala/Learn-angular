import {Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import 'rxjs/Rx';
import {Observable} from 'rxjs/Observable';
import {JsonConvert} from 'json2typescript';
import {RestService} from 'core';
import {DatasetModel} from 'shared/models/dataset.model';
import {CatalogResourcesModel} from './catalog-resources.model';
import {isNumber} from 'util';

@Injectable()
export class CatalogSearchService {

  get proxy(): RestService {
    return this.core;
  }

  constructor(private core: RestService) {
  }


  /**
   * Gets the endpoint of ECX web service.
   * @returns {string}
   */
  getEcxServiceEndpoint(): string {
    return this.core.getBaseUrl();
  } 

  searchVms(namePattern: string,
         page?: number,
         pageSize: number = RestService.pageSize): Observable<CatalogResourcesModel> {
    let me = this, 
       api = `api/hypervisor/search?resourceType=vm&from=recovery`, pageStartIndex: number; 

		return this.search(namePattern, api, page, pageSize, (response: Object) => {
				const data = response;
				let resources: CatalogResourcesModel = JsonConvert.deserializeObject(data, CatalogResourcesModel);
				resources.results = resources.vms;
				return resources;
			});
  }

  searchDatabases(namePattern: string,
         page?: number,
         pageSize: number = RestService.pageSize): Observable<CatalogResourcesModel> {
    let me = this, api = `api/application/search?resourceType=database&from=recovery`, pageStartIndex: number;

		return this.search(namePattern, api, page, pageSize, (response: Object) => {
					const data = response;
					let resources: CatalogResourcesModel =  JsonConvert.deserializeObject(data, CatalogResourcesModel);
					resources.results = resources.contents;
					return resources;
       });
  }

  private getPageStartIndex(page: number, pageSize: number): number {
		if (isNumber(page)) {
    	return (page - 1) * pageSize; 
		}

		return 0;
  }

  private search(namePattern: string, 
			api: string,
			page: number,
			pageSize: number,
			mapfunction: any): Observable<CatalogResourcesModel> {
    let me = this, pageStartIndex: number;

    pageStartIndex = me.getPageStartIndex(page, pageSize);
    api += `&pageSize=${pageSize}&pageStartIndex=${pageStartIndex}`;


    return me.core.post(api, {
      name: (namePattern) ? namePattern : '*'
    }).map(mapfunction).catch((error: HttpErrorResponse) => Observable.throw(error)); 
  }
}
