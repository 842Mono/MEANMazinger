import { Component, OnInit } from '@angular/core';
import {BackendServiceService} from '../backend-service/backend-service.service';

@Component
(
  {
    selector: 'app-auth',
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.css']
  }
)
export class AuthComponent implements OnInit
{
  loading1:boolean;

  miniFlashMessageText:string = "";
  miniFlashMessage:boolean;

  username:string = "";
  password:string = "";

  constructor(private bes:BackendServiceService){}

  ngOnInit(){}

  login()
  {
    this.miniFlashMessage = false;
    this.loading1 = true;
    if(this.username == "" || this.password == "")
    {
      this.loading1 = false;
      this.miniFlashMessageText = "Please Enter a Username and a Password";
      this.miniFlashMessage = true;
      return;
    }

    this.bes.authenticate(this.username, this.password).subscribe
    (
      resp =>
      {
        this.loading1 = false;
        if(resp.success)
        {

        }//save token and flip the switch :)
        else
        {
          this.miniFlashMessageText = resp.msg;
          this.miniFlashMessage = true;
        }
      },
      err =>
      {
        this.loading1 = false;
        let body = JSON.parse(err._body);
        console.log(body);
        console.log("the water");

        if(!body.success)
        {
          this.miniFlashMessageText = body.msg;
          this.miniFlashMessage = true;
        }
        else
          console.log(err);
      }
    );
  }

}
