import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { ChatWindowComponent } from './chat-window/chat-window.component';
import {BackendServiceService} from './backend-service/backend-service.service';

@NgModule
(
  {
    declarations:
    [
      AppComponent,
      ChatWindowComponent
    ],
    imports:
    [
      BrowserModule,
      FormsModule,
      HttpModule
    ],
    providers: [BackendServiceService],
    bootstrap: [AppComponent]
  }
)
export class AppModule { }
