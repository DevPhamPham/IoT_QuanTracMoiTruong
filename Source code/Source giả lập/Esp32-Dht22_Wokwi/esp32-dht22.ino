#include "DHTesp.h"
#include <WiFi.h>
#include "ThingSpeak.h"
#include <HTTPClient.h>
#include <Adafruit_Sensor.h>

const char* ssid = "Wokwi-GUEST";
const char* password = "";
const char* server = "api.thingspeak.com";
const String apikey = "8BYKHYI9QC1HC65P";
// #define LDR_PIN 2
const int LDR_PIN = A0;
const float GAMMA = 0.7;
const float RL10 = 50;
const int DHT_PIN = 15;
DHTesp dhtSensor;
WiFiClient client;

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }

  ThingSpeak.begin(client);
  dhtSensor.setup(DHT_PIN, DHTesp::DHT22);

  pinMode(LDR_PIN, INPUT);
}

void loop() {
  TempAndHumidity data = dhtSensor.getTempAndHumidity();
  float valueLDR = analogRead(LDR_PIN);
  Serial.print("Temperature: ");
  Serial.print(data.temperature, 2);
  Serial.println(" °C");
  Serial.print("Humidity: ");
  Serial.print(data.humidity, 1);
  Serial.println(" %");

  valueLDR = map(valueLDR, 4095, 0, 1024, 0);
  float voltage = valueLDR / 1024. * 5;
  float resistance = 2000 * voltage / (1 - voltage / 5);
  float lux = pow(RL10 * 1e3 * pow(10, GAMMA) / resistance, (1 / GAMMA));
  Serial.println(valueLDR);
  if(isfinite(lux))
  {
    Serial.print("Ánh sáng: ");
    Serial.print(lux);
    Serial.println(" lx");
  }
  else
  {
    Serial.println("Too bright to measure");
  }

  if (WiFi.status() == WL_CONNECTED) {
    ThingSpeak.setField(1, data.temperature);
    ThingSpeak.setField(2, data.humidity);
    ThingSpeak.setField(3,lux);
    int httpResponseCode = ThingSpeak.writeFields(1, apikey.c_str());
    if (httpResponseCode == 200) {
      Serial.println("Data sent to Thingspeak successfully");
    } else {
      Serial.print("Error sending data to Thingspeak. HTTP response code: ");
      Serial.println(httpResponseCode);
    }
  }
  delay(10000);
}
