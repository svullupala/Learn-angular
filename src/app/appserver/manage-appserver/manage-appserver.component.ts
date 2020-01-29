import {
  Component, OnDestroy, OnInit, ViewChild, ElementRef, Renderer2, Input, Output, EventEmitter, ChangeDetectorRef
} from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { TranslateService } from '@ngx-translate/core';

import { ManageAppServerService } from './manage-appserver.service';
import { AppServerModel } from '../appserver.model';
import { ErrorHandlerComponent } from 'shared/components/error-handler/error-handler.component';
import { SessionService } from 'core';
import { AppServersModel } from '../appservers.model';
import { FilterModel } from 'shared/models/filter.model';

@Component({
  selector: 'manage-app-server',
  templateUrl: 'manage-appserver.component.html',
  styles: []
})

export class ManageAppServerComponent implements OnInit, OnDestroy {

  @ViewChild('formButton') formButton: ElementRef;
  @ViewChild('appserverform') appserverFormContainerRef: ElementRef;
  @Output() onSuccessfulRegisterEvent: EventEmitter<void> = new EventEmitter<void>();

  @Input() onlyUserSelection: boolean = true;
  @Input() hideOptions: boolean = false;
  @Input() propertiesText: string;
  @Input() propertiesEditText: string;
  @Input() addServerText: string;
  @Input() showOsType: boolean = true;
  @Input() applicationType: string;
  @Input() filters: Array<FilterModel>;
  @Input() fieldWidth: number = 3;
  @Input() labelWidth: number = 2;
  @Input() canDoDiscover: boolean = false;
  canCreate: boolean = false;

  public errorHandler: ErrorHandlerComponent;
  public appServers: AppServerModel[];

  private mode: string = 'list';
  private subs: Subject<void> = new Subject<void>();
  private collapseSubject: Subject<boolean> = new Subject<boolean>();
  private isHide: boolean = true;
  public get serverText() {
    return typeof this.addServerText === 'string'
          ? this.addServerText
          : this.applicationType === 'script'
          ? 'scripts.textAddScriptServer'
          : this.applicationType === 'k8s'
          ? 'application.textAddCluster'
          : 'application.textAddApplicationServer';
  }
  constructor(private manageService: ManageAppServerService,
              private renderer: Renderer2,
              private changeDef: ChangeDetectorRef,
              private translate: TranslateService) {}

  ngOnInit() {
    this.errorHandler = SessionService.getInstance().context['errorHandler'];
    this.filters = this.filters ? this.filters : [new FilterModel('applicationType', this.applicationType)];
    this.getAppservers();
    this.manageService.refreshAppserversSubject.takeUntil(this.subs).
      subscribe(() => this.getAppservers());
    this.collapseSubject.takeUntil(this.subs).subscribe(
      (hide: boolean) => {
      }
     );
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  onAddClick() {
    this.collapseSubject.next(!this.isHide);
    this.manageService.resetRegistrationForm();
    this.mode = 'edit';
  }

  private handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  private getAppservers(): void {
    this.manageService.getAppservers(this.filters).takeUntil(this.subs).
    subscribe(
      (appServers: AppServersModel) => {
        this.appServers = appServers.getRecords();
        this.updateAppservers(this.appServers);
        this.canCreate = appServers.getLink('create') !== undefined;
      },
      (error: Error) => this.handleError(error, false)
    );
  }

  private updateAppservers(appServers: Array<AppServerModel>): void {
    this.manageService.updateAppservers(appServers);
  }

  private onToggleFormElement(addClass: boolean): void {
    this.mode = !addClass ? 'list' : 'edit';
    this.collapseSubject.next(!addClass);
    this.changeDef.detectChanges();
  }

  private onSuccessfulRegister(addClass: boolean): void {
    this.mode = 'list';
    this.collapseSubject.next(!addClass);
    this.changeDef.detectChanges();
    this.onSuccessfulRegisterEvent.emit();
  }
}
