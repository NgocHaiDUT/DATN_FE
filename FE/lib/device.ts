import { v4 as uuidv4 } from "uuid";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";

  let deviceId = localStorage.getItem("device_id");
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem("device_id", deviceId);
  }
  return deviceId;
}

export function getDeviceName(): string {
  if (typeof navigator === "undefined") return "unknown";
  return navigator.userAgent;
}
