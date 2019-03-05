import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { MessageBoxComponent } from './message-box/message-box.component';

const routes: Routes = [
  {
    path: '', component: HomeComponent, children: [
      { path: 'message', component: MessageBoxComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MessageRoutingModule { }
