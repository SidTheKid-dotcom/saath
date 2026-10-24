import type {
  StoredGroup,
  GeocodeResponse,
  GetGroupsResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  RoomState,
} from "./types";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { cache: "no-store", ...init });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

/** 200 with the group when this call won, "taken" on 409, throws otherwise. */
export async function acceptGroup(station: string, id: string): Promise<StoredGroup | "taken"> {
  const response = await fetch(`/api/rooms/${encodeURIComponent(station)}/groups/${encodeURIComponent(id)}/accept`, {
    method: "POST",
    cache: "no-store",
  });
  if (response.status === 409) return "taken";
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json() as Promise<StoredGroup>;
}

export async function geocode(q: string, station: string): Promise<GeocodeResponse> {
  const params = new URLSearchParams({ q, station });
  return requestJson(`/api/geocode?${params.toString()}`);
}

export async function joinRoom(station: string, body: JoinRoomRequest): Promise<JoinRoomResponse> {
  return requestJson(`/api/rooms/${encodeURIComponent(station)}/riders`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function getState(station: string, riderId: string): Promise<RoomState> {
  const params = new URLSearchParams({ rider: riderId });
  return requestJson(`/api/rooms/${encodeURIComponent(station)}/state?${params.toString()}`);
}

export async function getGroups(station: string): Promise<GetGroupsResponse> {
  return requestJson(`/api/rooms/${encodeURIComponent(station)}/groups`);
}
