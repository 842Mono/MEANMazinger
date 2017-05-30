import { Component, OnInit } from '@angular/core';
import {BackendServiceService} from '../backend-service/backend-service.service';

@Component
(
  {
    selector: 'app-signup',
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.css']
  }
)
export class SignupComponent implements OnInit
{
  username:string = "";
  password:string = "";
  firstName:string = "";
  middleName:string = "";
  lastName:string = "";
  dateOfBirth:Date;
  email:string = "";

  loading1:boolean;
  miniFlashMessage:boolean;
  miniFlashMessageText:string = "";

  constructor(private bes:BackendServiceService){}

  ngOnInit(){}

  signup()
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
    console.log(this.middleName + "/nthis.midN");
    const newData = <signupData>{};
    newData.Username = this.username;
    newData.Password = this.password;
    if(this.firstName != "")
      newData.FirstName = this.firstName;
    if(this.middleName != "")
      newData.MiddleName = this.middleName;
    if(this.lastName != "")
      newData.LastName = this.lastName;
    if(this.dateOfBirth)
      newData.DateOfBirth = this.dateOfBirth;
    if(this.email != "")
      newData.Email = this.email;

    console.log(newData);

    this.bes.newSubscribtion(newData).subscribe
    (
      resp =>
      {
        this.loading1 = false;
        if(resp.success)
        {
          this.miniFlashMessageText = "New User Registered Successfully ✓";
          this.miniFlashMessage = true;
        }
        else
        {
          this.miniFlashMessageText = resp.msg;
          this.miniFlashMessage = true;
        }
      },
      err => {console.log(err);}
    );
  }

}

interface signupData
{
  Username:string,
  Password:string,
  FirstName:string,
  MiddleName:string,
  LastName:string,
  DateOfBirth:Date,
  Email:string
}
