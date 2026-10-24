-- One row per station while a form is in progress. Expired rows can be taken again.
CREATE TABLE IF NOT EXISTS form_locks (
  station text PRIMARY KEY,
  until timestamptz NOT NULL
);
