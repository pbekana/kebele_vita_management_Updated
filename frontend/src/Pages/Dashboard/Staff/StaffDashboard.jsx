import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function StaffDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/tasks/my-tasks', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTasks(res.data.tasks || []);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to Staff Dashboard</h1>
      <p className="text-gray-600 mb-8">Here are your assigned tasks and modules.</p>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">My Tasks</h2>
        </div>
        
        <div className="p-6">
          {loading ? (
            <p className="text-gray-500">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="text-gray-500">No tasks assigned to you right now.</p>
          ) : (
            <div className="space-y-4">
              {tasks.map(task => (
                <div key={task.id} className="p-4 border rounded-xl hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-indigo-700">{task.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      task.status === 'completed' ? 'bg-green-100 text-green-700' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {task.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <div><span className="font-semibold">Type:</span> {task.task_type.replace('_', ' ')}</div>
                    {task.due_date && <div><span className="font-semibold">Due:</span> {new Date(task.due_date).toLocaleDateString()}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
