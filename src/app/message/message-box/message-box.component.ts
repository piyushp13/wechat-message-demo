import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MessageService } from '../message.service';
import { MatSnackBar } from '@angular/material';
import { ChatService } from '../chat.service';

@Component({
  selector: 'app-message-box',
  templateUrl: './message-box.component.html',
  styleUrls: ['./message-box.component.scss']
})
export class MessageBoxComponent implements OnInit {
  public recipient = 'piyush';
  public message = 'Hi';
  public followers: FollowersResponse[];
  @ViewChild('incomingMessages') incomingMessageContainer: ElementRef;
  constructor(private messageService: MessageService,
              private snackBar: MatSnackBar,
              private chat: ChatService) { }

  ngOnInit() {
    this.getFollowersList();
    this.pollForChatService().then(res => {
      console.log('Chat instance: ', this.chat);
      this.connectToSocket();
    });
  }

  pollForChatService() {
    return new Promise((resolve, reject) => {
      while (!this.chat) {
        setTimeout(() => {
          this.pollForChatService();
        }, 500);
      }
      resolve(true);
    });
  }

  connectToSocket() {
    this.chat.messages.subscribe(res => {
      console.log('Message is ', res);
      let sender = '';
      if (res.from) {
        sender += res.from + ' : ';
      }
      this.incomingMessageContainer.nativeElement.innerText += sender + res.text + '\n';
    });
  }

  sendMessage() {
    this.chat.sendMsg({recipient: this.recipient, message: this.message});
  }

  onSubmit(formValue: { recipient: string, message: string }) {
    console.log(formValue);
    this.messageService.sendMessage(formValue).subscribe(res => {
      this.snackBar.open(res, null, {
        duration: 2000
      });
    });
  }

  getFollowersList() {
    this.messageService.getFollowers().subscribe((followersList: (FollowersResponse[])) => {
      if (followersList && followersList[0]) {
        this.followers = followersList;
        this.recipient = this.followers[0].openid;
      } else if (followersList && followersList.hasOwnProperty('errcode')) {
        this.followers = [];
        console.log('Failed to get followers list');
      }
    }, error => {
      console.log('Error hitting the followers API');
      this.followers = [];
    });
  }

}

interface FollowersResponse {
  subscribe: number;
  openid: string;
  nickname: string;
  sex: number;
  language: string;
  city: string;
  province: string;
  country: string;
  headimgurl: string;
  subscribe_time: number;
  errcode?: number;
  errmsg: string;
}
