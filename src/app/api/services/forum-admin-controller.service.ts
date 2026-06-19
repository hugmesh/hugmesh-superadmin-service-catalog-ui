/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { forumAdminApprove } from '../fn/forum-admin-controller/forum-admin-approve';
import { ForumAdminApprove$Params } from '../fn/forum-admin-controller/forum-admin-approve';
import { forumAdminAssignGroup } from '../fn/forum-admin-controller/forum-admin-assign-group';
import { ForumAdminAssignGroup$Params } from '../fn/forum-admin-controller/forum-admin-assign-group';
import { forumAdminAudit } from '../fn/forum-admin-controller/forum-admin-audit';
import { ForumAdminAudit$Params } from '../fn/forum-admin-controller/forum-admin-audit';
import { forumAdminBan } from '../fn/forum-admin-controller/forum-admin-ban';
import { ForumAdminBan$Params } from '../fn/forum-admin-controller/forum-admin-ban';
import { forumAdminCategories } from '../fn/forum-admin-controller/forum-admin-categories';
import { ForumAdminCategories$Params } from '../fn/forum-admin-controller/forum-admin-categories';
import { forumAdminCreateCategory } from '../fn/forum-admin-controller/forum-admin-create-category';
import { ForumAdminCreateCategory$Params } from '../fn/forum-admin-controller/forum-admin-create-category';
import { forumAdminInstallExtension } from '../fn/forum-admin-controller/forum-admin-install-extension';
import { ForumAdminInstallExtension$Params } from '../fn/forum-admin-controller/forum-admin-install-extension';
import { forumAdminInstallStyle } from '../fn/forum-admin-controller/forum-admin-install-style';
import { ForumAdminInstallStyle$Params } from '../fn/forum-admin-controller/forum-admin-install-style';
import { forumAdminModerationQueue } from '../fn/forum-admin-controller/forum-admin-moderation-queue';
import { ForumAdminModerationQueue$Params } from '../fn/forum-admin-controller/forum-admin-moderation-queue';
import { forumAdminReject } from '../fn/forum-admin-controller/forum-admin-reject';
import { ForumAdminReject$Params } from '../fn/forum-admin-controller/forum-admin-reject';
import { forumAdminStats } from '../fn/forum-admin-controller/forum-admin-stats';
import { ForumAdminStats$Params } from '../fn/forum-admin-controller/forum-admin-stats';
import { forumAdminUnban } from '../fn/forum-admin-controller/forum-admin-unban';
import { ForumAdminUnban$Params } from '../fn/forum-admin-controller/forum-admin-unban';
import { forumAdminUsage } from '../fn/forum-admin-controller/forum-admin-usage';
import { ForumAdminUsage$Params } from '../fn/forum-admin-controller/forum-admin-usage';
import { forumAdminUser } from '../fn/forum-admin-controller/forum-admin-user';
import { ForumAdminUser$Params } from '../fn/forum-admin-controller/forum-admin-user';
import { forumAdminUsers } from '../fn/forum-admin-controller/forum-admin-users';
import { ForumAdminUsers$Params } from '../fn/forum-admin-controller/forum-admin-users';

