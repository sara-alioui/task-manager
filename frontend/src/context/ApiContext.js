// ApiContext.js
import React, { createContext, useContext } from 'react';
import axios from 'axios';

const ApiContext = createContext();

export const ApiProvider = ({ children }) => {
  // ✅ API functions utilisées par UserManager et TaskList

  const fetchUsers = async () => {
    const response = await axios.get('http://localhost:5000/api/users', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  };

  const createUser = async (userData) => {
    const response = await axios.post('http://localhost:5000/api/users', userData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  };

  const fetchTasks = async () => {
    const response = await axios.get('http://localhost:5000/api/tasks/mes-taches', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    const response = await axios.put(
      `http://localhost:5000/api/tasks/${taskId}`,
      { statut: newStatus },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }
    );
    return response.data;
  };

  return (
    <ApiContext.Provider
      value={{
        fetchUsers,
        createUser,
        fetchTasks,
        updateTaskStatus
      }}
    >
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => useContext(ApiContext);
