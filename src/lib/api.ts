import type {
  FormGroupsResponse,
  GeocodeResponse,
  GetGroupsResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  ResetRoomResponse,
  RoomState,
} from "./types";

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "1";

const waiting = [
  {
    id: "asha",
    name: "Asha",
    destText: "Datta Mandir, Viman Nagar",
    lat: 18.56772,
    lon: 73.91395,
  },
  {
    id: "rohan",
    name: "Rohan",
    destText: "Phoenix Marketcity, Viman Nagar",
    lat: 18.56215,
    lon: 73.91755,
  },
  {
    id: "meera",
    name: "Meera",
    destText: "Ganga Aurora, Viman Nagar",
    lat: 18.5704,
    lon: 73.9108,
  },
];

const places = [
  { label: "Datta Mandir, Viman Nagar, Pune", lat: 18.56772, lon: 73.91395 },
  { label: "Phoenix Marketcity, Viman Nagar, Pune", lat: 18.56215, lon: 73.91755 },
  { label: "Ganga Aurora, Viman Nagar, Pune", lat: 18.5704, lon: 73.9108 },
  { label: "Weikfield IT Park, Viman Nagar, Pune", lat: 18.5648, lon: 73.9112 },
  { label: "Shankar Maharaj Math, Viman Nagar, Pune", lat: 18.5662, lon: 73.9089 },
];

/** Two shared autos toward Viman Nagar. Shares follow the contracted split. */
const formed: FormGroupsResponse = [
  {
    riderIds: ["rohan", "asha"],
    totalKm: 3.6,
    legKm: [2, 1.6],
    perRider: [
      { id: "rohan", soloKm: 2.4, rideKm: 2, soloFare: 48, share: 31 },
      { id: "asha", soloKm: 3.1, rideKm: 3.6, soloFare: 62, share: 41 },
    ],
    estimated: false,
    meetAt: "Gate 2",
    route: [
      { lat: 18.55761, lon: 73.90907 },
      { lat: 18.5594, lon: 73.9142 },
      { lat: 18.56215, lon: 73.91755 },
      { lat: 18.5651, lon: 73.9158 },
      { lat: 18.56772, lon: 73.91395 },
    ],
  },
  {
    riderIds: ["meera"],
    totalKm: 2.8,
    legKm: [2.8],
    perRider: [{ id: "meera", soloKm: 2.8, rideKm: 2.8, soloFare: 56, share: 56 }],
    estimated: true,
    meetAt: "Gate 3",
    route: [
      { lat: 18.55727, lon: 73.90928 },
      { lat: 18.5628, lon: 73.9101 },
      { lat: 18.5704, lon: 73.9108 },
    ],
  },
];

function mockGeocode(q: string): GeocodeResponse {
  const needle = q.trim().toLowerCase();
  const hits = places.filter((place) => place.label.toLowerCase().includes(needle));
  if (hits.length > 0) return hits.slice(0, 5);
  return [{ label: q.trim() || "Viman Nagar, Pune", lat: 18.5676, lon: 73.9143 }, ...places].slice(0, 5);
}

function mockState(riderId: string): RoomState {
  const group = formed.find((item) => item.riderIds.includes(riderId)) ?? null;
  const sameWay = waiting.filter((rider) => rider.id !== riderId);
  return {
    waiting,
    sameWay: sameWay.length > 0 ? sameWay : waiting,
    group,
    estimated: group?.estimated ?? false,
  };
}

function mockGroups(station: string): GetGroupsResponse {
  return formed.map((group, index) => ({
    id: `mock-group-${index + 1}`,
    station,
    createdAt: "2026-10-24T07:00:00.000Z",
    data: group,
  }));
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { cache: "no-store", ...init });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function geocode(q: string, station: string): Promise<GeocodeResponse> {
  if (useMock) return mockGeocode(q);
  const params = new URLSearchParams({ q, station });
  return requestJson(`/api/geocode?${params.toString()}`);
}

export async function joinRoom(
  station: string,
  body: JoinRoomRequest,
): Promise<JoinRoomResponse> {
  if (useMock) return { riderId: "pending" };
  return requestJson(`/api/rooms/${encodeURIComponent(station)}/riders`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function getState(station: string, riderId: string): Promise<RoomState> {
  if (useMock) return mockState(riderId);
  const params = new URLSearchParams({ rider: riderId });
  return requestJson(`/api/rooms/${encodeURIComponent(station)}/state?${params.toString()}`);
}

export async function formGroups(
  station: string,
  boardKey: string,
): Promise<FormGroupsResponse> {
  if (useMock) return formed;
  return requestJson(`/api/rooms/${encodeURIComponent(station)}/form`, {
    method: "POST",
    headers: { "x-board-key": boardKey },
  });
}

export async function getGroups(station: string): Promise<GetGroupsResponse> {
  if (useMock) return mockGroups(station);
  return requestJson(`/api/rooms/${encodeURIComponent(station)}/groups`);
}

export async function resetRoom(
  station: string,
  boardKey: string,
): Promise<ResetRoomResponse> {
  if (useMock) return { ok: true };
  return requestJson(`/api/rooms/${encodeURIComponent(station)}/reset`, {
    method: "POST",
    headers: { "x-board-key": boardKey },
  });
}
