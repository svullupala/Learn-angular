import { Component, OnInit, OnDestroy, Input, Output, EventEmitter  } from '@angular/core';
import { AppServerModel  } from 'appserver/appserver.model';

@Component({
  selector: 'server-selector-component',
  styleUrls: ['./post-scripts-selector.component.scss'],
  templateUrl: './server-selector.component.html'

})
export class ServerSelectorComponent {
  @Input() textLabel: string;
  @Input() textNoServers: string;
  @Input() modelField: AppServerModel;
  @Input() scriptServers: Array<AppServerModel>;
  @Input() applicationServers: Array<AppServerModel>;
  @Input() isScriptServer: boolean;

  @Output() onChange: EventEmitter<AppServerModel> = new EventEmitter<AppServerModel>();
}
