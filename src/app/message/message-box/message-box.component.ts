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
  public followers = [];
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
    this.messageService.getFollowers().subscribe((followersList: (FollowersResponse | FollowersErrorResponse)) => {
      if (followersList && followersList.hasOwnProperty('data')) {
        this.followers = followersList.data.openid;
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
  total: number;
  count: number;
  data: {
    openid: string[]
  };
  next_openid: string;
}
interface FollowersErrorResponse {
  errcode: number;
  errmsg: string;
  data: {
    openid: string[]
  };
}
