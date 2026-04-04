export type Currency = 'USD' | 'EUR' | 'GBP' | 'ARS';
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
export type PreferencesLanguage = 'en' | 'es';

export interface UserPreferences {
  id: string;
  userId: string;
  currency: Currency;
  dateFormat: DateFormat;
  language: PreferencesLanguage;
  emailNotifications: boolean;
  pushNotifications: boolean;
  budgetAlerts: boolean;
  subscriptionReminders: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UpdatePreferencesRequest = Partial<
  Pick<
    UserPreferences,
    | 'currency'
    | 'dateFormat'
    | 'language'
    | 'emailNotifications'
    | 'pushNotifications'
    | 'budgetAlerts'
    | 'subscriptionReminders'
  >
>;
