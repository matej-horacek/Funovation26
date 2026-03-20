/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SuggestItem {
  name: string;
  label: string;
  position?: {
    lat: number;
    lon: number;
  };
  location?: {
    lat: number;
    lon: number;
  };
  type: string;
}

export interface RouteInfo {
  distance: number;
  duration: number;
  geometry: any;
}

export interface Location {
  lat: number;
  lon: number;
}
