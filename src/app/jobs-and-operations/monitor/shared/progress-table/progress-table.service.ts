import { Injectable } from '@angular/core';
import { RestService } from 'core';
import { FilterModel } from 'shared/models/filter.model';
import { SorterModel } from 'shared/models/sorter.model';

@Injectable()
export class ProgressTableService {

    private static API: string = 'api/hypervisor/vmsummary';
    private static API2: string = 'api/endeavour/jobsession'
    constructor(private rest: RestService) { }

    getVms(jobSessionId: string, jobId: string, filters?: FilterModel[], sorters?: SorterModel[], pageSize?: number, pageOffset?: number) {
        let _filter = null, _sorters = null, _pageSize = null, _pageOffset = null;
        if (filters !== undefined) {
            _filter = FilterModel.array2json(filters);
        }
        if (sorters !== undefined) {
            _sorters = SorterModel.array2json(sorters);
        }
        if (pageSize !== undefined) {
            _pageSize = pageSize;
        }
        if (pageOffset !== undefined) {
            _pageOffset = pageOffset;
        }
        return this.rest.getAll(`${ProgressTableService.API}?jobSessionId=${jobSessionId}`, _filter, _sorters, _pageSize, _pageOffset);
    }

}