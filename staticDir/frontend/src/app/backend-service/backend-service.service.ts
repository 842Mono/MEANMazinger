import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class BackendServiceService
{
  authToken:any;
  thisUser:string;

  constructor(private http: Http){}

  getAllUsers()
  {
    let headers = new Headers();
    //this.loadToken();
    //headers.append('Authorization', this.authToken);
    headers.append('Content-Type', 'application/json');
    let ep = this.prepEndpoint('getallusers');
    return this.http.get(ep, { headers: headers }).map(res => res.json());
  }

  getConversation(requiredUsername)
  {
    let headers = new Headers();
    //this.loadToken();
    //headers.append('Authorization', this.authToken);
    headers.append('Content-Type', 'application/json');
    let ep = this.prepEndpoint('fetchconversation');
    return this.http.post(ep, { requiredUsername: requiredUsername }, { headers: headers }).map(res => res.json());
  }

  loadToken()
  {
    const token = localStorage.getItem('id_token');
    this.authToken = token;
  }

  prepEndpoint(ep)
  {
    return 'http://localhost:5001/api/' + ep;
  }
}
