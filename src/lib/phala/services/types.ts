/**
 * Response shapes exactly as documented in api_integration.md, and the service contracts the
 * UI uses. Components never call fetch directly; they go through these services.
 */

export type ApiProfile = { u_id: string; name: string; mobile_number: string };

export type ApiSession = { token: string; profile: ApiProfile };

/** One row of the `main` sheet. `task` is the identifier sent back in POST /form. */
export type ApiTask = { task: string; short_description: string; full_description: string };

export type ApiSubmitResult = { submission_id: string; task: string; submitted_at: string };

export type ApiSubmission = { submission_id: string; task: string; submitted_at: string; response: unknown };

/** Wallet numbers from the `payment` sheet (admin-edited; the API never changes them). */
export type ApiPayment = {
  amount_withdrawn: number;
  amount_withdrawable: number;
  amount_balance: number;
  /** Free text; the API sets "pending" on withdraw, admin changes it (e.g. "paid"). */
  status: string;
  remarks: string;
  min_withdraw: number;
};

export type ApiWithdrawal = {
  withdrawal_id: string;
  amount: number;
  upi_id: string;
  /** Whatever admin sets ("pending" → e.g. "paid"). */
  status: string;
  requested_at: string;
};

export interface AuthService {
  /** POST /signin. Stores the token on success. */
  signIn(mobile: string, password: string): Promise<ApiProfile>;
  /** No logout endpoint: logout = delete the token. */
  signOut(): void;
  hasSession(): boolean;
}

export interface ProfileService {
  /** GET /profile */
  get(): Promise<ApiProfile>;
}

export interface TaskService {
  /** GET /tasks */
  list(): Promise<ApiTask[]>;
  /** POST /form — `task` must equal the sheet's Task cell exactly. */
  submit(task: string, response: Record<string, string>): Promise<ApiSubmitResult>;
  /** GET /forms — this user's submissions, oldest first. */
  submissions(): Promise<ApiSubmission[]>;
}

export interface WalletService {
  /** GET /payment */
  payment(): Promise<ApiPayment>;
  /** POST /withdraw — logged as pending; amounts are not changed by the API. */
  withdraw(amount: number, upiId: string): Promise<ApiWithdrawal>;
  /** GET /withdrawals */
  withdrawals(): Promise<ApiWithdrawal[]>;
}

export interface MediaService {
  /** Stores a file (photo/audio) and returns its storage key and public link. */
  upload(file: File, kind: "photo" | "audio"): Promise<{ key: string; url: string }>;
}

export interface PhalaServices {
  media: MediaService;
  auth: AuthService;
  profile: ProfileService;
  tasks: TaskService;
  wallet: WalletService;
}
