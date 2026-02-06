import React, { useState } from 'react';
import { Card, Button, Badge, message, DatePicker } from 'antd';
import moment from 'moment';

// Giả lập các khung giờ cố định của sân (Ca 90 phút)
const TIME_SLOTS = [
  "05:00 - 06:30", "06:30 - 08:00", "08:00 - 09:30",
  "16:00 - 17:30", "17:30 - 19:00", "19:00 - 20:30", "20:30 - 22:00"
];

// Giả lập dữ liệu các giờ ĐÃ BỊ ĐẶT (Mock Data)
// Sau này sẽ gọi API: GET /api/bookings?pitch_id=1&date=2026-02-06
const BOOKED_SLOTS_MOCK = [
  "17:30 - 19:00", 
  "19:00 - 20:30"
];

const BookingSchedule = ({ onSelectSlot }) => {
  const [selectedDate, setSelectedDate] = useState(moment());
  const [activeSlot, setActiveSlot] = useState(null);

  // Xử lý khi chọn giờ
  const handleSlotClick = (slot) => {
    // Kiểm tra nếu giờ đã bị đặt
    if (BOOKED_SLOTS_MOCK.includes(slot)) {
      message.error('Khung giờ này đã có người đặt!');
      return;
    }
    
    setActiveSlot(slot);
    onSelectSlot(slot, selectedDate); // Gửi dữ liệu ra ngoài cho trang cha
    message.success(`Đã chọn khung giờ: ${slot}`);
  };

  return (
    <Card 
      title="📅 Lịch trống sân bóng" 
      extra={<DatePicker defaultValue={moment()} onChange={(date) => setSelectedDate(date)} format="DD/MM/YYYY" />}
      className="shadow-sm mt-6 border-blue-100"
    >
      {/* Chú thích màu sắc */}
      <div className="flex gap-4 mb-4 justify-center text-sm">
        <div className="flex items-center gap-1"><div className="w-4 h-4 bg-gray-100 border rounded"></div> Trống</div>
        <div className="flex items-center gap-1"><div className="w-4 h-4 bg-blue-600 rounded"></div> Đang chọn</div>
        <div className="flex items-center gap-1"><div className="w-4 h-4 bg-red-100 border border-red-200 rounded text-red-500 flex justify-center items-center text-xs">X</div> Đã đặt</div>
      </div>

      {/* Lưới hiển thị giờ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TIME_SLOTS.map((slot, index) => {
          const isBooked = BOOKED_SLOTS_MOCK.includes(slot);
          const isSelected = activeSlot === slot;

          return (
            <Button
              key={index}
              disabled={isBooked} // Khóa nút nếu đã đặt
              type={isSelected ? "primary" : "default"}
              className={`h-12 font-medium ${
                isBooked 
                  ? "bg-red-50 text-red-400 border-red-200 cursor-not-allowed" 
                  : isSelected 
                    ? "bg-blue-600" 
                    : "hover:border-blue-500 hover:text-blue-500"
              }`}
              onClick={() => handleSlotClick(slot)}
            >
              {slot} {isBooked && "(Đã full)"}
            </Button>
          );
        })}
      </div>
    </Card>
  );
};

export default BookingSchedule;