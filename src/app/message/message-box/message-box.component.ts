import { Component, OnInit } from '@angular/core';
import { MessageService } from '../message.service';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-message-box',
  templateUrl: './message-box.component.html',
  styleUrls: ['./message-box.component.scss']
})
export class MessageBoxComponent implements OnInit {
  public recipient = 'piyush';
  public message = 'Hi';
  public followers: FollowersResponse[];
  constructor(private messageService: MessageService,
    private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.getFollowersList();
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
