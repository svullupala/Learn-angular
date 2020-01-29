import {Component, Input, Output, EventEmitter} from '@angular/core';
import {BaMenuService} from 'theme';
import 'style-loader!./baMenuItem.scss';
import {ActivatedRoute, Router, RouterStateSnapshot} from '@angular/router';
import {isArray} from 'rxjs/util/isArray';
import {GlobalState} from '../../../../../global.state';

@Component({
  selector: 'ba-menu-item',
  templateUrl: './baMenuItem.html'
})
export class BaMenuItem {

  @Input() sidebarCollapsed: boolean = false;
  @Input() firstLevel: boolean = false;
  @Input() menuItem: any;
  @Input() child: boolean = false;

  @Output() itemHover = new EventEmitter<any>();
  @Output() toggleSubMenu = new EventEmitter<any>();
  @Output() clickLeafMenu = new EventEmitter<any>();

  constructor(private globalState: GlobalState, private router: Router, private route: ActivatedRoute) {
  }

  public subMenuId(item): string {
    return BaMenuService.subMenuId(item);
  }

  public get canTabNavigate(): boolean {
    return this.firstLevel || !this.sidebarCollapsed;
  }

  public onHoverItem($event): void {
    this.itemHover.emit($event);
  }

  public onToggleSubMenu($event, item): boolean {
    if (!$event.item)
      $event.item = item;
    if ($event.firstLevel === undefined)
      $event.firstLevel = this.firstLevel;
    this.toggleSubMenu.emit($event);
    return false;
  }

  protected getRouterStateSnapshotUrl(): string {
    let routeSnapshot = this.route.snapshot,
      rsSnapshot: RouterStateSnapshot = routeSnapshot ? routeSnapshot['_routerState'] : null;
    return rsSnapshot ? rsSnapshot.url : '';
  }

  protected hasRoutePaths(item): boolean {
    return item && item.route && isArray(item.route.paths);
  }

  protected handleSameUrlRefresh(item): void {
    let me = this, url = me.getRouterStateSnapshotUrl(),
      target = item.route.paths.join('/');
    if ('/' + url === target)
      me.globalState.notifyDataChanged('menu.refreshSameUrl', url, true);
  }

  public onClickLeafMenu($event, item, refreshEnabled?: boolean): void {
    let me = this, url: string;
    if (!$event.item) {
      $event.item = item;
      if (refreshEnabled && me.hasRoutePaths(item)) {
        me.handleSameUrlRefresh(item);
      }
    }
    me.clickLeafMenu.emit($event);
  }
}
