import {Component, ViewChild, ElementRef} from '@angular/core';

import {SharedService} from '../../shared.service';
import {productionMode} from '../../../environment';

@Component({
  selector: 'downloader',
  template: '<div #downloadArea style="display: none"></div>'
})
export class DownloaderComponent {

  @ViewChild('downloadArea') area: ElementRef;

  constructor() {
  }

  /**
   * Convert certain characters (&, <, >, ', and ") to their HTML character
   *  equivalents for literal display in web pages.
   * @param {String} value The string to encode.
   * @return {String} The encoded text.
   * @method
   */
  htmlEncode(value) {
    let entityMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return (!value) ? value : String(value).replace(/[&<>"']/g, s => entityMap[s]);
  }

  download(url: string): void {
    let me = this;
    if (url && url.length > 0) {
      url = me.htmlEncode(url);
      me.update(SharedService.formatString('<iframe src="{0}"></iframe>', url));
    }
  }

  private update(html: string): void {
    let me = this, element: HTMLElement = me.area ? me.area.nativeElement : null;
    if (element)
      element.innerHTML = html;
  }
}
