import { Routes } from "@angular/router";
import { UserProfileComponent } from "src/app/_shared/user-profile/user-profile.component";
import { PlanComponent } from "./plan/plan.component";
import { UsersComponent } from "./users/users.component";

export const AccountConfigRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'profile',
        component: UserProfileComponent,
        data: {
          title: 'Mi perfil',
          routeName: 'main',
          urls: [
            { label: 'Inicio', url: '/account/config' },
            { label: 'Mi perfil' }
          ]
        }
      },
      {
        path: 'users',
        component: UsersComponent,
        data: {
          title: 'Usuarios y permisos',
          routeName: 'users',
          urls: [
            { label: 'Inicio', url: '/account/config' },
            { label: 'Usuarios y permisos' }
          ]
        }
      },
      {
        path: 'plan',
        component: PlanComponent,
        data: {
          title: 'Plan corporativo',
          routeName: 'plan',
          urls: [
            { label: 'Inicio', url: '/account/config' },
            { label: 'Plan corporativo' }
          ]
        }
      },
      { path: '', redirectTo: 'plan', pathMatch: 'prefix' }
    ]
  }
];