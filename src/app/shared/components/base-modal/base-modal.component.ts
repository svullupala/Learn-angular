import {
  Component, OnInit, Input, Output, EventEmitter,
  ViewChild, AfterViewInit
} from '@angular/core';
import {ModalDirective} from 'ngx-bootstrap';

@Component({
  selector: 'base-modal-component',
  styleUrls: ['./base-modal.component.scss'],
  templateUrl: './base-modal.component.html',
})

export class BaseModalComponent implements AfterViewInit {
  @Input() title: string;
  @Input() largeBtn: boolean = true;
  @Input() autoShow: boolean = false;
  @Input() enableButtons: boolean = true;
  @Input() splitButtons: boolean = false;
  @Input() confirmBtnText: string;
  @Input() cancelBtnText: string;
  @Input() disableConfirmButton: boolean = false;
  @Input() disableCancelButton: boolean = false;
  @Input() hideConfirmButton: boolean = false;
  @Input() hideCancelButton: boolean = false;
  @Input() floatRight: boolean = true;

  @Output() abort = new EventEmitter();
  @Output() onShow: EventEmitter<void> = new EventEmitter<void>();
  @Output() onHide: EventEmitter<void> = new EventEmitter<void>();
  @Output() onSave: EventEmitter<void> = new EventEmitter<void>();
  @Output() onCancel: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('modal') modal: ModalDirective;

  constructor() {
  }

  ngAfterViewInit() {
    if (this.autoShow)
      this.show();
  }

  show(): void {
    this.modal.show();
    this.onShow.emit();
  }

  hide(): void {
    this.modal.hide();
    this.onHide.emit();
  }

  private onSaveEvent(): void {
    this.onSave.emit();
  }

  private onCancelEvent(): void {
    this.modal.hide();
    this.onCancel.emit();
  }

  private onAbort(): void {
    this.modal.hide();
    this.abort.emit();
  }
}
