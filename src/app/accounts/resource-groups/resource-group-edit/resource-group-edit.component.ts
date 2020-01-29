import { Component, ElementRef, EventEmitter, OnInit, Input, Output, ViewChild, OnDestroy } from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';

import {ErrorHandlerComponent} from 'shared/components/error-handler/error-handler.component';
import {AlertComponent} from 'shared/components/msgbox/alert.component';
import {SessionService} from 'core';
import {ResourceGroupModel} from '../resource-group.model';
import {RestService} from 'core';
import {Observable} from 'rxjs/Observable';
import {ResourceGroupsModel} from '../resource-groups.model';
import {SorterModel} from 'shared/models/sorter.model';
import {FilterModel} from 'shared/models/filter.model';
import {LinkModel} from 'shared/models/link.model';
import { ResourceGroupsService } from '../resource-groups.service';
import { ResourceGroupSelectionModel } from '../shared/resource-group-selection.model';
import { ResourceGroupListComponent } from '../resource-group-list/resource-group-list.component';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'resource-group-edit',
  styleUrls: ['../resource-groups.scss'],
  templateUrl: './resource-group-edit.component.html'
})

export class ResourceGroupEditComponent implements OnInit, OnDestroy {

  @Input() createLink: LinkModel;
  @Input() model: ResourceGroupModel;
  @Output() saveSuccess = new EventEmitter<ResourceGroupModel>();
  @Output() cancelClick = new EventEmitter();
  @ViewChild(ResourceGroupListComponent) listComponent: ResourceGroupListComponent;

  public form: FormGroup;
  public name: AbstractControl;
  public method: AbstractControl;
  public template: AbstractControl;

  cannedResourceGroups: Array<ResourceGroupModel> = [];

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  session = SessionService.getInstance();
  @ViewChild('resourceGroupEditContainer') editContainer: ElementRef;
  @ViewChild(ResourceGroupListComponent) resourceGroupList: ResourceGroupListComponent;
  private subs: Subject<void> = new Subject<void>();
  private infoTitle: string;
  private processingRequestMsg: string;
  private textCreateSucceed: string;
  private textEditSucceed: string;
  private textConfirm: string;
  private subSignal: Subject<any> = new Subject<any>();
  private addResourceValidated: boolean = false;

  private masked: boolean = false;

  constructor(private rest: RestService, fb: FormBuilder,
              private resourceGroupsService: ResourceGroupsService,
              private translate: TranslateService) {

    this.form = fb.group({
      'template': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
      'method': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
      'name': ['', Validators.compose([Validators.required, Validators.minLength(1)])]
    });
    this.template = this.form.controls['template'];
    this.method = this.form.controls['method'];
    this.name = this.form.controls['name'];
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

  reset(): void {
    this.model = new ResourceGroupModel();
    this.form.reset();
    this.resourceGroupsService.reset();
  }

  ngOnInit(): void {
    let me = this;

    me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'common.textConfirm',
      'resourceGroups.textCreationSuccessful',
      'resourceGroups.textEditSuccessful',
    ]).takeUntil(me.subs)
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textCreateSucceed = resource['resourceGroups.textCreationSuccessful'];
        me.textEditSucceed = resource['resourceGroups.textEditSuccessful'];
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];

    if (!me.model)
      me.model = new ResourceGroupModel();

    me.loadCannedResourceGroups();
    me.resourceGroupsService.addResourceValidateSignalSub.takeUntil(me.subs).subscribe(
      (item: boolean) => {
        me.addResourceValidated = item;
      }
    );
    me.resourceGroupsService.addResourceCompletedSignalSub.takeUntil(me.subs).subscribe(
      () => {
        me.saveList();
      }
    );
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  loadCannedResourceGroups() {
    let me = this, observable: Observable<ResourceGroupsModel>,
      sorters = [
        new SorterModel('name', 'ASC')
      ],
      filters = [
        new FilterModel('type', 'BUILTIN')
      ];

    me.mask();

    observable = ResourceGroupsModel.retrieve<ResourceGroupModel, ResourceGroupsModel>(ResourceGroupsModel, me.rest,
      filters, sorters, 0, 0);

    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        dataset => {

          me.cannedResourceGroups = dataset.records || [];
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

  onCancelClick() {
    this.cancelClick.emit();
    this.reset();
  }

  onSaveClick() {
    /*  TODO RAC: bypassing this code as it caused SPP-9795. It originated from SPP-8159.  
    if (!me.addResourceValidated) {
      me.saveList();
    } else {
      me.resourceGroupsService.updateResourceGroupClicked();
    } */

    this.saveList();
  }

  saveList() {
    let me = this, observable: Observable<ResourceGroupModel>,
      resourceGroups: Array<ResourceGroupSelectionModel> = me.getList(),
      selections: Array<object> = [];
    resourceGroups.forEach((resource: ResourceGroupSelectionModel) => {
      selections.push(resource.getPersistentJson());
    });
    if (me.model.phantom) {
      me.mask();
      me.model.resources = selections;
      observable = ResourceGroupsModel.create(ResourceGroupModel, me.model, me.createLink, me.rest);
      if (observable) {
        observable.takeUntil(me.subs).subscribe(
          record => {
            me.unmask();
            me.info(me.textCreateSucceed);
            me.saveSuccess.emit(record);
            me.reset();
          },
          err => {
            me.unmask();
            me.handleError(err, false);
          }
        );
      } else {
        me.unmask();
      }
    } else {
      me.mask();
      me.model.resources = selections;
      observable = me.model.update(ResourceGroupModel, me.rest);
      if (observable) {
        observable.takeUntil(me.subs).subscribe(
          record => {
            me.unmask();
            me.info(me.textEditSucceed);
            me.reset();
            me.saveSuccess.emit(record);
          },
          err => {
            me.unmask();
            me.handleError(err, false);
          }
        );
      } else {
        me.unmask();
      }
    }
  }

  startEdit(item: ResourceGroupModel) {
    let me = this, oldId, newId = item ? item.id : undefined;

    if (me.model && !me.model.phantom) {
      oldId = me.model.id;
    }

    me.model = item;
  }

  public setResources(item: ResourceGroupModel): void {
    if (this.listComponent) {
      this.listComponent.setResources(item);
    }
  }

  private onTemplateSelect(): void {
   if (this.model.template) {
      this.setResources(this.model.template);
    }
  }

  private onMethodSelect(): void {
    let method: string = this.model.method,
        name: string = this.model.name;
    this.model = new ResourceGroupModel();
    this.model.method = method || '';
    this.model.name = name || '';
    this.resourceGroupsService.reset();
  }

  private editForm(): any {
    let me = this, element = me.editContainer && me.editContainer.nativeElement;
    return element;
  }

  private getList(): Array<ResourceGroupSelectionModel> {
    return this.resourceGroupList && this.resourceGroupList.getList();
  }

  private isValid(): boolean {
    let model = this.model,
        selections: Array<ResourceGroupSelectionModel> = this.getList();
    return model.name && model.name.length > 0 && selections && selections.length > 0 &&
      (!model.phantom ||
        (model.method === 'new' || (model.method === 'template' && model.template !== undefined)));
  }
}
