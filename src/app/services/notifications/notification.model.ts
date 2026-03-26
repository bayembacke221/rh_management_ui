export interface NotificationDto {
  id?: number;
  title?: string;
  content?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  sourceType?: string;
  sourceId?: number;
  actionUrl?: string;
  read?: boolean;
  createdDate?: string;
  active?: boolean;
}

export type NotificationType =
  | 'LEAVE_REQUEST' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED'
  | 'NEW_EMPLOYEE' | 'CONTRACT_EXPIRING' | 'DOCUMENT_UPLOADED'
  | 'EVALUATION_DUE' | 'BIRTHDAY' | 'ANNOUNCEMENT'
  | 'TASK_ASSIGNED' | 'SYSTEM';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface PageNotificationDto {
  content?: NotificationDto[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
}
