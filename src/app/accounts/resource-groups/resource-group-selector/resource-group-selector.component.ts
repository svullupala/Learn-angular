import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { ErrorHandlerComponent } from 'shared/components/error-handler/error-handler.component';
import { AlertComponent } from 'shared/components/msgbox/alert.component';
import { SessionService } from 'core';
import { RestService } from 'core';
import { ResourceGroupsService } from '../resource-groups.service';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'resource-group-selector',
  templateUrl: './resource-group-selector.component.html'
})

export class ResourceGroupSelectorComponent implements OnInit, OnDestroy {
  @Input() hideBorder: boolean = false;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  private subs: Subject<void> = new Subject<void>();
  private borderClass: string;
  private infoTitle: string;
  private resourceType: string;
  private masked: boolean = false;

  constructor(private rest: RestService,
              private resourceGroupsService: ResourceGroupsService,
              private translate: TranslateService) {
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  info(message: string, title?: string) {
    let me = this;
    if (me.alert) {
      me.alert.show(title || me.infoTitle, message);
    }
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  ngOnInit(): void {
    let me = this;

    if (me.hideBorder) {
      me.borderClass = 'no-border';
    }
    me.translate.get([
      'common.infoTitle'
    ]).takeUntil(me.subs).subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.resourceGroupsService.handleErrorSub.takeUntil(me.subs).subscribe(
      (err: any) => me.handleError(err)
    );
    me.resourceGroupsService.handleNodeErrorSub.takeUntil(me.subs).subscribe(
      (err: any) => me.handleError(err, true)
    );
    me.resourceGroupsService.resetSub.takeUntil(me.subs).subscribe(
      () => me.reset()
    );
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  private loadData(): void {
    this.resourceGroupsService.loadData(this.resourceType);
  }

  private reset(): void {
    this.resourceType = undefined;
  }
}
