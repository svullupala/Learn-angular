import { Component, OnInit, OnDestroy, Input, Output, EventEmitter  } from '@angular/core';
import { ScriptModel  } from 'scripts/script.model';

@Component({
  selector: 'scripts-selector-component',
  styleUrls: ['./post-scripts-selector.component.scss'],
  templateUrl: './scripts-selector.component.html'
})

export class ScriptsSelectorComponent {
  @Input() textLabel: string;
  @Input() textNone: string;
  @Input() modelField: ScriptModel;
  @Input() scripts: Array<ScriptModel>;

  @Output() onChange: EventEmitter<ScriptModel> = new EventEmitter<ScriptModel>();
 
  constructor() {}
}
