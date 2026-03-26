import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth-wrapper-service';
import { UserDto } from '../../services/models/user-dto';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {
  currentUser: UserDto | null = null;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  activeTab: 'profile' | 'security' | 'notifications' | 'appearance' = 'profile';

  loading = false;
  saving = false;
  successMessage: string | null = null;
  error: string | null = null;

  // Appearance
  themes = [
    { value: 'light', label: 'Clair' },
    { value: 'dark', label: 'Sombre' },
    { value: 'system', label: 'Systeme' }
  ];
  selectedTheme = 'light';
  selectedLanguage = 'fr';

  // Notifications
  emailNotifications = true;
  leaveNotifications = true;
  contractNotifications = true;
  reportNotifications = false;

  tabs: { id: 'profile' | 'security' | 'notifications' | 'appearance'; label: string; icon: string }[] = [
    { id: 'profile', label: 'Profil', icon: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z' },
    { id: 'security', label: 'Securite', icon: 'M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z' },
    { id: 'notifications', label: 'Notifications', icon: 'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0' },
    { id: 'appearance', label: 'Apparence', icon: 'M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      fullName: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.loading = true;
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.profileForm.patchValue({
          username: user.username,
          email: user.email,
          fullName: user.fullName
        });
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger le profil';
        this.loading = false;
      }
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.saving = true;
    this.successMessage = null;
    this.error = null;

    // Simulate save
    setTimeout(() => {
      this.successMessage = 'Profil mis a jour avec succes';
      this.saving = false;
    }, 500);
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;

    const { newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      this.error = 'Les mots de passe ne correspondent pas';
      return;
    }

    this.saving = true;
    this.successMessage = null;
    this.error = null;

    setTimeout(() => {
      this.successMessage = 'Mot de passe modifie avec succes';
      this.saving = false;
      this.passwordForm.reset();
    }, 500);
  }

  saveNotifications(): void {
    this.saving = true;
    this.successMessage = null;
    setTimeout(() => {
      this.successMessage = 'Preferences de notifications sauvegardees';
      this.saving = false;
    }, 300);
  }

  saveAppearance(): void {
    this.saving = true;
    this.successMessage = null;
    setTimeout(() => {
      this.successMessage = 'Preferences d\'apparence sauvegardees';
      this.saving = false;
    }, 300);
  }

  get pf() { return this.profileForm.controls; }
  get pwf() { return this.passwordForm.controls; }
}
