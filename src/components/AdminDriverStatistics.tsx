"use client";
import React, { useState, useEffect } from 'react';
import styles from './AdminDriverStatistics.module.css';

interface DriverStat {
  driverId: string;
  driverName: string;
  phone: string;
  tripCount: number;
  buses: string;
}

interface Statistics {
  month: number;
  year: number;
  totalTrips: number;
  totalDrivers: number;
  statistics: DriverStat[];
}

const AdminDriverStatistics: React.FC = () => {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Lấy tháng và năm hiện tại
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Fetch statistics
  useEffect(() => {
    fetchStatistics();
  }, [selectedMonth, selectedYear]);

  const fetchStatistics = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `/api/admin/driver-statistics?month=${selectedMonth}&year=${selectedYear}`
      );
      const data = await response.json();
      
      if (response.ok) {
        setStatistics(data);
      } else {
        setError(data.message || 'Lỗi khi tải thống kê');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tải thống kê tài xế');
    }
    setLoading(false);
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(parseInt(e.target.value));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(e.target.value));
  };

  const getMonthName = (month: number) => {
    const months = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
      'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
      'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    return months[month - 1];
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push(i);
    }
    return years;
  };

  const getAverageTrips = () => {
    if (!statistics || statistics.totalDrivers === 0) return 0;
    return (statistics.totalTrips / statistics.totalDrivers).toFixed(2);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Tài xế Chạy Nhiều Chuyến Nhất</h1>
      </div>

      {/* Date Selector */}
      <div className={styles.dateSelector}>
        <button className={styles.navBtn} onClick={handlePreviousMonth}>
          ← Tháng trước
        </button>
        
        <div className={styles.calendarInputs}>
          <div className={styles.inputGroup}>
            <label htmlFor="monthSelect">Tháng:</label>
            <select 
              id="monthSelect"
              className={styles.dateInput}
              value={selectedMonth}
              onChange={handleMonthChange}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                <option key={month} value={month}>
                  {getMonthName(month)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="yearSelect">Năm:</label>
            <select 
              id="yearSelect"
              className={styles.dateInput}
              value={selectedYear}
              onChange={handleYearChange}
            >
              {getYearOptions().map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button className={styles.navBtn} onClick={handleNextMonth}>
          Tháng sau →
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Đang tải thống kê...</div>
      ) : statistics ? (
        <>
          {/* Summary Stats */}
          <div className={styles.summaryCards}>
            <div className={styles.card}>
              <div className={styles.cardLabel}>Tổng chuyến</div>
              <div className={styles.cardValue}>{statistics.totalTrips}</div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardLabel}>Tổng tài xế</div>
              <div className={styles.cardValue}>{statistics.totalDrivers}</div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardLabel}>Trung bình/tài xế</div>
              <div className={styles.cardValue}>{getAverageTrips()}</div>
            </div>

            {statistics.statistics.length > 0 && (
              <div className={styles.card}>
                <div className={styles.cardLabel}>Tài xế chạy nhiều nhất</div>
                <div className={styles.cardValue}>{statistics.statistics[0].tripCount}</div>
                <div className={styles.cardSubtext}>{statistics.statistics[0].driverName}</div>
              </div>
            )}
          </div>

          {/* Rankings Table */}
          <div className={styles.tableContainer}>
            <h2>Xếp hạng tài xế</h2>
            
            {statistics.statistics.length === 0 ? (
              <div className={styles.empty}>
                Không có dữ liệu chuyến đi cho tháng này
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.rank}>Xếp hạng</th>
                    <th className={styles.name}>Tên tài xế</th>
                    <th className={styles.phone}>Điện thoại</th>
                    <th className={styles.trips}>Số chuyến</th>
                    <th className={styles.buses}>Xe sử dụng</th>
                    <th className={styles.badge}>Badge</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.statistics.map((driver, index) => (
                    <tr key={driver.driverId} className={styles[`rank-${Math.min(index + 1, 3)}`]}>
                      <td className={styles.rank}>
                        <span className={styles.rankBadge}>
                          {index + 1}
                        </span>
                      </td>
                      <td className={styles.name}>{driver.driverName}</td>
                      <td className={styles.phone}>{driver.phone}</td>
                      <td className={styles.trips}>
                        <span className={styles.tripCount}>{driver.tripCount}</span>
                      </td>
                      <td className={styles.buses}>{driver.buses || '—'}</td>
                      <td className={styles.badge}>
                        {index === 0 ? (
                          <span className={styles.medalGold}>🥇 Gold</span>
                        ) : index === 1 ? (
                          <span className={styles.medalSilver}>🥈 Silver</span>
                        ) : index === 2 ? (
                          <span className={styles.medalBronze}>🥉 Bronze</span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Chart Section */}
          {statistics.statistics.length > 0 && (
            <div className={styles.chartContainer}>
              <h2>Biểu đồ số chuyến (Top 10)</h2>
              <div className={styles.chartWrapper}>
                {statistics.statistics.slice(0, 10).map((driver, index) => {
                  const maxTrips = statistics.statistics[0].tripCount;
                  const percentage = (driver.tripCount / maxTrips) * 100;
                  
                  return (
                    <div key={driver.driverId} className={styles.chartItem}>
                      <div className={styles.chartLabel}>
                        <div className={styles.rankInfo}>
                          <span className={styles.rankNumber}>{index + 1}</span>
                          <span className={styles.driverName}>{driver.driverName}</span>
                        </div>
                        <span className={styles.tripValue}>{driver.tripCount} chuyến</span>
                      </div>
                      <div className={styles.chartBar}>
                        <div 
                          className={styles.chartFill}
                          style={{ 
                            width: `${percentage}%`,
                            background: `hsl(${120 - (index * 10)}, 70%, 50%)`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default AdminDriverStatistics;
