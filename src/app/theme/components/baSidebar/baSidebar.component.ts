import {Component, ElementRef, HostListener, ViewEncapsulation} from '@angular/core';
import {GlobalState} from '../../../global.state';
import {layoutSizes} from 'theme';

import 'style-loader!./baSidebar.scss';

@Component({
  selector: 'ba-sidebar',
  templateUrl: './baSidebar.html'
})
export class BaSidebar {
  public menuHeight: number;
  public isMenuCollapsed: boolean = false;
  public isMenuShouldCollapsed: boolean = false;

  private oldWidth: number = 0;

  constructor(private _elementRef: ElementRef, private _state: GlobalState) {
    this._state.subscribe('menu.isCollapsed', (isCollapsed) => {
      setTimeout(() => {
        this.isMenuCollapsed = isCollapsed;
        }, 1);
    });
  }

  public ngOnInit(): void {
    if (this._shouldMenuCollapse() || this.isMenuCollapsed) {
      this.menuCollapse();
    } else {
      this.menuExpand();
    }
  }

  public ngAfterViewInit(): void {
    setTimeout(() => this.updateSidebarHeight());
  }

  @HostListener('window:resize')
  public onWindowResize(): void {

    var isMenuShouldCollapsed = this._shouldMenuCollapse();

    // SPP-9589: Sidebar. Disable media expand of sidebar.
    // Just handle the case that the menu should be collapsed.
    if (isMenuShouldCollapsed) {
      if (this.isMenuShouldCollapsed !== isMenuShouldCollapsed || !this.isMenuCollapsed && this._isSmallerWidth()) {
        this.menuCollapseStateChange(isMenuShouldCollapsed);
      }
      this.isMenuShouldCollapsed = isMenuShouldCollapsed;
    }
    this.oldWidth = window.innerWidth;
    this.updateSidebarHeight();
  }

  public menuExpand(): void {
    this.menuCollapseStateChange(false);
  }

  public menuCollapse(): void {
    this.menuCollapseStateChange(true);
  }

  public menuCollapseStateChange(isCollapsed: boolean): void {
    this.isMenuCollapsed = isCollapsed;
    this._state.notifyDataChanged('menu.isCollapsed', this.isMenuCollapsed);
  }

  public updateSidebarHeight(): void {
    // TODO: get rid of magic 66 constant
    this.menuHeight = this._elementRef.nativeElement.childNodes[0].clientHeight - 66 -
      (this._hamburgerIconShowing() ? 48 : 0);
  }

  public hoverItem(): void {
    this._updateScrollbarStatus();
  }

  private _shouldMenuCollapse(): boolean {
    return window.innerWidth <= layoutSizes.resWidthCollapseSidebar;
  }

  private _isSmallerWidth(): boolean {
    return this.oldWidth > window.innerWidth;
  }

  private _hamburgerIconShowing(): boolean {
    let element = jQuery('.al-sidebar > .al-sidebar-list > .collapsible');
    return element && element.css('display') !== 'none';
  }

  private _updateScrollbarStatus(): void {
    let sidebar = jQuery('.al-sidebar'), almain = jQuery('.al-main'),
      content = jQuery('.al-sidebar .slimScrollDiv > ul'),
      scrollbarPresent = content && content[0] && content[0].scrollHeight > this.menuHeight;

    if (sidebar) {
      if (scrollbarPresent)
        sidebar.addClass('sidebar-scrollbar');
      else
        sidebar.removeClass('sidebar-scrollbar');
    }
    if (almain) {
      if (scrollbarPresent)
        almain.addClass('sidebar-scrollbar');
      else
        almain.removeClass('sidebar-scrollbar');
    }
  }
}
