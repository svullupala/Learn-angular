import { Injectable } from '@angular/core';

/** Default values provider for sdl tooltip */
@Injectable()
export class SdlTooltipConfig {
  /** tooltip placement, supported positions: 'top', 'bottom', 'left', 'right' */
  placement = 'top';
  /** tooltip mode, supported types: 'standard', 'info', 'critical', 'warning' */
  mode = 'standard';
  /** array of event names which triggers tooltip opening */
  triggers = 'hover focus';
  /** a selector specifying the element the tooltip should be appended to. Currently only supports "body" */
  container: string;
}
