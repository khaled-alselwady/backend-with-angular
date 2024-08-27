import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, throwError } from 'rxjs';

import { Place } from './place.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class PlacesService {
  private userPlaces = signal<Place[]>([]);
  private httpClient = inject(HttpClient);

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
    );
  }

  addPlaceToUserPlaces(placeId: number) {
    return this.httpClient.post('https://localhost:7067/api/user-places', {
      placeId,
    });
  }

  removeUserPlace(place: Place) {}

  private fetchPlaces(url: string, errorMessage: string) {
    return this.httpClient.get(url).pipe(
      map((resData) => resData as Place[]),
      catchError((error) => {
        console.log(error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
