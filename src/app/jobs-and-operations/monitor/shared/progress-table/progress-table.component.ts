import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Sortable, SortUtil } from 'shared/util/sortable';
import { JobSessionModel } from 'job/shared/job-session.model';
import { ProgressTableResourcesModel } from './progress-table-resources.model';
import { ProgressTableResourceModel } from './progress-table-resource.model';
import { SorterModel } from 'shared/models/sorter.model';
import { SharedService } from 'shared/shared.service';
import { ProgressTableService } from './progress-table.service';
import { FileSizePipe } from 'shared/pipes';
import { FilterModel } from 'shared/models/filter.model';
import { PaginateConfigModel } from 'shared/models/paginate-config.model';
import { PagingToolbarComponent, ErrorHandlerComponent } from 'shared/components';
import { SessionService } from 'core';

@Component({
    selector: 'progress-table',
    templateUrl: './progress-table.component.html',
    styleUrls: ['./progress-table.component.scss']
})
export class ProgressTableComponent implements OnInit, Sortable {

    @Input() jobSession: JobSessionModel;
    @Input() isCollapsed: boolean;
    @Input() filters: Array<FilterModel>;
    @Input() isDifferentJobSessionClicked: boolean = false;
    @ViewChild(PagingToolbarComponent) pagingToolbar: PagingToolbarComponent;
    @ViewChild('infiniteScrollContainer') infiniteScrollContainer: ElementRef;

    private progressDataResources: ProgressTableResourcesModel = undefined;
    private progressDataResource: Array<ProgressTableResourceModel>;
    private progressTransition: boolean = true;
    private sorters: Array<SorterModel>;
    private vmName: SorterModel;
    private isModelLoading: boolean = false;
    private fileSize: FileSizePipe = undefined;
    private entryStartIndex: number = 0;
    private jumpToPending: boolean = false;
    private subs: any[] = [];
    private mask: boolean = false;
    paginationId: string = `progress-table-pagination-${(new Date()).valueOf()}`;
    paginateConfig: PaginateConfigModel;
    errorHandler: ErrorHandlerComponent;

    get infiniteScrollingMode(): boolean {
        return this.pagingToolbar ? this.pagingToolbar.isInfiniteScrollingMode : false;
    }

    get displayedCount(): number {
        return this.progressDataResources && this.progressDataResources.vmsummarys ? this.progressDataResources.vmsummarys.length : 0;
    }

    set infiniteScrollLoadingIndicator(status: boolean) {
        if (this.pagingToolbar) {
            this.pagingToolbar.infiniteScrollLoadingIndicator = status;
        }
    }

    set infiniteScrollDisabled(disabled: boolean) {
        if (this.pagingToolbar) {
            this.pagingToolbar.infiniteScrollDisabled = disabled;
        }
    }

    constructor(private progressTableService: ProgressTableService) {
        this.init();
    }

    ngOnInit() {
        let me = this;
        me.vmName = new SorterModel('vmName', 'ASC');
        me.sorters = [new SorterModel('vmName', 'ASC')];
        this.errorHandler = SessionService.getInstance().context['errorHandler'];
    }

    loadData(jobSession?: JobSessionModel, jumpToStartIndex?: number) {
        this.mask = true;
        let me = this, jumpTo = jumpToStartIndex !== undefined,
            startIndex = jumpTo ? jumpToStartIndex : this.paginateConfig.pageStartIndex();
        me.jobSession = jobSession;
        if (me.jobSession) {
            this.progressTableService.getVms(me.jobSession.id, me.jobSession.jobId, me.filters, me.sorters, this.paginateConfig.pageSize(),
                startIndex).subscribe(
                    resources => {
                        this.mask = false;
                        this.progressDataResources = resources;
                        this.progressDataResource = this.progressDataResources.vmsummarys;
                        this.paginateConfig.refresh(resources.total);
                        this.entryStartIndex = startIndex;
                        if (jumpTo) {
                            this.jumpToPending = true;
                            this.resetScroll();
                        } else {
                            this.jumpToPending = false;
                        }
                        this.infiniteScrollDisabled = false;
                    }, error => {
                        this.mask = false;
                        this.errorHandler.handle(error);
                    });
        }
    }

    onPageChange(pageNumber: number): void {
        this.paginateConfig.pageChanged(pageNumber);
        this.loadData(this.jobSession);
    }

    isAsc(name: string): boolean {
        return SortUtil.has(this.sorters, name, false);
    }

    isDesc(name: string): boolean {
        return SortUtil.has(this.sorters, name, true);
    }

    onSort(name: string): void {
        this.changeSorter(name);
        SortUtil.toggle(this.sorters, name);
        this.loadData(this.jobSession);
    }

    private changeSorter(name: string): void {
        if (name === 'vmName') {
            this.sorters = [this.vmName];
        }
    }

