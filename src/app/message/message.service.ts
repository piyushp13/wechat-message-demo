import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  constructor(private http: HttpClient) { }

  sendMessage({ recipient, message }) {
    const weChatMessageUrl = `${environment.restUrl}/sendMessage`;
    const messageBody = { recipient, message };
    return this.http.post(weChatMessageUrl, messageBody, {responseType: 'text'});
  }

  getFollowers() {
    const wechatFollowersApi = `${environment.restUrl}/followers`;
    return this.http.get(wechatFollowersApi);
  }
}
