/**
 * SleepTrackerV2 — XIAO ESP32C6 Firmware
 *
 * Reads breathing rate and heart rate from the MR60BHA2 mmWave sensor
 * via UART, then POSTs the data to the Vercel API over HTTPS every 30s.
 *
 * Hardware: Seeed Studio XIAO ESP32C6 + MR60BHA2 kit
 * Library:  Seeed Arduino mmWave (install via Arduino Library Manager)
 *           Search: "Seeed Arduino mmWave"  →  by Seeed Studio
 *
 * Setup:
 *   1. Copy secrets.h.example → secrets.h and fill in your values
 *   2. Install "Seeed Arduino mmWave" library in Arduino IDE
 *   3. Install "ArduinoJson" library in Arduino IDE
 *   4. Select board: "XIAO_ESP32C6" in Arduino IDE
 *   5. Flash and open Serial Monitor at 115200 baud
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <Seeed_Arduino_mmWave.h>
#include "secrets.h"

// ── GTS Root R1 CA cert (Google Trust Services — used by *.vercel.app) ──
// Verified against sleep-tracker-v2-psi.vercel.app on 2026-02-28.
// Valid until 2028-01-28. Update if expired.
static const char* VERCEL_ROOT_CA =
  "-----BEGIN CERTIFICATE-----\n"
  "MIIFYjCCBEqgAwIBAgIQd70NbNs2+RrqIQ/E8FjTDTANBgkqhkiG9w0BAQsFADBX\n"
  "MQswCQYDVQQGEwJCRTEZMBcGA1UEChMQR2xvYmFsU2lnbiBudi1zYTEQMA4GA1UE\n"
  "CxMHUm9vdCBDQTEbMBkGA1UEAxMSR2xvYmFsU2lnbiBSb290IENBMB4XDTIwMDYx\n"
  "OTAwMDA0MloXDTI4MDEyODAwMDA0MlowRzELMAkGA1UEBhMCVVMxIjAgBgNVBAoT\n"
  "GUdvb2dsZSBUcnVzdCBTZXJ2aWNlcyBMTEMxFDASBgNVBAMTC0dUUyBSb290IFIx\n"
  "MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAthECix7joXebO9y/lD63\n"
  "ladAPKH9gvl9MgaCcfb2jH/76Nu8ai6Xl6OMS/kr9rH5zoQdsfnFl97vufKj6bwS\n"
  "iV6nqlKr+CMny6SxnGPb15l+8Ape62im9MZaRw1NEDPjTrETo8gYbEvs/AmQ351k\n"
  "KSUjB6G00j0uYODP0gmHu81I8E3CwnqIiru6z1kZ1q+PsAewnjHxgsHA3y6mbWwZ\n"
  "DrXYfiYaRQM9sHmklCitD38m5agI/pboPGiUU+6DOogrFZYJsuB6jC511pzrp1Zk\n"
  "j5ZPaK49l8KEj8C8QMALXL32h7M1bKwYUH+E4EzNktMg6TO8UpmvMrUpsyUqtEj5\n"
  "cuHKZPfmghCN6J3Cioj6OGaK/GP5Afl4/Xtcd/p2h/rs37EOeZVXtL0m79YB0esW\n"
  "CruOC7XFxYpVq9Os6pFLKcwZpDIlTirxZUTQAs6qzkm06p98g7BAe+dDq6dso499\n"
  "iYH6TKX/1Y7DzkvgtdizjkXPdsDtQCv9Uw+wp9U7DbGKogPeMa3Md+pvez7W35Ei\n"
  "Eua++tgy/BBjFFFy3l3WFpO9KWgz7zpm7AeKJt8T11dleCfeXkkUAKIAf5qoIbap\n"
  "sZWwpbkNFhHax2xIPEDgfg1azVY80ZcFuctL7TlLnMQ/0lUTbiSw1nH69MG6zO0b\n"
  "9f6BQdgAmD06yK56mDcYBZUCAwEAAaOCATgwggE0MA4GA1UdDwEB/wQEAwIBhjAP\n"
  "BgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBTkrysmcRorSCeFL1JmLO/wiRNxPjAf\n"
  "BgNVHSMEGDAWgBRge2YaRQ2XyolQL30EzTSo//z9SzBgBggrBgEFBQcBAQRUMFIw\n"
  "JQYIKwYBBQUHMAGGGWh0dHA6Ly9vY3NwLnBraS5nb29nL2dzcjEwKQYIKwYBBQUH\n"
  "MAKGHWh0dHA6Ly9wa2kuZ29vZy9nc3IxL2dzcjEuY3J0MDIGA1UdHwQrMCkwJ6Al\n"
  "oCOGIWh0dHA6Ly9jcmwucGtpLmdvb2cvZ3NyMS9nc3IxLmNybDA7BgNVHSAENDAy\n"
  "MAgGBmeBDAECATAIBgZngQwBAgIwDQYLKwYBBAHWeQIFAwIwDQYLKwYBBAHWeQIF\n"
  "AwMwDQYJKoZIhvcNAQELBQADggEBADSkHrEoo9C0dhemMXoh6dFSPsjbdBZBiLg9\n"
  "NR3t5P+T4Vxfq7vqfM/b5A3Ri1fyJm9bvhdGaJQ3b2t6yMAYN/olUazsaL+yyEn9\n"
  "WprKASOshIArAoyZl+tJaox118fessmXn1hIVw41oeQa1v1vg4Fv74zPl6/AhSrw\n"
  "9U5pCZEt4Wi4wStz6dTZ/CLANx8LZh1J7QJVj2fhMtfTJr9w4z30Z209fOU0iOMy\n"
  "+qduBmpvvYuR7hZL6Dupszfnw0Skfths18dG9ZKb59UhvmaSGZRVbNQpsg3BZlvi\n"
  "d0lIKO2d1xozclOzgjXPYovJJIultzkMu34qQb9Sz/yilrbCgj8=\n"
  "-----END CERTIFICATE-----\n";

// ── Sensor & timing constants ─────────────────────────────────────────
#define SENSOR_RX_PIN    17     // GPIO17 → MR60BHA2 TX
#define SENSOR_TX_PIN    16     // GPIO16 → MR60BHA2 RX
#define POST_INTERVAL_MS 30000  // 30 seconds between posts

// ── Sensor setup ──────────────────────────────────────────────────────
HardwareSerial sensorSerial(1);  // UART1
SEEED_MR60BHA2 radar;

// ── Last known values (sent even if no new reading this cycle) ────────
float lastBreathingRate = 0;
float lastHeartRate     = 0;
float lastDistance      = 0;
bool  lastPresence      = false;

unsigned long lastPostTime = 0;

// ── Setup ─────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("[SleepTracker] Booting...");

  // Init sensor serial on UART1
  sensorSerial.begin(115200, SERIAL_8N1, SENSOR_RX_PIN, SENSOR_TX_PIN);
  radar.begin(&sensorSerial);
  Serial.println("[SleepTracker] Sensor initialized");

  // Connect WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[SleepTracker] Connecting to WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[SleepTracker] WiFi connected: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[SleepTracker] WiFi failed - will retry in loop");
  }
}

// ── Main loop ─────────────────────────────────────────────────────────
void loop() {
  readSensor();

  unsigned long now = millis();
  if (now - lastPostTime >= POST_INTERVAL_MS) {
    lastPostTime = now;

    // Reconnect WiFi if dropped
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[SleepTracker] WiFi lost - reconnecting...");
      WiFi.reconnect();
      delay(3000);
    }

    if (WiFi.status() == WL_CONNECTED) {
      if (!postData()) {
        Serial.println("[SleepTracker] Post failed - retrying in 10s");
        delay(10000);
        postData();
      }
    }
  }
}

// ── Poll sensor for new frames ────────────────────────────────────────
void readSensor() {
  if (radar.update(100)) {  // process incoming serial frames (100ms timeout)
    float br, hr, dist;

    if (radar.getBreathRate(br))    lastBreathingRate = br;
    if (radar.getHeartRate(hr))     lastHeartRate     = hr;
    if (radar.getDistance(dist))    lastDistance      = dist;
    lastPresence = radar.isHumanDetected();

    Serial.printf("[Sensor] Presence=%d BR=%.1f HR=%.1f Dist=%.2f\n",
      lastPresence, lastBreathingRate, lastHeartRate, lastDistance);
  }
}

// ── POST data to Vercel ───────────────────────────────────────────────
bool postData() {
  WiFiClientSecure client;
  client.setCACert(VERCEL_ROOT_CA);
  client.setTimeout(10);

  Serial.print("[SleepTracker] Connecting to " API_HOST "...");
  if (!client.connect(API_HOST, 443)) {
    Serial.println(" FAILED");
    return false;
  }
  Serial.println(" OK");

  // Build JSON payload
  JsonDocument doc;
  doc["breathing_rate"] = lastBreathingRate;
  doc["heart_rate"]     = lastHeartRate;
  doc["distance"]       = lastDistance;
  doc["presence"]       = lastPresence;
  doc["movement_state"] = 0;  // reserved for future motion detection

  String body;
  serializeJson(doc, body);

  // HTTP POST
  String request =
    String("POST ") + API_PATH + " HTTP/1.1\r\n" +
    "Host: " + API_HOST + "\r\n" +
    "Content-Type: application/json\r\n" +
    "X-API-Key: " + INGEST_API_KEY + "\r\n" +
    "Content-Length: " + body.length() + "\r\n" +
    "Connection: close\r\n\r\n" +
    body;

  client.print(request);

  // Read first line of response to check status code
  String statusLine = client.readStringUntil('\n');
  Serial.println("[Response] " + statusLine);

  client.stop();
  return statusLine.indexOf("200") >= 0;
}
