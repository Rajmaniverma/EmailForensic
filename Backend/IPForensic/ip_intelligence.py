import os
import requests
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

IPINFO_TOKEN = os.getenv("IPINFO_TOKEN")
IPINFO_URL = "https://ipinfo.io"


def lookup_ip(ip: str) -> Optional[Dict[str, Any]]:
    """
    Get intelligence information about a public IP address.

    Returns:
        Dictionary containing IP, hostname, organization,
        ASN, location and network information.
    """

    if not ip:
        return None

    url = f"{IPINFO_URL}/{ip}/json"

    headers = {}

    if IPINFO_TOKEN:
        headers["Authorization"] = f"Bearer {IPINFO_TOKEN}"

    try:
        response = requests.get(
            url,
            headers=headers,
            timeout=5
        )

        response.raise_for_status()

        data = response.json()

        return {
            "ip": ip,
            "hostname": data.get("hostname"),
            "organization": data.get("org"),
            "asn": extract_asn(data.get("org")),
            "country": data.get("country"),
            "region": data.get("region"),
            "city": data.get("city"),
            "postal": data.get("postal"),
            "latitude": extract_coordinates(data.get("loc"))[0],
            "longitude": extract_coordinates(data.get("loc"))[1],
            "timezone": data.get("timezone"),
        }

    except requests.RequestException as e:

        return {
            "ip": ip,
            "error": str(e)
        }


def extract_asn(org: Optional[str]) -> Optional[str]:
    """
    Extract ASN from organization string.

    Example:
        'AS15169 Google LLC'
        -> 'AS15169'
    """

    if not org:
        return None

    parts = org.split()

    if parts and parts[0].upper().startswith("AS"):
        return parts[0]

    return None


def extract_coordinates(
    loc: Optional[str]
) -> tuple[Optional[float], Optional[float]]:

    if not loc:
        return None, None

    try:
        latitude, longitude = loc.split(",")

        return float(latitude), float(longitude)

    except (ValueError, AttributeError):
        return None, None


def lookup_multiple_ips(
    ips: list[str]
) -> list[Dict[str, Any]]:
    """
    Lookup intelligence for multiple IP addresses.
    """

    results = []

    seen = set()

    for ip in ips:

        if ip in seen:
            continue

        seen.add(ip)

        result = lookup_ip(ip)

        if result:
            results.append(result)

    return results