"use client";

import { useEffect, useRef } from "react";
import { Map as GLMap, Marker, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Point, Station, StoredGroup } from "@/lib/types";
import styles from "./board.module.css";
import {
  boundsAreFlat,
  boundsOf,
  colourForGroup,
  dropPins,
  pointsForFit,
  routeLine,
  textOn,
} from "./helpers";

// MapLibre finds its worker next to its own module, which a bundled chunk path breaks.
// Pointing at the packaged file lets the bundler emit it as an asset.
setWorkerUrl(new URL("../../../node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href);

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

type OverlayIds = {
  sources: string[];
  layers: string[];
};

type Props = {
  station: Station;
  groups: StoredGroup[];
  /** Drop points for riders whose group data carries none. */
  known: ReadonlyMap<string, Point>;
  /** Shown instead of the map when WebGL is missing. The group cards still work. */
  unavailable: string;
};

export default function BoardMap({ station, groups, known, unavailable }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GLMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const overlayRef = useRef<OverlayIds>({ sources: [], layers: [] });
  const groupsRef = useRef(groups);
  const knownRef = useRef(known);
  const loadedRef = useRef(false);

  useEffect(() => {
    groupsRef.current = groups;
    knownRef.current = known;
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    map.resize();
    paintGroups(map, station, groups, known, markersRef.current, overlayRef.current);
  }, [groups, known, station]);

  useEffect(() => {
    const container = frameRef.current;
    if (!container) return;

    const markers = markersRef.current;
    const overlay = overlayRef.current;
    let map: GLMap;
    try {
      map = new GLMap({
        container,
        style: MAP_STYLE,
        center: [station.lon, station.lat],
        zoom: 12,
        fadeDuration: 0,
        dragRotate: false,
      });
    } catch {
      container.textContent = unavailable;
      return;
    }
    mapRef.current = map;

    const paint = () => {
      loadedRef.current = true;
      map.resize();
      paintGroups(map, station, groupsRef.current, knownRef.current, markersRef.current, overlayRef.current);
    };
    map.on("load", paint);

    const observer = new ResizeObserver(() => {
      map.resize();
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      clearOverlays(map, markers, overlay);
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
  }, [station, unavailable]);

  return <div ref={frameRef} className={styles.map} />;
}

function paintGroups(
  map: GLMap,
  station: Station,
  groups: StoredGroup[],
  known: ReadonlyMap<string, Point>,
  markers: Marker[],
  overlay: OverlayIds,
) {
  clearOverlays(map, markers, overlay);

  const lines: Point[][] = [];
  const pins = groups.flatMap((stored, index) => {
    const groupPins = dropPins(stored.data.riderIds, stored.data.perRider, known);
    const line = routeLine(stored.data.route, station, groupPins);
    if (line) {
      drawRoute(map, overlay, `route-${index}`, line, colourForGroup(index));
      lines.push(line);
    }
    return groupPins.map((pin) => ({ ...pin, colour: colourForGroup(index) }));
  });

  for (const pin of pins) {
    const element = pinElement(String(pin.number), pin.colour, textOn(pin.colour), 36);
    addMarker(map, markers, pin.lon, pin.lat, element);
  }

  const stationPin = pinElement(station.name.slice(0, 1).toUpperCase(), "#14120b", "#ffe14a", 46);
  stationPin.title = station.name;
  stationPin.style.borderRadius = "8px";
  addMarker(map, markers, station.lon, station.lat, stationPin);

  const box = boundsOf(pointsForFit(station, lines, pins));
  if (!box) return;
  if (boundsAreFlat(box)) {
    map.jumpTo({ center: [box.west, box.south], zoom: 14 });
    return;
  }
  map.fitBounds(
    [
      [box.west, box.south],
      [box.east, box.north],
    ],
    { padding: 56, duration: 0, maxZoom: 14.5 },
  );
}

function drawRoute(map: GLMap, overlay: OverlayIds, sourceId: string, line: Point[], colour: string) {
  map.addSource(sourceId, {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: line.map((point) => [point.lon, point.lat]),
      },
    },
  });
  overlay.sources.push(sourceId);

  const casingId = `${sourceId}-casing`;
  const lineId = `${sourceId}-line`;
  map.addLayer({
    id: casingId,
    type: "line",
    source: sourceId,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#ffffff", "line-width": 11 },
  });
  map.addLayer({
    id: lineId,
    type: "line",
    source: sourceId,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": colour, "line-width": 6 },
  });
  overlay.layers.push(casingId, lineId);
}

function addMarker(map: GLMap, markers: Marker[], lon: number, lat: number, element: HTMLDivElement) {
  const marker = new Marker({ element, anchor: "center" }).setLngLat([lon, lat]).addTo(map);
  markers.push(marker);
}

function pinElement(label: string, background: string, foreground: string, size: number) {
  const element = document.createElement("div");
  element.textContent = label;
  element.style.width = `${size}px`;
  element.style.height = `${size}px`;
  element.style.borderRadius = "999px";
  element.style.background = background;
  element.style.color = foreground;
  element.style.display = "grid";
  element.style.placeItems = "center";
  element.style.font = `800 ${Math.round(size * 0.42)}px/1 sans-serif`;
  element.style.border = "3px solid #14120b";
  element.style.boxShadow = "0 1px 0 rgba(20, 18, 11, 0.35)";
  return element;
}

function clearOverlays(map: GLMap, markers: Marker[], overlay: OverlayIds) {
  for (const marker of markers) marker.remove();
  markers.length = 0;
  for (const id of overlay.layers) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  for (const id of overlay.sources) {
    if (map.getSource(id)) map.removeSource(id);
  }
  overlay.layers = [];
  overlay.sources = [];
}
