import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, X } from 'lucide-react';
import axios from 'axios';

const ApplyCertificate = () => {
  const { type } = useParams();
  const navigate = useNavigate();

  const [applicationFor, setApplicationFor] = useState('');
  const [formData, setFormData] = useState({
    childName: "", motherName: "", fatherName: "", fullName: "",
    birthDate: "", birthPlace: "",

    husbandName: "", wifeName: "", marriageDate: "", marriagePlace: "", witnessName: "",

    deceasedName: "", deathDate: "", causeOfDeath: "", deathPlace: "",

    // Residency ID
    existingIdNumber: "",

    phone: "",
    additionalInfo: "",
    documents: []
  });

  const [loading, setLoading] = useState(false);

  const configs = {
    birth: { title: "Birth Certificate", icon: "👶" },
    marriage: { title: "Marriage Certificate", icon: "💍" },
    death: { title: "Death Certificate", icon: "⚰️" },
    "residency-id": { title: "Residency ID Certificate", icon: "🪪" }
  };

  const config = configs[type] || configs.birth;
  const isBirth = type === 'birth';
  const isResidency = type === 'residency-id' || type === 'residency';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + " KB",
      file
    }));

    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...newFiles].slice(0, 5)
    }));
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/residents/certificates/request",
        {
          certificate_type: type,
          ...formData,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert(`✅ ${config.title} Application Submitted Successfully!`);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert(`❌ Failed to submit application: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Selection Screen for Birth and Residency ID
  if ((isBirth || isResidency) && !applicationFor) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-blue-600 mb-8 hover:underline">
            <ArrowLeft className="w-5 h-5" /> Back to Dashboard
          </Link>

          <div className="bg-white rounded-3xl shadow-xl p-10">
            <div className="text-center mb-10">
              <div className="text-6xl mb-4">{config.icon}</div>
              <h1 className="text-3xl font-bold">{config.title}</h1>
              <p className="text-gray-600 mt-3">
                {isBirth ? "Who is this certificate for?" : "Select Application Type"}
              </p>
            </div>

            <div className="grid gap-4">
              {isBirth ? (
                // Birth options
                <>
                  <button onClick={() => setApplicationFor('myself')} className="p-6 border-2 border-gray-200 hover:border-blue-500 rounded-2xl text-left transition hover:shadow-md">
                    <div className="text-3xl mb-3">🧑‍🦰</div>
                    <h3 className="font-semibold text-lg">For Myself (Replacement)</h3>
                    <p className="text-gray-600">Damaged, lost, or need new copy</p>
                  </button>

                  <button onClick={() => setApplicationFor('child')} className="p-6 border-2 border-gray-200 hover:border-blue-500 rounded-2xl text-left transition hover:shadow-md">
                    <div className="text-3xl mb-3">👶</div>
                    <h3 className="font-semibold text-lg">For My Child</h3>
                    <p className="text-gray-600">New birth registration</p>
                  </button>

                  <button onClick={() => setApplicationFor('other')} className="p-6 border-2 border-gray-200 hover:border-blue-500 rounded-2xl text-left transition hover:shadow-md">
                    <div className="text-3xl mb-3">👤</div>
                    <h3 className="font-semibold text-lg">For Someone Else</h3>
                    <p className="text-gray-600">Other person or guardian</p>
                  </button>
                </>
              ) : (
                // Residency ID options
                <>
                  <button onClick={() => setApplicationFor('new')} className="p-6 border-2 border-gray-200 hover:border-blue-500 rounded-2xl text-left transition hover:shadow-md">
                    <div className="text-3xl mb-3">🆕</div>
                    <h3 className="font-semibold text-lg">New Residency ID</h3>
                    <p className="text-gray-600">First time application</p>
                  </button>

                  <button onClick={() => setApplicationFor('renew')} className="p-6 border-2 border-gray-200 hover:border-blue-500 rounded-2xl text-left transition hover:shadow-md">
                    <div className="text-3xl mb-3">🔄</div>
                    <h3 className="font-semibold text-lg">Renewal (Existing ID)</h3>
                    <p className="text-gray-600">Renew or replace existing card</p>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Form
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-2xl mx-auto px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-blue-600 mb-6 hover:underline">
          <ArrowLeft className="w-5 h-5" /> Back to Dashboard
        </Link>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
            <div className="text-6xl mb-4">{config.icon}</div>
            <h1 className="text-3xl font-bold">{config.title}</h1>
            {isResidency && (
              <p className="text-blue-100 mt-1">
                {applicationFor === 'new' && "New Application"}
                {applicationFor === 'renew' && "Renewal Application"}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Residency ID Form */}
            {isResidency && (
              <>
                {applicationFor === 'renew' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Existing Residency ID Number</label>
                    <input 
                      type="text" 
                      name="existingIdNumber" 
                      value={formData.existingIdNumber} 
                      onChange={handleChange} 
                      required 
                      placeholder="KM-2024-XXXXX" 
                      className="w-full p-4 border rounded-2xl" 
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                </div>
              </>
            )}

            {/* Birth, Marriage, Death forms (unchanged) */}
            {type === 'birth' && (
              <>
                {applicationFor !== 'myself' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Child's Full Name</label>
                      <input type="text" name="childName" value={formData.childName} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Mother's Full Name</label>
                        <input type="text" name="motherName" value={formData.motherName} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Father's Full Name</label>
                        <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                      </div>
                    </div>
                  </>
                )}

                {applicationFor === 'myself' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Your Full Name</label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Date of Birth</label>
                    <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Place of Birth</label>
                    <input type="text" name="birthPlace" value={formData.birthPlace} onChange={handleChange} required className="w-full p-4 border rounded-2xl" placeholder="Jimma, Ethiopia" />
                  </div>
                </div>
              </>
            )}

            {type === 'marriage' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Husband's Full Name</label>
                  <input type="text" name="husbandName" value={formData.husbandName} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Wife's Full Name</label>
                  <input type="text" name="wifeName" value={formData.wifeName} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Marriage Date</label>
                    <input type="date" name="marriageDate" value={formData.marriageDate} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Marriage Place</label>
                    <input type="text" name="marriagePlace" value={formData.marriagePlace} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Witness Name</label>
                  <input type="text" name="witnessName" value={formData.witnessName} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                </div>
              </>
            )}

            {type === 'death' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Deceased Full Name</label>
                  <input type="text" name="deceasedName" value={formData.deceasedName} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Date of Death</label>
                    <input type="date" name="deathDate" value={formData.deathDate} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Place of Death</label>
                    <input type="text" name="deathPlace" value={formData.deathPlace} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cause of Death</label>
                  <input type="text" name="causeOfDeath" value={formData.causeOfDeath} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                </div>
              </>
            )}

            {/* Phone Number */}
            {!(isBirth && (applicationFor === 'child' || applicationFor === 'other')) && (
              <div>
                <label className="block text-sm font-medium mb-2">Contact Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
              </div>
            )}

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium mb-3">Upload Supporting Documents</label>
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400">
                <input type="file" multiple accept="image/*,.pdf" onChange={handleFileChange} className="hidden" id="docs" />
                <label htmlFor="docs" className="cursor-pointer block">
                  <Upload className="mx-auto w-12 h-12 text-gray-400 mb-3" />
                  <p className="font-medium">Click to upload supporting documents</p>
                </label>
              </div>

              {formData.documents.length > 0 && (
                <div className="mt-4 space-y-3">
                  {formData.documents.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border">
                      <div className="flex items-center gap-3">
                        <div>📄</div>
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500">{file.size}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold text-lg transition">
              {loading ? "Submitting..." : `Submit ${config.title}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplyCertificate;