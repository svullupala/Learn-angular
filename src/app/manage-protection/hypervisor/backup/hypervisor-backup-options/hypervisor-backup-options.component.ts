import {
  AfterViewInit,
  Component, ComponentRef, EventEmitter, Input, OnDestroy, OnInit, Output,
  ViewChild,
  ViewContainerRef

} from '@angular/core';
import { HypervisorBackupOptionsModel } from '../../shared/hypervisor-backup-options.model';
import { BaseHypervisorModel } from '../../shared/base-hypervisor.model';
import {
  HypervisorBackupOptionsPage
} from 'app/manage-protection/hypervisor/backup/hypervisor-backup-options/hypervisor-backup-options-page';
import { IdentityUserEnterSelectModel } from 'identity/shared/identity-user-enter-select.model';
import {
  HypervisorBackupOptionsService
} from 'app/manage-protection/hypervisor/backup/hypervisor-backup-options/hypervisor-backup-options.service';
import {
  HypervisorBackupOptionsRegistry
} from 'app/manage-protection/hypervisor/backup/hypervisor-backup-options/hypervisor-backup-options-registry';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'hypervisor-backup-options',
  templateUrl: './hypervisor-backup-options.component.html'
})

export class HypervisorBackupOptionsComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() hypervisorType: string;
  @Input() hypervisorModel: BaseHypervisorModel;

  @Output() testClicked = new EventEmitter<boolean>();
  @Output() applyOptionsClicked = new EventEmitter();
  @Output() loadedUserEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() loadedVADPsEvent: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('optionsContainer', { read: ViewContainerRef }) container: ViewContainerRef;
  componentRef: ComponentRef<HypervisorBackupOptionsPage<HypervisorBackupOptionsModel>>;

  private options: HypervisorBackupOptionsModel;
  private registry: HypervisorBackupOptionsRegistry;
  private subRef: Subject<void> = new Subject<void>();

  constructor(private optService: HypervisorBackupOptionsService) {
  }

  ngOnInit(): void {
    let me = this;
    me.registry = me.optService.getRegistry(me.hypervisorType);
    me.options = new me.registry.modelClazz();
    me.createComponent(me.options);
    me.setOptions(me.options);
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    if (this.subRef)
      this.subRef.unsubscribe();
    this.componentRef.destroy();
  }

  public getOptions(): Object {
    return this.componentRef.instance.getOptions();
  }

  public setOptions(options?: HypervisorBackupOptionsModel): void {
    this.componentRef.instance.setOptions(options);
  }

  public getUserInfo(): IdentityUserEnterSelectModel {
    return this.componentRef.instance.getUserInfo();
  }

  public getExistingUserHref(): string {
    return this.componentRef.instance.getExistingUserHref();
  }

  public getExistingKeyHref(): string {
    return this.componentRef.instance.getExistingKeyHref();
  }

  public reloadUsers(): void {
    return this.componentRef.instance.reloadUsers();
  }

  private createComponent(options: HypervisorBackupOptionsModel) {
    let me = this, factory = me.registry.componentFactory;
    me.container.clear();
    me.componentRef = me.container.createComponent(factory);
    me.componentRef.instance.model = options;
    me.componentRef.instance.loadedVADPsEvent.takeUntil(me.subRef).subscribe(data => {
      me.loadedVADPsEvent.emit(data);
    });
    me.componentRef.instance.loadedUserEvent.takeUntil(me.subRef).subscribe(data => {
      me.loadedUserEvent.emit(data);
    });
  }

  private isValidUserInfo(): boolean {
    let me = this, valid = false, userInfo = me.getUserInfo();
    if (userInfo) {
      valid = userInfo.useExisting ? !!userInfo.userHref :
        (userInfo.username.length > 0 && userInfo.password && userInfo.password.length > 0);
    }
    return valid;
  }

  private isValidSshKey(): boolean {
    let me = this, valid = false, keyHref = me.getExistingKeyHref();
    if (keyHref)
      valid = keyHref.length > 0;
    return valid;
  }

  private isNewCredential(): boolean {
    let me = this, userInfo = me.getUserInfo();
    return userInfo && !userInfo.useExisting;
  }

  private canTest(): boolean {
    let me = this, model = me.hypervisorModel;
    return model && model.resourceType === 'vm' && model.hasLink('test') &&
      (me.isValidUserInfo() || me.isValidSshKey());
  }

  private onTestClick(): void {
    let saveFirst = this.isNewCredential();
    if (this.canTest())
      this.testClicked.emit(saveFirst);
  }

  private onApplyOptionsClick(): void {
    this.applyOptionsClicked.emit();
  }
}
