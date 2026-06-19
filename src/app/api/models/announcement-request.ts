/* tslint:disable */
/* eslint-disable */
export interface AnnouncementRequest {
  body_html: string;
  dismissible?: boolean;
  ends_at?: string;
  format?: string;
  priority?: number;
  starts_at?: string;
  state?: string;
  target_akkoma?: boolean;
  target_forum?: boolean;
  target_home?: boolean;
  target_login?: boolean;
  timezone?: string;
  title: string;
}
