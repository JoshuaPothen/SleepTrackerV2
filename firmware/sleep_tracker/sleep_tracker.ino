/**
 * SleepTrackerV2 — XIAO ESP32C6 Firmware
 *
 * Reads breathing rate and heart rate from the MR60BHA2 mmWave sensor
 * via UART, then POSTs the data to the Vercel API over HTTPS every 30s.
 *
 * Hardware: Seeed Studio XIAO ESP32C6 + MR60BHA2 kit
 * Library:  Seeed mmWave Library (install via Arduino Library Manager)
 *           Search: "Seeed mmWave"  →  by Seeed Studio
 *
 * Setup:
 *   1. Copy secrets.h.example → secrets.h and fill in your values
 *   2. Install the Seeed mmWave library
 *   3. Select board: "XIAO_ESP32C6" in Arduino IDE
 *   4. Flash and open Serial Monitor at 115200 baud
 */

#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include "secrets.h"

// Seeed mmWave library — provides MR60BHA2 class
#include <mmWave.h>

// ── ISRG Root X1 CA cert (for *.vercel.app) ──────────────────────────
// This certificate validates the Vercel TLS connection.
// Valid until 2035-06-04. Update if expired.
static const char* VERCEL_ROOT_CA =
  "-----BEGIN CERTIFICATE-----\n"
  "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\n"
  "-----END CERTIFICATE-----\n";

// ── Sensor & timing constants ─────────────────────────────────────────
#define SENSOR_RX_PIN   17     // GPIO17 → MR60BHA2 TX
#define SENSOR_TX_PIN   16     // GPIO16 → MR60BHA2 RX
#define POST_INTERVAL_MS 30000 // 30 seconds between posts

// ── Globals ───────────────────────────────────────────────────────────
HardwareSerial sensorSerial(1); // UART1
MR60BHA2 radar;                 // Seeed mmWave sensor object

float lastBreathingRate = 0;
float lastHeartRate     = 0;
float lastDistance      = 0;
bool  lastPresence      = false;
int   lastMovement      = 0;

unsigned long lastPostTime = 0;

// ── Setup ─────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("[SleepTracker] Booting…");

  // Sensor serial
  sensorSerial.begin(115200, SERIAL_8N1, SENSOR_RX_PIN, SENSOR_TX_PIN);
  radar.begin(&sensorSerial);
  Serial.println("[SleepTracker] Sensor initialized");

  // WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[SleepTracker] Connecting to WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[SleepTracker] WiFi connected: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[SleepTracker] WiFi failed — will retry in loop");
  }
}

// ── Main loop ─────────────────────────────────────────────────────────
void loop() {
  // Read latest sensor data
  readSensor();

  // Post every POST_INTERVAL_MS
  unsigned long now = millis();
  if (now - lastPostTime >= POST_INTERVAL_MS) {
    lastPostTime = now;
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[SleepTracker] WiFi not connected — skipping post");
    } else {
      bool ok = postData();
      if (!ok) {
        Serial.println("[SleepTracker] Post failed — retrying in 10s");
        delay(10000);
        postData(); // one retry
      }
    }
  }

  delay(100); // short yield
}

// ── Read sensor values ────────────────────────────────────────────────
void readSensor() {
  if (radar.available()) {
    lastPresence      = radar.getPresence();
    lastBreathingRate = radar.getBreathRate();
    lastHeartRate     = radar.getHeartRate();
    lastDistance      = radar.getDistance();
    lastMovement      = radar.getMovement();

    Serial.printf("[Sensor] Presence=%d BR=%.1f HR=%.1f Dist=%.2f Mov=%d\n",
      lastPresence, lastBreathingRate, lastHeartRate, lastDistance, lastMovement);
  }
}

// ── POST data to Vercel ───────────────────────────────────────────────
bool postData() {
  WiFiClientSecure client;
  client.setCACert(VERCEL_ROOT_CA);
  client.setTimeout(10);

  Serial.print("[SleepTracker] Connecting to " API_HOST "…");
  if (!client.connect(API_HOST, 443)) {
    Serial.println(" FAILED");
    return false;
  }
  Serial.println(" OK");

  // Build JSON payload
  StaticJsonDocument<256> doc;
  doc["breathing_rate"] = lastBreathingRate;
  doc["heart_rate"]     = lastHeartRate;
  doc["distance"]       = lastDistance;
  doc["presence"]       = lastPresence;
  doc["movement_state"] = lastMovement;

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

  // Read response status line
  String statusLine = client.readStringUntil('\n');
  Serial.println("[Response] " + statusLine);

  client.stop();

  return statusLine.indexOf("200") >= 0;
}
