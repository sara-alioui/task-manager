import React, { useState, useContext, useEffect } from 'react';
import { useApi } from '../context/ApiContext';
import { formatDate } from '../utils/dateUtils';

const TaskList = () => {
  const { fetchTasks, updateTaskStatus } = useApi();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (error) {
      console.error('Erreur chargement tâches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      await loadTasks();
    } catch (error) {
      console.error('Erreur mise à jour tâche:', error);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="task-list">
      <h2>Liste des Tâches</h2>
      
      {tasks.length === 0 ? (
        <p>Aucune tâche disponible</p>
      ) : (
        <ul>
          {tasks.map(task => (
            <li key={task.id}>
              <h3>{task.titre}</h3>
              <p>{task.description}</p>
              <div>
                <span>Statut: </span>
                <select 
                  value={task.statut} 
                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                >
                  <option value="à faire">À faire</option>
                  <option value="en cours">En cours</option>
                  <option value="terminé">Terminé</option>
                </select>
              </div>
              <small>Créé le: {formatDate(task.date_creation)}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TaskList;