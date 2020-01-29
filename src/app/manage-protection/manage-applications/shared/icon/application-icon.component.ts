import {Component, Input} from '@angular/core';
import {BaseApplicationModel} from 'applications/shared/base-application-model.model';

@Component({
  selector: 'application-icon',
  host: {
    '[class]': 'class',
    'role': 'img'
  },
  templateUrl: './application-icon.component.html',
  styleUrls: ['./application-icon.component.scss']
})
export class ApplicationIconComponent {
  @Input() model: BaseApplicationModel;
  @Input() class: string;
}
