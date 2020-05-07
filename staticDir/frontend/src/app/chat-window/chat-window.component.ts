import { Component, OnInit, ElementRef } from '@angular/core';
import {BackendServiceService} from '../backend-service/backend-service.service';
import * as io from 'socket.io-client';

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
  otherUser:string = "";
  conversationFound:boolean;
  newMessage:string = "";
  //loginSwitch:boolean;

  socket = null;
  socketio = null;
  //socket: SocketIOClient.Socket;

  //filteredList:any[] = [];


  //constructor(private elementRef:ElementRef)
  constructor(private bes:BackendServiceService)
  {
    //this.socket = io(bes.backendPoint);
    //this.socket = io.connect(bes.backendSocket);


    console.log(bes.backendSocket);
    this.socketio = io.connect(bes.backendSocket);
    this.socketio.on('changeGetAllUsers', (data) => {console.log("Need to change Users!"); if(bes.loginSwitch) this.showAllUsers(); });
    this.socketio.on('changeConversation', (data) => {this.onMessageReceived(data);});
    //this.socketio.on('connect',function(){this.socketio.emit('authenticated', { Username:this.bes.thisUser });});
  }

  onMessageReceived(eventData)
  {
    console.log("delta conv!");
    if(eventData.sender == this.otherUser)
      this.fetchConversation(this.otherUser);
  }

  onLoggedIn(event)
  {
    console.log(event);

    this.socketio.emit('authenticated', { Username:this.bes.thisUser });

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
          this.socketio.emit('changeNewMessage', { recepient:this.otherUser, sender:this.bes.thisUser });
        }
      },
      err => {console.log(err);}
    );
  }
}
