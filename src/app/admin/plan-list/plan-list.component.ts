import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { mergeMap, tap } from 'rxjs/operators';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { iif, Observable, of, throwError, zip } from 'rxjs';
import {
  CATALOG_PAYMENT_TYPE,
  PLAN_DEFAULT_LICENCES,
  PLAN_DEFAULT_PRICE
} from 'src/app/_utils/constants';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Catalog } from 'src/app/_models/Catalog';
import { PlanApiService } from 'src/app/_services/api/plan-api.service';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { Plan } from 'src/app/_models/Plan';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-plan-list',
  templateUrl: './plan-list.component.html',
  styleUrls: ['./plan-list.component.scss'],
})
export class PlanListComponent implements OnInit, OnDestroy {
  // sidenave responsive
  mobileQuery!: MediaQueryList;
  private _mobileQueryListener!: () => void;
  displaySidemenu = false;
  isSidenavOpen = true;
  // table
  itemDialog!: boolean;
  items: Plan[] = [];
  item!: Plan;
  selectedItems: Plan[] = [];
  submitted: boolean = false;
  // catalogs
  paymentTypes: Catalog[] = [];
  // forms
  planForm!: FormGroup;
  // variables
  paymentTypeSelectedValue!: number;

  constructor(
    changeDetectorRef: ChangeDetectorRef,
    media: MediaMatcher,
    private readonly _catalog: CatalogApiService,
    private fb: FormBuilder,
    private _planApi: PlanApiService,
    private toast: CustomToastService,
    private confirmationService: ConfirmationService
  ) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addEventListener('mobile', this._mobileQueryListener);
    if (this.mobileQuery.matches) {
      this.isSidenavOpen = false;
    }
  }

  ngOnInit(): void {
    this.planForm = this.fb.group({
      id: [null],
      name: ['', Validators.compose([Validators.required, Validators.maxLength(150)])],
      isPostVacancyActive: [false],
      isHighlightVacancyActive: [false],
      licences: [PLAN_DEFAULT_LICENCES, Validators.compose([Validators.required])],
      isBenchmarkingActive: [false],
      price: [PLAN_DEFAULT_PRICE, Validators.compose([Validators.required])],
      paymentType: [this.paymentTypeSelectedValue, Validators.compose([Validators.required])],
      isPaymentRecurrent: [false],
      isTemplate: [false],
    });
    this.loadCatalogs()
      .pipe(
        tap((catalogs: any[]) => {
          this.paymentTypes = catalogs[0];
          if (this.paymentTypes.length > 0) {
            this.paymentTypeSelectedValue = this.paymentTypes[0].id;
            this.planForm.get('paymentType')?.setValue(this.paymentTypes[0].id);
          }
        }),
        mergeMap((resp: any[]) =>
          this._planApi
            .findAll()
            .pipe(
              mergeMap((response: ResponseApi) =>
                iif(
                  () => response.status === 'OK',
                  of(response.result),
                  throwError(response.message)
                )
              )
            )
        )
      )
      .subscribe(
        (accounts: Plan[]) => {
          this.items = accounts;
        },
        (err) => {
          this.toast.addPrimeToast('error', '', err.message);
        }
      );
  }
  loadCatalogs(): Observable<any> {
    const accountTypesCatalog$ = this._catalog
      .findAllByType(CATALOG_PAYMENT_TYPE)
      .pipe(
        mergeMap((response: ResponseApi) =>
          iif(
            () => response.status === 'OK',
            of(response.result),
            throwError(response.message)
          )
        )
      );
    return zip(accountTypesCatalog$);
  }
  // Table CRUD
  saveItem() {
    if (this.planForm.valid) {
      this.saveItemOnDb(this.planForm.value, this.submitted);
    } else {
      this.validateAllFormFields(this.planForm);
    }
  }
  saveItemOnDb(item: any, submitted: boolean) {
    const save$ = this._planApi.create(item);
    const update$ = this._planApi.update(item);

    const request$ = !submitted ? save$ : update$;

    request$.subscribe(
      (resp: ResponseApi) => {
        this.item = resp.result;
        this.hideDialog();
        if (!submitted) {
          this.items.push(this.item);
        } else {
          console.log(resp);
          this.items[this.findIndexById(this.item.id)] = this.item;
        }
        this.items = [...this.items];
        this.item = Object.create({});
        this.toast.addPrimeToast('success', '', resp.message);
      },
      (err) => {
        console.log(err);
        this.toast.addPrimeToast('error', '', err.message);
      },
      () => {}
    );
  }
  editItem(item: Plan) {
    this.submitted = true;
    this.item = { ...item }
    this.planForm.get('id')?.setValue(this.item.id);
    this.planForm.get('name')?.setValue(this.item.name);
    this.planForm.get('isPostVacancyActive')?.setValue(this.item.isPostVacancyActive);
    this.planForm.get('isHighlightVacancyActive')?.setValue(this.item.isHighlightVacancyActive);
    this.planForm.get('licences')?.setValue(this.item.licences);
    this.planForm.get('isBenchmarkingActive')?.setValue(this.item.isBenchmarkingActive);
    this.planForm.get('price')?.setValue(this.item.priceMonth);
    this.planForm.get('paymentType')?.setValue(this.item.paymentType);
    this.paymentTypeSelectedValue = this.item.paymentType;
    this.planForm.get('isPaymentRecurrent')?.setValue(this.item.isPaymentRecurrent);
    this.planForm.get('isTemplate')?.setValue(this.item.isTemplate);

    this.itemDialog = true;
  }
  deleteItem(item: Plan) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres borrar ' + item.name + '?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this._planApi.delete(item.id)
          .pipe(
            mergeMap((response: ResponseApi) =>
              iif(
                () => response.status === 'OK',
                of(response),
                throwError(response.message)
              )
            )
          )
          .subscribe(
            (resp: any) => {
              this.items = this.items.filter((val) => val.id !== item.id);
              this.item = Object.create({});
              this.toast.addPrimeToast('success', '', resp.message);
            },
            (err) => {
              console.log(err);
              this.toast.addPrimeToast('error', '', err.message);
            }
          );
      },
    });
  }
  deleteSelectedItems() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete the selected products?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this._planApi
          .deleteAll(this.selectedItems)
          .pipe(
            mergeMap((response: ResponseApi) =>
              iif(
                () => response.status === 'OK',
                of(response),
                throwError(response.message)
              )
            )
          )
          .subscribe(
            (resp: any) => {
              this.items = this.items.filter(
                (val) => !this.selectedItems.map((i) => i.id).includes(val.id)
              );
              this.item = Object.create({});
              this.toast.addPrimeToast('success', '', resp.message);
            },
            (err) => {
              console.log(err);
              this.toast.addPrimeToast('error', '', err.message);
            }
          );
      },
    });
  }
  // Screen controls
  openedSideNav(e: any) {
    this.isSidenavOpen = e;
  }
  openNew() {
    this.item = Object.create({});
    this.submitted = false;
    this.itemDialog = true;
  }
  hideDialog() {
    this.itemDialog = false;
    this.submitted = false;
    this.resetAllForms();
  }
  onHideCreate(event: any) {
    this.itemDialog = false;
    this.submitted = false;
    this.resetAllForms();
  }
  resetAllForms() {
    this.planForm.reset();
    if (this.paymentTypes.length > 0) {
      this.paymentTypeSelectedValue = this.paymentTypes[0].id;
      this.planForm.get('paymentType')?.setValue(this.paymentTypes[0].id);
    }
    this.planForm.get('price')?.setValue(PLAN_DEFAULT_PRICE);
    this.planForm.get('licences')?.setValue(PLAN_DEFAULT_LICENCES);
    this.planForm.get('isPostVacancyActive')?.setValue(false);
    this.planForm.get('isHighlightVacancyActive')?.setValue(false);
    this.planForm.get('isBenchmarkingActive')?.setValue(false);
    this.planForm.get('isPaymentRecurrent')?.setValue(false);
    this.planForm.get('isTemplate')?.setValue(false);

  } 
  findIndexById(id: number): number {
    let index = -1;
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].id === id) {
        index = i;
        break;
      }
    }

    return index;
  }
  validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof FormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }
  // For custom component
  onChangePostVacancy() {
    if (!this.planForm.get('isPostVacancyActive')?.value) {
      this.planForm.get('isHighlightVacancyActive')?.setValue(false);
    }
  }
  // destroy
  ngOnDestroy(): void {
    this.mobileQuery.removeEventListener('mobile', this._mobileQueryListener);
  }
}
