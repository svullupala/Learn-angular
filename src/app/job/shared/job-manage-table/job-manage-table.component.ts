import {Component, Input, Output, OnInit, ViewChild, ElementRef, OnDestroy, EventEmitter} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {JsonConvert} from 'json2typescript';
import {AlertType, AlertComponent, ErrorHandlerComponent} from 'shared/components';
import {SharedService} from 'shared/shared.service';
import {SessionService} from 'core';
import {FilterModel} from 'shared/models/filter.model';
import {SorterModel} from 'shared/models/sorter.model';
import {PaginateConfigModel} from 'shared/models/paginate-config.model';
import {Subscription} from 'rxjs/Subscription';
import {DefineSchedule} from 'shared/components/define-schedule/define-schedule.component';
import {JobService} from '../job.service';
import {JobModel} from '../job.model';
import {RestService} from 'core';
import {PolicyModel} from '../policy.model';
import {ScheduleModel} from 'shared/components/define-schedule/schedule.model';

@Component({
  selector: 'job-manage',
  templateUrl: './job-manage-table.component.html',
  styleUrls: ['./job-manage-table.component.scss'],
})
export class JobManageComponent implements OnInit, OnDestroy {


  @Input() providerType: string;
  @Input() providerEndPoint: string;
  @Input() isEdit: boolean = false;
  @Input() sources: Array<any> = [];
  @Output() onSave = new EventEmitter();
  @Output() onEdit = new EventEmitter<JobModel>();
  @ViewChild(DefineSchedule) triggerComponent: DefineSchedule;
  @ViewChild('schedulerestoreoptions') editor: ElementRef;

  records: Array<any>;
  paginateConfig: PaginateConfigModel;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;

  private onManageClick: boolean = false;
  private scheduleName: string = '';
  private getSub: Subscription;
  private updateSub: Subscription;
  private deleteSub: Subscription;
  private regSub: Subscription;
  private editSub: Subscription;
  private textEditRestore: string;
  private textCreateRestore: string;
  private infoTitle: string;
  private processingRequestMsg: string;
  private registrationSucceedMsg: string;
  private textDeleteSuccessTpl: string;
  private textConfirm: string;
  private textConfirmUnregister: string;
  private filters: Array<FilterModel>;
  private sorters: Array<SorterModel>;
  private maskList: boolean = false;
  private maskOptions: boolean = false;
  private editorExpanded: boolean = false;

  constructor(public translate: TranslateService,
              public rest: RestService,
              public jobService: JobService) {
    let paginationId: string = `jon-manage-table-pagination-${(new Date()).valueOf()}`;
    this.paginateConfig = new PaginateConfigModel({id: paginationId});
  }

  info(message: string, title?: string) {
    let me = this;
    if (me.alert) {
      me.alert.show(title || me.infoTitle, message);
    }
  }

  confirm(item: any, handler: Function, msg?: string) {
    let me = this;
    if (me.alert) {
      if (item !== undefined) {
        me.alert.show(me.textConfirm, SharedService.formatString(msg || me.textConfirmUnregister, item.name),
          AlertType.CONFIRMATION, handler);
      } else if (typeof msg === 'string') {
        me.alert.show(me.textConfirm, msg, AlertType.CONFIRMATION, handler);
      }
    }
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  loadData(resetPage: boolean = true) {
    let me = this;
    if (resetPage)
      me.paginateConfig.reset();
    me.maskList = true;
    me.getSub = me.jobService.getJobsFromNode(me.providerType, me.providerEndPoint, me.filters, undefined, undefined,
      me.paginateConfig.pageStartIndex())
      .subscribe(
        dataset => {
          me.maskList = false;
          me.records = <Array<any>> dataset.records;
          me.paginateConfig.refresh(dataset.total);
        },
        err => {
          me.maskList = false;
          me.handleError(err);
        }
      );
  }

  onPageChange(page: number): void {
    let me = this;
    me.paginateConfig.pageChanged(page);
    // console.log('page=' + page + ', pageStartIndex=' + me.paginateConfig.pageStartIndex());
    me.onRefresh();
  }

  onRefresh(): void {
    this.loadData(false);
  }

  ngOnDestroy() {
    if (this.updateSub) {
      this.updateSub.unsubscribe();
    }
    if (this.getSub) {
      this.getSub.unsubscribe();
    }
    if (this.deleteSub) {
      this.deleteSub.unsubscribe();
    }
    if (this.regSub) {
      this.regSub.unsubscribe();
    }
    if (this.editSub) {
      this.editSub.unsubscribe();
    }
  }

  ngOnInit() {
    let me = this;
    me.filters = [
      new FilterModel('name', 'onDemandRestore*', '<>')
    ];
    me.sorters = [
      new SorterModel('name', 'ASC')
    ];
    me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'common.textConfirmDelete',
      'common.textEditRestore',
      'common.textCreateRestore',
      'common.textDeleteSuccessTpl',
      'common.textConfirm'])
      .subscribe((resource: Object) => {
        me.textEditRestore = resource['common.textEditRestore'];
        me.textCreateRestore = resource['common.textCreateRestore'];
        me.infoTitle = resource['common.infoTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textConfirmUnregister = resource['common.textConfirmDelete'];
        me.textDeleteSuccessTpl = resource['common.textDeleteSuccessTpl'];
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.loadData();
  }

  public getScheduleName(): string {
    return typeof this.scheduleName === 'string' ? this.scheduleName.trim() : '';
  }

  public resetScheduleName(): void {
    this.scheduleName = '';
  }

  public getSchedule() {
    return this.triggerComponent && this.triggerComponent.getSchedule();
  }

  public resetSchedule(): void {
    this.triggerComponent.resetSchedule();
  }

  public setScheduleName(name: string): void {
    this.scheduleName = name;
  }

  public setSchedule(trigger: Object): void {
    this.triggerComponent.model = JsonConvert.deserializeObject(trigger, ScheduleModel);
    this.triggerComponent.parseDate();
  }

  private onDeleteClick(item: JobModel): void {
    let me = this;

    me.confirm(item, function () {
      me.maskList = true;
      me.deleteSub = me.jobService.deleteJobsFromNode(me.providerEndPoint, item.name).subscribe(
        () => {
          me.maskList = false;
          me.info(SharedService.formatString(me.textDeleteSuccessTpl, item.name));
          me.loadData();
        },
        err => {
          me.maskList = false;
          me.handleError(err);
        }
      );
    });
  }

  private onEditClick(item: JobModel) {
    let me = this;
    me.jobService.sendPolicyDefinition(item);
    me.onEdit.emit(item);
  }

  private onSaveClick() {
    this.onSave.emit();
    this.switchEditor();
  }

  private getEditor(): any {
    let me = this, element = me.editor && me.editor.nativeElement;
    return element;
  }

  private switchEditor(): void {
    let me = this, element = me.getEditor();
    if (element) {
      $(element).toggle();
      this.editorExpanded = !this.editorExpanded;
    }
  }

  private isValid(): boolean {
    return !!(this.sources && this.sources.length > 0
      && this.triggerComponent.isValid() && this.scheduleName.length > 0);
  }
}
