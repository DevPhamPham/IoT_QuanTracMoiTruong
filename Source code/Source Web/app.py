from flask import Flask, request, jsonify
import xgboost as xgb
import pandas as pd
from sklearn.preprocessing import LabelEncoder
le = LabelEncoder()
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

app = Flask(__name__)

@app.route('/predict', methods=['get'])
def predict():
    results = []  # Danh sách kết quả dự đoán
    #Đọc dữ liệu từ file CSV
    df = pd.read_csv('data_weather_2_format.csv')

    # Tiền xử lý dữ liệu
    # Chuyển đổi cột 'Time' sang kiểu datetime
    df['Time'] = pd.to_datetime(df['Time'], format='%I:%M %p')

    # Mã hóa nhãn cột 'Condition'
    le = LabelEncoder()
    df['Condition'] = le.fit_transform(df['Condition'])

    # print(df['Condition'])

    # Mã hóa cột 'Time' thành các giá trị số nguyên
    df['Time'] = df['Time'].dt.hour * 60 + df['Time'].dt.minute

    # Chia dữ liệu thành tập train và test
    X = df[['Temp', 'Hum', 'Time']]
    y = df['Condition']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.32, random_state=42)

    # Xây dựng mô hình Gradient Boosting (XGBoost)
    model = xgb.XGBClassifier(n_estimators=200, max_depth=10, learning_rate=0.016, random_state=42)

    # Huấn luyện mô hình trên tập train
    model.fit(X_train, y_train)

    # Dự đoán trên tập test
    y_pred = model.predict(X_test)

    # Đánh giá độ chính xác trên tập test
    accuracy = accuracy_score(y_test, y_pred)
    # print(f"Độ chính xác trên tập test: {accuracy}")

    # Dự đoán condition trong từng 30 phút của 24 giờ tiếp theo
    # Lấy thời gian hiện tại
    current_time = pd.Timestamp.now()
    # Tính toán start_time dựa trên thời gian hiện tại
    if current_time.minute < 30:
        start_time = current_time.floor('H') + pd.Timedelta(minutes=30)
    else:
        start_time = current_time.floor('H') + pd.Timedelta(hours=1)
    # Tính toán end_time
    end_time = start_time + pd.Timedelta(hours=24)
    # Tạo future_time_range
    future_time_range = pd.date_range(start=start_time, end=end_time, freq='30min')


    # Tạo dữ liệu dự đoán
    temps = df['Temp'].values[-len(future_time_range):][::-1]
    hums = df['Hum'].values[-len(future_time_range):][::-1]
    times = df['Time'].values[-len(future_time_range):][::-1]
    df_pred = pd.DataFrame({'Temp': temps, 'Hum': hums, 'Time': times})

    # Dự đoán condition
    predictions = model.predict(df_pred[['Temp', 'Hum', 'Time']])

    # Giải mã các nhãn dự đoán thành các condition tương ứng
    predicted_conditions = le.inverse_transform(predictions)

    # In kết quả
    for time, condition in zip(future_time_range, predicted_conditions):
        # print(f'{time}: {condition}')
        results.append({
            'time': str(time),
            'condition': condition
        })

    response = {
        "results": results,
        "ability": round(accuracy, 6)*100
    }
    # Trả về kết quả dự đoán
    return jsonify(response)

if __name__ == '__main__':
    app.run()
