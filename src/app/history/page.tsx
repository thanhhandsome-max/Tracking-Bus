'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface DayTrip {
  date: string;
  status: 'today' | 'to-school' | 'to-home' | 'rest-day';
  tripCount: number;
  trips?: Array<{
    id: string;
    studentName: string;
    time: string;
    direction: 'pickup' | 'dropoff';
    routeName: string;
  }>;
}

export default function HistoryPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const tripData: Record<string, DayTrip> = {
    '2025-10-01': { date: '2025-10-01', status: 'to-school', tripCount: 2 },
    '2025-10-02': { date: '2025-10-02', status: 'to-home', tripCount: 1 },
    '2025-10-14': { date: '2025-10-14', status: 'to-school', tripCount: 2 },
    '2025-10-15': { date: '2025-10-15', status: 'to-home', tripCount: 1 },
    '2025-10-28': { 
      date: '2025-10-28', 
      status: 'today', 
      tripCount: 3,
      trips: [
        {
          id: '1',
          studentName: 'Nguyễn Văn A',
          time: '07:00',
          direction: 'pickup',
          routeName: 'Tuyến 1: Bến Thành'
        }
      ]
    },
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { 
      daysInMonth: lastDay.getDate(), 
      startingDayOfWeek: firstDay.getDay() 
    };
  };

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const getDayStatus = (day: number): string => {
    const dateKey = formatDateKey(year, month, day);
    return tripData[dateKey]?.status || '';
  };

  const handleDayClick = (day: number) => {
    const dateKey = formatDateKey(year, month, day);
    if (tripData[dateKey]) {
      setSelectedDate(dateKey);
    }
  };

  const selectedDayData = selectedDate ? tripData[selectedDate] : null;
  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Lịch sử chuyến đi</h1>
      <div className={styles.content}>
        <div className={styles.calendarSection}>
          <div className={styles.calendar}>
            <div className={styles.calendarHeader}>
              <button onClick={previousMonth} className={styles.navButton}>◀</button>
              <h2 className={styles.monthTitle}>{monthNames[month]} {year}</h2>
              <button onClick={nextMonth} className={styles.navButton}>▶</button>
            </div>
            <div className={styles.legend}>
              <div className={styles.legendItem}><span className={`${styles.dot} ${styles.today}`}></span><span>Hôm nay</span></div>
              <div className={styles.legendItem}><span className={`${styles.dot} ${styles.toSchool}`}></span><span>Ngày đi học</span></div>
              <div className={styles.legendItem}><span className={`${styles.dot} ${styles.toHome}`}></span><span>Ngày đi về</span></div>
              <div className={styles.legendItem}><span className={`${styles.dot} ${styles.restDay}`}></span><span>Ngày nghỉ ở nhà</span></div>
            </div>
            <div className={styles.weekDays}>{weekDays.map(day => (<div key={day} className={styles.weekDay}>{day}</div>))}</div>
            <div className={styles.calendarGrid}>
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (<div key={`empty-${i}`} className={styles.emptyDay}></div>))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const status = getDayStatus(day);
                const dateKey = formatDateKey(year, month, day);
                const isSelected = selectedDate === dateKey;
                return (<div key={day} className={`${styles.day} ${status ? styles[status] : ''} ${isSelected ? styles.selected : ''}`} onClick={() => handleDayClick(day)}><span className={styles.dayNumber}>{day}</span></div>);
              })}
            </div>
          </div>
        </div>
        <div className={styles.detailsSection}>
          <h3 className={styles.detailsTitle}>Chi tiết chuyến đi</h3>
          {selectedDayData && selectedDayData.trips ? (
            <div className={styles.tripList}>
              {selectedDayData.trips.map(trip => (
                <div key={trip.id} className={styles.tripCard}>
                  <div className={styles.tripHeader}>
                    <div className={styles.tripInfo}>
                      <div className={styles.studentName}>👤 {trip.studentName}</div>
                      <div className={styles.routeName}>🚌 {trip.routeName}</div>
                    </div>
                    <div className={styles.tripBadge}>{trip.direction === 'pickup' ? '📚 Đi học' : '🏠 Về nhà'}</div>
                  </div>
                  <div className={styles.tripTime}>⏰ Thời gian: {trip.time}</div>
                  <Link href={`/multi-trip-tracking?trip=${trip.id}`} className={styles.viewButton}>Xem chi tiết</Link>
                </div>
              ))}
            </div>
          ) : selectedDayData ? (
            <div className={styles.noTrips}><p>📅 Ngày {new Date(selectedDate!).getDate()}/{month + 1}/{year}</p><p>Không có chuyến đi nào</p></div>
          ) : (
            <div className={styles.selectDate}><p>📅 Chọn một ngày trên lịch để xem chi tiết chuyến đi</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
