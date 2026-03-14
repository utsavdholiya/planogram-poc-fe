import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Orders
export const uploadOrders = (storeId, csvData, filename) =>
  api.post("/orders/upload", {
    store_id: storeId,
    csv_data: csvData,
    filename,
  });

export const submitManualOrders = (storeId, orders) =>
  api.post("/orders/manual", { store_id: storeId, orders });

export const getOrdersSummary = (storeId) =>
  api.get("/orders/summary", { params: { store_id: storeId } });

export const getOrdersHistory = (storeId) =>
  api.get("/orders/history", { params: { store_id: storeId } });

// Footfall
export const submitFootfall = (storeId, weekStart, weeklyCount, enteredBy) =>
  api.post("/footfall", {
    store_id: storeId,
    week_start: weekStart,
    weekly_count: weeklyCount,
    entered_by: enteredBy,
  });

export const getFootfall = (storeId) =>
  api.get("/footfall", { params: { store_id: storeId } });

// Planogram
const PLANOGRAM_FN_URL = import.meta.env.VITE_PLANOGRAM_FN_URL;
export const generatePlanogram = (params) =>
  api.post("/planogram/generate", params);

export const scorePlanogram = (params) => api.post("/planogram/score", params);

export const savePlanogram = (data) => api.post("/planogram/save", data);

export const getSavedPlanograms = (storeId) =>
  api.get("/planogram/saved", { params: { store_id: storeId } });

// Admin - Stores
export const getStores = () => api.get("/admin/stores");
export const createStore = (data) => api.post("/admin/stores", data);
export const updateStore = (data) => api.put("/admin/stores", data);
export const deleteStore = (storeId) =>
  api.delete("/admin/stores", { params: { store_id: storeId } });

// Admin - Zones
export const getZones = (storeId) =>
  api.get("/admin/zones", { params: { store_id: storeId } });
export const createZone = (data) => api.post("/admin/zones", data);
export const updateZone = (data) => api.put("/admin/zones", data);
export const deleteZone = (storeId, zoneId) =>
  api.delete("/admin/zones", {
    params: { store_id: storeId, zone_id: zoneId },
  });

// Admin - SKUs
export const getSKUs = () => api.get("/admin/skus");
export const updateSKU = (data) => api.put("/admin/skus", data);

export default api;
