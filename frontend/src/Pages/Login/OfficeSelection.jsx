import { useNavigate } from 'react-router-dom';

export default function OfficeSelection() {
  const navigate = useNavigate();

  const goToDashboard = (office) => {
    const routes = {
      death: "/staff/death",
      birth: "/staff/birth",
      marriage: "/staff/marriage",
      reports: "/staff/reports",
      id: "/staff/id"
    };
    navigate(routes[office]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🛡️</div>
            <h1 className="text-3xl font-bold">Welcome Staff Member</h1>
            <p className="text-gray-600 mt-2">Which office do you work in?</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => goToDashboard('death')}
              className="w-full p-6 border-2 border-red-200 hover:border-red-500 rounded-2xl text-left transition hover:bg-red-50"
            >
              💀 Death Certificate Office
            </button>

            <button 
              onClick={() => goToDashboard('birth')}
              className="w-full p-6 border-2 border-pink-200 hover:border-pink-500 rounded-2xl text-left transition hover:bg-pink-50"
            >
              👶 Birth Certificate Office
            </button>

            <button 
              onClick={() => goToDashboard('marriage')}
              className="w-full p-6 border-2 border-purple-200 hover:border-purple-500 rounded-2xl text-left transition hover:bg-purple-50"
            >
              💍 Marriage Certificate Office
            </button>

            <button 
              onClick={() => goToDashboard('reports')}
              className="w-full p-6 border-2 border-amber-200 hover:border-amber-500 rounded-2xl text-left transition hover:bg-amber-50"
            >
              📢 Resident Reports Office
            </button>

            <button 
              onClick={() => goToDashboard('id')}
              className="w-full p-6 border-2 border-teal-200 hover:border-teal-500 rounded-2xl text-left transition hover:bg-teal-50"
            >
              🆔 ID Management Office
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}