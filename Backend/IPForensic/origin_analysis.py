from typing import List, Dict, Any, Optional


def determine_origin(
    candidates: List[Dict[str, Any]],
    ip_intelligence: Dict[str, Dict[str, Any]],
    classifications: Dict[str, Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Determine the earliest observable IP and assess
    whether it can reasonably be treated as an origin candidate.

    IMPORTANT:
    This does NOT determine the sender's exact physical
    location or identity.
    """

    if not candidates:
        return {
            "original_sender_ip": None,
            "earliest_observable_ip": None,
            "origin_status": "NOT_AVAILABLE",
            "confidence": "LOW",
            "reason": "No IP address was found in the Received headers."
        }

    # Candidates are expected to be ordered from
    # newest Received header to oldest.
    #
    # Therefore, the last public candidate is generally
    # the earliest observable public IP.

    public_candidates = [
        candidate
        for candidate in candidates
        if candidate.get("type") == "PUBLIC"
    ]

    if not public_candidates:
        return {
            "original_sender_ip": None,
            "earliest_observable_ip": None,
            "origin_status": "NO_PUBLIC_IP",
            "confidence": "LOW",
            "reason": "Only private or non-global IP addresses were found."
        }

    earliest = public_candidates[-1]

    ip = earliest.get("ip")

    intelligence = ip_intelligence.get(ip, {})
    classification = classifications.get(ip, {})

    role = classification.get("role")

    organization = intelligence.get("organization")
    hostname = intelligence.get("hostname")

    # -------------------------------------------------
    # Determine whether this looks like mail infrastructure
    # -------------------------------------------------

    if role == "MAIL_SERVER":

        return {
            "original_sender_ip": None,

            "earliest_observable_ip": ip,

            "origin_status": "MAIL_INFRASTRUCTURE",

            "confidence": "LOW",

            "role": role,

            "organization": organization,

            "hostname": hostname,

            "reason": (
                "The earliest observable public IP appears to "
                "belong to mail infrastructure. The original "
                "sender IP cannot be confirmed from the available headers."
            )
        }

    # -------------------------------------------------
    # Possible origin infrastructure
    # -------------------------------------------------

    if role in {
        "POSSIBLE_ORIGIN",
        "CLOUD_HOSTING"
    }:

        return {
            "original_sender_ip": None,

            "earliest_observable_ip": ip,

            "origin_status": "POSSIBLE_ORIGIN_INFRASTRUCTURE",

            "confidence": "MEDIUM",

            "role": role,

            "organization": organization,

            "hostname": hostname,

            "reason": (
                "The earliest observable public IP may represent "
                "sending infrastructure, but the available headers "
                "do not establish that it is the sender's actual device."
            )
        }

    # -------------------------------------------------
    # Unknown public infrastructure
    # -------------------------------------------------

    return {
        "original_sender_ip": None,

        "earliest_observable_ip": ip,

        "origin_status": "EARLIEST_OBSERVABLE_IP",

        "confidence": "LOW",

        "role": role or "UNKNOWN",

        "organization": organization,

        "hostname": hostname,

        "reason": (
            "This is the earliest observable public IP in the "
            "available header chain, but sender attribution cannot "
            "be established from the headers alone."
        )
    }


def add_geolocation(
    origin_result: Dict[str, Any],
    geolocation: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Attach infrastructure geolocation to the origin result.
    """

    if not geolocation:
        origin_result["geolocation"] = {
            "available": False
        }

        return origin_result

    origin_result["geolocation"] = geolocation

    return origin_result