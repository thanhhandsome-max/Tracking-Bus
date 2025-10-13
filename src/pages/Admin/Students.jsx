import React, { useState } from 'react';

const Students = () => {
  const [students] = useState([
    {
      id: 1,
      name: 'Nguyễn Văn An',
      studentId: 'HS001',
      grade: 'Lớp 10A1',
      school: 'THPT Nguyễn Du',
      parentName: 'Nguyễn Văn Bố',
      parentPhone: '0123456789',
      address: '123 Đường ABC, Quận 1, TP.HCM',
      busRoute: 'Tuyến 1 - Trường A',
      status: 'active'
    },
    {
      id: 2,
      name: 'Trần Thị Bình',
      studentId: 'HS002',
      grade: 'Lớp 9B2',
      school: 'THCS Lê Lợi',
      parentName: 'Trần Văn Mẹ',
      parentPhone: '0123456790',
      address: '456 Đường XYZ, Quận 2, TP.HCM',
      busRoute: 'Tuyến 2 - Trường B',
      status: 'active'
    },
    {
      id: 3,
      name: 'Lê Văn Cường',
      studentId: 'HS003',
      grade: 'Lớp 11C3',
      school: 'THPT Trần Hưng Đạo',
      parentName: 'Lê Văn Cha',
      parentPhone: '0123456791',
      address: '789 Đường DEF, Quận 3, TP.HCM',
      busRoute: 'Tuyến 3 - Trường C',
      status: 'inactive'
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'graduated':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Đang học';
      case 'inactive':
        return 'Nghỉ học';
      case 'graduated':
        return 'Đã tốt nghiệp';
      default:
        return 'Không xác định';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý học sinh</h1>
          <p className="text-gray-600">Danh sách và thông tin các học sinh trong hệ thống</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
          Thêm học sinh mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">👨‍🎓</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng số học sinh
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{students.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">✓</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Đang học
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {students.filter(student => student.status === 'active').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">🚌</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Có xe đưa đón
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {students.filter(student => student.busRoute && student.status === 'active').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">❌</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Nghỉ học
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {students.filter(student => student.status === 'inactive').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Danh sách học sinh
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Thông tin chi tiết về các học sinh trong hệ thống
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {students.map((student) => (
            <li key={student.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 font-medium text-sm">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {student.name}
                      </p>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                        {getStatusText(student.status)}
                      </span>
                    </div>
                    <div className="mt-1">
                      <p className="text-sm text-gray-500">
                        Mã học sinh: {student.studentId} • {student.grade} • {student.school}
                      </p>
                      <p className="text-sm text-gray-500">
                        Phụ huynh: {student.parentName} ({student.parentPhone})
                      </p>
                      <p className="text-sm text-gray-500">
                        Địa chỉ: {student.address}
                      </p>
                      <p className="text-sm text-gray-500">
                        Tuyến xe: {student.busRoute || 'Chưa phân tuyến'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                    Chỉnh sửa
                  </button>
                  <button className="text-red-600 hover:text-red-900 text-sm font-medium">
                    Xóa
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Students;
