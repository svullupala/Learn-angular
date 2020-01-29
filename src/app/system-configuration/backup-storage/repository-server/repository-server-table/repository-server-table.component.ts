import {
  Component, OnDestroy, OnInit, ViewChild, ElementRef, Renderer2, Input, Output, EventEmitter
} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { PaginateModel } from 'shared/models/paginate.model';
import { AlertComponent, AlertType, ErrorHandlerComponent } from 'shared/components';
import { LinkModel } from 'shared/models/link.model';
import { Subject } from 'rxjs/Subject';
import { CloudService } from 'cloud/cloud.service';
import { TranslateService } from '@ngx-translate/core';
import { SessionService } from 'core/session.service';
import { SharedService } from 'shared/shared.service';
import { CloudModel } from 'cloud/cloud.model';
import { CloudsModel } from 'cloud/clouds.model';
import { FilterModel } from 'shared/models/filter.model';

@Component({
  selector: 'repository-table',
  templateUrl: 'repository-server-table.component.html'
})

export class RepositoryServerTableComponent {
  @Output() editCloudEvent: EventEmitter<CloudModel> = new EventEmitter<CloudModel>();
  private model: PaginateModel<CloudModel>;
  private errorHandler: ErrorHandlerComponent;
  private alert: AlertComponent;
  private currentLink: LinkModel;
  private filters: Array<FilterModel> = [];
  private subs: Subject<void> = new Subject<void>();
  private textUnregisterConfirm: string;
  private textConfirm: string;
  private textRepositorySucceedUnregisterTpl: string;
  private textInfo: string;
  private masked: boolean = false;
  private canCreate: boolean = false;

  constructor(private cloudService: CloudService, private translate: TranslateService) {
    let paginationId: string = `cloud-table-pagination-${(new Date()).valueOf()}`;
    this.model = new PaginateModel({id: paginationId, classObject: CloudsModel, relyOnPageLinks: true});
  }

  ngOnInit() {
    this.translate.get([
      'common.textUnregisterConfirm',
      'common.infoTitle',
      'common.textConfirm',
      'repositoryserver.textRepositorySucceedUnregisterTpl'
    ]).takeUntil(this.subs)
      .subscribe((resource: Object) => {
        this.textConfirm = resource['common.textConfirm'];
        this.textInfo = resource['common.infoTitle'];
        this.textUnregisterConfirm = resource['common.textUnregisterConfirm'];
        this.textRepositorySucceedUnregisterTpl = resource['repositoryserver.textRepositorySucceedUnregisterTpl'];
      });
    this.errorHandler = SessionService.getInstance().context['errorHandler'];
    this.alert = SessionService.getInstance().context['msgbox.alert'];
    this.filters.push(new FilterModel('provider', 'sp', 'IN'));
    this.getClouds();
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  public canCreateCloud(): boolean {
    return this.canCreate;
  }

  public getClouds(): void {
    this.mask();
    this.cloudService.getCloudServers(this.filters).takeUntil(this.subs).
    subscribe(
      (dataset: CloudsModel) => {
        this.model.reset();
        this.model.update(dataset);
        this.model.refresh(dataset.total);
        this.canCreate = dataset.hasLink('create');
        this.unmask();
      },
      (err) => {
        this.unmask();
        this.handleError(err);
      }
    );
  }

  private refresh(link: LinkModel): void {
    let me = this, ds = me.model.dataset, observable: Observable<CloudsModel>;

    if (!ds)
      return;
    me.mask();
    observable = ds.getPageByLink<CloudsModel>(CloudsModel, link);
    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          me.model.update(dataset);
          me.model.refresh(dataset.total);
        },
        err => {
          me.unmask();
          me.handleError(err, false);
        },
        () => {
          me.unmask();
        }
      );
    } else {
      me.unmask();
    }
  }

  private onRefresh(): void {
    let me = this;
    if (me.currentLink) {
      me.refresh(me.currentLink);
    } else {
      me.getClouds();
    }
  }

  private onPageChange(param: { page: number, link: LinkModel }): void {
    this.currentLink = param.link;
    this.unmask();
  }

  private onUnregisterCloud(cloud: CloudModel): void {
    let confirmMsg: string = SharedService.formatString(this.textUnregisterConfirm, cloud.name),
      unregisterFeebackMsg: string = SharedService.formatString(this.textRepositorySucceedUnregisterTpl, cloud.name);
    this.confirm(confirmMsg, () => {
      this.cloudService.unregisterCloud(cloud).takeUntil(this.subs).
      subscribe(() => {
          this.info(unregisterFeebackMsg);
          this.getClouds();
        },
        (err) => this.handleError(err)
      );
    });
  }

  private onEditCloudClick(cloud: CloudModel): void {
    this.editCloudEvent.emit(cloud);
  }

  private confirm(message: string, handler: Function, discardHandler?: Function) {
    let me = this;
    if (me.alert)
      me.alert.show(me.textConfirm, message, AlertType.UNREGISTER, handler, discardHandler);
  }

  private info(message: string, title?: string) {
    let me = this;
    if (me.alert) {
      me.alert.show(title || me.textInfo, message);
    }
  }

  private handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  private mask(): void {
    this.masked = true;
  }

  private unmask(): void {
    this.masked = false;
  }

  private trackByFn(idx: number, item: CloudModel): string {
    return item && item.id;
  }
}
