import React, { useState, useEffect } from 'react';
import { JiraAPI } from './api';

export const App = () => {
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [error, setError] = useState(null);

  // Состояния для модальных окон
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showMultiFixModal, setShowMultiFixModal] = useState(false);
  const [showAutoAssignConfirm, setShowAutoAssignConfirm] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [activeTab, setActiveTab] = useState('issues'); // 'issues' или 'team'

  useEffect(() => {
    console.log('🚀 Jira Team Assistant загружается...');
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 Инициализация приложения...');

      // Инициализируем API
      await JiraAPI.initialize();
      console.log('✅ JiraAPI готов, запускаем загрузку данных');

      // Загружаем список проектов
      await loadProjects();

      // Устанавливаем текущий проект
      const currentProjectKey = JiraAPI.getCurrentProject();
      setCurrentProject(currentProjectKey);

      // Загружаем данные текущего проекта
      await loadData();

    } catch (error) {
      console.error('❌ Ошибка инициализации:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      console.log('📡 Загрузка списка проектов...');
      const projectsResponse = await JiraAPI.getProjects();

      if (projectsResponse.success) {
        setProjects(projectsResponse.data);
        console.log(`✅ Загружено ${projectsResponse.data.length} проектов`);
      } else {
        throw new Error(`Ошибка загрузки проектов: ${projectsResponse.error}`);
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки проектов:', error);
      setError(error.message);
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

  const handleProjectChange = async (projectKey) => {
    try {
      console.log(`🔄 Смена проекта на: ${projectKey}`);
      setLoading(true);
      
      // Устанавливаем новый проект в API
      JiraAPI.setCurrentProject(projectKey);
      setCurrentProject(projectKey);
      
      // Перезагружаем данные для нового проекта
      await loadData();
    } catch (error) {
      console.error('❌ Ошибка смены проекта:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    try {
      console.log('🔄 Массовое назначение задач...');
      const response = await JiraAPI.autoAssignUnassigned();

      if (response.success) {
        console.log('✅ Массовое назначение завершено');
        setShowAutoAssignConfirm(false);
        await loadData();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('❌ Ошибка массового назначения:', error);
      alert(`Ошибка: ${error.message}`);
      setShowAutoAssignConfirm(false);
    }
  };

  const handleFixPriority = async (issueKey, priorityId = '3') => {
    try {
      const priorityName = priorityId === '2' ? 'High' : 'Medium';
      console.log(`⬆️ Повышение приоритета для ${issueKey} до ${priorityName}`);
      const response = await JiraAPI.updateIssuePriority(issueKey, priorityId);

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

  // Универсальная функция Fix для разных типов проблем
  const handleFix = (issue) => {
    const isUnassigned = !issue.assignee;
    const isLowPriority = issue.priority.name === 'Low' || issue.priority.name === 'Lowest';
    const isLowPriorityWithDeadline = isLowPriority && issue.duedate &&
      new Date(issue.duedate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    setSelectedIssue(issue);

    // Если есть обе проблемы - показываем модалку выбора
    if (isUnassigned && isLowPriorityWithDeadline) {
      setShowMultiFixModal(true);
    }
    // Если только без исполнителя - показываем модалку назначения
    else if (isUnassigned) {
      setShowAssignModal(true);
    }
    // Если только низкий приоритет с дедлайном - показываем модалку приоритета
    else if (isLowPriorityWithDeadline) {
      setShowPriorityModal(true);
    }
  };

  // Закрытие всех модалок
  const closeModals = () => {
    setShowAssignModal(false);
    setShowPriorityModal(false);
    setShowMultiFixModal(false);
    setShowAutoAssignConfirm(false);
    setSelectedIssue(null);
  };

  // Назначение исполнителя из модалки
  const handleAssignFromModal = async (accountId) => {
    if (selectedIssue) {
      await handleAssignIssue(selectedIssue.key, accountId);
      closeModals();
    }
  };

  // Повышение приоритета из модалки
  const handleFixPriorityFromModal = async (priorityId = '3') => {
    if (selectedIssue) {
      await handleFixPriority(selectedIssue.key, priorityId);
      closeModals();
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

  // Функция для определения активности участника
  const getUserActivity = (user) => {
    const assignedCount = issues.filter(issue =>
      issue.assignee && issue.assignee.accountId === user.accountId
    ).length;
    
    // Участник активен если у него меньше 2 задач (может взять еще)
    return assignedCount < 2;
  };

  // Получаем активных участников для назначения
  const getActiveUsers = () => {
    return users.filter(user => user.active && getUserActivity(user));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>

      {/* Навигационные вкладки */}
      <div style={{ 
        marginBottom: '20px', 
        borderBottom: '2px solid #dee2e6',
        display: 'flex',
        gap: '0'
      }}>
        <button
          onClick={() => setActiveTab('issues')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'issues' ? '3px solid #007bff' : '3px solid transparent',
            backgroundColor: activeTab === 'issues' ? '#f8f9fa' : 'transparent',
            cursor: 'pointer',
            fontWeight: activeTab === 'issues' ? 'bold' : 'normal',
            fontSize: '16px'
          }}
        >
          📋 Задачи проекта
        </button>
        <button
          onClick={() => setActiveTab('team')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'team' ? '3px solid #007bff' : '3px solid transparent',
            backgroundColor: activeTab === 'team' ? '#f8f9fa' : 'transparent',
            cursor: 'pointer',
            fontWeight: activeTab === 'team' ? 'bold' : 'normal',
            fontSize: '16px'
          }}
        >
          👥 Team
        </button>
      </div>

      {/* Контент вкладки "Задачи проекта" */}
      {activeTab === 'issues' && (
        <div>
          {/* Панель управления - только на вкладке "Задачи проекта" */}
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3>📊 Статистика проекта</h3>
              
              {/* Dropdown выбора проекта */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label htmlFor="project-select" style={{ fontWeight: 'bold' }}>Проект:</label>
                <select
                  id="project-select"
                  value={currentProject || ''}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    minWidth: '150px'
                  }}
                >
                  {projects.map(project => (
                    <option key={project.key} value={project.key}>
                      {project.key} - {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => setShowAutoAssignConfirm(true)}
                  disabled={getActiveUsers().length === 0}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: getActiveUsers().length > 0 ? '#007bff' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: getActiveUsers().length > 0 ? 'pointer' : 'not-allowed',
                    opacity: getActiveUsers().length > 0 ? 1 : 0.6
                  }}
                >
                  🔄 Auto-assign unassigned ({unassignedIssues.length})
                </button>
                {getActiveUsers().length === 0 && (
                  <span style={{ fontSize: '12px', color: '#dc3545' }}>
                    ⚠️ Все участники загружены (2/2 задачи)
                  </span>
                )}
              </div>
            )}
          </div>

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
                    {(isUnassigned || isLowPriorityWithDeadline) && (
                      <button
                        onClick={() => handleFix(issue)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        🔧 Fix
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
          </div>
        </div>
      )}

      {/* Контент вкладки "Team" */}
      {activeTab === 'team' && (
        <div>
          <h3>👥 Команда проекта</h3>
          <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px', fontSize: '14px' }}>
            <strong>ℹ️ Логика активности:</strong> Максимум 2 задачи на участника. 
            Участники с 2 задачами считаются неактивными и не могут получить новые задачи.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
            {users.map(user => {
              const assignedCount = issues.filter(issue =>
                issue.assignee && issue.assignee.accountId === user.accountId
              ).length;
              const isUserActive = getUserActivity(user);

              return (
                <div key={user.accountId} style={{
                  padding: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: isUserActive ? 'white' : '#f8f9fa',
                  borderLeft: `4px solid ${isUserActive ? '#28a745' : '#6c757d'}`
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{user.displayName}</div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                    📋 Назначено задач: <strong>{assignedCount} / 2</strong>
                  </div>
                  <div style={{ fontSize: '14px' }}>
                    ⚡ Статус: <span style={{ 
                      color: isUserActive ? 'green' : 'red',
                      fontWeight: 'bold'
                    }}>
                      {isUserActive ? '🟢 Может взять задачи' : '🔴 Загружен (2/2)'}
                    </span>
                  </div>
                  {!isUserActive && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#721c24', 
                      backgroundColor: '#f8d7da', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      marginTop: '8px' 
                    }}>
                      Максимальная загрузка - не может взять новые задачи
                    </div>
                  )}
                  {isUserActive && assignedCount > 0 && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#155724', 
                      backgroundColor: '#d4edda', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      marginTop: '8px' 
                    }}>
                      Может взять еще {2 - assignedCount} {2 - assignedCount === 1 ? 'задачу' : 'задачи'}
                    </div>
                  )}
                  {isUserActive && assignedCount === 0 && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#004085', 
                      backgroundColor: '#cce7ff', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      marginTop: '8px' 
                    }}>
                      Свободен - может взять до 2 задач
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Модальное окно для назначения исполнителя */}
      {showAssignModal && selectedIssue && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            minWidth: '300px',
            maxWidth: '500px'
          }}>
            <h3>👤 Назначить исполнителя</h3>
            <p><strong>Задача:</strong> {selectedIssue.key} - {selectedIssue.summary}</p>
            <p>Выберите исполнителя из активных участников:</p>
            <div style={{ marginBottom: '15px' }}>
              {getActiveUsers().length > 0 ? getActiveUsers().map(user => {
                const assignedCount = issues.filter(issue =>
                  issue.assignee && issue.assignee.accountId === user.accountId
                ).length;
                
                return (
                  <button
                    key={user.accountId}
                    onClick={() => handleAssignFromModal(user.accountId)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px',
                      margin: '5px 0',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div>{user.displayName}</div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>
                      📋 Текущих задач: {assignedCount}/2 (может взять еще {2 - assignedCount})
                    </div>
                  </button>
                );
              }) : (
                <div style={{ 
                  padding: '15px', 
                  backgroundColor: '#f8d7da', 
                  border: '1px solid #f5c6cb', 
                  borderRadius: '4px',
                  color: '#721c24'
                }}>
                  <strong>⚠️ Нет доступных участников</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                    Все участники уже имеют максимальную загрузку (2 задачи). Для назначения нужны участники с менее чем 2 задачами.
                  </p>
                </div>
              )}
            </div>
            <button onClick={closeModals} style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно для повышения приоритета */}
      {showPriorityModal && selectedIssue && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            minWidth: '300px',
            maxWidth: '500px'
          }}>
            <h3>⬆️ Повысить приоритет</h3>
            <p><strong>Задача:</strong> {selectedIssue.key} - {selectedIssue.summary}</p>
            <p><strong>Текущий приоритет:</strong> {selectedIssue.priority.name}</p>
            <p><strong>Дедлайн:</strong> {selectedIssue.duedate}</p>
            <p>Задача имеет низкий приоритет, но близкий дедлайн. Выберите новый приоритет:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
              <button
                onClick={() => handleFixPriorityFromModal('3')}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#ffc107',
                  color: 'black',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ⬆️ Повысить до Medium
              </button>
              <button
                onClick={() => handleFixPriorityFromModal('2')}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ⬆️⬆️ Повысить до High
              </button>
              <button onClick={closeModals} style={{
                padding: '10px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для выбора действия (несколько проблем) */}
      {showMultiFixModal && selectedIssue && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            minWidth: '300px',
            maxWidth: '500px'
          }}>
            <h3>🔧 Выберите действие</h3>
            <p><strong>Задача:</strong> {selectedIssue.key} - {selectedIssue.summary}</p>
            <p>У этой задачи несколько проблем:</p>
            <ul>
              <li>🔴 Не назначен исполнитель</li>
              <li>🟡 Низкий приоритет ({selectedIssue.priority.name}) с близким дедлайном ({selectedIssue.duedate})</li>
            </ul>
            <p>Что хотите исправить?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
              <button
                onClick={() => {
                  setShowMultiFixModal(false);
                  setShowAssignModal(true);
                }}
                style={{
                  padding: '10px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                👤 Назначить исполнителя
              </button>
              <button
                onClick={() => {
                  setShowMultiFixModal(false);
                  setShowPriorityModal(true);
                }}
                style={{
                  padding: '10px',
                  backgroundColor: '#ffc107',
                  color: 'black',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ⬆️ Повысить приоритет
              </button>
              <button onClick={closeModals} style={{
                padding: '10px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Подтверждающий диалог для массового назначения */}
      {showAutoAssignConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            minWidth: '400px',
            maxWidth: '500px'
          }}>
            <h3>🔄 Подтверждение массового назначения</h3>
            <p>Вы собираетесь автоматически назначить исполнителей для <strong>{unassignedIssues.length}</strong> задач без исполнителя.</p>
            
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Задачи для назначения:</p>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {unassignedIssues.slice(0, 5).map(issue => (
                  <li key={issue.id} style={{ fontSize: '14px', marginBottom: '5px' }}>
                    {issue.key} - {issue.summary}
                  </li>
                ))}
                {unassignedIssues.length > 5 && (
                  <li style={{ fontSize: '14px', fontStyle: 'italic', color: '#666' }}>
                    ... и еще {unassignedIssues.length - 5} задач
                  </li>
                )}
              </ul>
            </div>

            <div style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 10px 0' }}>
                Исполнители будут назначены случайным образом из списка <strong>активных участников</strong> проекта.
              </p>
              <div style={{ 
                padding: '10px', 
                backgroundColor: '#e3f2fd', 
                borderRadius: '4px',
                border: '1px solid #bbdefb'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>📊 Статистика команды:</div>
                <div>👥 Всего участников: <strong>{users.length}</strong></div>
                <div>🟢 Доступных участников: <strong>{getActiveUsers().length}</strong> (могут взять задачи)</div>
                <div>🔴 Загруженных участников: <strong>{users.length - getActiveUsers().length}</strong> (2/2 задачи)</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={closeModals}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Отмена
              </button>
              <button 
                onClick={handleAutoAssign}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🔄 Подтвердить назначение
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};