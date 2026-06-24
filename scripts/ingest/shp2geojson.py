#!/usr/bin/env python
# shp2geojson.py — convertit SHP / GPKG / FGDB (ou .zip) en GeoJSON EPSG:4326.
# Moteur : geopandas + GDAL (via pyogrio). Reprojette automatiquement en WGS84.
# Conforme DOCTRINE_INGESTION.md : transformation de format uniquement, aucune donnée inventée.
#
# Usage :
#   python scripts/ingest/shp2geojson.py <entree> <sortie.geojson> [couche]
#
# Exemples :
#   python scripts/ingest/shp2geojson.py data/geo/SDA.shp.zip data/geo/municipalites.geojson
#   python scripts/ingest/shp2geojson.py "zip://data/geo/SDA.shp.zip!SDA_MUS_S.shp" out.geojson
#   python scripts/ingest/shp2geojson.py data/geo/decoupe.gpkg out.geojson nom_couche

import sys
import geopandas as gpd


def main():
    if len(sys.argv) < 3:
        print("Usage: shp2geojson.py <entree> <sortie.geojson> [couche]")
        sys.exit(1)
    src, out = sys.argv[1], sys.argv[2]
    layer = sys.argv[3] if len(sys.argv) > 3 else None
    gdf = gpd.read_file(src, layer=layer) if layer else gpd.read_file(src)
    if gdf.crs is not None and gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs(4326)
    gdf.to_file(out, driver="GeoJSON")
    print(f"OK {len(gdf)} entites -> {out}")


if __name__ == "__main__":
    main()
