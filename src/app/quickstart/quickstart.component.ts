import { ViewChild, Component, Input, Output, AfterViewInit, EventEmitter } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { QuickStartService } from './quickstart.service';

@Component({
  selector: 'quickstart',
  templateUrl: './quickstart.component.html',
  styleUrls: ['./quickstart.scss'],
  providers: [
    QuickStartService
  ]
})
export class QuickStartComponent implements AfterViewInit {
  @Input() autoShow: boolean = true;

  @Output('show') showEvent = new EventEmitter();
  @Output('hide') hideEvent = new EventEmitter();
  @ViewChild('lgModal') lgModal: ModalDirective;

  private showAtLogin: boolean = true;

  constructor(private quickStartService: QuickStartService) {
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.showAtLogin = this.quickStartService.getFlag();
    }, 100);
    this.autoShow ? this.show() : this.hide();
  }

  show(): void {
    this.lgModal.show();
    this.showEvent.emit();
  }

  hide(): void {
    this.lgModal.hide();
    this.hideEvent.emit();
  }

  openOnlineHelp() {
    this.quickStartService.openOnlineHelp();
  }

  private onOkClick(){
    this.hide();
    this.quickStartService.setFlag(this.showAtLogin);
  }

  private onOpenClick() {
    this.openOnlineHelp();
    this.quickStartService.setFlag(this.showAtLogin);
    this.hide();
  }
}
