import { api, session } from "../api/client";
import type {
  ApiPayment, ApiProfile, ApiSession, ApiSubmission, ApiSubmitResult, ApiTask, ApiWithdrawal, PhalaServices,
} from "./types";

/** Real backend implementation of the services (endpoints from api_integration.md §2). */
export const apiServices: PhalaServices = {
  auth: {
    async signIn(mobile, password) {
      const data = await api<ApiSession>("POST", "/signin", {
        mobile_number: mobile.replace(/\D/g, ""),
        password,
      });
      session.set(data.token);
      return data.profile;
    },
    signOut() {
      session.clear();
    },
    hasSession() {
      return !!session.get();
    },
  },
  profile: {
    get: () => api<ApiProfile>("GET", "/profile"),
  },
  tasks: {
    list: () => api<ApiTask[]>("GET", "/tasks"),
    submit: (task, response) => api<ApiSubmitResult>("POST", "/form", { task, response }),
    submissions: () => api<ApiSubmission[]>("GET", "/forms"),
  },
  wallet: {
    payment: () => api<ApiPayment>("GET", "/payment"),
    withdraw: (amount, upiId) => api<ApiWithdrawal>("POST", "/withdraw", { amount, upi_id: upiId }),
    withdrawals: () => api<ApiWithdrawal[]>("GET", "/withdrawals"),
  },
};
