import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { DashboardNewService } from './dashboard-new.service';
import { Subject } from 'rxjs/Rx';

@Component({
  selector: 'dashboard-new',
  styleUrls: ['./dashboard.scss'],
  templateUrl: './dashboard-new.component.html'
})

export class DashboardNew implements OnInit, OnDestroy {

  private sub;
  private serverTime: string = 'Click Me';
  private message: string = 'SPP_TOGGLE';

  constructor(private service: DashboardNewService) { } 

  ngOnInit() { }

  ngAfterViewInit() { }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = undefined; 
      this.service.disconnect();
    }
  }

  public sendMsg() {
    if (!this.sub) {
      this.subscribeToWebsocket(); 
    } 

    console.log("new message from client to websocket: ", this.message);
    this.service.messages.next(this.message);
  }

  private subscribeToWebsocket() {
    this.sub = this.service.messages.subscribe(msg => {
      this.serverTime = msg;
    });
  }
}
