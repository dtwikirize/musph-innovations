import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const normalizeBaseUrl = (url = "") => url.replace(/\/+$/, "");
const baseURL = normalizeBaseUrl(process.env.DHIS2_BASE_URL || "https://cranemis.org");
const apiVersion = String(process.env.DHIS2_API_VERSION || "29");

const dhis2Api = axios.create({
  baseURL,
  timeout: 20000,
  proxy: false
});

export const dhis2Get = async (endpoint, params = {}) => {
  const token = process.env.DHIS2_TOKEN;
  if (!token) {
    const error = new Error("DHIS2_TOKEN is missing");
    error.status = 500;
    throw error;
  }
  try {
    const response = await dhis2Api.get(endpoint, {
      params,
      headers: {
        Authorization: `ApiToken ${token}`
      }
    });
    return response.data;
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || "DHIS2 request failed";
    console.error(`DHIS2 GET ${endpoint} failed [${status}]: ${message}`);
    const safeError = new Error(`DHIS2 request failed (${status})`);
    safeError.status = status;
    throw safeError;
  }
};

export const dhis2ApiPath = (path) => `/api/${apiVersion}${path}`;

export { baseURL, apiVersion };
