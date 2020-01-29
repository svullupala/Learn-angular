import {ViewChild, Component, Input, TemplateRef, EventEmitter, Output} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {ConfigGroupModel, ConfigGroupsTestTaskModel} from '../../models/config-groups.model';

@Component({
  selector: 'config-groups',
  templateUrl: './config-groups.component.html',
  styleUrls: ['./config-groups.component.scss']
})
export class ConfigGroupsComponent {
  @Input() model: ConfigGroupsTestTaskModel;
  @Output() abortClick = new EventEmitter();

  @ViewChild('template', {read: TemplateRef})
  public template: TemplateRef<any>;

  constructor(private translate: TranslateService) {
  }

  testInProgress(model: ConfigGroupsTestTaskModel, item?: ConfigGroupModel) {
    return model && !model.testsComplete && (!item || !item.groupTestsComplete);
  }

  onAbortClick(): void {
    this.abortClick.emit();
  }
}
