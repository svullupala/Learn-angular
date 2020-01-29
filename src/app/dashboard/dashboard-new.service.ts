import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs/Rx';
import { WebsocketService } from 'shared/websocket.service';
import { SessionService } from 'core';
import { SharedService } from 'shared/shared.service';

const urlPattern = '{0}//{1}:{2}/api/endeavour/sysdiag/sockets/time?esessionid={3}';

@Injectable()
export class DashboardNewService {

  private _messages: Subject<string>;

  private wsService;
  private sessionService;

  constructor(wsService: WebsocketService) {
    this.wsService = wsService;
    this.sessionService = SessionService.getInstance();
  }

  public get messages(): Subject<string> {
    this.connectWebsocket(this.getWebsocketUrl());
    return this._messages;
  }

  public disconnect() {
    this.wsService.close(this.getWebsocketUrl());
  }

  private connectWebsocket(url: string) {
   this._messages = <Subject<string>>this.wsService.connect(url).map(
      (response: MessageEvent): string => {
        return response.data;
      }
    );
  }

  // TODO: NEED TO RETRIEVE FROM HATOAS LINK
  private getWebsocketUrl(): string {
    let protocol='wss:', port='8443';

    if (window.location.protocol === 'http:') {
      protocol = 'ws:';
      port = '8082';
    }

    return SharedService.formatString(urlPattern, protocol, window.location.hostname, port, this.sessionService.sessionId);
  }
}
