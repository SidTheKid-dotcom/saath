import { iconResponse } from "../components/pwa/iconArt";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return iconResponse(180, 0.9);
}
