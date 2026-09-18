import requests
from typing import Optional, Dict, Any, Set

TOR_EXIT_LIST_URL = (
    "https://check.torproject.org/torbulkexitlist"
)


def get_tor_exit_nodes() -> Set[str]:
    """
    Fetch the current Tor exit-node IP list.
    """

    try:
        response = requests.get(
            TOR_EXIT_LIST_URL,
            timeout=10
        )

        response.raise_for_status()

        ips = set()

        for line in response.text.splitlines():

            line = line.strip()

            if not line:
                continue

            if line.startswith("#"):
                continue

            ips.add(line)

        return ips

    except requests.RequestException:
        return set()


def check_tor(ip: str) -> Dict[str, Any]:
    """
    Check whether an IP is a known Tor exit node.
    """

    tor_nodes = get_tor_exit_nodes()

    is_tor = ip in tor_nodes

    return {
        "ip": ip,
        "is_tor": is_tor,
        "status": "TOR_EXIT_NODE" if is_tor else "NOT_TOR_EXIT_NODE"
    }


def check_proxy(
    ip: str,
    ip_intelligence: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Determine whether the IP appears to be proxy infrastructure.

    This is an intelligence-based indication, not proof.
    """

    if not ip_intelligence:
        return {
            "ip": ip,
            "is_proxy": False,
            "status": "UNKNOWN",
            "confidence": "LOW"
        }

    organization = (
        ip_intelligence.get("organization") or ""
    ).lower()

    hostname = (
        ip_intelligence.get("hostname") or ""
    ).lower()

    proxy_keywords = [
        "proxy",
        "vpn",
        "anonymous",
        "anonymizer",
        "relay",
        "tor"
    ]

    text = f"{organization} {hostname}"

    detected = any(
        keyword in text
        for keyword in proxy_keywords
    )

    return {
        "ip": ip,
        "is_proxy": detected,
        "status": (
            "POSSIBLE_PROXY"
            if detected
            else "NOT_IDENTIFIED_AS_PROXY"
        ),
        "confidence": "MEDIUM" if detected else "LOW"
    }


def check_vpn(
    ip: str,
    ip_intelligence: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Determine whether the IP appears to belong to VPN infrastructure.

    VPN detection requires dedicated IP intelligence.
    """

    if not ip_intelligence:
        return {
            "ip": ip,
            "is_vpn": False,
            "status": "UNKNOWN",
            "confidence": "LOW"
        }

    organization = (
        ip_intelligence.get("organization") or ""
    ).lower()

    hostname = (
        ip_intelligence.get("hostname") or ""
    ).lower()

    vpn_keywords = [
        "vpn",
        "virtual private",
        "anonymous vpn",
        "nordvpn",
        "expressvpn",
        "surfshark",
        "protonvpn"
    ]

    text = f"{organization} {hostname}"

    detected = any(
        keyword in text
        for keyword in vpn_keywords
    )

    return {
        "ip": ip,
        "is_vpn": detected,
        "status": (
            "POSSIBLE_VPN"
            if detected
            else "NOT_IDENTIFIED_AS_VPN"
        ),
        "confidence": "MEDIUM" if detected else "LOW"
    }


def analyze_anonymization(
    ip: str,
    ip_intelligence: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Run TOR, VPN and Proxy analysis for an IP.
    """

    tor_result = check_tor(ip)

    vpn_result = check_vpn(
        ip,
        ip_intelligence
    )

    proxy_result = check_proxy(
        ip,
        ip_intelligence
    )

    return {
        "ip": ip,
        "tor": tor_result,
        "vpn": vpn_result,
        "proxy": proxy_result
    }