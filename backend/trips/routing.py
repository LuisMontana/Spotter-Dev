import requests
from django.conf import settings

ORS_BASE_URL = "https://api.openrouteservice.org"


class RoutingError(Exception):
    pass


def geocode(place_name: str) -> tuple[float, float]:
    """Return (longitude, latitude) for a place name/address."""
    if not settings.ORS_API_KEY:
        raise RoutingError(
            "ORS_API_KEY is not set."
        )

    resp = requests.get(
        f"{ORS_BASE_URL}/geocode/search",
        params={"api_key": settings.ORS_API_KEY, "text": place_name, "size": 1},
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()
    features = data.get("features", [])
    if not features:
        raise RoutingError(f"Could not geocode location: {place_name!r}")
    lon, lat = features[0]["geometry"]["coordinates"]
    return lon, lat


def get_route(coords: list[tuple[float, float]]) -> dict:
    if not settings.ORS_API_KEY:
        raise RoutingError(
            "ORS_API_KEY is not set."
        )

    resp = requests.post(
        f"{ORS_BASE_URL}/v2/directions/driving-hgv/geojson",
        headers={
            "Authorization": settings.ORS_API_KEY,
            "Content-Type": "application/json",
        },
        json={"coordinates": [[lon, lat] for lon, lat in coords]},
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()
    feature = data["features"][0]
    summary = feature["properties"]["summary"]

    return {
        "distance_miles": summary["distance"] / 1609.34,
        "duration_hours": summary["duration"] / 3600,
        "geometry": feature["geometry"]["coordinates"],
    }
