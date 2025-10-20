const pool = require('./config/db'); // Đảm bảo đường dẫn này đúng
require('dotenv').config(); // Tải file .env

(async () => {
  try {
    // --- THAY ĐỔI CÂU QUERY Ở ĐÂY ---
    // Chúng ta sẽ thử lấy tất cả người dùng từ bảng NguoiDung
    const [rows] = await pool.query('SELECT * FROM NguoiDung');
    // ---------------------------------

    if (rows.length > 0) {
      // Nếu có dữ liệu, in ra
      console.log('✅ Lấy dữ liệu NguoiDung thành công:');
      console.log(rows); // In ra một mảng các đối tượng
      console.log('---');
      console.log('Dữ liệu người dùng đầu tiên:', rows[0].hoTen, '-', rows[0].email);
    } else {
      // Nếu không có dữ liệu
      console.log('✅ Kết nối thành công, nhưng bảng NguoiDung đang trống.');
      console.log('👉 Bạn hãy chạy file "insert_sample_data.sql" để có dữ liệu mẫu nhé.');
    }

  } catch (error) {
    console.error('❌ Lỗi khi query dữ liệu MySQL:', error.message);
  } finally {
    // Đóng kết nối sau khi test xong để chương trình kết thúc
    pool.end();
  }
})();