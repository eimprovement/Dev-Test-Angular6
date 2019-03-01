import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogConfig, MatPaginator, MatSnackBar, MatSort, MatTableDataSource } from '@angular/material';
import { Pet } from '@app/shared/models';
import { PetsService } from '@app/shared/services/pets.service';
import { take, takeWhile } from 'rxjs/operators';
import { AddPetComponent } from '../add-pet/add-pet.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
@Component({
  selector: 'app-pets',
  templateUrl: './pets.component.html',
  styleUrls: ['./pets.component.scss']
})
export class PetsComponent implements OnInit, OnDestroy {
  /*  Public Properties */
  dataLoaded = false;
  dataSource: MatTableDataSource<Pet>;
  displayedColumns: string[] = ['id', 'name', 'category', 'sold', 'delete'];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  /*  Private Properties */
  private alive = true;
  constructor(private dialog: MatDialog, private petsService: PetsService, private snackBar: MatSnackBar) {}

  /*  Life Cycle Hooks */
  ngOnInit(): void {
    this.registeredEvents();
  }
  ngOnDestroy(): void {
    this.alive = false;
  }

  /*  Public Methods */
  addPet(): void {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    const dialogRef = this.dialog.open(AddPetComponent, dialogConfig);

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe(data => {
        if (data) {
          data.status = 'pending';
          this.petsService
            .addPet(data)
            .pipe(take(1))
            .subscribe(response => {
              const dataTable: Pet[] = this.dataSource.data;
              dataTable.push(response);
              this.dataSource.data = [...dataTable];
              this.openConfirmation(data.name + ' added', 'Close');
            });
        }
      });
  }

  applyFilter(filterValue: string): void {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.dataSource.filter = filterValue;
  }

  deletePet(pet: Pet) {
    const dataTable: Pet[] = this.dataSource.data;

    const index = dataTable.indexOf(pet);

    if (index > -1) {
      dataTable.splice(index, 1);
    }

    this.dataSource.data = [...dataTable];
  }

  openConfirmation(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000
    });
  }

  removePet(pet: Pet): void {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = false;
    dialogConfig.data = {
      title: 'Delete pet',
      subtitle: 'Are you sure you want to delete ' + pet.name + '?'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, dialogConfig);
    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe(data => {
        if (data) {
          this.petsService
            .delete(pet.id)
            .pipe(take(1))
            .subscribe(
              response => {
                this.deletePet(pet);
                this.openConfirmation(pet.name + ' deleted', 'Close');
              },
              err => console.log(err)
            );
        }
      });
  }

  soldPet(pet: Pet): void {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = false;
    dialogConfig.data = {
      title: 'Sell pet',
      subtitle: 'Are you sure you want to sell ' + pet.name + '?'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, dialogConfig);
    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe(data => {
        if (data) {
          pet.status = 'sold';
          this.petsService
            .updatePet(pet)
            .pipe(take(1))
            .subscribe(
              response => {
                this.deletePet(pet);
                this.openConfirmation(response.name + ' sold', 'Close');
              },
              err => console.log(err)
            );
        }
      });
  }

  /*  Private Methods */
  private registeredEvents(): void {
    this.petsService
      .getPendingPets()
      .pipe(takeWhile(() => this.alive))
      .subscribe(data => {
        if (data) {
          this.dataSource = new MatTableDataSource<Pet>(data);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.dataLoaded = true;
        }
      });
  }
}
