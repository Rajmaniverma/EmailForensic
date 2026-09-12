import re
import ipaddress


def extract_origin_ip(received_headers):

    # Received headers are normally newest → oldest.
    # Reverse them so we examine oldest → newest.
    for received in reversed(received_headers):

        # Find IPv4 addresses
        ipv4_addresses = re.findall(
            r'\b(?:\d{1,3}\.){3}\d{1,3}\b',
            received
        )

        for ip in ipv4_addresses:

            try:
                ip_obj = ipaddress.ip_address(ip)

                # Ignore private/internal addresses
                if ip_obj.is_private:
                    continue

                # Ignore loopback
                if ip_obj.is_loopback:
                    continue

                # Found a public IPv4
                return ip

            except ValueError:
                continue

    return None