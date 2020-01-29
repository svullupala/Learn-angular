import {Component, OnInit, Input, Output, EventEmitter, OnDestroy} from '@angular/core';
import {SharedService} from 'shared/shared.service';

@Component({
  selector: 'ba-banner',
  styleUrls: ['./baBanner.scss'],
  templateUrl: './baBanner.html'
})
export class BaBanner {
  @Output()
  onClose: EventEmitter<void> = new EventEmitter<void>();

  constructor() { }

  private _onClose() {
    this.onClose.emit();
  }
} 
 
