import { Routes } from "@angular/router";
import { UserProfileComponent } from "src/app/_shared/user-profile/user-profile.component";

export const UserConfigRoutes: Routes = [
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
                        { label: 'Inicio', url: '/user/config' },
                        { label: 'Mi perfil' }
                    ]
                }
            }
        ]
    }
];