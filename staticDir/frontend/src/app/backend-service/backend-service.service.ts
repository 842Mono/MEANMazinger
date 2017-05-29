import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class BackendServiceService
{
  authToken:any;

  constructor(private http: Http){}

  getAllUsers()
  {
    let headers = new Headers();
    headers.append('Content-Type', 'application/json');
    let ep = this.prepEndpoint('getallusers');
    return this.http.get(ep, { headers: headers }).map(res => res.json());
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
