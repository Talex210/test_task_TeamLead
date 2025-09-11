import React, { useState, useEffect } from 'react';
import { JiraAPI } from './api';

export const App = () => {
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🚀 Jira Team Assistant v2.0 загружается...');
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 Инициализация приложения...');
      
      // Инициализируем API
      await JiraAPI.initialize();
      console.log('✅ JiraAPI готов, запускаем загрузку данных');
      
      // Загружаем данные
      await loadData();
      
    } catch (error) {
      console.error('❌ Ошибка инициализации:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      console.log('📡 Загрузка данных из Jira API...');
      
      // Загружаем задачи и пользователей параллельно
      const [issuesResponse, usersResponse] = await Promise.all([
        JiraAPI.getProjectIssues(),
        JiraAPI.getProjectUsers()
      ]);

      if (issuesResponse.success) {
        setIssues(issuesResponse.data);
        console.log(`✅ Загружено ${issuesResponse.data.length} задач из проекта ${issuesResponse.projectKey}`);
      } else {
        throw new Error(`Ошибка загрузки задач: ${issuesResponse.error}`);
      }

      if (usersResponse.success) {
        setUsers(usersResponse.data);
        console.log(`✅ Загружено ${usersResponse.data.length} пользователей`);
      } else {
        throw new Error(`Ошибка загрузки пользователей: ${usersResponse.error}`);
      }

    } catch (error) {
      console.error('❌ Ошибка загрузки данных:', error);
      setError(error.message);
    }
  };

  const handleAssignIssue = async (issueKey, accountId) => {
    try {
      console.log(`👤 Назначение исполнителя для ${issueKey}`);
      const response = await JiraAPI.updateIssueAssignee(issueKey, accountId);
      
      if (response.success) {
        console.log('✅ Исполнитель назначен успешно');
        // Обновляем локальные данные
        await loadData();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('❌ Ошибка назначения исполнителя:', error);
      alert(`Ошибка: ${error.message}`);
    }
  };

  const handleAutoAssign = async () => {
    try {
      console.log('🔄 Массовое назначение задач...');
      const response = await JiraAPI.autoAssignUnassigned();
      
      if (response.success) {
        console.log('✅ Массовое назначение завершено');
        alert(response.summary);
        await loadData();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('❌ Ошибка массового назначения:', error);
      alert(`Ошибка: ${error.message}`);
    }
  };

  const handleFixPriority = async (issueKey) => {
    try {
      console.log(`⬆️ Повышение приоритета для ${issueKey}`);
      // Повышаем приоритет до Medium (id: '3')
      const response = await JiraAPI.updateIssuePriority(issueKey, '3');
      
      if (response.success) {
        console.log('✅ Приоритет повышен успешно');
        // Обновляем локальные данные
        await loadData();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('❌ Ошибка повышения приоритета:', error);
      alert(`Ошибка: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>🚀 Jira Team Assistant</h2>
        <p>Загрузка данных...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>🚀 Jira Team Assistant</h2>
        <div style={{ color: 'red', marginTop: '20px' }}>
          <h3>❌ Ошибка</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Перезагрузить
          </button>
        </div>
      </div>
    );
  }

  const unassignedIssues = issues.filter(issue => !issue.assignee);
  const problemIssues = issues.filter(issue => 
    !issue.assignee || 
    ((issue.priority.name === 'Low' || issue.priority.name === 'Lowest')
     && issue.duedate && new Date(issue.duedate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  );

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🚀 Jira Team Assistant</h1>
      
      {/* Панель управления */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h3>📊 Статистика проекта</h3>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
          <span>Всего задач: <strong>{issues.length}</strong></span>
          <span>Без исполнителя: <strong style={{ color: unassignedIssues.length > 0 ? 'red' : 'green' }}>
            {unassignedIssues.length}
          </strong></span>
          <span>Проблемных: <strong style={{ color: problemIssues.length > 0 ? 'orange' : 'green' }}>
            {problemIssues.length}
          </strong></span>
          <span>Участников: <strong>{users.length}</strong></span>
        </div>
        
        {unassignedIssues.length > 0 && (
          <button 
            onClick={handleAutoAssign}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Auto-assign unassigned ({unassignedIssues.length})
          </button>
        )}
      </div>

      {/* Таблица задач */}
      <div style={{ marginBottom: '20px' }}>
        <h3>📋 Задачи проекта</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Key</th>
              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Summary</th>
              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Assignee</th>
              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Priority</th>
              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {issues.map(issue => {
              const isUnassigned = !issue.assignee;
              const isLowPriority = issue.priority.name === 'Low' || issue.priority.name === 'Lowest';
              const isLowPriorityWithDeadline = isLowPriority && issue.duedate && 
                new Date(issue.duedate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
              
              return (
                <tr key={issue.id} style={{ 
                  backgroundColor: isUnassigned ? '#ffebee' : isLowPriorityWithDeadline ? '#fff3e0' : 'white'
                }}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {isUnassigned && <span style={{ color: 'red' }}>🔴</span>}
                      {isLowPriorityWithDeadline && <span style={{ color: 'orange' }}>🟡</span>}
                      {issue.key}
                    </div>
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{issue.summary}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{issue.status}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {issue.assignee ? issue.assignee.displayName : 'Не назначен'}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{issue.priority.name}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {isUnassigned && (
                        <select 
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssignIssue(issue.key, e.target.value);
                            }
                          }}
                          style={{ padding: '4px', fontSize: '12px' }}
                        >
                          <option value="">Назначить...</option>
                          {users.filter(u => u.active).map(user => (
                            <option key={user.accountId} value={user.accountId}>
                              {user.displayName}
                            </option>
                          ))}
                        </select>
                      )}
                      {isLowPriorityWithDeadline && (
                        <button
                          onClick={() => handleFixPriority(issue.key)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            backgroundColor: '#ffc107',
                            color: 'black',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                        >
                          ⬆️ Fix Priority
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Команда */}
      <div>
        <h3>👥 Команда проекта</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          {users.map(user => {
            const assignedCount = issues.filter(issue => 
              issue.assignee && issue.assignee.accountId === user.accountId
            ).length;
            
            return (
              <div key={user.accountId} style={{
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: user.active ? 'white' : '#f5f5f5'
              }}>
                <div style={{ fontWeight: 'bold' }}>{user.displayName}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Задач: {assignedCount}
                </div>
                <div style={{ fontSize: '12px', color: user.active ? 'green' : 'gray' }}>
                  {user.active ? '✅ Активен' : '⚪ Неактивен'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};