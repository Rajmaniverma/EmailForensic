
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API_URL = "https://emailforensic.onrender.com";

// ============================================================
// LEAFLET MARKER ICON
// ============================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});


// ============================================================
// MAP CONTROLLER
// ============================================================

function MapController({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 10);
    }
  }, [position, map]);

  return null;
}


// ============================================================
// MAIN IP TRACING PAGE
// ============================================================

function IPTracingPage() {

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const messageId = searchParams.get("message_id");

  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // ==========================================================
  // FETCH CACHED FORENSIC ANALYSIS
  // ==========================================================

  useEffect(() => {

    const fetchAnalyzerData = async () => {

      try {

        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("access_token");

        if (!token) {
          throw new Error(
            "Authentication token is missing."
          );
        }

        if (!messageId) {
          throw new Error(
            "Message ID is missing."
          );
        }


        // ------------------------------------------------------
        // Get already generated analysis
        // ------------------------------------------------------

        const response = await fetch(
          `${API_URL}/gmail/cached-analysis/${encodeURIComponent(
            messageId
          )}`,
          {
            method: "GET",

            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );


        const data = await response.json();


        if (!response.ok) {

          throw new Error(
            data?.detail ||
              "Failed to fetch cached analysis."
          );
        }


        if (
          !data.success ||
          !data.data
        ) {

          throw new Error(
            "No cached analysis found. Analyze this email from the Analyzer first."
          );
        }


        // ------------------------------------------------------
        // IMPORTANT:
        //
        // Store COMPLETE analysis response.
        //
        // New backend:
        //
        // data
        //   └── ip_tracing
        //          └── ip_forensics
        // ------------------------------------------------------

        setAnalysisData(data.data);

      } catch (err) {

        console.error(
          "IP tracing error:",
          err
        );

        setError(
          err.message ||
            "Unable to fetch IP forensic information."
        );

      } finally {

        setLoading(false);
      }
    };


    fetchAnalyzerData();

  }, [messageId]);


  // ==========================================================
  // EMAIL DATA
  // ==========================================================

  const emailData =
    analysisData?.email ||
    analysisData?.email_data ||
    {};



  // ==========================================================
  // NEW IP FORENSICS STRUCTURE
  // ==========================================================

  const ipForensics =
    analysisData?.ip_tracing?.ip_forensics ||
    {};


  // ==========================================================
  // SUMMARY
  // ==========================================================

  const summary =
    ipForensics?.summary ||
    {};


  // ==========================================================
  // ORIGIN ANALYSIS
  // ==========================================================

  const originAnalysis =
    ipForensics?.origin_analysis ||
    {};


  // ==========================================================
  // ALL IP RECORDS
  // ==========================================================

  const ipRecords = Array.isArray(
    ipForensics?.ip_records
  )
    ? ipForensics.ip_records
    : [];


  // ==========================================================
  // DETERMINE PRIMARY IP
  //
  // Priority:
  //
  // 1. Original sender IP
  // 2. Earliest observable IP
  // 3. First IP record
  // ==========================================================

  const primaryIP =
    originAnalysis?.original_sender_ip ||
    originAnalysis?.earliest_observable_ip ||
    ipRecords?.[0]?.ip ||
    null;


  // ==========================================================
  // FIND PRIMARY IP RECORD
  // ==========================================================

  const primaryRecord = useMemo(() => {

    if (!ipRecords.length) {
      return {};
    }

    return (
      ipRecords.find(
        (record) =>
          record?.ip === primaryIP
      ) ||
      ipRecords[0] ||
      {}
    );

  }, [ipRecords, primaryIP]);


  // ==========================================================
  // PRIMARY GEOLOCATION
  // ==========================================================

  const geolocation =
    primaryRecord?.geolocation ||
    originAnalysis?.geolocation ||
    {};


  // ==========================================================
  // PRIMARY INTELLIGENCE
  // ==========================================================

  const ipAddress =
    primaryRecord?.ip ||
    primaryIP ||
    "Not available";


  const hostname =
    primaryRecord?.hostname ||
    "Unknown";


  const organization =
    primaryRecord?.organization ||
    "Unknown";


  const asn =
    primaryRecord?.asn ||
    "N/A";


  // ==========================================================
  // CLASSIFICATION
  // ==========================================================

  const classification =
    primaryRecord?.classification ||
    {};


  // Backend can return classification as:
  // {
  //   ip_type: "PUBLIC",
  //   role: "POSSIBLE_ORIGIN",
  //   origin_candidate: true,
  //   reason: "..."
  // }
  // Older responses may use classification/type/category.
  const classificationName =
    classification?.classification ||
    classification?.ip_type ||
    classification?.type ||
    classification?.category ||
    "Unknown";

  const classificationType =
    classification?.ip_type ||
    classification?.type ||
    classification?.category ||
    "Unknown";

  const classificationRole =
    classification?.role ||
    "Unknown";

  const originCandidate =
    classification?.origin_candidate === true;

  const classificationReason =
    classification?.reason ||
    classification?.description ||
    "No classification explanation available.";


  // ==========================================================
  // ANONYMIZATION
  // ==========================================================
  // IMPORTANT:
  // Backend returns tor/vpn/proxy as OBJECTS, not booleans:
  //
  // tor: {
  //   is_tor: false,
  //   status: "NOT_IDENTIFIED_AS_TOR",
  //   confidence: "LOW"
  // }
  //
  // The helper below also supports a boolean response so the UI
  // remains compatible with older backend responses.

  const anonymization =
    primaryRecord?.anonymization ||
    {};

  const getIndicator = (value, key) => {
    if (typeof value === "boolean") {
      return {
        detected: value,
        status: value ? `DETECTED_${key.toUpperCase()}` : `NOT_DETECTED_${key.toUpperCase()}`,
        confidence: "N/A",
      };
    }

    if (!value || typeof value !== "object") {
      return {
        detected: false,
        status: "NOT_AVAILABLE",
        confidence: "N/A",
      };
    }

    return {
      detected:
        value?.[`is_${key}`] === true ||
        value?.detected === true ||
        value?.is_detected === true,
      status:
        value?.status ||
        (value?.[`is_${key}`] === true
          ? `DETECTED_${key.toUpperCase()}`
          : `NOT_IDENTIFIED_AS_${key.toUpperCase()}`),
      confidence: value?.confidence || "N/A",
      ip: value?.ip || primaryRecord?.ip || "N/A",
    };
  };

  const torInfo = getIndicator(anonymization?.tor, "tor");
  const vpnInfo = getIndicator(anonymization?.vpn, "vpn");
  const proxyInfo = getIndicator(anonymization?.proxy, "proxy");

  const isTor = torInfo.detected;
  const isVpn = vpnInfo.detected;
  const isProxy = proxyInfo.detected;

  // Show every indicator explicitly. This is more useful for
  // forensic review than only showing a boolean.
  const detectedAnonymization = [
    isTor && "TOR",
    isVpn && "VPN",
    isProxy && "PROXY",
  ].filter(Boolean);

  // Derive counts from all observable IP records when the backend
  // summary does not provide them.
  const derivedAnonymizationCounts = useMemo(() => {
    return ipRecords.reduce(
      (acc, record) => {
        const a = record?.anonymization || {};
        if (getIndicator(a?.tor, "tor").detected) acc.tor += 1;
        if (getIndicator(a?.vpn, "vpn").detected) acc.vpn += 1;
        if (getIndicator(a?.proxy, "proxy").detected) acc.proxy += 1;
        return acc;
      },
      { tor: 0, vpn: 0, proxy: 0 }
    );
  }, [ipRecords]);


  // ==========================================================
  // GEOLOCATION FIELDS
  // ==========================================================

  const latitude = Number(
    geolocation?.latitude ??
      geolocation?.lat
  );


  const longitude = Number(
    geolocation?.longitude ??
      geolocation?.lon ??
      geolocation?.lng
  );


  const hasCoordinates =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);


  const position = hasCoordinates
    ? [latitude, longitude]
    : null;


  const city =
    geolocation?.city ||
    "Unknown";


  const region =
    geolocation?.region ||
    "Unknown";


  const country =
    geolocation?.country ||
    "Unknown";


  const postal =
    geolocation?.postal ||
    "N/A";


  const timezone =
    geolocation?.timezone ||
    "Unknown";


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (

      <div className="min-h-screen bg-slate-50 flex items-center justify-center">

        <div className="text-center">

          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />

          <p className="mt-4 text-slate-600 font-medium">
            Loading IP forensic analysis...
          </p>

          <p className="text-sm text-slate-400 mt-1">
            Reading cached email routing intelligence
          </p>

        </div>

      </div>

    );
  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {

    return (

      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">

        <div className="max-w-lg w-full bg-white border border-red-200 rounded-2xl p-8 shadow-sm text-center">

          <div className="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center text-2xl">
            ⚠️
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            IP Forensics Failed
          </h1>

          <p className="mt-2 text-slate-500">
            {error}
          </p>

          <button
            onClick={() =>
              navigate(
                `/analyzer?message_id=${encodeURIComponent(
                  messageId || ""
                )}`
              )
            }
            className="mt-6 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            Back to Analyzer
          </button>

        </div>

      </div>

    );
  }


  // ==========================================================
  // NO IP RECORDS
  // ==========================================================

  if (!ipRecords.length) {

    return (

      <div className="min-h-screen bg-slate-50">

        <header className="bg-white border-b border-slate-200">

          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl">
                🌐
              </div>

              <div>

                <h1 className="text-lg font-bold">
                  IP Tracing
                </h1>

                <p className="text-xs text-slate-500">
                  Email routing & forensic analysis
                </p>

              </div>

            </div>


            <button
              onClick={() =>
                navigate(
                  `/analyzer?message_id=${encodeURIComponent(
                    messageId || ""
                  )}`
                )
              }
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold"
            >
              ← Analyzer
            </button>

          </div>

        </header>


        <main className="max-w-4xl mx-auto px-6 py-16">

          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">

            <div className="text-5xl">
              🌐
            </div>

            <h2 className="mt-5 text-xl font-bold">
              No observable IP address found
            </h2>

            <p className="mt-3 text-slate-500 leading-6">
              No usable IP address was extracted from the
              available email routing headers.
            </p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">

              <InfoCard
                label="IPs Found"
                value={summary?.total_ips_found ?? 0}
                icon="🔢"
              />

              <InfoCard
                label="Public IPs"
                value={summary?.public_ips ?? 0}
                icon="🌍"
              />

              <InfoCard
                label="Private IPs"
                value={summary?.private_ips ?? 0}
                icon="🔒"
              />

            </div>

          </div>

        </main>

      </div>

    );
  }


  // ==========================================================
  // MAIN PAGE
  // ==========================================================

  return (

    <div className="min-h-screen bg-slate-50 text-slate-900">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">

        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl shadow-sm">
              🌐
            </div>

            <div>

              <h1 className="text-lg font-bold">
                IP Tracing
              </h1>

              <p className="text-xs text-slate-500">
                Email routing & forensic intelligence
              </p>

            </div>

          </div>


          <button
            onClick={() =>
              navigate(
                `/analyzer?message_id=${encodeURIComponent(
                  messageId || ""
                )}`
              )
            }
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold"
          >
            ← Analyzer
          </button>

        </div>

      </header>


      <main className="max-w-7xl mx-auto px-6 py-8">


        {/* ====================================================
            TITLE
        ==================================================== */}

        <div className="mb-7">

          <p className="text-sm font-semibold text-blue-600">
            NETWORK FORENSICS
          </p>

          <h2 className="text-3xl font-bold mt-1">
            Email IP Forensic Analysis
          </h2>

          <p className="text-slate-500 mt-2">
            Observable routing infrastructure and IP intelligence
            extracted from the email headers.
          </p>

        </div>


        {/* ====================================================
            ORIGIN STATUS
        ==================================================== */}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            <div>

              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                Origin Analysis
              </p>

              <h3 className="text-xl font-bold text-slate-900 mt-1">
                {originAnalysis?.origin_status ||
                  "Unknown"}
              </h3>

              <p className="text-sm text-slate-500 mt-2 max-w-2xl">
                The system reports the earliest observable
                routing information. This does not automatically
                establish the sender's physical location or identity.
              </p>

            </div>


            <div className="flex flex-wrap gap-3">

              <StatusBadge
                label="Confidence"
                value={
                  originAnalysis?.confidence ||
                  "Unknown"
                }
              />

              <StatusBadge
                label="IPs Found"
                value={
                  summary?.total_ips_found ?? 0
                }
              />

              <StatusBadge
                label="Public IPs"
                value={
                  summary?.public_ips ?? 0
                }
              />

            </div>

          </div>

        </div>


        {/* ====================================================
            PRIMARY IP
        ==================================================== */}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">

          <div className="flex items-center gap-4">

            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
              📡
            </div>

            <div className="min-w-0">

              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                Earliest Observable IP
              </p>

              <p className="text-2xl font-bold text-blue-700 font-mono mt-1 break-all">
                {originAnalysis?.earliest_observable_ip ||
                  "Not available"}
              </p>

            </div>

          </div>


          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">

            <InfoCard
              label="Original Sender IP"
              value={
                originAnalysis?.original_sender_ip ||
                "Not established"
              }
              icon="👤"
            />

            <InfoCard
              label="Origin Status"
              value={
                originAnalysis?.origin_status ||
                "Unknown"
              }
              icon="🔎"
            />

          </div>

        </div>

        {/* ====================================================
            ORIGIN EVIDENCE
        ==================================================== */}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">

          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              ORIGIN EVIDENCE
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-1">
              Why this IP was selected
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              This section exposes the backend's origin-classification evidence
              instead of hiding it behind a single label.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

            <DetailRow
              label="Original Sender IP"
              value={originAnalysis?.original_sender_ip || "Not established"}
            />

            <DetailRow
              label="Earliest Observable IP"
              value={originAnalysis?.earliest_observable_ip || "Not available"}
            />

            <DetailRow
              label="Origin Status"
              value={originAnalysis?.origin_status || "Unknown"}
            />

            <DetailRow
              label="Origin Confidence"
              value={originAnalysis?.confidence || "Unknown"}
            />

            <DetailRow
              label="Origin Candidate"
              value={originCandidate ? "Yes" : "No"}
            />

            <DetailRow
              label="Candidate Role"
              value={classificationRole}
            />

          </div>

          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs text-blue-700 font-bold uppercase">
              Evidence / Reason
            </p>

            <p className="mt-1 text-sm text-slate-700">
              {classificationReason}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              An observable IP is not automatically the sender's physical
              device IP. Mail relays, gateways, NAT, VPNs, proxies and other
              infrastructure can appear in the routing chain.
            </p>
          </div>

        </div>


        {/* ====================================================
            LOCATION CARDS
        ==================================================== */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

          <InfoCard
            label="City"
            value={city}
            icon="🏙️"
          />

          <InfoCard
            label="Region"
            value={region}
            icon="📍"
          />

          <InfoCard
            label="Country"
            value={country}
            icon="🌎"
          />

          <InfoCard
            label="Timezone"
            value={timezone}
            icon="🕐"
          />

        </div>


        {/* ====================================================
            MAP
        ==================================================== */}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">

            <div>

              <h3 className="text-lg font-bold">
                📍 IP Geolocation
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Approximate location associated with the observable IP.
              </p>

            </div>


            {hasCoordinates && (

              <div className="text-right">

                <p className="text-xs text-slate-400">
                  Coordinates
                </p>

                <p className="font-mono text-sm font-semibold text-blue-700">
                  {latitude.toFixed(6)},{" "}
                  {longitude.toFixed(6)}
                </p>

              </div>

            )}

          </div>


          {hasCoordinates ? (

            <div className="h-[520px] w-full">

              <MapContainer
                center={position}
                zoom={10}
                scrollWheelZoom={true}
                className="h-full w-full"
              >

                <MapController
                  position={position}
                />


                <TileLayer
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                  attribution="&copy; OpenStreetMap contributors"
                />


                <Marker
                  position={position}
                >

                  <Popup>

                    <div className="text-sm">

                      <strong>
                        Observable IP
                      </strong>

                      <br />

                      {ipAddress}

                      <br />
                      <br />

                      {city}, {region}, {country}

                      <br />

                      {latitude.toFixed(6)},{" "}
                      {longitude.toFixed(6)}

                    </div>

                  </Popup>

                </Marker>


                <Circle
                  center={position}
                  radius={1000}
                  pathOptions={{
                    color: "#2563eb",
                    fillColor: "#3b82f6",
                    fillOpacity: 0.12,
                  }}
                />

              </MapContainer>

            </div>

          ) : (

            <div className="h-[400px] flex items-center justify-center bg-slate-50">

              <div className="text-center">

                <div className="text-5xl mb-4">
                  🗺️
                </div>

                <h3 className="font-bold text-lg">
                  Coordinates unavailable
                </h3>

                <p className="text-slate-500 text-sm mt-2 max-w-md">
                  IP intelligence did not provide usable
                  latitude and longitude coordinates for the
                  selected observable IP.
                </p>

                <div className="mt-4 px-4 py-3 bg-white border border-slate-200 rounded-xl inline-block">

                  <span className="text-xs text-slate-400">
                    IP
                  </span>

                  <p className="font-mono font-semibold text-blue-700">
                    {ipAddress}
                  </p>

                </div>

              </div>

            </div>

          )}

        </div>


        {/* ====================================================
            NETWORK INTELLIGENCE
        ==================================================== */}

        <div className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">

          <div className="flex items-center justify-between mb-5">

            <div>

              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                NETWORK INTELLIGENCE
              </p>

              <h3 className="text-xl font-bold text-slate-900 mt-1">
                Provider & Infrastructure
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Intelligence associated with the selected IP record.
              </p>

            </div>


            <div
              className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                detectedAnonymization.length
                  ? "bg-red-100 text-red-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {detectedAnonymization.length
                ? `⚠ ${detectedAnonymization.join(" / ")} detected`
                : "✓ No detected anonymization indicator"}
            </div>

          </div>


          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

            <DetailRow
              label="IP Address"
              value={ipAddress}
            />

            <DetailRow
              label="Hostname"
              value={hostname}
            />

            <DetailRow
              label="Organization"
              value={organization}
            />

            <DetailRow
              label="ASN"
              value={asn}
            />

            <DetailRow
              label="IP Type"
              value={classificationType}
            />

            <DetailRow
              label="Classification"
              value={classificationName}
            />

            <DetailRow
              label="Role"
              value={classificationRole}
            />

            <DetailRow
              label="Origin Candidate"
              value={originCandidate ? "Yes" : "No"}
            />

            <DetailRow
              label="Header Position"
              value={primaryRecord?.header_index ?? "N/A"}
            />

          </div>

        </div>


        {/* ====================================================
            ANONYMIZATION
        ==================================================== */}

        <div className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">

          <div className="mb-5">

            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              ANONYMIZATION ANALYSIS
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-1">
              VPN / Proxy / TOR Indicators
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Indicators associated with the selected observable IP.
            </p>

          </div>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <AnonymizationCard
              label="TOR"
              icon="🧅"
              info={torInfo}
            />

            <AnonymizationCard
              label="VPN"
              icon="🛡️"
              info={vpnInfo}
            />

            <AnonymizationCard
              label="Proxy"
              icon="🔀"
              info={proxyInfo}
            />

          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <MiniDetail
              label="TOR Status"
              value={torInfo.status}
            />

            <MiniDetail
              label="VPN Status"
              value={vpnInfo.status}
            />

            <MiniDetail
              label="Proxy Status"
              value={proxyInfo.status}
            />

            <MiniDetail
              label="TOR Confidence"
              value={torInfo.confidence}
            />

            <MiniDetail
              label="VPN Confidence"
              value={vpnInfo.confidence}
            />

            <MiniDetail
              label="Proxy Confidence"
              value={proxyInfo.confidence}
            />
          </div>

          <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase font-semibold">
              Detection Interpretation
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {detectedAnonymization.length
                ? `Detected indicators: ${detectedAnonymization.join(", ")}.`
                : "No TOR, VPN, or proxy indicator was identified for this observable IP."}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Detection status is based on the intelligence returned for the
              selected observable IP. A "not identified" result does not prove
              that anonymization was never used.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatusBadge
              label="TOR across routing"
              value={summary?.tor_detected ?? derivedAnonymizationCounts.tor}
            />

            <StatusBadge
              label="VPN across routing"
              value={summary?.vpn_detected ?? derivedAnonymizationCounts.vpn}
            />

            <StatusBadge
              label="Proxy across routing"
              value={summary?.proxy_detected ?? derivedAnonymizationCounts.proxy}
            />
          </div>

        </div>


        {/* ====================================================
            CLASSIFICATION
        ==================================================== */}

        <div className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">

          <div className="mb-5">

            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              IP CLASSIFICATION
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-1">
              Infrastructure Assessment
            </h3>

          </div>


          <div className="grid md:grid-cols-2 gap-4">

            <DetailRow
              label="Classification"
              value={classificationName}
            />

            <DetailRow
              label="IP Type"
              value={classificationType}
            />

            <DetailRow
              label="Role"
              value={classificationRole}
            />

            <DetailRow
              label="Origin Candidate"
              value={originCandidate ? "Yes" : "No"}
            />

            <DetailRow
              label="Reason"
              value={classificationReason}
            />

          </div>

        </div>


        {/* ====================================================
            LOCATION DETAILS
        ==================================================== */}

        <div className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">

          <h3 className="text-lg font-bold mb-5">
            Location Details
          </h3>


          <div className="grid md:grid-cols-2 gap-4">

            <DetailRow
              label="IP Address"
              value={ipAddress}
            />

            <DetailRow
              label="City"
              value={city}
            />

            <DetailRow
              label="Region"
              value={region}
            />

            <DetailRow
              label="Country"
              value={country}
            />

            <DetailRow
              label="Postal Code"
              value={postal}
            />

            <DetailRow
              label="Timezone"
              value={timezone}
            />

            <DetailRow
              label="Latitude"
              value={
                hasCoordinates
                  ? latitude
                  : "Unavailable"
              }
            />

            <DetailRow
              label="Longitude"
              value={
                hasCoordinates
                  ? longitude
                  : "Unavailable"
              }
            />

          </div>

        </div>


        {/* ====================================================
            ALL OBSERVABLE IPs
        ==================================================== */}

        <div className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">

          <div className="mb-5">

            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              ROUTING PATH
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-1">
              Observable IP Records
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              IP addresses extracted from the available email routing headers.
            </p>

          </div>


          <div className="space-y-4">

            {ipRecords.map(
              (record, index) => {

                const recordGeo =
                  record?.geolocation ||
                  {};

                const recordClass =
                  record?.classification ||
                  {};

                const recordAnon =
                  record?.anonymization ||
                  {};

                return (

                  <div
                    key={`${record?.ip || "ip"}-${index}`}
                    className="border border-slate-200 rounded-xl p-5 hover:border-blue-200 transition"
                  >

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                      <div className="min-w-0">

                        <div className="flex items-center gap-3">

                          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                            📡
                          </div>

                          <div>

                            <p className="text-xs text-slate-400 font-semibold">
                              ROUTING HOP {index + 1}
                            </p>

                            <p className="font-mono font-bold text-blue-700 break-all">
                              {record?.ip || "Unknown"}
                            </p>

                          </div>

                        </div>

                      </div>


                      <div className="flex flex-wrap gap-2">

                        <SmallBadge
                          label={
                            record?.type ||
                            "UNKNOWN"
                          }
                        />

                        <SmallBadge
                          label={
                            recordClass?.classification ||
                            recordClass?.ip_type ||
                            recordClass?.type ||
                            recordClass?.category ||
                            "UNKNOWN"
                          }
                        />

                        {getIndicator(recordAnon?.tor, "tor").detected && (
                          <SmallBadge
                            label="TOR"
                            danger
                          />
                        )}

                        {getIndicator(recordAnon?.vpn, "vpn").detected && (
                          <SmallBadge
                            label="VPN"
                            danger
                          />
                        )}

                        {getIndicator(recordAnon?.proxy, "proxy").detected && (
                          <SmallBadge
                            label="PROXY"
                            danger
                          />
                        )}

                      </div>

                    </div>


                    <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-4 gap-3">

                      <MiniDetail
                        label="Hostname"
                        value={
                          record?.hostname ||
                          "Unknown"
                        }
                      />

                      <MiniDetail
                        label="Organization"
                        value={
                          record?.organization ||
                          "Unknown"
                        }
                      />

                      <MiniDetail
                        label="ASN"
                        value={
                          record?.asn ||
                          "N/A"
                        }
                      />

                      <MiniDetail
                        label="IP Type"
                        value={
                          recordClass?.ip_type ||
                          record?.type ||
                          "Unknown"
                        }
                      />

                      <MiniDetail
                        label="Role"
                        value={
                          recordClass?.role ||
                          "Unknown"
                        }
                      />

                      <MiniDetail
                        label="Location"
                        value={[
                          recordGeo?.city,
                          recordGeo?.region,
                          recordGeo?.country,
                        ]
                          .filter(Boolean)
                          .join(", ") ||
                          "Unknown"}
                      />

                      <MiniDetail
                        label="TOR"
                        value={
                          getIndicator(recordAnon?.tor, "tor").detected
                            ? "Detected"
                            : getIndicator(recordAnon?.tor, "tor").status
                        }
                      />

                      <MiniDetail
                        label="VPN"
                        value={
                          getIndicator(recordAnon?.vpn, "vpn").detected
                            ? "Detected"
                            : getIndicator(recordAnon?.vpn, "vpn").status
                        }
                      />

                      <MiniDetail
                        label="Proxy"
                        value={
                          getIndicator(recordAnon?.proxy, "proxy").detected
                            ? "Detected"
                            : getIndicator(recordAnon?.proxy, "proxy").status
                        }
                      />

                      <MiniDetail
                        label="Classification Reason"
                        value={
                          recordClass?.reason ||
                          recordClass?.description ||
                          "Not available"
                        }
                      />

                    </div>

                  </div>

                );

              }
            )}

          </div>

        </div>


        {/* ====================================================
            NAVIGATION
        ==================================================== */}

        <div className="mt-8 grid md:grid-cols-3 gap-4">

          <NavigationCard
            title="Email Analyzer"
            description="View complete forensic analysis"
            icon="🔍"
            onClick={() =>
              navigate(
                `/analyzer?message_id=${encodeURIComponent(
                  messageId || ""
                )}`
              )
            }
          />


          <NavigationCard
            title="Phishing Detection"
            description="Check phishing indicators"
            icon="🎣"
            onClick={() =>
              navigate(
                `/phishing?message_id=${encodeURIComponent(
                  messageId || ""
                )}`
              )
            }
          />


          <NavigationCard
            title="Social Engineering"
            description="Check manipulation techniques"
            icon="👥"
            onClick={() =>
              navigate(
                `/social?message_id=${encodeURIComponent(
                  messageId || ""
                )}`
              )
            }
          />

        </div>

      </main>

    </div>

  );
}


