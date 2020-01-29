import { Component, OnInit, Input, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import { AlertComponent, AlertType } from 'shared/components';
import {SessionService} from 'core';
import {FilterModel} from 'shared/models/filter.model';
import {SorterModel} from 'shared/models/sorter.model';
import {ErrorHandlerComponent} from 'shared/components/error-handler/error-handler.component';
import {JobService} from '../job.service';
import {JobSessionModel} from '../job-session.model';
import {Subscription} from 'rxjs/Subscription';
import {PaginateConfigModel} from 'shared/models/paginate-config.model';
import {BaseModel} from 'shared/models/base.model';

@Component({
  selector: 'clone-table',
  templateUrl: './clone-table.component.html',
  styleUrls: ['./clone-table.component.scss'],
  providers: [JobService]
})
export class CloneTableComponent implements OnInit, OnDestroy {

  @ViewChild('postRestoreTemplate', {read: TemplateRef}) restoreInfotemplate: TemplateRef<any>;
  @Input() subType: string;
  @Input() enableApplicationServerColumn: boolean = false;
  @Input() enableMountPointColumn: boolean = false;
  @Input() tableType: string;
  // This property is passed in by the parent as array of serviceIds(strings).
  // ex: ['serviceprovider.recovery.hypervisor']
  @Input() serviceIds: Array<string>;
  clones: Array<JobSessionModel>;
  jobPaginateConfig: PaginateConfigModel;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  private transSub: Subscription;
  private jobSub: Subscription;
  private actionsSub: Subscription;
  private infoTitle: string;
  private filters: Array<FilterModel>;
  private sorters: Array<SorterModel>;
  private jobSessionWithPostRestoreInfo: JobSessionModel;

  constructor(private translate: TranslateService,
              private jobService: JobService) {
  }

  ngOnDestroy() {
    if (this.actionsSub) {
      this.actionsSub.unsubscribe();
    }
    if (this.jobSub) {
      this.jobSub.unsubscribe();
    }
    if (this.transSub) {
      this.transSub.unsubscribe();
    }
  }

  info(message: string, title?: string) {
    let me = this;
    if (me.alert)
      me.alert.show(title || me.infoTitle, message);
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  public loadData() {
    let me = this;
    me.jobSub = me.jobService.getJobSessions(undefined, me.filters, me.sorters,
      me.jobPaginateConfig.pageSize(),
      me.jobPaginateConfig.pageStartIndex()).subscribe(
      records => {
        me.clones = records;
        me.jobPaginateConfig.refresh(me.jobService.jobSessionTotalItems);
      },
      err => me.handleError(err)
    );
  }

  trackByModel(idx: number, model: BaseModel) {
    return model.getId();
  }

  ngOnInit() {
    let me = this;

    me.jobPaginateConfig = new PaginateConfigModel({id: 'clone-table'});
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    if (me.subType)
      me.filters = [new FilterModel('serviceId', me.serviceIds, 'IN'),
        new FilterModel('status', 'PENDING'),
        new FilterModel('subType', me.subType)
      ];
    else
      me.filters = [new FilterModel('serviceId', me.serviceIds, 'IN'),
        new FilterModel('status', 'PENDING'),
      ];

    // Initialize sorters.
    me.sorters = [new SorterModel('start', 'DESC')];

    me.transSub = me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg'])
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.loadData();
      });
  }

  private onExecuteAction(href: string): void {
    this.actionsSub = this.jobService.postByUrl(href).subscribe(
      res => this.loadData(),
      err => this.handleError(err));
  }

  private onRestoreInfoClick(jobSession: JobSessionModel): void {
    this.jobSessionWithPostRestoreInfo = jobSession;
    if (this.alert && this.restoreInfotemplate)
      this.alert.show(this.infoTitle, this.restoreInfotemplate, AlertType.TEMPLATE);
  }
}
