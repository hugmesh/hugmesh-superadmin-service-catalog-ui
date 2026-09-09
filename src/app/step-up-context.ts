import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * The step-up token seam between the {@link ServiceCatalogService} and the
 * {@code bffAuthInterceptor}.
 *
 * <p>The create-service wizard's scaffold/federate calls carry their step-up token as a
 * declared header parameter of the generated client (the admin-bff OpenAPI spec lists
 * {@code X-ServiceStore-StepUp} on those two operations). The offer / withdraw / provision
 * operations are NOT (yet) step-up-gated at the bff, so their generated clients expose no
 * header parameter — and the generated code is {@code DO NOT EDIT}. Rather than fork the
 * generated client or bypass it with a hand-rolled fetch, the token rides in the request's
 * {@link HttpContext} and the interceptor turns it into the header. When the bff gate lands
 * on those endpoints and {@code npm run gen:spec} regenerates the clients with the header
 * parameter, the service can switch to passing it directly (as scaffold/federate do) and
 * this seam can go — the wire contract is identical either way.
 */
export const STEP_UP_HEADER = 'X-ServiceStore-StepUp';

/** The step-up token to present on THIS request ('' = none; no header is sent). */
export const STEP_UP_TOKEN = new HttpContextToken<string>(() => '');

/**
 * An {@link HttpContext} carrying {@code token} as the request's step-up token, or
 * {@code undefined} when there is no token to present — so a token-less call is
 * byte-identical to one made before this seam existed.
 */
export function stepUpContext(token?: string): HttpContext | undefined {
  const t = token?.trim() ?? '';
  return t.length > 0 ? new HttpContext().set(STEP_UP_TOKEN, t) : undefined;
}
