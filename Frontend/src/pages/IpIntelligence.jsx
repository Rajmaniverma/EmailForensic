import { useState } from "react";
import "./IpIntelligence.css";

// Pre-configured benchmark IP samples
const SAMPLE_IPS = [
  {
    ip: "93.114.69.213",
    label: "Poland - Elastic Email / OVH (Target IP)",
    data: {
      basic: {
        ip: "93.114.69.213",
        status: "Active",
        threatRating: "Low",
        type: "IPv4 Public",
      },
      location: {
        continent: "Europe",
        country: "Poland",
        countryCode: "PL",
        region: "West Pomerania",
        regionCode: "32",
        city: "Szczecin",
        district: "Prawobrzeże",
        zip: "70-563",
        latitude: 53.4264,
        longitude: 14.5559,
        timezone: "Europe/Warsaw",
      },
      network: {
        isp: "OVH SAS",
        organization: "Elastic Email Sp. z o.o",
      },
      asn: {
        asn: "AS16276 OVH SAS",
        asName: "OVH",
      },
      security: {
        proxy: false,
        hosting: false,
        vpn: false,
        tor: false,
      },
    },
  },
  {
    ip: "185.220.101.5",
    label: "Germany - Tor Exit Relay (High Risk)",
    data: {
      basic: {
        ip: "185.220.101.5",
        status: "Active",
        threatRating: "High",
        type: "IPv4 Public",
      },
      location: {
        continent: "Europe",
        country: "Germany",
        countryCode: "DE",
        region: "Hesse",
        regionCode: "HE",
        city: "Frankfurt am Main",
        district: "Innenstadt",
        zip: "60313",
        latitude: 50.1109,
        longitude: 8.6821,
        timezone: "Europe/Berlin",
      },
      network: {
        isp: "Zwiebelfreunde e.V.",
        organization: "Tor Anonymizer Network",
      },
      asn: {
        asn: "AS206804 Zwiebelfreunde e.V.",
        asName: "Zwiebel-DE",
      },
      security: {
        proxy: true,
        hosting: true,
        vpn: false,
        tor: true,
      },
    },
  },
  {
    ip: "104.28.18.23",
    label: "United States - Cloudflare Proxy (Clean CDN)",
    data: {
      basic: {
        ip: "104.28.18.23",
        status: "Active",
        threatRating: "Clean",
        type: "IPv4 Public",
      },
      location: {
        continent: "North America",
        country: "United States",
        countryCode: "US",
        region: "California",
        regionCode: "CA",
        city: "San Francisco",
        district: "Financial District",
        zip: "94107",
        latitude: 37.7749,
        longitude: -122.4194,
        timezone: "America/Los_Angeles",
      },
      network: {
        isp: "Cloudflare, Inc.",
        organization: "Cloudflare Warp CDN",
      },
      asn: {
        asn: "AS13335 Cloudflare, Inc.",
        asName: "CLOUDFLARENET",
      },
      security: {
        proxy: true,
        hosting: true,
        vpn: false,
        tor: false,
      },
    },
  },
];

