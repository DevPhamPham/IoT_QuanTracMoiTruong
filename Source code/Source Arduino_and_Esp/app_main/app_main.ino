#include <DHTesp.h>
#include <SoftwareSerial.h>
#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ThingSpeak.h>
#include <MQ135.h>
#include <cmath>
#include <String.h>

const char* ssid = "Khoa";
const char* password = "khoa1303";
const char* server = "api.thingspeak.com";
const String apikey = "7NT2XTAS8DU67C9F";


SoftwareSerial espSerial(14,12);

const int DHT_PIN = 5;
DHTesp dhtSensor;

WiFiClient client;

void setup() {
  Serial.begin(115200);
 
  espSerial.begin(9600); // Baud rate cho ESP8266
  
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }

  ThingSpeak.begin(client);
  dhtSensor.setup(DHT_PIN, DHTesp::DHT11);
}

void loop() {
  TempAndHumidity data = dhtSensor.getTempAndHumidity();
  MQ135 mq135_sensor = MQ135(A0);
  // float sensorRainValue= analogRead(sensorRain);

  // Serial.print("Rain Value: ");
  // Serial.println(sensorRainValue);

  Serial.print("Temperature: ");
  Serial.print(data.temperature, 2);
  Serial.println(" °C");
  Serial.print("Humidity: ");
  Serial.print(data.humidity, 1);
  Serial.println(" %");

  float rzero = mq135_sensor.getRZero();
  float correctedRZero = mq135_sensor.getCorrectedRZero(data.temperature, data.humidity);
  float resistance = mq135_sensor.getResistance();
  float ppm = mq135_sensor.getPPM();
  float correctedPPM = mq135_sensor.getCorrectedPPM(data.temperature, data.humidity);
 
  Serial.print("MQ135 RZero: ");
  Serial.print(rzero);
  Serial.print("\t Corrected RZero: ");
  Serial.print(correctedRZero);
  Serial.print("\t Resistance: ");
  Serial.print(resistance);
  Serial.print("\t PPM: ");
  Serial.print(ppm);
  Serial.print("\t Corrected PPM: ");
  Serial.print(correctedPPM);
  Serial.println("ppm");
  String sensorRain="nan";
  String sensorBrightness="nan";

 //    gửi dữ liệu lên arduino
  espSerial.println("getdata");

       // Chờ nhận phản hồi từ Arduino
  int ThoiGianDeNgat =0;
  while (!espSerial.available()) {
    ThoiGianDeNgat+=10;
    if (ThoiGianDeNgat >= 10000)break;
    delay(10);
  }
  if (espSerial.available()) {
  // Serial.begin(115200);
    // Đọc phản hồi từ Arduino
    String receivedData = espSerial.readStringUntil('\n');
    Serial.println(receivedData);
    // Kiểm tra dữ liệu nhận được từ Arduino
   if (receivedData.indexOf("Lượng mưa:") != -1 && receivedData.indexOf("Độ sáng:") != -1) {
    int rainIndex = receivedData.indexOf("Lượng mưa:") + 14;
    int commaIndex = receivedData.indexOf(",", rainIndex);
    int brightnessIndex = receivedData.indexOf("Độ sáng:") + 12;
  
//     // Lấy giá trị lượng mưa và độ sáng từ chuỗi
    sensorRain = receivedData.substring(rainIndex, commaIndex);
    sensorBrightness = receivedData.substring(brightnessIndex);
  
    Serial.print("Received Sensor Rain Value: ");
    Serial.println(sensorRain);
    Serial.print("Received Sensor Brightness Value: ");
    Serial.println(sensorBrightness);
  
    // Tiếp tục xử lý dữ liệu nhận được từ Arduino
  } else {
    Serial.println("Invalid data format");
  }
} else {
  Serial.println("No data received");
}

  if (WiFi.status() == WL_CONNECTED) {
    if(!isnan(data.temperature) || !isnan(data.humidity) || !isnan(correctedPPM) || !sensorRain.equals("nan") || !sensorBrightness.equals("nan")){
      ThingSpeak.setField(1, data.temperature);
      ThingSpeak.setField(2, data.humidity);
      ThingSpeak.setField(3, correctedPPM);
      ThingSpeak.setField(4, sensorRain);
      ThingSpeak.setField(5, sensorBrightness);
      int httpResponseCode = ThingSpeak.writeFields(1, apikey.c_str());
      if (httpResponseCode == 200) {
        Serial.println("Data sent to Thingspeak successfully");
      } else {
        Serial.print("Error sending data to Thingspeak. HTTP response code: ");
        Serial.println(httpResponseCode);
      }
    }else Serial.println("Có giá trị Nan, chưa gửi dữ liệu lên được vui lòng kiểm tra hệ thống.");
  }
  delay(10000);
}
