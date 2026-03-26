import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserDto } from '../../../services/models';
import { AuthService } from '../../../services/auth-wrapper-service';
import { NotificationService } from '../../../services/notifications/notification.service';
import { NotificationDto } from '../../../services/notifications/notification.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();

  userDropdownOpen = false;
  notificationsOpen = false;
  currentUser: UserDto | null = null;

  unreadCount = 0;
  notifications: NotificationDto[] = [];
  loadingNotifications = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    public notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();

    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        // Connect WebSocket after user is loaded
        this.notificationService.connect();
      },
      error: (err) => {
        console.error('Error fetching current user', err);
      }
    });

    // Subscribe to unread count
    this.subscriptions.push(
      this.notificationService.unreadCount.subscribe(count => {
        this.unreadCount = count;
      })
    );

    // Subscribe to notifications list
    this.subscriptions.push(
      this.notificationService.notifications.subscribe(notifs => {
        this.notifications = notifs;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.notificationService.disconnect();
  }

  toggleUserDropdown(): void {
    this.userDropdownOpen = !this.userDropdownOpen;
    if (this.userDropdownOpen) {
      this.notificationsOpen = false;
    }
  }

  toggleNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) {
      this.userDropdownOpen = false;
      // Load notifications when opening
      if (this.notifications.length === 0) {
        this.loadNotifications();
      }
    }
  }

  loadNotifications(): void {
    this.loadingNotifications = true;
    this.notificationService.getMyNotifications(0, 10).subscribe({
      next: () => {
        this.loadingNotifications = false;
      },
      error: () => {
        this.loadingNotifications = false;
      }
    });
  }

  markAsRead(notification: NotificationDto): void {
    if (notification.id && !notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  logout(): void {
    this.notificationService.disconnect();
    this.authService.logout().subscribe();
  }
}