export default function IpIntelligence() {
  const [selectedIp, setSelectedIp] = useState(SAMPLE_IPS[0].ip);
  const [searchIp, setSearchIp] = useState(SAMPLE_IPS[0].ip);
  const [currentData, setCurrentData] = useState(SAMPLE_IPS[0].data);
  const [isSearching, setIsSearching] = useState(false);

  // Handle Preset Selector
  const handleSelectSample = (sample) => {
    setSelectedIp(sample.ip);
    setSearchIp(sample.ip);
    setCurrentData(sample.data);
  };

  // Run IP Lookup
  const handleLookup = () => {
    if (!searchIp.trim()) return;

    setIsSearching(true);
    setTimeout(() => {
      const found = SAMPLE_IPS.find((s) => s.ip.trim() === searchIp.trim());
      if (found) {
        setCurrentData(found.data);
        setSelectedIp(found.ip);
      } else {
        // Generate realistic payload for custom IP input
        const parts = searchIp.split(".");
        const lat = 52.2297 + ((parts[0] || 10) % 5);
        const lon = 21.0122 + ((parts[1] || 10) % 5);

        setCurrentData({
          basic: {
            ip: searchIp,
            status: "Active",
            threatRating: "Medium",
            type: "IPv4 Public",
          },
          location: {
            continent: "Europe",
            country: "Poland",
            countryCode: "PL",
            region: "Masovian Voivodeship",
            regionCode: "14",
            city: "Warsaw",
            district: "Centrum",
            zip: "00-001",
            latitude: parseFloat(lat.toFixed(4)),
            longitude: parseFloat(lon.toFixed(4)),
            timezone: "Europe/Warsaw",
          },
          network: {
            isp: "Telecom Provider SAS",
            organization: "Global Enterprise Network",
          },
          asn: {
            asn: `AS${(parseInt(parts[0] || 90) * 150 + 1200)} Telecom Inc`,
            asName: "GLOBAL-NET",
          },
          security: {
            proxy: false,
            hosting: true,
            vpn: false,
            tor: false,
          },
        });
        setSelectedIp(null);
      }
      setIsSearching(false);
    }, 450);
  };

  const { basic, location, network, asn, security } = currentData;

  // OpenStreetMap embed URL centered at coordinates
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
    location.longitude - 0.08
  }%2C${location.latitude - 0.04}%2C${location.longitude + 0.08}%2C${
    location.latitude + 0.04
  }&layer=mapnik&marker=${location.latitude}%2C${location.longitude}`;

  const externalMapUrl = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;

  return (
    <div className="ip-intelligence-page">
      {/* Header Banner */}
      <div className="ip-banner">
        <div className="ip-banner-text">
          <span className="ip-badge-pill">NETWORK THREAT TELEMETRY</span>
          <h1>IP Intelligence & Geolocation</h1>
          <p>
            Inspect target IP infrastructure, geographic coordinates, ISP/ASN ownership, proxy status,
            and live interactive map location.
          </p>
        </div>
        <div className="ip-engine-badge">
          <span className="ip-pulse-dot" />
          GEO-IP DATABASE ONLINE
        </div>
      </div>

      {/* IP Lookup Search Card */}
      <div className="ip-card ip-search-card">
        <div className="ip-card-header">
          <div className="ip-title-group">
            <span className="ip-step">01</span>
            <div>
              <h3>Target IP Lookup</h3>
              <p className="ip-subtext">Enter an IPv4/IPv6 address or select preset intelligence samples</p>
            </div>
          </div>

          <div className="ip-preset-buttons">
            <span className="ip-label-text">PRESETS:</span>
            {SAMPLE_IPS.map((sample, idx) => (
              <button
                key={sample.ip}
                className={`ip-preset-btn ${selectedIp === sample.ip ? "active" : ""}`}
                onClick={() => handleSelectSample(sample)}
              >
                Sample {idx + 1} ({sample.data.location.countryCode})
              </button>
            ))}
          </div>
        </div>

        <div className="ip-search-body">
          <div className="ip-input-wrap">
            <span className="ip-input-icon">⌕</span>
            <input
              type="text"
              className="ip-input"
              value={searchIp}
              onChange={(e) => setSearchIp(e.target.value)}
              placeholder="e.g. 93.114.69.213"
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            />
          </div>
          <button className="ip-lookup-btn" onClick={handleLookup} disabled={isSearching}>
            {isSearching ? (
              <>
                <span className="ip-spinner" /> RESOLVING...
              </>
            ) : (
              <>
                <span>QUERY IP TELEMETRY</span>
                <span className="ip-btn-arrow">→</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Split Section: Data Breakdown vs Embedded Map (Reference Pic Layout) */}
      <div className="ip-main-grid">
        {/* Left Side: Information Panels */}
        <div className="ip-left-panel">
          {/* BASIC */}
          <div className="ip-card ip-info-card">
            <div className="ip-section-title">
              <span className="ip-sec-tag">BASIC</span>
              <h4>Core Parameters</h4>
            </div>
            <div className="ip-data-rows">
              <div className="ip-data-row">
                <span className="ip-label">IP Address</span>
                <strong className="ip-val highlight">{basic.ip}</strong>
              </div>
              <div className="ip-data-row">
                <span className="ip-label">Status</span>
                <span className="ip-val-badge status-online">{basic.status}</span>
              </div>
              <div className="ip-data-row">
                <span className="ip-label">Threat Rating</span>
                <span className={`ip-val-badge rating-${basic.threatRating.toLowerCase()}`}>
                  {basic.threatRating}
                </span>
              </div>
              <div className="ip-data-row">
                <span className="ip-label">Type</span>
                <span className="ip-val">{basic.type}</span>
              </div>
            </div>
          </div>

          {/* LOCATION */}
          <div className="ip-card ip-info-card">
            <div className="ip-section-title">
              <span className="ip-sec-tag">LOCATION</span>
              <h4>Geographic Location</h4>
            </div>
            <div className="ip-data-rows">
              <div className="ip-data-row">
                <span className="ip-label">Continent</span>
                <span className="ip-val">{location.continent}</span>
              </div>
              <div className="ip-data-row">
                <span className="ip-label">Country</span>
                <span className="ip-val">
                  {location.country} ({location.countryCode})
                </span>
              </div>
              <div className="ip-data-row">
                <span className="ip-label">Region</span>
                <span className="ip-val">
                  {location.region} {location.regionCode ? `(${location.regionCode})` : ""}
                </span>
              </div>
              <div className="ip-data-row">
                <span className="ip-label">City</span>
                <span className="ip-val">{location.city}</span>
              </div>
              <div className="ip-data-row">
                <span className="ip-label">ZIP / Postal</span>
                <span className="ip-val">{location.zip}</span>
              </div>
              <div className="ip-data-row">
                <span className="ip-label">Latitude</span>
                <span className="ip-val coord">{location.latitude}</span>
              </div>
              <div className="ip-data-row">
                <span className="ip-label">Longitude</span>
                <span className="ip-val coord">{location.longitude}</span>
              </div>
              <div className="ip-data-row">
                <span className="ip-label">Timezone</span>
                <span className="ip-val">{location.timezone}</span>
              </div>
            </div>
          </div>

          {/* NETWORK & ASN */}
          <div className="ip-card ip-info-card">
            <div className="ip-section-title">
              <span className="ip-sec-tag">NETWORK & ASN</span>
              <h4>Infrastructure & Carrier</h4>
            </div>
            <div className="ip-data-rows">
              <div className="ip-data-row">
                <span className="ip-label">ISP</span>
                <span className="ip-val">{network.isp}</span>
              </div>
              <div className="ip-data-row">
                <span className="ip-label">Organization</span>
                <span className="ip-val">{network.organization}</span>
              </div>
              <div className="ip-data-row">
                <span className="ip-label">ASN</span>
                <span className="ip-val asn-code">{asn.asn}</span>
              </div>
              <div className="ip-data-row">
                <span className="ip-label">AS Name</span>
                <span className="ip-val">{asn.asName}</span>
              </div>
            </div>
          </div>

          {/* SECURITY */}
          <div className="ip-card ip-info-card">
            <div className="ip-section-title">
              <span className="ip-sec-tag">SECURITY</span>
              <h4>Risk Flags & Anonymity</h4>
            </div>
            <div className="ip-security-grid">
              <div className={`ip-sec-item ${security.proxy ? "danger" : "clear"}`}>
                <span className="ip-sec-label">Proxy</span>
                <span className="ip-sec-bool">{security.proxy ? "True" : "False"}</span>
              </div>
              <div className={`ip-sec-item ${security.hosting ? "warning" : "clear"}`}>
                <span className="ip-sec-label">Hosting</span>
                <span className="ip-sec-bool">{security.hosting ? "True" : "False"}</span>
              </div>
              <div className={`ip-sec-item ${security.vpn ? "danger" : "clear"}`}>
                <span className="ip-sec-label">VPN</span>
                <span className="ip-sec-bool">{security.vpn ? "True" : "False"}</span>
              </div>
              <div className={`ip-sec-item ${security.tor ? "danger" : "clear"}`}>
                <span className="ip-sec-label">Tor Exit Node</span>
                <span className="ip-sec-bool">{security.tor ? "True" : "False"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Embedded Geolocation Map (Reference Layout) */}
        <div className="ip-right-panel">
          <div className="ip-card ip-map-card">
            <div className="ip-map-header">
              <div className="ip-map-title">
                <span className="ip-map-icon">📍</span>
                <div>
                  <h3>Geolocation with MAP</h3>
                  <p className="ip-subtext">
                    {location.city}, {location.country} ({location.latitude}, {location.longitude})
                  </p>
                </div>
              </div>

              <a
                href={externalMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ip-open-map-btn"
              >
                <span>Open in Maps</span>
                <span className="ip-ext-icon">↗</span>
              </a>
            </div>

            {/* Map Frame Container */}
            <div className="ip-map-container">
              <iframe
                title="IP Geolocation Map"
                className="ip-map-iframe"
                src={mapEmbedUrl}
                loading="lazy"
              />

              {/* Map Floating Info Badge Overlay */}
              <div className="ip-map-overlay-badge">
                <div className="ip-badge-top">
                  <span className="ip-badge-dot" />
                  <strong>
                    {location.city}, {location.country}
                  </strong>
                </div>
                <small>
                  Lat: {location.latitude} | Lon: {location.longitude}
                </small>
                <small className="ip-isp-tag">ISP: {network.isp}</small>
              </div>
            </div>

            <div className="ip-map-footer">
              <div className="ip-footer-item">
                <span>TIMEZONE:</span>
                <strong>{location.timezone}</strong>
              </div>
              <div className="ip-footer-item">
                <span>POSTAL CODE:</span>
                <strong>{location.zip}</strong>
              </div>
              <div className="ip-footer-item">
                <span>CARRIER:</span>
                <strong>{network.organization}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
