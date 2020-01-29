import { Injectable } from "@angular/core";
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';

@Injectable()
export class WebsocketService {
  private cache: Map<string, WebsocketObject>;

  constructor() {
    this.cache = new Map<string, WebsocketObject>();
  }

  public connect(url): Subject<MessageEvent> {
    let me = this, subject;

    if (!me.cache.has(url)) {
      this.cache.set(url, me.create(url));
      console.log('websocket service. Successfully connected: ' + url);
    } 
    
    subject = me.cache.get(url).subject;      
    console.log('websocket service. Returning socket: ' + url);

    return subject;
  }

  public close(url) {
    let me = this, sockObj;

    if (me.cache.has(url)) {
      sockObj = me.cache.get(url);
      sockObj.websocket.close();
      me.cache.delete(url);
      console.log('websocket service. disconnect: ' + url);
    }
  }
 
/* TODO: reconnect websocket if closed.
  private reconnect(url):  WebsocketObject {
    let me = this, sockObj, retVal;

    if (me.cache.has(url)) {
      retVal = me.cache.get(url);
      retVal.websocket.close();
      sockObj = me.create(url); 
      retVal.subject = sockObj.subject;
      retVal.websocket = sockObj.websocket;
    }  else {
      retVal = me.create(url);
      me.cache.set(url, retVal);
    }

    return retVal;
  }

*/

  private create(url): WebsocketObject {
    let ws = new WebSocket(url);

    let observable = Observable.create((obs: Observer<MessageEvent>) => {
      ws.onmessage = obs.next.bind(obs);
      ws.onerror = obs.error.bind(obs);
      ws.onclose = obs.complete.bind(obs);
      return ws.close.bind(ws);
    });
    let observer = {
      next: (data: Object) => {
        let websocket = ws;
        if (websocket.readyState === WebSocket.OPEN) {
          websocket.send(data);
        } else {
          console.log('websocket service. Websocket not open.' );
        }
      }
    };
    
    return new WebsocketObject(url, Subject.create(observer, observable), ws);
  }
}

class WebsocketObject {
  url: string;
  subject: Subject<MessageEvent>;
  websocket: WebSocket; 

  constructor(url: string, subject: Subject<MessageEvent>, websocket: WebSocket) {
    this.url = url;
    this.subject = subject;
    this.websocket = websocket;
  }
}