    private ellipsisPath(value: string, length: number, secondValue?: string): string {
        return SharedService.ellipsisPath(value, length);
    }

    getBarLabel(value: ProgressTableResourceModel): string {
        let me = this;
        return SharedService.formatString('{0}%', value.percentageCompleted);
    }

    getCapacityLabel(value: ProgressTableResourceModel): string {
        let totalDisp = this.fileSize.transform(100);
        let usedDisp = this.fileSize.transform((value.percentageCompleted));
        return SharedService.formatString('{0}/{1}', usedDisp, totalDisp);
    }

    applyFilters(progressFilters: Array<FilterModel>, preventLoadData?: boolean): void {
        this.filters = [];
        this.filters.push(...progressFilters);
        if (!preventLoadData) {
            this.loadData(this.jobSession);
        }
    }

    private init() {
        this.paginateConfig = new PaginateConfigModel({ id: this.paginationId });
        this.filters = undefined;
        this.pageReset();
    }

    private pageReset() {
        this.paginateConfig.reset();
    }

    private resetScroll(): void {
        if (this.pagingToolbar)
            this.pagingToolbar.scrollToTop();
    }

    onScrollDown(): void {
        this.onInfiniteScroll(false);
    }

    onScrollUp(): void {
        if (this.jumpToPending) {
            this.jumpToPending = false;
            return;
        }
        this.onInfiniteScroll(true);
    }

    private hasPrevPage(): boolean {
        return this.entryStartIndex > 0;
    }

    private hasNextPage(): boolean {
        return this.entryStartIndex + this.displayedCount < this.paginateConfig.totalItems;
    }

    private infiniteScrollPageSize(up: boolean): number {
        let me = this, pageSize = me.paginateConfig.pageSize();
        return up ? (me.entryStartIndex >= pageSize ? pageSize : me.entryStartIndex) : pageSize;
    }

    private onInfiniteScroll(up: boolean): void {
        let me = this, pageStartIndex;
        if (!up && !me.hasNextPage() || up && !me.hasPrevPage()) {
            return;
        }
        me.infiniteScrollLoadingIndicator = true;
        if (!up) {
            me.paginateConfig.currentPage++;
        }
        pageStartIndex = me.infiniteScrollPageStartIndex(up);
        me.subs.push(me.progressTableService.getVms(me.jobSession.id, me.jobSession.jobId, me.filters, me.sorters, me.infiniteScrollPageSize(up), pageStartIndex)
            .subscribe(
                model => {
                    me.paginateConfig.refresh(model.total);
                    if (me.progressDataResources) {
                        up ? me.onScrollUpTable(model) : me.onScrollDownTable(model);
                    }
                    if (up) {
                        me.entryStartIndex = pageStartIndex;
                    }
                    me.infiniteScrollLoadingIndicator = false;
                },
                err => {
                    me.infiniteScrollLoadingIndicator = false;
                    this.errorHandler.handle(err);
                }
            ));
    }

    private infiniteScrollPageStartIndex(up: boolean): number {
        let me = this, pageSize = me.paginateConfig.pageSize();
        return up ? (me.entryStartIndex >= pageSize ? me.entryStartIndex - pageSize : 0) :
            me.entryStartIndex + me.displayedCount;
    }

    private onScrollUpTable(model: ProgressTableResourcesModel) {
        let me = this,
            count = me.getModelRecordCount(model);
        if (count > 0) {
            me.prependPageRecords(model);
        }
    }

    private onScrollDownTable(model: ProgressTableResourcesModel) {
        let me = this,
            count = me.getModelRecordCount(model);
        if (count > 0) {
            me.appendPageRecords(model);
        }
    }

    private appendPageRecords(model: ProgressTableResourcesModel): void {
        this.addPageRecords(false, model);
    }

    private prependPageRecords(model: ProgressTableResourcesModel): void {
        this.addPageRecords(true, model);
    }

    private getModelRecordCount(model: ProgressTableResourcesModel): number {
        return model && model.vmsummarys ? model.vmsummarys.length : 0;
    }

    private addPageRecords(up: boolean, model: ProgressTableResourcesModel): void {
        let me = this;
        if (up) {
            me.progressDataResources.vmsummarys.unshift(...(model.vmsummarys || []).reverse());
        } else {
            me.progressDataResources.vmsummarys.push(...(model.vmsummarys || []));
        }
    }

    private getColspan() {
        if (this.isCollapsed) {
            return 3;
        } return 5;
    }

    private getVsnapVolumes(vsnapVolumesObj) {
        let vsnapVolume: string = '';
        for (const key in vsnapVolumesObj) {
            if (vsnapVolumesObj.hasOwnProperty(key)) {
                vsnapVolume += key + ' - ' + vsnapVolumesObj[key] + ';' + '\n';
            }
        }
        return vsnapVolume;
    }

}
