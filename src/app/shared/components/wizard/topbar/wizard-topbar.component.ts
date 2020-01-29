import {Component, EventEmitter, Input, Output, TemplateRef} from '@angular/core';
import {WizardToolbarBtn} from 'shared/components';
import {isString} from 'util';

@Component({
  selector: 'wizard-topbar',
  templateUrl: './wizard-topbar.component.html',
  styleUrls: ['./wizard-topbar.component.scss']
})
export class WizardTopbarComponent {
  @Input() title: string;
  @Input() subtitle: string;
  @Input() textBackToTarget: string;
  @Input() description: string | TemplateRef<any>;
  @Output() backTo: EventEmitter<WizardToolbarBtn> = new EventEmitter<WizardToolbarBtn>();


  get isStringDesc(): boolean {
    return isString(this.description);
  }

  private btn: WizardToolbarBtn = new WizardToolbarBtn('wizard.textBackTo', 'backTo');

  setMessage(title: string, description: string): void {
    this.title = title;
    this.description = description;
  }

  onButtonClick(): void {
    this.backTo.emit(this.btn);
  }
}
