#include <String.h>

int quangtro = A0; //Thiết đặt chân analog đọc quang trở
int rain=A1;

const float voltageRef = 5.0;    // Điện áp tham chiếu (V), tùy thuộc vào vi điều khiển
const float sensorRange = 1023;  // Phạm vi đọc từ cảm biến analog (tùy thuộc vào độ phân giải)
const float luxPerVolt = 100.0;  // Số lux tương ứng với mỗi volt (tuỳ thuộc vào cảm biến)

void setup() {
  // Khởi tạo cộng Serial 9600  
  Serial.begin(9600);
}

void loop() {
  if (Serial.available()) {
    String receivedData = Serial.readStringUntil('\n');
    receivedData.trim();
//    Serial.println(receivedData);
    // const char receivedData;
    // Kiểm tra dữ liệu nhận được từ ESP8266
    if (receivedData.equals("getdata")){
      // Thực hiện xử lý lấy dữ liệu từ các cảm biến
      int giatriQuangtro = analogRead(quangtro);// đọc giá trị quang trở
      int giatrirain = analogRead(rain);// đọc giá trị quang trở
    
      Serial.print("Lượng mưa:");
      Serial.print(giatrirain); // Xuất giá trị ra Serial Monitor
      // int sensorValue = analogRead(sensorRain);
    
      float voltage = (giatriQuangtro / sensorRange) * voltageRef;
      float lux = voltage * luxPerVolt;
      
      // Serial.print("Giá trị đọc: ");
      // Serial.println(giatriQuangtro);
      // Serial.print("Điện áp: ");
      // Serial.print(voltage, 2);
      // Serial.println("V");
      Serial.print(", Độ sáng:");
      Serial.println(lux, 2);
      // Serial.println(" lux");
    }
  // }else{
  //   Serial.println("Error");
  }
  // delay(1000);
}
