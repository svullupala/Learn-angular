import { Component, AfterViewInit } from '@angular/core';
import { SharedService } from 'shared/shared.service';
import { Router, NavigationEnd } from '@angular/router';
import {GlobalState} from '../../../global.state';

@Component({
  selector: 'ba-content-top',
  styleUrls: ['./baContentTop.scss'],
  templateUrl: './baContentTop.html',
})
export class BaContentTop implements AfterViewInit {

  public activePageTitle:string = '';
  private isFullScreen: boolean = false;
  private prevUrl: string = undefined;
  private fontColor: string = "#5D5D5D";

  constructor(private _state:GlobalState, private router: Router) {
    this._state.subscribe('menu.activeLink', (activeLink) => {
      if (activeLink) {
        this.activePageTitle = activeLink.title;
      }
      this.scrollToTop();
    });

    this._state.subscribe('main.alcontent', (screen) => {
      if (screen && screen.full === true) {
        this.goFullScreen(screen.backgroundColor, screen.fontColor, screen.title, screen.url);
      } else if (screen && screen.full === false) {
        this.resetFullScreen();
      }
    });

  } 

  ngAfterViewInit(): void {
    this.fontColor = SharedService.setContentTopFontColor(undefined); 
  }

  private scrollToTop(): void {
    // JQuery for now
    $('html, body').animate({
      scrollTop: 0
    }, 0);
  }

  private goFullScreen(backgroundColor: string, fontColor: string, title: string, prevUrl: string): void {
    if (this.isFullScreen) {
      return;
    }
  
    this.isFullScreen = true;

    if (prevUrl) {
      this.prevUrl = prevUrl;
    }

    if (fontColor) {
      SharedService.setContentTopFontColor(fontColor);
    }

    this._state.notifyDataChanged('menu.activeLink', {title: title});
  }

  private resetFullScreen(): void {
    if (!this.isFullScreen) {
      return;
    }

    this.isFullScreen = false;

    SharedService.setContentTopFontColor(this.fontColor);
  } 

  private onClose(): void {
    this.resetFullScreen();
    (this.prevUrl) ? this.router.navigate([this.prevUrl]) : this.router.navigate(['/pages/dashboard']);
  }
}
