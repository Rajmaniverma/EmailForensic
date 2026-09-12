import requests


# ==========================================
# GET IP INTELLIGENCE
# ==========================================

def get_ip_intelligence(ip_address):

    try:

        # --------------------------------------
        # IP-API endpoint
        # --------------------------------------

        url = f"http://ip-api.com/json/{ip_address}"

        # Fields required by our system
        params = {
            "fields": (
                "status,message,query,"
                "continent,continentCode,"
                "country,countryCode,"
                "region,regionName,"
                "city,district,zip,"
                "lat,lon,timezone,"
                "isp,org,as,asname,"
                "proxy,hosting"
            )
        }

        # --------------------------------------
        # API REQUEST
        # --------------------------------------

        response = requests.get(
            url,
            params=params,
            timeout=10
        )

        response.raise_for_status()

        data = response.json()


        # --------------------------------------
        # CHECK STATUS
        # --------------------------------------

        if data.get("status") != "success":

            return {
                "ip": ip_address,
                "error": data.get(
                    "message",
                    "IP lookup failed"
                )
            }


        # ======================================
        # EXTRACT INFORMATION
        # ======================================

        result = {

            # Basic
            "ip": data.get("query"),

            # Location
            "continent": data.get("continent"),
            "continent_code": data.get("continentCode"),

            "country": data.get("country"),
            "country_code": data.get("countryCode"),

            "region": data.get("region"),
            "region_name": data.get("regionName"),

            "city": data.get("city"),
            "district": data.get("district"),
            "zip": data.get("zip"),

            "latitude": data.get("lat"),
            "longitude": data.get("lon"),

            "timezone": data.get("timezone"),

            # Network
            "isp": data.get("isp"),
            "organization": data.get("org"),

            # ASN
            "asn": data.get("as"),
            "as_name": data.get("asname"),

            # Security / infrastructure
            "is_proxy": data.get("proxy"),
            "is_hosting": data.get("hosting")
        }


        # ======================================
        # PRINT INTELLIGENCE
        # ======================================

        print("\n========================================")
        print("          IP INTELLIGENCE")
        print("========================================")

        print("\n---------- BASIC ----------")

        print("IP              :", result["ip"])


        print("\n---------- LOCATION ----------")

        print("Continent       :", result["continent"])
        print("Country         :", result["country"])
        print("Country Code    :", result["country_code"])
        print("Region          :", result["region_name"])
        print("Region Code     :", result["region"])
        print("City            :", result["city"])
        print("District        :", result["district"])
        print("ZIP             :", result["zip"])
        print("Latitude        :", result["latitude"])
        print("Longitude       :", result["longitude"])
        print("Timezone        :", result["timezone"])


        print("\n---------- NETWORK ----------")

        print("ISP             :", result["isp"])
        print("Organization    :", result["organization"])


        print("\n---------- ASN ----------")

        print("ASN             :", result["asn"])
        print("AS Name         :", result["as_name"])


        print("\n---------- SECURITY ----------")

        print("Proxy           :", result["is_proxy"])
        print("Hosting         :", result["is_hosting"])


        return result


    except requests.exceptions.Timeout:

        print("\nIP Intelligence Error: Request timed out")

        return {
            "ip": ip_address,
            "error": "Request timed out"
        }


    except requests.exceptions.RequestException as e:

        print("\nIP Intelligence Error:", e)

        return {
            "ip": ip_address,
            "error": str(e)
        }


    except Exception as e:

        print("\nUnexpected Error:", e)

        return {
            "ip": ip_address,
            "error": str(e)
        }


# ==========================================
# TEST
# ==========================================

if __name__ == "__main__":

    result = get_ip_intelligence("24.48.0.1")

    print("\n========================================")
    print("          RETURNED DATA")
    print("========================================")

    for key, value in result.items():
        print(f"{key:20}: {value}")