@Injectable({ providedIn: 'root' })
export class ForumAdminControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `forumAdminAssignGroup()` */
  static readonly ForumAdminAssignGroupPath = '/bff/admin/forum/users/{id}/groups';

  /**
   * Assign group.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `forumAdminAssignGroup()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  forumAdminAssignGroup$Response(params: ForumAdminAssignGroup$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return forumAdminAssignGroup(this.http, this.rootUrl, params, context);
  }

  /**
   * Assign group.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `forumAdminAssignGroup$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  forumAdminAssignGroup(params: ForumAdminAssignGroup$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.forumAdminAssignGroup$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `forumAdminBan()` */
  static readonly ForumAdminBanPath = '/bff/admin/forum/users/{id}/ban';

  /**
   * Ban.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `forumAdminBan()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  forumAdminBan$Response(params: ForumAdminBan$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return forumAdminBan(this.http, this.rootUrl, params, context);
  }

  /**
   * Ban.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `forumAdminBan$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  forumAdminBan(params: ForumAdminBan$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.forumAdminBan$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `forumAdminUnban()` */
  static readonly ForumAdminUnbanPath = '/bff/admin/forum/users/{id}/ban';

  /**
   * Unban.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `forumAdminUnban()` instead.
   *
   * This method doesn't expect any request body.
   */
  forumAdminUnban$Response(params: ForumAdminUnban$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return forumAdminUnban(this.http, this.rootUrl, params, context);
  }

  /**
   * Unban.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `forumAdminUnban$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  forumAdminUnban(params: ForumAdminUnban$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.forumAdminUnban$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `forumAdminInstallStyle()` */
  static readonly ForumAdminInstallStylePath = '/bff/admin/forum/styles';

  /**
   * Install style.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `forumAdminInstallStyle()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  forumAdminInstallStyle$Response(params: ForumAdminInstallStyle$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return forumAdminInstallStyle(this.http, this.rootUrl, params, context);
  }

  /**
   * Install style.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `forumAdminInstallStyle$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  forumAdminInstallStyle(params: ForumAdminInstallStyle$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.forumAdminInstallStyle$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `forumAdminReject()` */
  static readonly ForumAdminRejectPath = '/bff/admin/forum/moderation/{id}/reject';

  /**
   * Reject.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `forumAdminReject()` instead.
   *
   * This method doesn't expect any request body.
   */
  forumAdminReject$Response(params: ForumAdminReject$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return forumAdminReject(this.http, this.rootUrl, params, context);
  }

  /**
   * Reject.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `forumAdminReject$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  forumAdminReject(params: ForumAdminReject$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.forumAdminReject$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `forumAdminApprove()` */
  static readonly ForumAdminApprovePath = '/bff/admin/forum/moderation/{id}/approve';

  /**
   * Approve.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `forumAdminApprove()` instead.
   *
   * This method doesn't expect any request body.
   */
  forumAdminApprove$Response(params: ForumAdminApprove$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return forumAdminApprove(this.http, this.rootUrl, params, context);
  }

  /**
   * Approve.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `forumAdminApprove$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  forumAdminApprove(params: ForumAdminApprove$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.forumAdminApprove$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `forumAdminInstallExtension()` */
  static readonly ForumAdminInstallExtensionPath = '/bff/admin/forum/extensions';

  /**
   * Install extension.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `forumAdminInstallExtension()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  forumAdminInstallExtension$Response(params: ForumAdminInstallExtension$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return forumAdminInstallExtension(this.http, this.rootUrl, params, context);
  }

  /**
   * Install extension.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `forumAdminInstallExtension$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  forumAdminInstallExtension(params: ForumAdminInstallExtension$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.forumAdminInstallExtension$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `forumAdminCategories()` */
  static readonly ForumAdminCategoriesPath = '/bff/admin/forum/categories';

  /**
   * Categories.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `forumAdminCategories()` instead.
   *
   * This method doesn't expect any request body.
   */
  forumAdminCategories$Response(params?: ForumAdminCategories$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return forumAdminCategories(this.http, this.rootUrl, params, context);
  }

  /**
   * Categories.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `forumAdminCategories$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  forumAdminCategories(params?: ForumAdminCategories$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.forumAdminCategories$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `forumAdminCreateCategory()` */
  static readonly ForumAdminCreateCategoryPath = '/bff/admin/forum/categories';

  /**
   * Create category.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `forumAdminCreateCategory()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  forumAdminCreateCategory$Response(params: ForumAdminCreateCategory$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return forumAdminCreateCategory(this.http, this.rootUrl, params, context);
  }

  /**
   * Create category.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `forumAdminCreateCategory$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  forumAdminCreateCategory(params: ForumAdminCreateCategory$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.forumAdminCreateCategory$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `forumAdminUsers()` */
  static readonly ForumAdminUsersPath = '/bff/admin/forum/users';

  /**
   * Users.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `forumAdminUsers()` instead.
   *
   * This method doesn't expect any request body.
   */
  forumAdminUsers$Response(params?: ForumAdminUsers$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return forumAdminUsers(this.http, this.rootUrl, params, context);
  }

  /**
   * Users.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `forumAdminUsers$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  forumAdminUsers(params?: ForumAdminUsers$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.forumAdminUsers$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `forumAdminUser()` */
  static readonly ForumAdminUserPath = '/bff/admin/forum/users/{id}';

  /**
   * User.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `forumAdminUser()` instead.
   *
   * This method doesn't expect any request body.
   */
  forumAdminUser$Response(params: ForumAdminUser$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return forumAdminUser(this.http, this.rootUrl, params, context);
  }

  /**
   * User.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `forumAdminUser$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  forumAdminUser(params: ForumAdminUser$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.forumAdminUser$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `forumAdminUsage()` */
  static readonly ForumAdminUsagePath = '/bff/admin/forum/usage';

  /**
   * Usage.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `forumAdminUsage()` instead.
   *
   * This method doesn't expect any request body.
   */
  forumAdminUsage$Response(params?: ForumAdminUsage$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return forumAdminUsage(this.http, this.rootUrl, params, context);
  }

  /**
   * Usage.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `forumAdminUsage$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  forumAdminUsage(params?: ForumAdminUsage$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.forumAdminUsage$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `forumAdminStats()` */
  static readonly ForumAdminStatsPath = '/bff/admin/forum/stats';

  /**
   * Stats.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `forumAdminStats()` instead.
   *
   * This method doesn't expect any request body.
   */
  forumAdminStats$Response(params?: ForumAdminStats$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return forumAdminStats(this.http, this.rootUrl, params, context);
  }

  /**
   * Stats.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `forumAdminStats$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  forumAdminStats(params?: ForumAdminStats$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.forumAdminStats$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `forumAdminModerationQueue()` */
  static readonly ForumAdminModerationQueuePath = '/bff/admin/forum/moderation-queue';

  /**
   * Moderation queue.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `forumAdminModerationQueue()` instead.
   *
   * This method doesn't expect any request body.
   */
  forumAdminModerationQueue$Response(params?: ForumAdminModerationQueue$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return forumAdminModerationQueue(this.http, this.rootUrl, params, context);
  }

  /**
   * Moderation queue.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `forumAdminModerationQueue$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  forumAdminModerationQueue(params?: ForumAdminModerationQueue$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.forumAdminModerationQueue$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `forumAdminAudit()` */
  static readonly ForumAdminAuditPath = '/bff/admin/forum/audit';

  /**
   * Audit.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `forumAdminAudit()` instead.
   *
   * This method doesn't expect any request body.
   */
  forumAdminAudit$Response(params?: ForumAdminAudit$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return forumAdminAudit(this.http, this.rootUrl, params, context);
  }

  /**
   * Audit.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `forumAdminAudit$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  forumAdminAudit(params?: ForumAdminAudit$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.forumAdminAudit$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

}
