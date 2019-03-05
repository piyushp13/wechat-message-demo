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
  constructor(private messageService: MessageService,
              private snackBar: MatSnackBar) { }

  ngOnInit() {
  }

  onSubmit(formValue: { recipient: string, message: string }) {
    console.log(formValue);
    this.messageService.sendMessage(formValue).subscribe(res => {
      this.snackBar.open(res, null, {
        duration: 2000
      });
    });
  }

}
