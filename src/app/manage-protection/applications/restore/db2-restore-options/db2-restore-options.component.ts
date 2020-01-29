import {Component, Input, OnInit} from '@angular/core';
import {ApplicationSubOptionModel} from '../../shared/application-sub-option.model';
import {ApplicationOptionsPage} from 'applications/restore/application-options/application-options-page';

@Component({
  selector: 'db2-restore-options',
  templateUrl: 'db2-restore-options.component.html'
})

export class Db2RestoreOptionsComponent extends ApplicationOptionsPage<ApplicationSubOptionModel> implements OnInit {
  @Input() model: ApplicationSubOptionModel;
  @Input() restoreType: string;

  get hideMaxParallelStreams(): boolean {
    return this.restoreType !== 'production';
  }

  private maxKb: number = 4294967295;

  constructor() {
    super();
  }

  ngOnInit() {
    let me = this;
    me.model = me.model || new ApplicationSubOptionModel();
  }

  public getModel(): ApplicationSubOptionModel {
    return this.model;
  }

  public reset(): void {
    this.model = new ApplicationSubOptionModel();
  }
}
