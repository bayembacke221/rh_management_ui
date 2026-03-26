import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Client, IMessage } from '@stomp/stompjs';
import { NotificationDto, PageNotificationDto } from './notification.model';
import { TokenService } from '../token.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl = 'http://localhost:8088/api/v1/notifications';
  private wsUrl = 'http://localhost:8088/api/v1/ws';

  private stompClient: Client | null = null;
  private connected = false;

  private unreadCount$ = new BehaviorSubject<number>(0);
  private newNotification$ = new BehaviorSubject<NotificationDto | null>(null);
  private notifications$ = new BehaviorSubject<NotificationDto[]>([]);

  get unreadCount(): Observable<number> {
    return this.unreadCount$.asObservable();
  }

  get newNotification(): Observable<NotificationDto | null> {
    return this.newNotification$.asObservable();
  }

  get notifications(): Observable<NotificationDto[]> {
    return this.notifications$.asObservable();
  }

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) {}

  // --- REST API ---

  getMyNotifications(page = 0, size = 20): Observable<PageNotificationDto> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdDate,desc');
    return this.http.get<PageNotificationDto>(this.baseUrl, { params }).pipe(
      tap(res => {
        if (res.content) {
          this.notifications$.next(res.content);
        }
      })
    );
  }

  getUnreadNotifications(page = 0, size = 20): Observable<PageNotificationDto> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdDate,desc');
    return this.http.get<PageNotificationDto>(`${this.baseUrl}/unread`, { params });
  }

  countUnread(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/count-unread`).pipe(
      tap(res => this.unreadCount$.next(res.count))
    );
  }

  markAsRead(id: number): Observable<NotificationDto> {
    return this.http.post<NotificationDto>(`${this.baseUrl}/${id}/read`, {}).pipe(
      tap(() => {
        // Decrement unread count
        const current = this.unreadCount$.value;
        if (current > 0) this.unreadCount$.next(current - 1);

        // Update local list
        const notifs = this.notifications$.value.map(n =>
          n.id === id ? { ...n, read: true } : n
        );
        this.notifications$.next(notifs);
      })
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/mark-all-read`, {}).pipe(
      tap(() => {
        this.unreadCount$.next(0);
        const notifs = this.notifications$.value.map(n => ({ ...n, read: true }));
        this.notifications$.next(notifs);
      })
    );
  }

  // --- WebSocket ---

  connect(): void {
    if (this.connected || !this.tokenService.isAuthenticated()) return;

    const token = this.tokenService.getToken();

    this.stompClient = new Client({
      brokerURL: this.wsUrl.replace('http', 'ws') + '/websocket',
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: () => {}
    });

    this.stompClient.onConnect = () => {
      this.connected = true;
      console.log('[WS] Connected');

      // Subscribe to personal notifications
      this.stompClient!.subscribe('/user/queue/notifications', (message: IMessage) => {
        const notification: NotificationDto = JSON.parse(message.body);
        this.newNotification$.next(notification);

        // Add to top of list
        const current = this.notifications$.value;
        this.notifications$.next([notification, ...current]);

        // Increment unread count
        this.unreadCount$.next(this.unreadCount$.value + 1);
      });

      // Subscribe to unread count updates
      this.stompClient!.subscribe('/user/queue/notifications/count', (message: IMessage) => {
        const count = JSON.parse(message.body);
        this.unreadCount$.next(count);
      });

      // Subscribe to broadcast notifications
      this.stompClient!.subscribe('/topic/notifications', (message: IMessage) => {
        const notification: NotificationDto = JSON.parse(message.body);
        this.newNotification$.next(notification);
        const current = this.notifications$.value;
        this.notifications$.next([notification, ...current]);
        this.unreadCount$.next(this.unreadCount$.value + 1);
      });

      // Load initial unread count
      this.countUnread().subscribe();
    };

    this.stompClient.onStompError = (frame) => {
      console.error('[WS] STOMP error:', frame.headers['message']);
    };

    this.stompClient.onDisconnect = () => {
      this.connected = false;
      console.log('[WS] Disconnected');
    };

    this.stompClient.activate();
  }

  disconnect(): void {
    if (this.stompClient && this.connected) {
      this.stompClient.deactivate();
      this.connected = false;
    }
  }

  // --- Helpers ---

  getTypeIcon(type?: string): string {
    const icons: Record<string, string> = {
      'LEAVE_REQUEST': 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5',
      'LEAVE_APPROVED': 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
      'LEAVE_REJECTED': 'M9.75 9.75l4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
      'NEW_EMPLOYEE': 'M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z',
      'CONTRACT_EXPIRING': 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z',
      'DOCUMENT_UPLOADED': 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
      'ANNOUNCEMENT': 'M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46',
    };
    return icons[type || ''] || 'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0';
  }

  getTypeColor(type?: string): string {
    const colors: Record<string, string> = {
      'LEAVE_APPROVED': 'text-green-600 bg-green-500/10',
      'LEAVE_REJECTED': 'text-destructive bg-destructive/10',
      'CONTRACT_EXPIRING': 'text-orange-600 bg-orange-500/10',
      'URGENT': 'text-destructive bg-destructive/10',
    };
    return colors[type || ''] || 'text-muted-foreground bg-muted';
  }

  getPriorityColor(priority?: string): string {
    const colors: Record<string, string> = {
      'LOW': 'bg-muted text-muted-foreground',
      'MEDIUM': 'bg-blue-500/10 text-blue-600',
      'HIGH': 'bg-orange-500/10 text-orange-600',
      'URGENT': 'bg-destructive/10 text-destructive',
    };
    return colors[priority || ''] || 'bg-muted text-muted-foreground';
  }

  formatTimeAgo(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'A l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  }
}
