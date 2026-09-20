
import os
from typing import Any, Dict, Optional

import requests

VPNAPI_URL = "https://vpnapi.io/api/{ip}"


def fetch_ip_data(ip: str, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Query vpnapi.io for VPN / proxy / Tor / relay flags, geolocation and
    network info for a single IP address.

    Raises requests.RequestException on network/HTTP errors.
    """
    api_key = api_key or os.getenv("VPNAPI_KEY")
    if not api_key:
        raise ValueError("Missing API key. Pass api_key or set VPNAPI_KEY.")

    response = requests.get(
        VPNAPI_URL.format(ip=ip),
        params={"key": api_key},
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


def analyze_anonymization(ip: str, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Run VPN, Proxy, Tor and geolocation analysis for an IP using vpnapi.io.
    """
    try:
        data = fetch_ip_data(ip, api_key)
    except (requests.RequestException, ValueError) as exc:
        return {"ip": ip, "success": False, "error": str(exc)}

    # vpnapi.io returns {"message": "..."} on errors such as an invalid key
    if "security" not in data:
        return {
            "ip": ip,
            "success": False,
            "error": data.get("message", "Unexpected API response"),
        }

    security = data.get("security", {})
    location = data.get("location", {})
    network = data.get("network", {})

    return {
        "ip": ip,
        "success": True,
        "anonymization": {
            "vpn": bool(security.get("vpn")),
            "proxy": bool(security.get("proxy")),
            "tor": bool(security.get("tor")),
            "relay": bool(security.get("relay")),
            "is_anonymized": any(
                security.get(k) for k in ("vpn", "proxy", "tor", "relay")
            ),
        },
        "geolocation": {
            "city": location.get("city"),
            "region": location.get("region"),
            "region_code": location.get("region_code"),
            "country": location.get("country"),
            "country_code": location.get("country_code"),
            "continent": location.get("continent"),
            "latitude": location.get("latitude"),
            "longitude": location.get("longitude"),
            "time_zone": location.get("time_zone"),
            "is_in_european_union": location.get("is_in_european_union"),
        },
        "network": {
            "network": network.get("network"),
            "asn": network.get("autonomous_system_number"),
            "organization": network.get("autonomous_system_organization"),
        },
    }

