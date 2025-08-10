import api from './api';

export const fetchTasks = async () => {
  try {
    const response = await api.get('/tasks');
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const createTask = async (taskData) => {
  try {
    const response = await api.post('/tasks', {
      ...taskData,
      date_creation: new Date().toISOString()
    });
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const updateTaskStatus = async (taskId, newStatus) => {
  try {
    const response = await api.patch(`/tasks/${taskId}`, { statut: newStatus });
    return response.data;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};