// ============================================================
// INFO CARD
// ============================================================

function InfoCard({
  label,
  value,
  icon,
}) {

  return (

    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

      <div className="flex items-center gap-3">

        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          {icon}
        </div>

        <div className="min-w-0">

          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
            {label}
          </p>

          <p className="font-semibold text-slate-800 break-all mt-1">
            {value}
          </p>

        </div>

      </div>

    </div>

  );
}


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  label,
  value,
}) {

  return (

    <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">

      <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
        {label}
      </p>

      <p className="text-sm font-bold text-slate-800 mt-0.5">
        {value}
      </p>

    </div>

  );
}


// ============================================================
// ANONYMIZATION CARD
// ============================================================

function AnonymizationCard({
  label,
  icon,
  info,
}) {

  const detected = info?.detected === true;

  return (
    <div
      className={`rounded-2xl border p-5 ${
        detected
          ? "bg-red-50 border-red-200"
          : "bg-emerald-50 border-emerald-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">

        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${
              detected
                ? "bg-red-100"
                : "bg-emerald-100"
            }`}
          >
            {icon}
          </div>

          <div>
            <p className="text-sm font-bold text-slate-800">
              {label}
            </p>

            <p
              className={`text-xs font-semibold mt-1 ${
                detected
                  ? "text-red-700"
                  : "text-emerald-700"
              }`}
            >
              {detected ? "Detected" : "Not detected"}
            </p>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
            detected
              ? "bg-red-100 text-red-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {info?.confidence || "N/A"}
        </span>

      </div>

      <div className="mt-4 space-y-2">
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-semibold">
            Status
          </p>
          <p className="text-xs font-semibold text-slate-700 break-all mt-0.5">
            {info?.status || "Not available"}
          </p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 uppercase font-semibold">
            IP Checked
          </p>
          <p className="text-xs font-mono font-semibold text-slate-700 break-all mt-0.5">
            {info?.ip || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// BOOLEAN CARD
// ============================================================

function BooleanCard({
  label,
  value,
}) {

  return (

    <div
      className={`rounded-xl border p-4 ${
        value
          ? "bg-red-50 border-red-200"
          : "bg-emerald-50 border-emerald-200"
      }`}
    >

      <div className="flex items-center justify-between">

        <span className="text-sm font-semibold text-slate-700">
          {label}
        </span>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            value
              ? "bg-red-100 text-red-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {value ? "Detected" : "Not detected"}
        </span>

      </div>

    </div>

  );
}


// ============================================================
// DETAIL ROW
// ============================================================

function DetailRow({
  label,
  value,
}) {

  return (

    <div className="bg-slate-50 rounded-xl px-4 py-3">

      <p className="text-xs text-slate-400 font-semibold uppercase">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800 break-all">
        {value || "Not available"}
      </p>

    </div>

  );
}


// ============================================================
// MINI DETAIL
// ============================================================

function MiniDetail({
  label,
  value,
}) {

  return (

    <div className="bg-slate-50 rounded-lg px-3 py-2.5">

      <p className="text-[10px] text-slate-400 uppercase font-semibold">
        {label}
      </p>

      <p className="mt-1 text-xs font-semibold text-slate-700 break-all">
        {value || "Unknown"}
      </p>

    </div>

  );
}


// ============================================================
// SMALL BADGE
// ============================================================

function SmallBadge({
  label,
  danger = false,
}) {

  return (

    <span
      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
        danger
          ? "bg-red-100 text-red-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {label}
    </span>

  );

}


// ============================================================
// NAVIGATION CARD
// ============================================================

function NavigationCard({
  title,
  description,
  icon,
  onClick,
}) {

  return (

    <button
      onClick={onClick}
      className="text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition"
    >

      <div className="flex items-center gap-4">

        <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-xl">
          {icon}
        </div>

        <div>

          <h3 className="font-bold text-slate-900">
            {title}
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            {description}
          </p>

        </div>

      </div>

    </button>

  );

}


export default IPTracingPage;

