import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Subject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketConnectionService {
  private webSocketUrl: string;
  private socket;
  messages: Subject<any>;
  constructor() {
    this.webSocketUrl = environment.restUrl;
  }
  connect(): Subject<MessageEvent> {
    this.socket = io(this.webSocketUrl);
    const socketObservable = new Observable(observer => {
      this.socket.on('message', (data) => {
        console.log('Received message from Websocket Server');
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });

    const socketObserver = {
      next: (data: object) => {
        this.socket.emit('message', JSON.stringify(data));
      },
    };
    return Subject.create(socketObserver, socketObservable);
  }
}
