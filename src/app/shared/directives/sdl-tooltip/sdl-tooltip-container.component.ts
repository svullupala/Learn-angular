import {
  AfterViewInit,
  Component,
  ChangeDetectionStrategy
} from '@angular/core';
import {SdlTooltipConfig} from './sdl-tooltip.config';
import {isBs3} from 'ngx-bootstrap';

@Component({
  selector: 'sdl-tooltip-container',
  changeDetection: ChangeDetectionStrategy.OnPush,

  templateUrl: './sdl-tooltip-container.component.html',
  styleUrls: ['./sdl-tooltip-container.scss'],
// tslint:disable:max-line-length
  host: {
    '[class]':
      '"tooltip in " + mode + " tooltip-" + placement + " " + "sdl-tooltip-" + placement + " " + placement + " " + containerClass',
    '[class.show]': '!isBs3',
    role: 'tooltip'
  }
})
export class SdlTooltipContainerComponent implements AfterViewInit {
  classMap: any;
  placement: string;
  containerClass: string;
  animation: boolean;
  mode: string;
  isTextContent: boolean;
  iconHidden: boolean;

  get isBs3(): boolean {
    return isBs3();
  }

  get iconCls(): string {
    let icon: string;
    switch (this.mode) {
      case 'info':
        icon = 'status-info';
        break;
      case 'critical':
        icon = 'status-error';
        break;
      case 'warning':
        icon = 'status-warning';
        break;
      default:
        break;
    }
    return icon ? 'bidi-' + icon : '';
  }

  constructor(config: SdlTooltipConfig) {
    Object.assign(this, config);
  }

  ngAfterViewInit(): void {
    this.classMap = {in: false, fade: false};
    this.classMap[this.placement] = true;
    this.classMap[`tooltip-${this.placement}`] = true;

    this.classMap.in = true;
    if (this.animation) {
      this.classMap.fade = true;
    }

    if (this.containerClass) {
      this.classMap[this.containerClass] = true;
    }
  }
}
