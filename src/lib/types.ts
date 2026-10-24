/** Shared types from CONTRACT.md. Lanes import these; they do not restate them. */

export type Point = {
  lat: number;
  lon: number;
};

export type Exit = Point & {
  label: string;
};

export type Station = Point & {
  slug: string;
  name: string;
  exits: Exit[];
};

export type RiderInput = Point & {
  id: string;
};

export type GroupMember = {
  id: string;
  soloKm: number;
  rideKm: number;
  soloFare: number;
  share: number;
  /** Drop point and the rider's own words, for drawing routes and the driver card. */
  lat?: number;
  lon?: number;
  destText?: string;
  /** +91XXXXXXXXXX. Only present in /state for members of the asking rider's own group. */
  phone?: string;
};

/** Grouping output. meetAt and route are added when the group is stored. */
export type Group = {
  riderIds: string[];
  totalKm: number;
  legKm: number[];
  perRider: GroupMember[];
  estimated: boolean;
  meetAt?: string;
  route?: Point[];
};

export type RoomRider = {
  id: string;
  name: string | null;
  destText: string;
  lat: number;
  lon: number;
};

export type RoomState = {
  waiting: RoomRider[];
  sameWay: RoomRider[];
  group: (Group & { meetAt: string }) | null;
  estimated: boolean;
};

export type GeocodeResult = Point & {
  label: string;
};

export type GeocodeResponse = GeocodeResult[];

export type JoinRoomRequest = {
  name?: string;
  /** Indian mobile; the server normalises to +91XXXXXXXXXX. */
  phone?: string;
  destText: string;
  lat: number;
  lon: number;
};

export type JoinRoomResponse = {
  riderId: string;
};

export type FormGroupsResponse = Array<Group & { meetAt: string }>;

export type StoredGroup = {
  id: string;
  station: string;
  createdAt: string;
  data: Group & { meetAt: string };
};

export type GetGroupsResponse = StoredGroup[];

export type ResetRoomResponse = {
  ok: true;
};
