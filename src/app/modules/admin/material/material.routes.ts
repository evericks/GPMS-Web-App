import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { MaterialComponent } from 'app/modules/admin/material/material.component';
import { MaterialService } from './material.service';

export default [
    {
        path: '',
        component: MaterialComponent,
        resolve: {
            // material: () => inject(MaterialService).getMaterials(),
        }
    },
] as Routes;
