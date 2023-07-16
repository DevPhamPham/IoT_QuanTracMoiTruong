# IoT_QuanTracMoiTruong

### Link data cho dữ liệu huấn luyện: 
    - https://www.wunderground.com/history/daily/vn/ho-chi-minh-city/VVTS/date/2023-5-11

### Chạy chương trình:

	npm i | npm start

### Thông tin chi tiết
    READ -> ANALOG
    lấy giá trị đọc từ analogRead/1023 * điện áp tham chiếu (5V) * luxPerVolt (100).

    Đối với cảm biến mưa, không phải cảm biến nào cũng có thể chuyển đổi giá trị đọc analog thành đơn vị đo lượng mưa trực tiếp. Thông thường, cảm biến mưa sẽ cung cấp các tín hiệu tương tự hoặc tín hiệu kỹ thuật số liên quan đến độ ẩm hoặc tình trạng mưa.

    Tuy nhiên, nếu bạn muốn chuyển đổi giá trị đọc analog từ cảm biến mưa thành mức độ mưa (ví dụ: "nhẹ", "trung bình", "mạnh"), bạn có thể xây dựng một bảng ánh xạ để định rõ mức độ mưa dựa trên giá trị đọc analog. Cách này yêu cầu bạn thử nghiệm và hiệu chỉnh thủ công để xác định các ngưỡng tương ứng với các mức độ mưa khác nhau.

    AS: 
        Condition	Illumination (lux)	
        Full moon	        0.1
        Deep twilight	1
        Twilight	        10
        Computer monitor**	50
        Stairway lighting	100
        Office lighting	400
        Overcast day	1,000
        Full daylight	10,000
        Direct sunlight	100,000

    🌧️ Rain (mm): <0.2597 ( no rain) , 0.2597-5.9061(light rain), , 5.9061-7.6 (rain), >7.6( heavy rain)

## Chức năng chính của hệ thống:
### Đọc dữ liệu:
    Lấy dữ liệu từ các cảm biến gửi lên ThingSpeak sau đó hệ thống lấy dữ liệu từ ThingSpeak để thống kê, dự đoán và phân tích.
### Thống kê:
    Nhiệt độ.
    Độ ẩm.
    Chất lượng không khí.
    Lượng mưa.
    Cường độ sáng.
### Dự đoán: sử dụng mô hình Gradient Boosting (XGBoost) để huấn luyện
    Dự đoán khả năng xảy ra của thời tiết từng 30 phút trong 24H tới
### Phân tích: 
     Co2 + Nhiệt độ: nếu nồng độ ppm và ℃ tăng bất thường(tăng mạnh trên đồ thị thống kê) thì cảnh báo có khả năng kẹt xe ở các tuyến đường xung quanh.

    (Nhiệt độ giảm + độ ẩm tăng) bất thường + phần trăm dự đoán thời tiết trong thời gian mỗi 30 phút => có khả năng mưa cáo hơn dự đoán.

    Ánh sáng tăng cao + nhiệt độ cao => trời nóng oi bức, bôi kem chống Sun hoặc dùng ô.

#### Quy trình phân tích các khả năng:
    Lấy dữ liệu gửi từ ThingSpeak.
    So sánh dữ liệu cuối cùng gửi về với trung bình 5 dữ liệu trước đó với ngưỡng cảnh báo các khả năng.
    Phân tích và xuất ra màn hình các cảnh báo về khả năng xảy ra dựa trên trên.

#### tinkercad:
    https://www.tinkercad.com/things/33RWjBNGJIP-finaliot/editel?sharecode=rJpNcfOBh4MjcF1q4RcBFzcg6fEc6Q6_jdAVaBZTxHw&fbclid=IwAR3mwFa7gp1fg7zrMEDUYSZTAF6bHtxJhQyv5X2oGepV69rw2v2CEJdR270

#### wokwi:
    https://wokwi.com/projects/363991898536470529

#### ThingSpeak:
    https://thingspeak.com/channels/2136077