import { Component, OnInit, ElementRef } from '@angular/core';
import {BackendServiceService} from '../backend-service/backend-service.service';

declare var Tagify:any;

@Component
(
  {
    selector: 'app-chat-window',
    templateUrl: './chat-window.component.html',
    styleUrls:
    [
      './chat-window.component.css',
      './css/style.css'
    ]
  }
)
export class ChatWindowComponent implements OnInit
{
  users:any[];

  //constructor(private elementRef:ElementRef)
  constructor(private bes:BackendServiceService)
  {
    this.showAllUsers();
  }

  ngOnInit(){}

  showAllUsers()
  {
    this.bes.getAllUsers().subscribe
    (
      data =>
      {
        this.users = data.Users;
        console.log(this.users);
      },
      err =>{console.log(err);}
    );
  }

  /*sendMessage()
  {
    let headers = new Headers();
    this.loadToken();
    headers.append('Authorization', this.authToken);
    headers.append('Content-Type', 'application/json');
    let ep = this.prepEndpoint('CommentActivity');
    return this.http.post(ep, { "activityId": ID, "comment": comment }, { headers: headers }).map(res => res.json());
  }*/
}
