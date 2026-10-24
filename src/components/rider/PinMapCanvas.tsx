"use client";

// Loaded client-only via next/dynamic from PinMap, so maplibre-gl and its CSS stay out of the main bundle.
import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Point } from "../../lib/types";
import { inBbox } from "./geo";
import styles from "./Rider.module.css";

// MapLibre finds its worker next to its own module, which a bundled chunk path breaks.
// Pointing at the packaged file lets the bundler emit it as an asset.
maplibregl.setWorkerUrl(new URL("../../../node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href);

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

type Props = {
  station: Point;
  pin: Point;
  stationLabel: string;
  pinLabel: string;
  onMove: (point: Point) => void;
  onOutside: () => void;
  onReady: () => void;
  onFail: () => void;
};

export default function PinMapCanvas({ station, pin, stationLabel, pinLabel, onMove, onOutside, onReady, onFail }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const handlers = useRef({ onMove, onOutside, onReady, onFail });
  const initial = useRef({ station, pin, stationLabel, pinLabel });

  useEffect(() => {
    handlers.current = { onMove, onOutside, onReady, onFail };
  });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const { station: s, pin: p, stationLabel: sl, pinLabel: pl } = initial.current;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: el,
        style: STYLE_URL,
        bounds: [
          [Math.min(s.lon, p.lon), Math.min(s.lat, p.lat)],
          [Math.max(s.lon, p.lon), Math.max(s.lat, p.lat)],
        ],
        fitBoundsOptions: { padding: { top: 64, bottom: 80, left: 56, right: 56 }, maxZoom: 16 },
        attributionControl: { compact: true },
      });
    } catch {
      handlers.current.onFail();
      return;
    }

    const stationEl = document.createElement("div");
    stationEl.className = styles.stationMarker;
    stationEl.setAttribute("role", "img");
    stationEl.setAttribute("aria-label", sl);
    stationEl.textContent = "M";
    new maplibregl.Marker({ element: stationEl }).setLngLat([s.lon, s.lat]).addTo(map);

    const pinEl = document.createElement("div");
    pinEl.className = styles.pinMarker;
    pinEl.setAttribute("role", "img");
    pinEl.setAttribute("aria-label", pl);
    const marker = new maplibregl.Marker({ element: pinEl, draggable: true, anchor: "bottom", offset: [0, -7] })
      .setLngLat([p.lon, p.lat])
      .addTo(map);

    let last: Point = p;
    const place = (point: Point) => {
      if (!inBbox(point.lat, point.lon)) {
        marker.setLngLat([last.lon, last.lat]);
        handlers.current.onOutside();
        return;
      }
      last = point;
      marker.setLngLat([point.lon, point.lat]);
      handlers.current.onMove(point);
    };

    marker.on("dragend", () => {
      const { lat, lng } = marker.getLngLat();
      place({ lat, lon: lng });
    });
    map.on("click", (event) => place({ lat: event.lngLat.lat, lon: event.lngLat.lng }));
    map.on("load", () => handlers.current.onReady());
    map.on("error", () => {
      if (!map.isStyleLoaded()) handlers.current.onFail();
    });

    return () => map.remove();
  }, []);

  // maplibre's own CSS makes its container position:relative, so the sized box is a wrapper.
  return (
    <div className={styles.map}>
      <div ref={box} className={styles.mapInner} />
    </div>
  );
}
