import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { ChatWindowComponent } from './chat-window/chat-window.component';
import { BackendServiceService } from './backend-service/backend-service.service';
import { AuthComponent } from './auth/auth.component';
import { SignupComponent } from './signup/signup.component';

@NgModule
(
  {
    declarations:
    [
      AppComponent,
      ChatWindowComponent,
      AuthComponent,
      SignupComponent
    ],
    imports:
    [
      BrowserModule,
      FormsModule,
      HttpModule
    ],
    providers: [BackendServiceService],
    bootstrap: [ChatWindowComponent]
  }
)
export class AppModule { }
