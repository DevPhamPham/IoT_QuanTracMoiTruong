const express = require('express');
const axios = require('axios');
const hbs = require('hbs');

const app = express();
const port = 8080;

hbs.handlebars.registerHelper('json', function(context) {
  return JSON.stringify(context);
});

// Set up hbs as view engine
app.set('view engine', 'hbs');

// Route to get data from Thingspeak API
app.get('/', async (req, res) => {
  try {
    const channelID = '2136077';
    const apiKey = 'AN35ADFIY1JVHY23';

    const response = await axios.get(`https://api.thingspeak.com/channels/${channelID}/feeds.json`, {
      params: {
        api_key: apiKey,
        // results: results
      }
    });

    const data = response.data;
    const field1 = data.channel.field1;
    const field2 = data.channel.field2;
    const field3 = data.channel.field3;
    const field4 = data.channel.field4;
    const field5 = data.channel.field5;
    const feeds = data.feeds;
    const dataNhietDo = [];
    const dataDoAm = [];
    const dataKhongKhi = [];
    const dataLuongMua = [];
    const dataAnhSang = [];
    const dataDate = [];
    const dateCsv = []
    const timeCsv = []
    const tempCsv = []
    const humCsv = []
    feeds.forEach(feed =>{
      dataNhietDo.push(parseFloat(feed.field1));
      dataDoAm.push(parseFloat(feed.field2));
      dataKhongKhi.push(parseFloat(feed.field3));
      dataLuongMua.push(parseFloat(feed.field4));
      dataAnhSang.push(parseFloat(feed.field5.replace(/\r/g, '')));
      dataDate.push(Date.parse(feed.created_at));

      const timestamp = new Date(feed.created_at);
      const day = `${timestamp.getMonth() + 1}/${timestamp.getDate()}/${timestamp.getFullYear()}`;
      let hour = timestamp.getHours();
      let minutes = timestamp.getMinutes();
      
      // Chỉnh lại thời gian
      if (minutes >= 0 && minutes < 30) {
        minutes = '30';
      } else {
        hour += 1;
        minutes = '00';
      }
      
      // Chuyển đổi sang định dạng AM/PM
      const period = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12;
      hour = hour ? hour : 12; // 0h được chuyển thành 12h
      
      const time = `${hour}:${minutes} ${period}`;
      
      dateCsv.push(day);
      timeCsv.push(time);      
      tempCsv.push(parseFloat(feed.field1));
      humCsv.push(parseFloat(feed.field2));
    });


    const avg_temp = [];
    const avg_hum = [];
    const tempSum = {};
    const humSum = {};
    const tempCount = {};
    const humCount = {};

    for (let i = 0; i < timeCsv.length; i++) {
      if (!tempSum[timeCsv[i]]) {
        tempSum[timeCsv[i]] = 0;
        tempCount[timeCsv[i]] = 0;
      }
      if (!humSum[timeCsv[i]]) {
        humSum[timeCsv[i]] = 0;
        humCount[timeCsv[i]] = 0;
      }

      tempSum[timeCsv[i]] += tempCsv[i];
      humSum[timeCsv[i]] += humCsv[i];
      tempCount[timeCsv[i]]++;
      humCount[timeCsv[i]]++;
    }

    for (const t in tempSum) {
      avg_temp.push(tempSum[t] / tempCount[t]);
    }

    for (const h in humSum) {
      avg_hum.push(humSum[h] / humCount[h]);
    }
    const uniqueData = {};

    for (let i = 0; i < dateCsv.length; i++) {
      const key = dateCsv[i] + '-' + timeCsv[i];
      if (!uniqueData[key]) {
        uniqueData[key] = {
          Day: dateCsv[i],
          Time: timeCsv[i],
        };
      }
    }

    const uniqueDays = Object.values(uniqueData).map((data) => data.Day);
    const uniqueTimes = Object.values(uniqueData).map((data) => data.Time);

    const LuongMuaCSV = dataLuongMua.map(analogValue => {
      var reverseAnalogVal = 1023 - analogValue;
      var ratio = (1023-350)/7.6
      var maxMM = 1023/ratio
      return (reverseAnalogVal/ratio)
      //.toFixed(2)
    });
    const avg_rain = [];
    const avg_light = [];
    const rainSum = {};
    const lightSum = {};
    const rainCount = {};
    const lightCount = {};

    for (let i = 0; i < timeCsv.length; i++) {
      if (!rainSum[timeCsv[i]]) {
        rainSum[timeCsv[i]] = 0;
        rainCount[timeCsv[i]] = 0;
      }
      if (!lightSum[timeCsv[i]]) {
        lightSum[timeCsv[i]] = 0;
        lightCount[timeCsv[i]] = 0;
      }

      rainSum[timeCsv[i]] += LuongMuaCSV[i];
      lightSum[timeCsv[i]] += dataAnhSang[i];
      rainCount[timeCsv[i]]++;
      lightCount[timeCsv[i]]++;
    }

    for (const t in rainSum) {
      avg_rain.push(rainSum[t] / rainCount[t]);
    }

    for (const h in lightSum) {
      avg_light.push(lightSum[h] / lightCount[h]);
    }

    // console.log(avg_temp);
    // console.log(avg_hum);
    // console.log(uniqueDays)
    // console.log(uniqueTimes)
    // console.log(avg_rain)
    // console.log(avg_light)

    const writeData = []
    
    for (let i = 0; i < uniqueTimes.length;i++){
      let conditionCsv="No Rain"
      if (avg_rain[i] >= 0.2597 && avg_rain[i]<=5.9061){
        conditionCsv = "Light Rain"
      } else if (avg_rain[i]>=5.9061 && avg_rain[i]<=7.6){
        conditionCsv = "Rain"
      }else if(avg_rain[i]>7.6){
        conditionCsv = "Heavy Rain"
      } else{
        // Kiểm tra giá trị thời gian từ 6:00 PM đến 6:00 AM
        if (uniqueTimes[i].includes("PM") || uniqueTimes[i].includes("AM")) {
          const timeParts = uniqueTimes[i].split(":");
          const hour = parseInt(timeParts[0]);
          const isPM = uniqueTimes[i].includes("PM");

          // So sánh giờ từ 6:00 PM đến 6:00 AM
          if (!(isPM && hour >= 6) && !(!isPM && hour < 6)) {
            if (avg_light[i] >= 3000) {
              conditionCsv = "Sun";
            } else {
              conditionCsv = "Clouds";
            }
          }
        }
      }

      writeData.push({
        Day: uniqueDays[i],
        Time: uniqueTimes[i],
        Temp: (avg_temp[i] * 9/5) + 32, // Chuyển đổi độ C sang độ F
        Hum: avg_hum[i],
        Condition: conditionCsv,
      });
    }
    // console.log(writeData)

    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    const csv = require('csv-parser');
    const fs = require('fs');
    
    // Đường dẫn đến tệp CSV hiện có
    const existingCsvPath = 'data_weather_2_format.csv';
    
    // Tạo mảng để lưu trữ các bản ghi từ tệp CSV hiện có
    const existingRecords = [];
    
    // Đọc dữ liệu từ tệp CSV hiện có
    fs.createReadStream(existingCsvPath)
      .pipe(csv())
      .on('data', (data) => {
        existingRecords.push(data);
      })
      .on('end', () => {
        // Lọc các bản ghi trùng lặp trong dữ liệu mới
        const uniqueWriteData = writeData.filter((record) => {
          const isDuplicate = existingRecords.some((existingRecord) => {
            return (
              existingRecord.Day === record.Day &&
              existingRecord.Time === record.Time
            );
          });
          return !isDuplicate;
        });
    
        if (uniqueWriteData.length === 0) {
          console.log('Không có dữ liệu mới để ghi vào tệp CSV.');
          return;
        }
    
        // Tạo đối tượng ghi CSV để ghi dữ liệu mới
        const csvWriter = createCsvWriter({
          path: existingCsvPath,
          header: [
            { id: 'Day', title: 'Day' },
            { id: 'Time', title: 'Time' },
            { id: 'Temp', title: 'Temp' },
            { id: 'Hum', title: 'Hum' },
            { id: 'Condition', title: 'Condition' },
          ],
          append: true,
        });
    
        // Ghi dữ liệu mới vào tệp CSV
        csvWriter.writeRecords(uniqueWriteData)
          .then(() => {
            console.log('Dữ liệu đã được ghi vào tệp CSV.');
          })
          .catch((err) => {
            console.error('Lỗi khi ghi tệp CSV:', err);
          });
      })
      .on('error', (err) => {
        console.error('Lỗi khi đọc tệp CSV:', err);
      });
    
    const sendData = {
      dataNhietDo: dataNhietDo,
      dataDoAm: dataDoAm,
      dataKhongKhi: dataKhongKhi,
      dataLuongMua: dataLuongMua,
      dataAnhSang: dataAnhSang,
      dataDate: dataDate
    }

    // console.log(sendData)
    var dataPredict = [];
    function handlePredictResult(response) {
      dataPredict = response.data;
      // console.log(dataPredict);
      // Render index.hbs with data
      res.render('index', { field1, field2, field3, field4, field5, sendData, dataPredict });
    }
    // Gửi yêu cầu GET đến API Flask
    axios.get('http://127.0.0.1:5000/predict')
      .then(handlePredictResult)
      .catch(error => {
        console.error(error);
        dataPredict = response.data;
        res.render('index', { field1, field2, field3, field4, field5, sendData, dataPredict });
      // Xử lý lỗi nếu có
      });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
