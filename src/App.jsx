import React from 'react';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './router/AppRouter';
import './App.css';

function App() {
  return (
    <div className="App">
      {/* Context Providers - Wrap toàn bộ app để chia sẻ state */}
      <AuthProvider>
        {/* Router chính - quản lý tất cả routing */}
        <AppRouter />
      </AuthProvider>
    </div>
  );
}

export default App
