import { useEffect, useState } from "react";
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

// Fix Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function MapController({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 10);
    }
  }, [position, map]);

  return null;
}

function IPTracingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const messageId = searchParams.get("message_id");

  const [emailData, setEmailData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // FETCH SAME DATA USED BY ANALYZER
  // =========================================================

  useEffect(() => {
    const fetchAnalyzerData = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("access_token");

        if (!token) {
          throw new Error("Authentication token is missing.");
        }

        if (!messageId) {
          throw new Error("Message ID is missing.");
        }

        const response = await fetch(
          `${API_URL}/gmail/analyze/${encodeURIComponent(messageId)}`,
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
            data?.detail || "Failed to fetch email analysis."
          );
        }

        if (!data.success) {
          throw new Error("Email analysis failed.");
        }

        // EXACT SAME email_data returned to Analyzer Dashboard
        setEmailData(data.email_data);

      } catch (err) {
        console.error("IP tracing error:", err);
        setError(err.message || "Unable to fetch IP information.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyzerData();
  }, [messageId]);

  // =========================================================
  // EXTRACT IP
  // =========================================================

  const originIP = emailData?.origin_ip || "Not available";

  // =========================================================
  // EXTRACT GEOLOCATION
  // =========================================================

  const geolocation = emailData?.geolocation || {};

  /*
    Depending on what get_ip_intelligence() returns,
    this handles common names such as:

      latitude / longitude
      lat / lon
      lat / lng
  */

  const latitude = Number(
    geolocation?.latitude ??
      geolocation?.lat ??
      geolocation?.Latitude
  );

  const longitude = Number(
    geolocation?.longitude ??
      geolocation?.lon ??
      geolocation?.lng ??
      geolocation?.Longitude
  );

  const hasCoordinates =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const position = hasCoordinates
    ? [latitude, longitude]
    : null;

  // =========================================================
  // LOCATION TEXT
  // =========================================================

  const city =
    geolocation?.city ||
    geolocation?.City ||
    "Unknown";

  const region =
    geolocation?.region ||
    geolocation?.state ||
    geolocation?.Region ||
    "Unknown";

  const country =
    geolocation?.country ||
    geolocation?.country_name ||
    geolocation?.Country ||
    "Unknown";

  const postal =
    geolocation?.postal ||
    geolocation?.postal_code ||
    geolocation?.zip ||
    "N/A";

  const timezone =
    geolocation?.timezone ||
    geolocation?.time_zone ||
    "Unknown";

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />

          <p className="mt-4 text-slate-600 font-medium">
            Tracing originating IP...
          </p>

          <p className="text-sm text-slate-400 mt-1">
            Extracting location from email forensic data
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="max-w-lg w-full bg-white border border-red-200 rounded-2xl p-8 shadow-sm text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center text-2xl">
            ⚠️
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            IP Tracing Failed
          </h1>

          <p className="mt-2 text-slate-500">
            {error}
          </p>

          <button
            onClick={() =>
              navigate(
                `/analyzer?message_id=${encodeURIComponent(messageId)}`
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

  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* HEADER */}
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
                Email origin & geolocation analysis
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              navigate(
                `/analyzer?message_id=${encodeURIComponent(messageId)}`
              )
            }
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold"
          >
            ← Analyzer
          </button>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* TITLE */}
        <div className="mb-7">
          <p className="text-sm font-semibold text-blue-600">
            NETWORK FORENSICS
          </p>

          <h2 className="text-3xl font-bold mt-1">
            Originating IP Location
          </h2>

          <p className="text-slate-500 mt-2">
            Location extracted from the same forensic email data used by
            the Analyzer Dashboard.
          </p>
        </div>

        {/* IP CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">

          <div className="flex items-center gap-4">

            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
              📡
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                Origin IP Address
              </p>

              <p className="text-2xl font-bold text-blue-700 font-mono mt-1">
                {originIP}
              </p>
            </div>

          </div>

        </div>

        {/* LOCATION CARDS */}
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

        {/* MAP */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">

            <div>
              <h3 className="text-lg font-bold">
                📍 Exact Geolocation
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Coordinates returned by the IP intelligence service
              </p>
            </div>

            {hasCoordinates && (
              <div className="text-right">
                <p className="text-xs text-slate-400">
                  Coordinates
                </p>

                <p className="font-mono text-sm font-semibold text-blue-700">
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
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

                <MapController position={position} />

                <TileLayer
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                  attribution='&copy; OpenStreetMap contributors'
                />

                <Marker position={position}>

                  <Popup>
                    <div className="text-sm">
                      <strong>Originating IP</strong>
                      <br />
                      {originIP}
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
                  The IP address was extracted, but the IP intelligence
                  response did not contain usable latitude and longitude
                  coordinates.
                </p>

                <div className="mt-4 px-4 py-3 bg-white border border-slate-200 rounded-xl inline-block">
                  <span className="text-xs text-slate-400">
                    IP
                  </span>

                  <p className="font-mono font-semibold text-blue-700">
                    {originIP}
                  </p>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* LOCATION DETAILS */}
        <div className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">

          <h3 className="text-lg font-bold mb-5">
            Location Details
          </h3>

          <div className="grid md:grid-cols-2 gap-4">

            <DetailRow
              label="IP Address"
              value={originIP}
            />

            <DetailRow
              label="City"
              value={city}
            />

            <DetailRow
              label="Region / State"
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
              value={hasCoordinates ? latitude : "Unavailable"}
            />

            <DetailRow
              label="Longitude"
              value={hasCoordinates ? longitude : "Unavailable"}
            />

          </div>

        </div>

        {/* NAVIGATION */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">

          <NavigationCard
            title="Email Analyzer"
            description="View complete forensic analysis"
            icon="🔍"
            onClick={() =>
              navigate(
                `/analyzer?message_id=${encodeURIComponent(messageId)}`
              )
            }
          />

          <NavigationCard
            title="Phishing Detection"
            description="Check phishing indicators"
            icon="🎣"
            onClick={() =>
              navigate(
                `/phishing?message_id=${encodeURIComponent(messageId)}`
              )
            }
          />

          <NavigationCard
            title="Social Engineering"
            description="Check manipulation techniques"
            icon="👥"
            onClick={() =>
              navigate(
                `/social?message_id=${encodeURIComponent(messageId)}`
              )
            }
          />

        </div>

      </main>
    </div>
  );
}


// =========================================================
// COMPONENTS
// =========================================================

function InfoCard({ label, value, icon }) {
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

          <p className="font-semibold text-slate-800 truncate mt-1">
            {value}
          </p>
        </div>

      </div>

    </div>
  );
}


function DetailRow({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-xl px-4 py-3">

      <p className="text-xs text-slate-400 font-semibold uppercase">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800 break-all">
        {value}
      </p>

    </div>
  );
}


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