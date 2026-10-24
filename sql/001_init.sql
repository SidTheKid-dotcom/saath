CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY,
  station text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  data jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS riders (
  id uuid PRIMARY KEY,
  station text NOT NULL,
  name text,
  dest_text text NOT NULL,
  lat double precision NOT NULL,
  lon double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  group_id uuid REFERENCES groups(id)
);

CREATE INDEX IF NOT EXISTS riders_station_created_idx ON riders (station, created_at);
CREATE INDEX IF NOT EXISTS groups_station_created_idx ON groups (station, created_at);
