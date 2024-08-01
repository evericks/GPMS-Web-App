import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Material } from 'app/types/material.type';
import { Pagination } from 'app/types/pagination.type';
import { BehaviorSubject, Observable, map, switchMap, take, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MaterialService {

    private _material: BehaviorSubject<Material | null> = new BehaviorSubject(null);
    private _materials: BehaviorSubject<Material[] | null> = new BehaviorSubject(null);
    private _pagination: BehaviorSubject<Pagination | null> = new BehaviorSubject(null);

    constructor(private _httpClient: HttpClient) { }

    /**
 * Getter for material
 */
    get material$(): Observable<Material> {
        return this._material.asObservable();
    }

    /**
     * Getter for materials
     */
    get materials$(): Observable<Material[]> {
        return this._materials.asObservable();
    }

    /**
 * Getter for pagination
 */
    get pagination$(): Observable<Pagination> {
        return this._pagination.asObservable();
    }

    getMaterials(filter: any = {}):
        Observable<{ pagination: Pagination; data: Material[] }> {
        return this._httpClient.post<{ pagination: Pagination; data: Material[] }>('/api/materials/filter', filter).pipe(
            tap((response) => {
                this._pagination.next(response.pagination);
                this._materials.next(response.data);
            }),
        );
    }

    /**
     * Get material by id
     */
    getMaterialById(id: string): Observable<Material> {
        return this.materials$.pipe(
            take(1),
            switchMap(() => this._httpClient.get<Material>('/api/materials/' + id).pipe(
                map((material) => {

                    // Set value for current material
                    this._material.next(material);

                    // Return the new contact
                    return material;
                })
            ))
        );
    }

    /**
* Create material
*/
    createMaterial(data) {
        return this.materials$.pipe(
            take(1),
            switchMap((materials) => this._httpClient.post<Material>('/api/materials', data).pipe(
                map((newMaterial) => {

                    // Update material list with current page size
                    this._materials.next([newMaterial, ...materials].slice(0, this._pagination.value.pageSize));

                    return newMaterial;
                })
            ))
        )
    }

    /**
    * Update material
    */
    updateMaterial(id: string, data) {
        return this.materials$.pipe(
            take(1),
            switchMap((materials) => this._httpClient.put<Material>('/api/materials/' + id, data).pipe(
                map((updatedMaterial) => {

                    // Find and replace updated material
                    const index = materials.findIndex(item => item.id === id);
                    materials[index] = updatedMaterial;
                    this._materials.next(materials);

                    // Update material
                    this._material.next(updatedMaterial);

                    return updatedMaterial;
                })
            ))
        )
    }

    deleteMaterial(id: string): Observable<boolean> {
        return this.materials$.pipe(
            take(1),
            switchMap(materials => this._httpClient.delete('/api/materials/' + id).pipe(
                map((isDeleted: boolean) => {
                    // Find the index of the deleted product
                    const index = materials.findIndex(item => item.id === id);

                    // Delete the product
                    materials.splice(index, 1);

                    // Update the materials
                    this._materials.next(materials);

                    // Return the deleted status
                    return isDeleted;
                }),
            )),
        );
    }
}