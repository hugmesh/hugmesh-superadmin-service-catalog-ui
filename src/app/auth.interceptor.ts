import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Attaches the shared-session {@code bffToken} Bearer to every same-origin
 * {@code /bff/**} request, exactly as the hand-rolled {@code fetch} layer did
 * before the ng-openapi-gen migration.
 *
 * <p>The token lives in {@code localStorage} under {@code snap.session} — the
 * OPAQUE {@code bff_session} login flow: the host shell (login-ui) performs the
 * {@code /bff/login} exchange and writes {@code snap.session}; this federated
 * remote only READS it and never renders a login form. The interceptor reads the
 * token per-request (never caches) so a re-login / cross-tab session change is
 * picked up immediately, matching the previous {@code bffToken()} call site.
 *
 * <p>{@code Accept: application/json} is added to match the previous fetch
 * headers; {@code Content-Type} is left to Angular's {@code HttpClient} (it sets
 * {@code application/json} for object bodies), which is what the generated client
 * sends.
 */
export const bffAuthInterceptor: HttpInterceptorFn = (req, next) => {
  let token: string | null = null;
  try {
    const s = JSON.parse(localStorage.getItem('snap.session') ?? 'null');
    token = s?.bffToken ?? null;
  } catch {
    token = null;
  }

  let headers = req.headers.set('Accept', 'application/json');
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }
  return next(req.clone({ headers }));
};
