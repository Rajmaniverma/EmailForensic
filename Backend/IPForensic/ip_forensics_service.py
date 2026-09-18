from typing import Dict, Any

from .header_parser import extract_candidate_ips
from .ip_intelligence import lookup_ip
from .ip_classifier import classify_ip
from .anonymization import analyze_anonymization
from .geolocation import get_geolocation
from .origin_analysis import determine_origin
from .forensic_report import generate_ip_report


def analyze_ip_forensics(
    email_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Main orchestrator for IP forensic analysis.

    Flow:

        Email Data
            ↓
        Header Parser
            ↓
        IP Intelligence
            ↓
        IP Classification
            ↓
        Anonymization Analysis
            ↓
        Geolocation
            ↓
        Origin Analysis
            ↓
        Final Forensic Report
    """

    # ============================================================
    # 1. GET RECEIVED HEADERS
    # ============================================================

    received_headers = email_data.get(
        "received_headers",
        []
    )

    # Safety check
    if not received_headers:
        return {
            "status": "NO_DATA",
            "message": "No Received headers found in email.",
            "ip_forensics": {
                "summary": {
                    "total_ips_found": 0,
                    "public_ips": 0,
                    "private_ips": 0,
                    "earliest_observable_ip": None,
                    "original_sender_ip": None,
                    "origin_status": "UNAVAILABLE",
                    "confidence": "LOW"
                },
                "origin_analysis": {
                    "earliest_observable_ip": None,
                    "original_sender_ip": None,
                    "origin_status": "UNAVAILABLE",
                    "confidence": "LOW"
                },
                "ip_records": []
            }
        }

    # ============================================================
    # 2. EXTRACT IP CANDIDATES
    # ============================================================

    try:
        candidates = extract_candidate_ips(
            received_headers
        )

    except Exception as e:
        return {
            "status": "ERROR",
            "message": "Failed to extract IP addresses.",
            "error": str(e)
        }

    if not candidates:
        return {
            "status": "NO_IP_FOUND",
            "message": "No valid IP addresses found in Received headers.",
            "ip_forensics": {
                "summary": {
                    "total_ips_found": 0,
                    "public_ips": 0,
                    "private_ips": 0,
                    "earliest_observable_ip": None,
                    "original_sender_ip": None,
                    "origin_status": "UNAVAILABLE",
                    "confidence": "LOW"
                },
                "origin_analysis": {
                    "earliest_observable_ip": None,
                    "original_sender_ip": None,
                    "origin_status": "UNAVAILABLE",
                    "confidence": "LOW"
                },
                "ip_records": []
            }
        }

    # ============================================================
    # 3. IP INTELLIGENCE
    # ============================================================

    intelligence = {}

    # Avoid querying the same IP multiple times
    unique_ips = list(
        dict.fromkeys(
            candidate["ip"]
            for candidate in candidates
            if candidate.get("ip")
        )
    )

    for ip in unique_ips:

        try:

            result = lookup_ip(ip)

            if result:
                intelligence[ip] = result

        except Exception as e:

            # Do not stop the complete analysis
            # if one IP intelligence lookup fails.
            intelligence[ip] = {
                "ip": ip,
                "error": str(e)
            }

    # ============================================================
    # 4. CLASSIFY IPs
    # ============================================================

    classifications = {}

    for ip in unique_ips:

        info = intelligence.get(ip, {})

        try:

            classifications[ip] = classify_ip(
                ip=ip,
                organization=info.get(
                    "organization"
                ),
                hostname=info.get(
                    "hostname"
                )
            )

        except Exception as e:

            classifications[ip] = {
                "classification": "UNKNOWN",
                "error": str(e)
            }

    # ============================================================
    # 5. ANONYMIZATION ANALYSIS
    # ============================================================

    anonymization = {}

    for ip in unique_ips:

        info = intelligence.get(ip, {})

        try:

            anonymization[ip] = analyze_anonymization(
                ip,
                info
            )

        except Exception as e:

            anonymization[ip] = {
                "vpn": False,
                "proxy": False,
                "tor": False,
                "error": str(e)
            }

    # ============================================================
    # 6. GEOLOCATION
    # ============================================================

    geolocation = {}

    for ip in unique_ips:

        info = intelligence.get(ip, {})

        try:

            geolocation[ip] = get_geolocation(
                info
            )

        except Exception as e:

            geolocation[ip] = {
                "country": info.get("country"),
                "region": info.get("region"),
                "city": info.get("city"),
                "latitude": info.get("latitude"),
                "longitude": info.get("longitude"),
                "timezone": info.get("timezone"),
                "error": str(e)
            }

    # ============================================================
    # 7. ORIGIN ANALYSIS
    # ============================================================

    try:

        origin = determine_origin(
            candidates=candidates,
            ip_intelligence=intelligence,
            classifications=classifications
        )

    except Exception as e:

        origin = {
            "earliest_observable_ip": None,
            "original_sender_ip": None,
            "origin_status": "ANALYSIS_FAILED",
            "confidence": "LOW",
            "error": str(e)
        }

    # Add geolocation of the earliest observable IP
    earliest_ip = origin.get(
        "earliest_observable_ip"
    )

    if earliest_ip:

        origin["geolocation"] = geolocation.get(
            earliest_ip
        )

    # ============================================================
    # 8. GENERATE FINAL FORENSIC REPORT
    # ============================================================

    try:

        report = generate_ip_report(
            candidates=candidates,
            intelligence=intelligence,
            classifications=classifications,
            anonymization=anonymization,
            origin=origin
        )

    except Exception as e:

        return {
            "status": "ERROR",
            "message": "Failed to generate forensic report.",
            "error": str(e)
        }

    # ============================================================
    # 9. RETURN FINAL RESULT
    # ============================================================

    return {
        "status": "SUCCESS",

        "message_id": email_data.get(
            "message_id"
        ),

        "ip_forensics": report
    }