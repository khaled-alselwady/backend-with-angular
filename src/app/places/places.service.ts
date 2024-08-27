import { inject, Injectable, signal } from '@angular/core';
import {
  catchError,
  lastValueFrom,
  map,
  Observable,
  Subscribable,
  tap,
  throwError,
} from 'rxjs';

import { Place } from './place.model';
import { HttpClient } from '@angular/common/http';
import { ErrorService } from '../shared/error.service';

@Injectable({
  providedIn: 'root',
})
export class PlacesService {
  private userPlaces = signal<Place[]>([]);
  private httpClient = inject(HttpClient);
  private errorService = inject(ErrorService);

  loadedUserPlaces = this.userPlaces.asReadonly();

  loadAvailablePlaces() {
    return this.fetchPlaces(
      'https://localhost:7067/api/places/all',
      'Something went wrong fetching the available places. please try again later.'
    );
  }

  loadUserPlaces() {
    return this.fetchPlaces(
      'https://localhost:7067/api/user-places/all',
      'Something went wrong fetching the favorite places. please try again later.'
    ).pipe(tap((userPlaces) => this.userPlaces.set(userPlaces)));
  }

  addPlaceToUserPlaces(place: Place) {
    const previousPlaces = this.userPlaces();
    let isExists = false;
    this.existsByPlaceId(place.id).subscribe({
      next: (exists) => (isExists = exists),
      complete: () => {
        if (!isExists) {
          this.userPlaces.update((prevPlaces) => [...prevPlaces, place]);

          this.httpClient
            .post('https://localhost:7067/api/user-places', {
              placeId: place.id,
            })
            .pipe(
              catchError((error) => {
                this.userPlaces.set(previousPlaces);
                this.errorService.showError(
                  'Failed to add place to favorites.'
                );
                return throwError(
                  () => new Error('Failed to add place to favorites.')
                );
              })
            )
            .subscribe();
        }
      },
    });
  }
  removeUserPlace(placeId: number) {
    const previousPlaces = this.userPlaces();

    if (previousPlaces.some((place) => place.id === placeId)) {
      this.userPlaces.set(
        previousPlaces.filter((place) => place.id !== placeId)
      );
    }

    return this.httpClient
      .delete(`https://localhost:7067/api/user-places/${placeId}`)
      .pipe(
        catchError((error) => {
          this.userPlaces.set(previousPlaces);
          this.errorService.showError('Failed to remove place from favorites.');
          return throwError(
            () => new Error('Failed to remove place from favorites.')
          );
        })
      );
  }

  private fetchPlaces(url: string, errorMessage: string) {
    return this.httpClient.get(url).pipe(
      map((resData) => resData as Place[]),
      catchError((error) => {
        console.log(error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  existsByPlaceId(placeId: number) {
    return this.httpClient
      .get(`https://localhost:7067/api/user-places/exists/${placeId}`)
      .pipe(
        map((resData) => {
          console.log('Continue IN EXISTS ' + resData);
          return resData as boolean;
        })
      );
  }
}
