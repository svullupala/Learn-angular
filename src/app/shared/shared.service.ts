import {Injectable} from '@angular/core';
import {HttpResponse} from '@angular/common/http';
import {JsonConvert} from 'json2typescript';
import {ResponseNodelModel} from './models/response-node.model';

@Injectable()
export class SharedService {
  
  public static WINDOW_PARAMS = 'directories=no,location=no,menubar=no,resizable=yes,scrollbars=yes,toolbar=yes,titlebar=yes';
  public static TAB_PARAMS = 'noopener,noreferrer';

  public static handleNodeResponse(res: Object | HttpResponse<any>): false | ResponseNodelModel {
    let result: false | ResponseNodelModel = false, data = res;
    try {
      if (res instanceof HttpResponse) {
        data = res.body;
      }
      result = JsonConvert.deserializeObject(data, ResponseNodelModel);
    } catch (e) {
    }
    return result;
  }

  public static formatString(value: string, ...args): string {
    try {
      return value.replace(/{(\d+(:.*)?)}/g, function (match, i) {
        let s = match.split(':');
        if (s.length > 1) {
          i = i[0];
          match = s[1].replace('}', '');
        }

        let arg = SharedService.formatPattern(match, args[i]);
        return typeof arg !== 'undefined' && arg != null ? arg : '';
      });
    }
    catch (e) {
      return '';
    }
  }

  public static formatDayOfMonth(value: number): string {
    if (value >= 11 && value <= 13 ){
      return value + 'th';
    }
    switch (value % 10){
      case 1:
        return value + 'st';
      case 2:
        return value + 'nd';
      case 3:
        return value + 'rd';
      default:
        return value + 'th';
    }
  }

  /**
   * Returns a wildcard string for search operations.
   *
   * @method wildcardEx
   * @param content {String} The content for the search string from user
   * @return {String} string with asterisk at the front and the end of the input string
   */
  public static wildcardEx(content: string): string {
    if (!content.startsWith('*')) {
      content = '*' + content;
    }
    if (!content.endsWith('*')) {
      content = content + '*';
    }
    return content;
  }

  /**
   * Truncate a path string and add an ellipsis ('...') to the middle if it exceeds the specified length.
   * @param {String} value The string to truncate.
   * @param {Number} length The maximum length to allow before truncating.
   * @return {String} The converted text.
   */
  public static ellipsisPath(value: string, length: number): string {
    if (value && value.length > length) {
      // return value.substr(0, Math.ceil((length - 3) / 2)) + '...' +
      //   value.substr(value.length - Math.floor((length - 3) / 2));
      return SharedService.ellipsis(value, length);
    }
    return value;
  }

  public static scrollUnique(selector: any, off?: boolean, handler?: any): any {
    let eventType = 'mousewheel', element = jQuery(selector);
    if (!element)
      return handler;

    if (!off)
      handler = function (event: any) {
        let scrollTop = this.scrollTop,
          scrollHeight = this.scrollHeight,
          height = this.clientHeight,
          delta = (event.originalEvent.wheelDelta) ? event.originalEvent.wheelDelta :
            -(event.originalEvent.detail || 0);

        if ((delta > 0 && scrollTop <= delta) || (delta < 0 && scrollHeight - height - scrollTop <= -1 * delta)) {
          this.scrollTop = delta > 0 ? 0 : scrollHeight;
          event.preventDefault();
        }
      };

    if ((<any>document).mozHidden !== undefined)
      eventType = 'DOMMouseScroll';

    if (off)
      element.off(eventType, handler);
    else
      element.on(eventType, handler);

    return handler;
  }

  public static restoreBodyScrollbar(): void {
    let element = jQuery('body');
    if (element) {
      element.removeClass('modal-open');
      element.css('padding-right', '0px');
    }
  }

  public static getMainBackgroundColor(): string {
    let color, element = jQuery('main');
    if (element) {
      color = element.css('background-color');
    }
    return color;
  }

  public static setMainBackgroundColor(color: string): string {
    let element = jQuery('main'), current = element.css('background-color');
    if (element && color) {
      element.css('background-color', color);
    }
    return current;
  }

  public static formatCamelCase(value: string): string {
    return value.replace(/([A-Z])/g, ' $1').replace(/^./, function(str){ return str.toUpperCase(); });
  }

  public static hasWhiteSpace(value: string): boolean {
    return (value) && (value.indexOf(' ') >= 0);
  }

  public static isModalBackgroundElement(el: any): boolean {
    let result = false, isTarget1Modal = false,
      body = SharedService.getBody(), modals = SharedService.getOpenModals(),
      target1, target2;
    if (body && modals && modals.length > 0) {
      target1 = SharedService.getChild(body, el);
      modals.each(function (idx, modal) {
        target2 = SharedService.getChild(modal, el);
        if (target2)
          return false;
      });
      if (target1) {
        modals.each(function (idx, modal) {
          if (modal === target1) {
            isTarget1Modal = true;
            return false;
          }
        });
      }
      result = (body === el) || (target1 && !target2 && !isTarget1Modal);
    }
    return result;
  }

  public static focusFirstFocusableElementInOpenModal(): void {
    let target, modal = SharedService.getOpenModal(true);
    if (modal) {
      target = SharedService.getFirstFocusableButton(modal);
      if (target)
        target.focus();
    }
  }

