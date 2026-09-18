from typing import Dict, Any, List


def generate_ip_report(
    candidates: List[Dict[str, Any]],
    intelligence: Dict[str, Dict[str, Any]],
    classifications: Dict[str, Dict[str, Any]],
    anonymization: Dict[str, Dict[str, Any]],
    origin: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Generate the final IP forensic report.

    This report describes observable email infrastructure.
    It does not claim the exact physical location or identity
    of the sender unless independently established.
    """

    ip_records = []

    for candidate in candidates:

        ip = candidate.get("ip")

        if not ip:
            continue

        ip_records.append({
            "ip": ip,

            "type": candidate.get("type"),

            "header_index": candidate.get("header_index"),

            "hostname": (
                intelligence
                .get(ip, {})
                .get("hostname")
            ),

            "organization": (
                intelligence
                .get(ip, {})
                .get("organization")
            ),

            "asn": (
                intelligence
                .get(ip, {})
                .get("asn")
            ),

            "classification": (
                classifications
                .get(ip, {})
            ),

            "geolocation": {
                "country": (
                    intelligence
                    .get(ip, {})
                    .get("country")
                ),

                "region": (
                    intelligence
                    .get(ip, {})
                    .get("region")
                ),

                "city": (
                    intelligence
                    .get(ip, {})
                    .get("city")
                ),

                "latitude": (
                    intelligence
                    .get(ip, {})
                    .get("latitude")
                ),

                "longitude": (
                    intelligence
                    .get(ip, {})
                    .get("longitude")
                ),

                "timezone": (
                    intelligence
                    .get(ip, {})
                    .get("timezone")
                )
            },

            "anonymization": (
                anonymization
                .get(ip, {})
            )
        })

    return {
        "summary": {
            "total_ips_found": len(candidates),

            "public_ips": sum(
                1
                for c in candidates
                if c.get("type") == "PUBLIC"
            ),

            "private_ips": sum(
                1
                for c in candidates
                if c.get("type") == "PRIVATE"
            ),

            "earliest_observable_ip": (
                origin.get("earliest_observable_ip")
            ),

            "original_sender_ip": (
                origin.get("original_sender_ip")
            ),

            "origin_status": (
                origin.get("origin_status")
            ),

            "confidence": (
                origin.get("confidence")
            )
        },

        "origin_analysis": origin,

        "ip_records": ip_records
    }