import { Injectable } from '@angular/core';
import { SocketConnectionService } from './socket-connection.service';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  messages: Subject<any>;
  constructor(private socketService: SocketConnectionService) {
    // tslint:disable-next-line:no-angle-bracket-type-assertion
    this.messages = <Subject<any>> this.socketService.connect()
      .pipe(map((response: any): any => {
        return response;
      }));
  }

  sendMsg(msg) {
    this.messages.next(msg);
  }
}
