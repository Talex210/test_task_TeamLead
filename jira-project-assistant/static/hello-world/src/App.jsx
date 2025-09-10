import React, { useState, useEffect } from 'react';

export const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('App component mounted');
    setTimeout(() => {
      console.log('Loading finished');
      setLoading(false);
    }, 1000);
  }, []);

  console.log('App render, loading:', loading);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>🚀 Jira Team Assistant v2.0</h2>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>🚀 Jira Team Assistant v2.0</h1>
      <p>Обновленный помощник для управления проектом в Jira - готов к работе!</p>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <h3>Статус приложения</h3>
        <p style={{ color: 'green' }}>✅ Приложение успешно запущено</p>
        <p style={{ color: '#666' }}>Готово к интеграции с Jira API</p>
        <p><strong>Время:</strong> {new Date().toLocaleTimeString()}</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Отладочная информация</h3>
        <p>React работает: ✅</p>
        <p>Компонент загружен: ✅</p>
        <p>Готов к следующему этапу: ✅</p>
      </div>
    </div>
  );
};