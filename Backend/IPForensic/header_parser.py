import re
import ipaddress
from typing import List, Dict, Any


# ============================================================
# REGEX PATTERNS
# ============================================================

# IPv4 pattern
IPV4_PATTERN = re.compile(
    r"\b(?:\d{1,3}\.){3}\d{1,3}\b"
)

# IPv6 pattern
IPV6_PATTERN = re.compile(
    r"(?<![0-9A-Fa-f:])"
    r"(?:[0-9A-Fa-f]{1,4}:){2,7}"
    r"[0-9A-Fa-f]{1,4}"
    r"(?![0-9A-Fa-f:])"
)


# ============================================================
# IP VALIDATION
# ============================================================

def validate_ip(ip: str) -> bool:
    """
    Check whether the extracted string is a valid IPv4/IPv6 address.
    """

    try:
        ipaddress.ip_address(ip)
        return True

    except ValueError:
        return False


# ============================================================
# IP CLASSIFICATION
# ============================================================

def classify_ip(ip: str) -> str:
    """
    Classify an IP address.

    Returns:
        PRIVATE
        PUBLIC
        LOOPBACK
        LINK_LOCAL
        MULTICAST
        RESERVED
        UNSPECIFIED
        OTHER
    """

    try:
        ip_obj = ipaddress.ip_address(ip)

    except ValueError:
        return "INVALID"

    if ip_obj.is_loopback:
        return "LOOPBACK"

    if ip_obj.is_private:
        return "PRIVATE"

    if ip_obj.is_link_local:
        return "LINK_LOCAL"

    if ip_obj.is_multicast:
        return "MULTICAST"

    if ip_obj.is_reserved:
        return "RESERVED"

    if ip_obj.is_unspecified:
        return "UNSPECIFIED"

    if ip_obj.is_global:
        return "PUBLIC"

    return "OTHER"


# ============================================================
# EXTRACT IPS FROM ONE HEADER
# ============================================================

def extract_ips_from_header(header: str) -> List[str]:
    """
    Extract valid IPv4 and IPv6 addresses from a single
    Received header.
    """

    if not header:
        return []

    found_ips = []

    # -------------------------
    # Extract IPv4
    # -------------------------

    ipv4_matches = IPV4_PATTERN.findall(header)

    # -------------------------
    # Extract IPv6
    # -------------------------

    ipv6_matches = IPV6_PATTERN.findall(header)

    # Combine
    all_matches = ipv4_matches + ipv6_matches

    # Validate and remove duplicates
    for ip in all_matches:

        if validate_ip(ip):

            normalized_ip = str(
                ipaddress.ip_address(ip)
            )

            if normalized_ip not in found_ips:
                found_ips.append(normalized_ip)

    return found_ips


# ============================================================
# EXTRACT HOSTNAME FROM RECEIVED HEADER
# ============================================================

def extract_hostname(header: str) -> str | None:
    """
    Try to extract the hostname from a Received header.

    Example:

        Received: from mail.example.com
        (mail.example.com [192.0.2.1])

    Returns:

        mail.example.com
    """

    if not header:
        return None

    # Look for:
    # from hostname
    match = re.search(
        r"\bfrom\s+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})",
        header,
        re.IGNORECASE
    )

    if match:
        return match.group(1).lower()

    return None


# ============================================================
# EXTRACT FROM/TO INFORMATION
# ============================================================

def extract_received_metadata(header: str) -> Dict[str, Any]:
    """
    Extract basic information from a Received header.
    """

    result = {
        "hostname": None,
        "ips": [],
        "ip_details": []
    }

    if not header:
        return result

    # Hostname
    result["hostname"] = extract_hostname(header)

    # IPs
    ips = extract_ips_from_header(header)

    result["ips"] = ips

    # Detailed IP information
    for ip in ips:

        ip_type = classify_ip(ip)

        result["ip_details"].append({
            "ip": ip,
            "type": ip_type,
            "is_private": ip_type == "PRIVATE",
            "is_public": ip_type == "PUBLIC"
        })

    return result


# ============================================================
# MAIN FUNCTION
# ============================================================

def extract_candidate_ips(
    received_headers: List[str]
) -> List[Dict[str, Any]]:
    """
    Extract all IP candidates from Received headers.

    Important:
    This function DOES NOT claim that any IP is the
    original sender IP.

    It simply extracts observable IP evidence.

    Received headers are normally arranged:

        newest -> oldest

    Therefore we process them:

        oldest -> newest

    so that the earliest observable hop appears first.
    """

    if not received_headers:
        return []

    candidates = []

    seen_ips = set()

    # --------------------------------------------------------
    # Reverse header order
    # --------------------------------------------------------

    for header_index, header in enumerate(
        reversed(received_headers),
        start=1
    ):

        if not header:
            continue

        metadata = extract_received_metadata(header)

        hostname = metadata["hostname"]

        # ----------------------------------------------------
        # Process every IP
        # ----------------------------------------------------

        for ip in metadata["ips"]:

            if ip in seen_ips:
                continue

            seen_ips.add(ip)

            ip_type = classify_ip(ip)

            candidate = {

                # IP itself
                "ip": ip,

                # Type
                "type": ip_type,

                # Private/public flags
                "is_private": (
                    ip_type == "PRIVATE"
                ),

                "is_public": (
                    ip_type == "PUBLIC"
                ),

                # Header information
                "header_index": header_index,

                "hostname": hostname,

                # Original header
                "header": header,

                # At this stage we DO NOT know
                # whether this is the sender origin.
                "origin_candidate": None,

                # Will be determined later
                "role": "UNDETERMINED"
            }

            candidates.append(candidate)

    return candidates


# ============================================================
# GET PUBLIC IPs
# ============================================================

def get_public_ips(
    candidates: List[Dict[str, Any]]
) -> List[str]:
    """
    Return only public IP addresses.
    """

    return [
        candidate["ip"]
        for candidate in candidates
        if candidate["is_public"]
    ]


# ============================================================
# GET PRIVATE IPS
# ============================================================

def get_private_ips(
    candidates: List[Dict[str, Any]]
) -> List[str]:
    """
    Return private IP addresses found in the headers.
    """

    return [
        candidate["ip"]
        for candidate in candidates
        if candidate["is_private"]
    ]


# ============================================================
# EARLIEST OBSERVABLE PUBLIC IP
# ============================================================

def get_earliest_public_ip(
    candidates: List[Dict[str, Any]]
) -> str | None:
    """
    Return the earliest observable public IP.

    IMPORTANT:
    This is NOT automatically the original sender IP.

    It is only the earliest public IP visible in the
    supplied Received headers.
    """

    for candidate in candidates:

        if candidate["is_public"]:
            return candidate["ip"]

    return None