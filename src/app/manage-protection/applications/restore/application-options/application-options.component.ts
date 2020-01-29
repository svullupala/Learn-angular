import {
  Component, ComponentRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild,
  ViewContainerRef
} from '@angular/core';
import {ApplicationSubOptionModel} from '../../shared/application-sub-option.model';
import {ApplicationOptionsRegistry} from 'applications/restore/application-options/application-options-registry';
import {ApplicationOptionsService} from 'applications/restore/application-options/application-options.service';
import {ApplicationOptionsPage} from 'applications/restore/application-options/application-options-page';

@Component({
  selector: 'application-options',
  templateUrl: 'application-options.component.html'
})

export class ApplicationOptionsComponent implements OnInit, OnDestroy, OnChanges {
  @Input() options: ApplicationSubOptionModel;
  @Input() applicationType: string;
  @Input() restoreType: string;

  @ViewChild('optionsContainer', {read: ViewContainerRef}) container: ViewContainerRef;
  componentRef: ComponentRef<ApplicationOptionsPage<ApplicationSubOptionModel>>;

  private registry: ApplicationOptionsRegistry;

  constructor(private optService: ApplicationOptionsService) {
  }

  ngOnInit() {
    let me = this;
    me.registry = me.optService.getRegistry(me.applicationType);
    me.options = me.options || new me.registry.modelClazz();
    me.createComponent(me.options);
  }

  ngOnChanges(currentVal: SimpleChanges) {
    if (currentVal.options && currentVal.options['currentValue']) {
      this.options = currentVal.options['currentValue'];
    }
    if (this.componentRef && this.componentRef.instance) {
      this.componentRef.instance.model = this.options;
      if (currentVal.restoreType && currentVal.restoreType['currentValue']) {
        this.componentRef.instance.restoreType = currentVal.restoreType['currentValue'];
      }
    }
  }

  ngOnDestroy() {
    this.componentRef.destroy();
  }

  public getModel(): ApplicationSubOptionModel {
    return this.componentRef && this.componentRef.instance && this.componentRef.instance.getModel();
  }

  public reset(): void {
    if (this.componentRef && this.componentRef.instance)
      this.componentRef.instance.reset();
  }

  private createComponent(options: ApplicationSubOptionModel) {
    let me = this, factory = me.registry.componentFactory;
    me.container.clear();
    me.componentRef = me.container.createComponent(factory);
    me.componentRef.instance.model = options;
    me.componentRef.instance.restoreType = me.restoreType;
  }
}