  public static isDrpBackgroundElement(el: any): boolean {
    let result = false, body = SharedService.getBody(), modal = SharedService.getOpenDrp(),
      target1, target2;
    if (body && modal) {
      target1 = SharedService.getChild(body, el);
      target2 = SharedService.getChild(modal, el);
      result = (body === el) || (target1 && !target2 && modal !== target1);
    }
    return result;
  }

  public static focusFirstFocusableElementInOpenDrp(): void {
    let target, modal = SharedService.getOpenDrp();
    if (modal) {
      target = SharedService.getFirstFocusableButton(modal);
      if (target)
        target.focus();
    }
  }

  public static isDpBackgroundElement(el: any): boolean {
    let result = false, body = SharedService.getBody(), modal = SharedService.getOpenDp(),
      target1, target2;
    if (body && modal) {
      target1 = SharedService.getChild(body, el);
      target2 = SharedService.getChild(modal, el);
      result = (body === el) || (target1 && !target2 && modal !== target1);
    }
    return result;
  }

  public static focusFirstFocusableElementInOpenDp(): void {
    let target, modal = SharedService.getOpenDp();
    if (modal) {
      target = SharedService.getFirstFocusableButton(modal);
      if (target)
        target.focus();
    }
  }

  public static maximizeContent(disable?: boolean, partial?: boolean, keepPartialZeroPadding?: boolean): void {
    let contentTop = SharedService.getContentTop(), content = SharedService.getAlContent();
    if (content && contentTop) {
      if (!disable) {
        partial ? contentTop.addClass('partial') : contentTop.addClass('hidden');
        content.addClass('zero-padding');
      } else {
        if (!keepPartialZeroPadding)
          contentTop.removeClass('partial');
        contentTop.removeClass('hidden');
        if (!keepPartialZeroPadding)
          content.removeClass('zero-padding');
      }
    }
  }

  public static setContentTopFontColor(value: string): string {
    let top = SharedService.getContentTop().find('h1.al-title'), current = top.css('color');
    if (value) {
      top.css('color', value);
    }

    return current; 
  }

  private static getContentTop(): JQuery<HTMLElement> {
    return jQuery('body .al-content .content-top');
  }

  private static getAlContent(): JQuery<HTMLElement> {
    return jQuery('body .al-content');
  }

  private static getBody(): HTMLElement {
    let els = jQuery('body');
    return els && els.length ? els[0] : null;
  }

  private static getOpenModals(): JQuery<HTMLElement> {
    return jQuery('body .modal.fade.in');
  }

  private static getOpenModal(last?: boolean): HTMLElement {
    let els = jQuery('body .modal.fade.in');
    return els && els.length ? (last ? els[els.length - 1] : els[0]) : null;
  }

  private static getOpenDrp(): HTMLElement {
    let els = jQuery('body > bs-daterangepicker-container');
    return els && els.length ? els[0] : null;
  }

  private static getOpenDp(): HTMLElement {
    let els = jQuery('body > bs-datepicker-container');
    return els && els.length ? els[0] : null;
  }

  private static getChild(parent: HTMLElement, el: any): HTMLElement {
    let els = jQuery(parent).find(el);
    return els && els.length ? els[0] : null;
  }

  private static getFirstFocusableButton(parent: HTMLElement): HTMLElement {
    let els = jQuery(parent).find('button:not([disabled])');
    return els && els.length ? els[0] : null;
  }

  private static formatPattern(match, arg): string {
    switch (match) {
      case 'L':
        arg = arg.toLowerCase();
        break;
      case 'U':
        arg = arg.toUpperCase();
        break;
      default:
        break;
    }
    return arg;
  }

  private static ellipsis(value: string, length: number): string {
    let step = 0, strLength = value.length,
      pos1 = Math.ceil((length - 3) / 2),
      pos2 = strLength - Math.floor((length - 3) / 2),
      newStr1 = '', newStr2 = '', targetRegex = /[^\x00-\xff]/g,
      singleChar = '', nextChar = '';

    for (let i = 0; i < pos1;) {
      step = 1;
      singleChar = value.charAt(i).toString();
      if (singleChar.match(targetRegex) != null && i + 1 < strLength) {
        nextChar = value.charAt(i + 1).toString();
        if (nextChar.match(targetRegex) != null) {
          singleChar += nextChar;
          step = 2;
        }
      }
      i += step;
      newStr1 += singleChar;
    }
    for (let i = strLength - 1; i >= pos2;) {
      step = 1;
      singleChar = value.charAt(i).toString();
      if (singleChar.match(targetRegex) != null && i - 1 >= 0) {
        nextChar = value.charAt(i - 1).toString();
        if (nextChar.match(targetRegex) != null) {
          singleChar = nextChar + singleChar;
          step = 2;
        }
      }
      i -= step;
      newStr2 = singleChar + newStr2;
    }
    return newStr1 + '...' + newStr2;
  }

  /**
   * Open the specified URL.
   *
   * @method openUrl
   * @param {String} url An URL.
   * @param {String} frameName Frame name
   * @param {Boolean=} tab True to open in browser tab
   */
  public static openUrl(url: string, frameName: string, tab?: boolean) {
    let popup = (tab) ?  window.open(url, '_blank', SharedService.TAB_PARAMS) :
                  window.open(url, frameName, SharedService.WINDOW_PARAMS);

    if (popup) {
      popup.focus();

    }
  }
}
