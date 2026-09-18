from typing import Optional, Dict, Any


def get_geolocation(
    ip_intelligence: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Convert IP intelligence data into a normalized
    geolocation structure.
    """

    if not ip_intelligence:
        return {
            "available": False,
            "country": None,
            "region": None,
            "city": None,
            "postal": None,
            "latitude": None,
            "longitude": None,
            "timezone": None
        }

    return {
        "available": bool(
            ip_intelligence.get("country")
            or ip_intelligence.get("city")
        ),

        "country": ip_intelligence.get("country"),

        "region": ip_intelligence.get("region"),

        "city": ip_intelligence.get("city"),

        "postal": ip_intelligence.get("postal"),

        "latitude": ip_intelligence.get("latitude"),

        "longitude": ip_intelligence.get("longitude"),

        "timezone": ip_intelligence.get("timezone")
    }


def get_location_label(
    geolocation: Dict[str, Any]
) -> str:
    """
    Create a human-readable location string.
    """

    city = geolocation.get("city")
    region = geolocation.get("region")
    country = geolocation.get("country")

    parts = [
        value
        for value in [city, region, country]
        if value
    ]

    if not parts:
        return "Location unavailable"

    return ", ".join(parts)


def get_coordinates(
    geolocation: Dict[str, Any]
) -> Optional[Dict[str, float]]:
    """
    Return coordinates if available.
    """

    latitude = geolocation.get("latitude")
    longitude = geolocation.get("longitude")

    if latitude is None or longitude is None:
        return None

    return {
        "latitude": latitude,
        "longitude": longitude
    }