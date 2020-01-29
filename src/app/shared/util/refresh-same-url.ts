import {OnDestroy, OnInit} from '@angular/core';
import {GlobalState} from '../../global.state';
import {ActivatedRoute, RouterStateSnapshot} from '@angular/router';

export abstract class RefreshSameUrl implements OnInit, OnDestroy {

  private ownUrl: string;
  private fnRefreshSameUrl: Function;

  protected abstract onRefreshSameUrl(): void;

  protected constructor(protected globalState: GlobalState,
                        protected route: ActivatedRoute) {
  }

  ngOnDestroy(): void {
    let me = this, fn = me.fnRefreshSameUrl;
    if (fn)
      me.globalState.unsubscribe('menu.refreshSameUrl', fn);
  }

  ngOnInit() {
    let me = this;

    me.ownUrl = me.getRouterStateSnapshotUrl();
    me.fnRefreshSameUrl = (targetUrl) => {
      setTimeout(() => {
        me.rsuHandler(targetUrl);
      }, 1);
    };
    me.globalState.subscribe('menu.refreshSameUrl', me.fnRefreshSameUrl);
  }

  private getRouterStateSnapshotUrl(): string {
    let routeSnapshot = this.route.snapshot,
      rsSnapshot: RouterStateSnapshot = routeSnapshot ? routeSnapshot['_routerState'] : null;
    return rsSnapshot ? rsSnapshot.url : '';
  }

  private rsuHandler(targetUrl: string): void {
    let me = this, ownUrl = me.ownUrl;
    if (ownUrl === targetUrl)
      me.onRefreshSameUrl();
  }
}
