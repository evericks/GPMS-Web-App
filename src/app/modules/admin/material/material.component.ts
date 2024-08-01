import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { FuseAlertComponent } from '@fuse/components/alert';
import { Pagination } from 'app/types/pagination.type';
import { Material } from 'app/types/material.type';
import { Observable, Subject, debounceTime, filter, map, merge, of, switchMap, takeUntil } from 'rxjs';
import { CreateMaterialComponent } from './create/create-material.component';
import { MaterialDetailComponent } from './detail/material-detail.component';
import { MaterialService } from './material.service';

@Component({
    selector: 'material',
    standalone: true,
    templateUrl: './material.component.html',
    styleUrls: ['./material.component.css'],
    encapsulation: ViewEncapsulation.None,
    imports: [CommonModule, MatButtonModule, MatIconModule, FormsModule, MatFormFieldModule, ReactiveFormsModule, MatInputModule, MatSortModule, MatPaginatorModule,
        MatSelectModule, MatOptionModule, FuseAlertComponent, MatCheckboxModule]
})
export class MaterialComponent implements OnInit, AfterViewInit {
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    @ViewChildren('inputField') inputFields: QueryList<ElementRef>;

    searchInputControl: UntypedFormControl = new UntypedFormControl();
    filterForm: UntypedFormGroup;

    materials$: Observable<Material[]>;
    pagination: Pagination;
    isLoading: boolean = false;
    flashMessage: 'success' | 'error' | null = null;
    message: string = null;

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    /**
     * Constructor
     */
    constructor(
        private _materialService: MaterialService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: UntypedFormBuilder,
        private _dialog: MatDialog
    ) { }

    ngOnInit(): void {

        // Get the materials
        this.getMaterials();

        // Get the pagination
        this._materialService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: Pagination) => {

                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        this.initFilterForm();
        this.subcribeFilterForm();
    }

    /**
* After view init
*/
    ngAfterViewInit(): void {
        if (this._sort && this._paginator) {
            // Set the initial sort
            this._sort.sort({
                id: 'name',
                start: 'asc',
                disableClear: true
            });

            // Detect changes
            this._changeDetectorRef.detectChanges();

            // If the invoices changes the sort order...
            this._sort.sortChange
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe(() => {
                    const isAsc = this._sort.direction === 'asc';
                    this.setSortFilter(this._sort.active, isAsc)
                    // Reset back to the first page
                    this._paginator.pageIndex = 0;
                });

            // Get invoices if sort or page changes
            merge(this._sort.sortChange, this._paginator.page).pipe(
                switchMap(() => {
                    this.setPaginationFilter(this._paginator.pageIndex, this._paginator.pageSize)
                    this.isLoading = true;
                    return of(true);
                }),
                map(() => {
                    this.isLoading = false;
                })
            ).subscribe();
        }
    }

    private getMaterials() {
        this.materials$ = this._materialService.materials$;
    }

    private setPaginationFilter(pageIndex: number, pageSize: number) {
        this.filterForm.patchValue({
            pagination: {
                pageNumber: pageIndex,
                pageSize: pageSize
            },
        })
    }

    private setSortFilter(orderBy: string, isAscending: boolean) {
        this.filterForm.controls['orderBy'].setValue(orderBy);
        this.filterForm.controls['isAscending'].setValue(isAscending);
    }

    private initFilterForm() {
        this.filterForm = this._formBuilder.group({
            search: [null],
            orderBy: [null],
            pagination: [{
                pageNumber: this.pagination.pageNumber,
                pageSize: this.pagination.pageSize,
            }],
            isAscending: [null]
        });
    }

    private subcribeFilterForm() {
        this.filterForm.valueChanges.pipe(
            takeUntil(this._unsubscribeAll),
            filter(() => this.filterForm.valid),
            debounceTime(500),
            switchMap((filter) => {
                this.isLoading = true;
                this._materialService.getMaterials(filter).subscribe(result => {
                    if (result.data.length == 0) {
                        this.showFlashMessage('error', 'No items were found', 3000)
                    }
                });
                return of(true);
            }),
            map(() => {
                this.isLoading = false;
            })
        ).subscribe();
    }

    private showFlashMessage(type: 'success' | 'error', message: string, time: number): void {
        this.flashMessage = type;
        this.message = message;
        this._changeDetectorRef.markForCheck();
        setTimeout(() => {
            this.flashMessage = this.message = null;
            this._changeDetectorRef.markForCheck();
        }, time);
    }

    openCreateMaterialDialog() {
        this._dialog.open(CreateMaterialComponent, {
            width: '720px'
        }).afterClosed().subscribe(result => {
            if (result === 'success') {
                this.showFlashMessage('success', 'Create material successful', 3000);
            }
        })
    }

    openMaterialDetailDialog(id: string) {
        this._materialService.getMaterialById(id).subscribe(material => {
            if (material) {
                this._dialog.open(MaterialDetailComponent, {
                    width: '720px'
                }).afterClosed().subscribe(result => {
                    if (result === 'success') {
                        this.showFlashMessage('success', 'Update material successful', 3000);
                    }
                })
            }
        })
    }
}