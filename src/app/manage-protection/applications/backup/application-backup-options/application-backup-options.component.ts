import {
  Component, ComponentRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild,
  ViewContainerRef
} from '@angular/core';
import {ApplicationBackupOptionsModel} from 'applications/shared/application-backup-options.model';
import {
  ApplicationBackupOptionsPage
} from 'applications/backup/application-backup-options/application-backup-options-page';
import {
  ApplicationBackupOptionsRegistry
} from 'applications/backup/application-backup-options/application-backup-options-registry';
import {
  ApplicationBackupOptionsService
} from 'applications/backup/application-backup-options/application-backup-options.service';
import {BaseApplicationModel} from 'applications/shared/base-application-model.model';

@Component({
  selector: 'application-backup-options',
  templateUrl: 'application-backup-options.component.html'
})

export class ApplicationBackupOptionsComponent implements OnInit, OnDestroy {
  @Input() applicationType: string;
  @Input() applicationView: string;
  @Input() includeLogBackup: boolean = true;
  @Output() applyOptionsClicked = new EventEmitter();

  @ViewChild('optionsContainer', {read: ViewContainerRef}) container: ViewContainerRef;
  componentRef: ComponentRef<ApplicationBackupOptionsPage<ApplicationBackupOptionsModel>>;

  private options: ApplicationBackupOptionsModel;
  private registry: ApplicationBackupOptionsRegistry;

  constructor(private optService: ApplicationBackupOptionsService) {
  }

  ngOnInit() {
    let me = this;
    me.registry = me.optService.getRegistry(me.applicationType);
    me.options = new me.registry.modelClazz();
    me.createComponent(me.options);
    me.setOptions(me.options);
  }

  ngOnDestroy() {
    this.componentRef.destroy();
  }

  public getOptions(): ApplicationBackupOptionsModel {
    return this.componentRef.instance.getOptions();
  }

  public setOptions(options?: ApplicationBackupOptionsModel): void {
    this.componentRef.instance.setOptions(options);
  }

  public resetLogBackupValid(selections: Array<BaseApplicationModel>): void {
    this.componentRef.instance.resetLogBackupValid(selections);
  }

  public setSelections(selections: Array<BaseApplicationModel>, view: string): void {
    this.componentRef.instance.setSelections(selections);
    this.componentRef.instance.setView(view);
  }

  private createComponent(options: ApplicationBackupOptionsModel) {
    let me = this, factory = me.registry.componentFactory;
    me.container.clear();
    me.componentRef = me.container.createComponent(factory);
    me.componentRef.instance.model = options;
  }

  private onApplyOptionsClick(): void {
    this.applyOptionsClicked.emit(this.getOptions());
  }

  private isValid(): boolean {
    return this.componentRef && this.componentRef.instance && this.componentRef.instance.isValid();
  }
}
