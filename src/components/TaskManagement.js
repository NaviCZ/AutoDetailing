// TaskManagement.js
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Plus, Save, Trash2 } from 'lucide-react';
import { saveServiceTasks, getServiceTasks } from './Firebase';
import { useServiceContext } from './ServiceContext';

const TaskManagement = ({ serviceId }) => {
  const [tasks, setTasks] = useState([]);
  const { serviceGroups } = useServiceContext();
  
  useEffect(() => {
    const loadTasks = async () => {
      const serviceTasks = await getServiceTasks(serviceId);
      setTasks(serviceTasks);
    };
    
    if (serviceId) {
      loadTasks();
    }
  }, [serviceId]);

  const addTask = () => {
    setTasks([...tasks, { description: '', productId: null }]);
  };

  const updateTask = (index, field, value) => {
    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setTasks(newTasks);
  };

  const removeTask = (index) => {
    const newTasks = tasks.filter((_, i) => i !== index);
    setTasks(newTasks);
  };

  const handleSave = async () => {
    const success = await saveServiceTasks(serviceId, tasks);
    if (success) {
      alert('Úkoly byly úspěšně uloženy');
    } else {
      alert('Při ukládání úkolů došlo k chybě');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Správa úkolů pro službu</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={task.description}
                onChange={(e) => updateTask(index, 'description', e.target.value)}
                className="flex-grow p-2 border rounded"
                placeholder="Popis úkolu..."
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeTask(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <div className="flex justify-between pt-4">
            <Button onClick={addTask}>
              <Plus className="mr-2 h-4 w-4" />
              Přidat úkol
            </Button>
            
            <Button onClick={handleSave} variant="default">
              <Save className="mr-2 h-4 w-4" />
              Uložit změny
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskManagement;