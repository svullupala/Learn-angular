import {Component, Input, Output, EventEmitter, OnDestroy, OnInit, ElementRef} from '@angular/core'; import { Router, NavigationEnd } from '@angular/router'; import { Subscription } from 'rxjs/Rx'; import { BaMenuService } from '../../services';
import { GlobalState } from '../../../global.state';

import 'style-loader!./baMenu.scss';
import { SessionService } from 'core';
import * as _ from 'lodash';
import { environment } from '../../../environment';

@Component({
  selector: 'ba-menu',
  templateUrl: './baMenu.html'
})
export class BaMenu implements OnInit, OnDestroy {

  @Input() sidebarCollapsed: boolean = false;
  @Input() menuHeight: number;

  @Output() expandMenu = new EventEmitter<any>();
  @Output() itemHover = new EventEmitter<any>();

  public menuItems: any[];
  protected _menuItemsSub: Subscription;
  public showHoverElem: boolean;
  public hoverElemHeight: number;
  public hoverElemTop: number;
  protected _onRouteChange: Subscription;
  public outOfArea: number = -200;

  private sticky: boolean = false;

  constructor(private _router: Router, private _service: BaMenuService, private _state: GlobalState,
              private element: ElementRef) {
  }

  public toggleMenu(toggleSticky? : boolean) {
    if (this.sticky && !toggleSticky && !this.sidebarCollapsed) {
      return false;
    }

    if ((!this.sticky && toggleSticky && this.sidebarCollapsed) ||
         (this.sticky && toggleSticky && !this.sidebarCollapsed)) {
        this.sticky = !this.sticky;
    }

    this._state.notifyDataChanged('menu.isCollapsed', !this.sidebarCollapsed);
    return false;
  }

  public updateMenu(newMenuItems) {
    this.menuItems = this.rbacCheck(newMenuItems);

    // Save the allowed router paths.
    SessionService.getInstance().routerPathsAllowed = this.menus2routerPaths();

    this.selectMenuAndNotify();
    this.navigateToFirstAvailablePage();
  }

  /**
   * Navigate to te first available page
   */
  navigateToFirstAvailablePage() {
    if (this.menuItems && this.menuItems.length > 0) {
      let firstItem = this.menuItems[0],
        path = firstItem.route.path;

      this.addChildToPath(firstItem, path);
      // NOTE: Prevent navigating to /pages when autologin mode is on - this is for faster development
      if (!environment.autologin) {
        this._router.navigate(['/pages/' + path]);
      }
    }
  }

  /**
   * Recursively build the path to the first available page by iterating over children if available
   * @param menuItem
   * @param path
   * @returns {String}
   */
  addChildToPath(menuItem, path): String {
    if (menuItem.children) {
      path += '/' + menuItem.children[0].route.path;
      if (menuItem.children[0].children) {
        this.addChildToPath(menuItem.children[0], path);
      }
    }
    return path;
  }

  public selectMenuAndNotify(): void {
    if (this.menuItems) {
      this.menuItems = this._service.selectMenuItem(this.menuItems);
      this._state.notifyDataChanged('menu.activeLink', this._service.getCurrentItem());
    }
  }

  public ngOnInit(): void {
    this._onRouteChange = this._router.events.subscribe((event) => {

      if (event instanceof NavigationEnd) {
        if (this.menuItems) {
          this.selectMenuAndNotify();
        } else {
          // on page load we have to wait as event is fired before menu elements are prepared
          setTimeout(() => this.selectMenuAndNotify());
        }
      }
    });

    this._menuItemsSub = this._service.menuItems.subscribe(this.updateMenu.bind(this));
  }

  public ngOnDestroy(): void {
    this._onRouteChange.unsubscribe();
    this._menuItemsSub.unsubscribe();

    // Clean up the allowed router paths.
    SessionService.getInstance().routerPathsAllowed = undefined;
  }

  public hoverItem($event): void {
    this.showHoverElem = true;
    this.hoverElemHeight = $event.currentTarget.clientHeight;
    // TODO: get rid of magic 66 constant
    this.hoverElemTop = $event.currentTarget.getBoundingClientRect().top - 66;
    this.itemHover.emit($event);
  }

  public toggleSubMenu($event): boolean {
    let me = this, submenu = jQuery($event.currentTarget).next();

    if (me.sidebarCollapsed) {
      if (!$event.item.expanded) {
        $event.item.expanded = true;
        if ($event.firstLevel)
          me.collapseSiblingSubMenu($event.item, false);
      }
      me.expandMenu.emit(null);
    } else {
      $event.item.expanded = !$event.item.expanded;
      $event.item.expanded ? submenu.slideDown() : submenu.slideUp();

      if ($event.item.expanded && $event.firstLevel)
        me.collapseSiblingSubMenu($event.item, true);
    }
    return false;
  }  

  public clickLeafMenu($event): void {    
    if (!this.isFirstLevelMenuItem($event.item)) {
      this.toggleMenu();
    }
  }

  private collapseSiblingSubMenu(menuItem: any, slidingMotion: boolean): void {
    let me = this;
    (me.menuItems || []).forEach(function (item) {
      let sm, haSubMenu = item.children;
      if (haSubMenu && item.expanded && item !== menuItem) {
        item.expanded = false;
        sm = jQuery(me.element.nativeElement).find('ul[data-submenu="' + BaMenuService.subMenuId(item) + '"]');
        if (sm && sm.length) {
          slidingMotion ? sm.slideUp() : sm.hide();
        }
      }
    });
  }

  private rbacCheck(menuItems) {
    let screensAllowed = SessionService.getInstance().screens,
      newMenuItems = [], menuChildren = [];

    for (let eachMenuItem of menuItems) {
      this.rbacItem(newMenuItems, _.cloneDeep(eachMenuItem), screensAllowed);
    }

    return newMenuItems;
  }

  rbacItem(menuItems, menuItem, screens) {
    if (menuItem['children'] !== undefined) {
      let menuChildren = menuItem['children'];
      let newMenuItems = [];
      for (let eachChildItem of menuChildren) {
        this.rbacItem(newMenuItems, eachChildItem, screens);
      } 
      if (newMenuItems.length !== 0) {
        menuItem['children'] = newMenuItems;
        menuItems.push(menuItem);
      }
    } else if (this.rbacAllowed(menuItem, screens)) {
        menuItems.push(menuItem);
    }
  }

  rbacAllowed(menuItem, screens): boolean {
    for (let eachScreenAllowed of screens) {
      if (menuItem.route.rbacPath === undefined || menuItem.route.rbacPath === eachScreenAllowed.rbacPath) {
        return true;
      }
    } 

    return false;
  }

  private menuItem2routerPaths(item: any, parent: string, paths: string[]): string [] {
    let me = this, path = parent + '/' + item.route.path;
    if (item.children) {
      item.children.forEach(function (child) {
        me.menuItem2routerPaths(child, path, paths);
      });
    } else {
      paths.push(path);
    }
    if (item.self) {
      paths.push(path);
    }
    return paths;
  }

  private menus2routerPaths(): string[] {
    let me = this, paths: string[] = [];
    if (this.menuItems) {
      this.menuItems.forEach(function (item) {
        me.menuItem2routerPaths(item, '/pages', paths);
      });
    }
    return paths;
  }

  private isFirstLevelMenuItem(menuItem): boolean {
    for (var i = 0; i < this.menuItems.length; i++) {
      if (this.menuItems[i].title === menuItem.title) { 
        return true;
      }
    }
    
    return false; 
  }
}
