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
  users:any[] = [];
  activeConversation:any[] = [];
  conversationFound:boolean;
  otherUser:string = "";
  newMessage:string = "";
  loginSwitch:boolean;

  //constructor(private elementRef:ElementRef)
  constructor(private bes:BackendServiceService)
  {

  }

  onLoggedIn(event)
  {
    console.log(event);

    this.bes.getAllUsers().subscribe
    (
      data =>
      {
        this.users = data.Users;
        if(this.users.length > 0)
          this.fetchConversation(this.users[0].Username);
      },
      err => {console.log(err);}
    );
    //then show messages from the first user
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

  fetchConversation(requiredUsername:string)
  {
    this.otherUser = requiredUsername;
    console.log(requiredUsername);
    this.bes.getConversation(requiredUsername).subscribe
    (
      data =>
      {
        console.log(data);
        if(data.success)
        {
          this.activeConversation = data.conversation;
          this.conversationFound = true;
          console.log(this.activeConversation);
        }
        else
        {
          this.activeConversation = [];
          this.conversationFound = false;
        }
      },
      err => {console.log(err);}
    );
  }

  sendMessage()
  {
    console.log(this.newMessage);
    let message = this.newMessage;
    this.newMessage = "";
    //push message
    this.bes.sendMessage(message, this.otherUser).subscribe
    (
      resp =>
      {
        console.log(resp);
        if(resp.success)
        {
          this.activeConversation = resp.newConversation;
          this.conversationFound = true;
        }
      },
      err => {console.log(err);}
    );
  }
}
