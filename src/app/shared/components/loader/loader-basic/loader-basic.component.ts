import {Component, Input} from '@angular/core';

@Component({
  selector: 'loader-basic' ,
  template: `<div *ngIf="active"
                  [ngClass]="small ? 'loader-basic-small' : 'loader-basic'">
    <svg viewBox="-75 -75 150 150">
      <title>Loading</title>
      <circle cx="0" cy="0" r="37.5"></circle>
    </svg></div>`,
  styleUrls: [ './loader-basic.scss' ]
})
export class LoaderBasicComponent {
  @Input()
  active: boolean = true;
  @Input()
  small: boolean = true;

  constructor() {}
}
