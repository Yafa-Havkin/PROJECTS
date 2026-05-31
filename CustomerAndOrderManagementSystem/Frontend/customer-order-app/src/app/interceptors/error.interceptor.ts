import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = '';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Client Error: ${error.error.message}`;
      } else {
        // Server-side error
        errorMessage = `Server Error: ${error.status} - ${error.error?.message || error.message}`;
      }

      console.error('HTTP Error:', errorMessage);
      alert(errorMessage);

      return throwError(() => error);
    })
  );
};
