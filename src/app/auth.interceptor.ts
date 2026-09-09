import { HttpInterceptorFn } from '@angular/common/http';

import { STEP_UP_HEADER, STEP_UP_TOKEN } from './step-up-context';

/**
 * Authenticates every same-origin {@code /bff/**} request with the HttpOnly
 * {@code bff_} cookie instead of a browser-held Bearer.
 *
 * <p>The OPAQUE {@code bff_session} login flow runs on the host shell (login-ui):
 * the {@code /bff/login} exchange returns a {@code Set-Cookie: bff_=...} the
 * browser stores as HttpOnly (never readable from JS). The fe-gateway's
 * {@code BffCookieToBearerWebFilter} turns that cookie into the upstream Bearer
 * SERVER-SIDE, so the browser must only send the cookie as request credentials —
 * it must NOT (and now cannot) attach an {@code Authorization} header from
 * {@code localStorage}. We therefore set {@code withCredentials: true} on every
 * request so the same-origin {@code bff_} cookie rides along.
 *
 * <p>{@code Accept: application/json} is added to match the previous fetch
 * headers; {@code Content-Type} is left to Angular's {@code HttpClient} (it sets
 * {@code application/json} for object bodies), which is what the generated client
 * sends.
 *
 * <p>A request whose {@link HttpContext} carries a {@link STEP_UP_TOKEN} (the
 * offer / withdraw / provision writes, when the operator has confirmed a step-up
 * challenge) additionally gets the {@code X-ServiceStore-StepUp} header — see
 * {@code step-up-context.ts} for why the token travels in the context rather than
 * as a generated header parameter. A request without one is left exactly as before.
 */
export const bffAuthInterceptor: HttpInterceptorFn = (req, next) => {
  let headers = req.headers.set('Accept', 'application/json');
  const stepUp = req.context.get(STEP_UP_TOKEN);
  if (stepUp.length > 0) headers = headers.set(STEP_UP_HEADER, stepUp);
  return next(req.clone({ headers, withCredentials: true }));
};
