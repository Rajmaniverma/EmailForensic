import ipaddress
from typing import Optional


def classify_ip(
    ip: str,
    organization: Optional[str] = None,
    hostname: Optional[str] = None
) -> dict:
    """
    Classify an already-extracted IP.

    This function does NOT extract IPs.
    It determines what the IP represents.
    """

    try:
        ip_obj = ipaddress.ip_address(ip)

    except ValueError:
        return {
            "ip": ip,
            "ip_type": "INVALID",
            "role": "UNKNOWN",
            "origin_candidate": False
        }

    # -----------------------------------------
    # Private IP
    # -----------------------------------------

    if ip_obj.is_private:

        return {
            "ip": ip,
            "ip_type": "PRIVATE",
            "role": "PRIVATE_NETWORK",
            "origin_candidate": False,
            "reason": "Private/local network address."
        }

    # -----------------------------------------
    # Loopback
    # -----------------------------------------

    if ip_obj.is_loopback:

        return {
            "ip": ip,
            "ip_type": "LOOPBACK",
            "role": "LOCAL_MACHINE",
            "origin_candidate": False,
            "reason": "Loopback address."
        }

    # -----------------------------------------
    # Non-public addresses
    # -----------------------------------------

    if not ip_obj.is_global:

        return {
            "ip": ip,
            "ip_type": "NON_PUBLIC",
            "role": "UNKNOWN",
            "origin_candidate": False,
            "reason": "IP is not globally routable."
        }

    # -----------------------------------------
    # Public IP
    # -----------------------------------------

    org = (organization or "").lower()
    host = (hostname or "").lower()

    combined = f"{org} {host}"

    # -----------------------------------------
    # Known mail infrastructure
    # -----------------------------------------

    mail_keywords = [
        "google",
        "gmail",
        "microsoft",
        "outlook",
        "office365",
        "yahoo",
        "proton",
        "zoho",
        "fastmail"
    ]

    for keyword in mail_keywords:

        if keyword in combined:

            return {
                "ip": ip,
                "ip_type": "PUBLIC",
                "role": "MAIL_SERVER",
                "provider": keyword,
                "origin_candidate": False,
                "reason": (
                    "IP appears to belong to "
                    "mail-provider infrastructure."
                )
            }

    # -----------------------------------------
    # Common mail hostname
    # -----------------------------------------

    mail_hostname_keywords = [
        "mail.",
        "smtp.",
        "mx.",
        "mta.",
        "relay.",
        "outbound.",
        "inbound."
    ]

    for keyword in mail_hostname_keywords:

        if keyword in host:

            return {
                "ip": ip,
                "ip_type": "PUBLIC",
                "role": "MAIL_SERVER",
                "origin_candidate": False,
                "reason": (
                    "Hostname appears to represent "
                    "mail infrastructure."
                )
            }

    # -----------------------------------------
    # Cloud / hosting
    # -----------------------------------------

    cloud_keywords = [
        "amazon",
        "aws",
        "google cloud",
        "azure",
        "digitalocean",
        "linode",
        "vultr",
        "ovh",
        "hetzner",
        "oracle"
    ]

    for keyword in cloud_keywords:

        if keyword in combined:

            return {
                "ip": ip,
                "ip_type": "PUBLIC",
                "role": "CLOUD_HOSTING",
                "provider": keyword,
                "origin_candidate": True,
                "reason": (
                    "IP appears to belong to "
                    "cloud or hosting infrastructure."
                )
            }

    # -----------------------------------------
    # Unknown public IP
    # -----------------------------------------

    return {
        "ip": ip,
        "ip_type": "PUBLIC",
        "role": "POSSIBLE_ORIGIN",
        "origin_candidate": True,
        "reason": (
            "Public IP observed without a known "
            "mail or hosting classification."
        )
    }