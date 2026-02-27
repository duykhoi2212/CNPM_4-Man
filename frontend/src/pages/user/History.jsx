const History = () => {
  const bookings = [
    { id: '#BK1029', pitch: 'Sân bóng A', date: '28/02/2026', time: '18:00 - 19:30', status: 'Đã xác nhận', color: 'bg-green-100 text-green-800' },
    { id: '#BK0938', pitch: 'Sân bóng C', date: '20/02/2026', time: '19:00 - 20:30', status: 'Đã hoàn thành', color: 'bg-gray-100 text-gray-800' },
    { id: '#BK0811', pitch: 'Sân bóng B', date: '15/02/2026', time: '17:00 - 18:00', status: 'Đã hủy', color: 'bg-red-100 text-red-800' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Lịch sử đặt sân của bạn</h2>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {bookings.map((booking) => (
            <li key={booking.id}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-primary truncate">{booking.id} - {booking.pitch}</p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${booking.color}`}>
                      {booking.status}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      Ngày: {booking.date} | Giờ: {booking.time}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default History;