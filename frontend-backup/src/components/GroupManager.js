import React, { useState, useContext, useEffect } from 'react';
import { useApi } from '../context/ApiContext';
import { Button, Input } from './ui';

const GroupManager = () => {
  const { fetchGroups, createGroup } = useApi();
  const [groups, setGroups] = useState([]);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await fetchGroups();
      setGroups(data);
    } catch (error) {
      console.error('Erreur chargement groupes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createGroup(newGroup);
      await loadGroups();
      setNewGroup({ name: '', description: '' });
    } catch (error) {
      console.error('Erreur création groupe:', error);
    }
  };

  return (
    <div className="group-manager">
      <h2>Gestion des Groupes</h2>
      
      <form onSubmit={handleSubmit}>
        <Input
          label="Nom du groupe"
          value={newGroup.name}
          onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
          required
        />
        <Input
          label="Description"
          type="textarea"
          value={newGroup.description}
          onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
        />
        <Button type="submit">Créer</Button>
      </form>

      <div className="group-list">
        {groups.map(group => (
          <div key={group.id} className="group-card">
            <h3>{group.name}</h3>
            <p>{group.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupManager;