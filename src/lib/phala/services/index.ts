import { apiServices } from "./api";
import type { PhalaServices } from "./types";

/** The services the app uses: the real backend (see api_integration.md). */
export const services: PhalaServices = apiServices;

export { ApiError, API_BASE, setUnauthenticatedHandler } from "../api/client";
export type {
  ApiPayment, ApiProfile, ApiSubmission, ApiTask, ApiWithdrawal, PhalaServices,
} from "./types";
