import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, X } from 'lucide-react';
import axios from 'axios';
import { useNotification } from '../../components/NotificationProvider';

const ApplyCertificate = () => {
  const { type } = useParams();
  const navigate = useNavigate();

  const [applicationFor, setApplicationFor] = useState('');
  const [formData, setFormData] = useState({
    existingIdNumber: "",
    applicantPhoto: null,
    phone: "",
    additionalInfo: "",
    documents: []
  });

  const [regData, setRegData] = useState({
    firstname: '', lastname: '', gender: 'male', birth_date: '', birthplace: '',
    spouse_id: '', marriage_date: '', marriage_place: '',
    deceased_person_id: '', family_relationship_type: '', date_of_death: '', cause_of_death: '', place_of_death: ''
  });
  const [regFile, setRegFile] = useState(null);

  const [showChildForm, setShowChildForm] = useState(false);
  const [showMarriageForm, setShowMarriageForm] = useState(false);

  const [loading, setLoading] = useState(false);
  const { notifySuccess, notifyError } = useNotification();

  const [backendData, setBackendData] = useState(null);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [selectedDeceasedId, setSelectedDeceasedId] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return dateString.split('T')[0];
  };

  const fetchCertificateData = async () => {
    if (!applicationFor || !type) return;
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/residents/certificate-data/${type}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBackendData(response.data);
    } catch (error) {
      console.error("Failed to fetch certificate data:", error);
      notifyError("Failed to load certificate data from backend");
    }
  };

  useEffect(() => {
    fetchCertificateData();
  }, [applicationFor, type]);

  const configs = {
    birth: { title: "Birth Certificate", icon: "👶" },
    marriage: { title: "Marriage Certificate", icon: "💍" },
    death: { title: "Death Certificate", icon: "⚰️" },
    "residency-id": { title: "Residency ID Certificate", icon: "🪪" }
  };

  const config = configs[type] || configs.birth;
  const isBirth = type === 'birth';
  const isResidency = type === 'residency-id' || type === 'residency';

  const needsChildRegistration = type === 'birth' && applicationFor === 'child' && (!backendData?.children || backendData.children.length === 0);
  const needsMarriageRegistration = type === 'marriage' && !backendData?.marriageRelationship;
  const needsDeathRegistration = type === 'death' && (!backendData?.deathReports || backendData.deathReports.length === 0);
  const needsEntityRegistration = needsChildRegistration || needsMarriageRegistration || needsDeathRegistration;

  const getPreviewData = () => {
    const previewFields = [];
    const missingFields = [];
    const uploadFields = [];
    const summaryFields = [];

    if (backendData?.resident) {
      const resident = backendData.resident;
      summaryFields.push({
        label: 'Applicant Name',
        value: `${resident.firstname} ${resident.lastname}`
      });
      if (resident.phone_number) {
        summaryFields.push({ label: 'Phone', value: resident.phone_number });
      }
    }

    const addField = ({ label, key, value, required = false }) => {
      const field = { label, key, value, required };
      previewFields.push(field);
      if (required && !value) {
        missingFields.push(field);
      }
    };

    if (type === 'birth' && applicationFor === 'child' && backendData?.children?.length > 0) {
      const selectedChild = backendData.children.find(c => c.id === selectedChildId) || backendData.children[0];
      
      if (selectedChild) {
        addField({ label: 'Child Full Name', key: 'childName', value: `${selectedChild.firstname} ${selectedChild.lastname}`, required: false });
        addField({ label: 'Date of Birth', key: 'birthDate', value: formatDate(selectedChild.birth_date), required: false });
        addField({ label: 'Place of Birth', key: 'birthPlace', value: selectedChild.birthplace, required: false });
        addField({ label: 'Gender', key: 'gender', value: selectedChild.gender, required: false });
      }

      if (backendData.resident?.gender === 'female') {
        addField({ label: 'Mother Name', key: 'motherName', value: `${backendData.resident.firstname} ${backendData.resident.lastname}`, required: false });
      } else if (backendData.resident?.gender === 'male') {
        addField({ label: 'Father Name', key: 'fatherName', value: `${backendData.resident.firstname} ${backendData.resident.lastname}`, required: false });
      }

      uploadFields.push({ name: 'childPhoto', label: 'Child Photo', required: false, description: 'Optional child photo upload.' });
    } else if (type === 'birth' && applicationFor === 'myself') {
      addField({ label: 'Your Full Name', key: 'fullName', value: backendData?.resident ? `${backendData.resident.firstname} ${backendData.resident.lastname}` : '', required: true });
      addField({ label: 'Date of Birth', key: 'birthDate', value: formatDate(backendData?.resident?.birth_date), required: true });
      addField({ label: 'Place of Birth', key: 'birthPlace', value: backendData?.resident?.birthplace || '', required: true });
      addField({ label: 'Contact Phone', key: 'phone', value: backendData?.resident?.phone_number || '', required: true });
      uploadFields.push({ name: 'applicantPhoto', label: 'Applicant Photo', required: true, description: 'Upload a photo for the certificate.' });
    } else if (type === 'marriage' && (backendData?.spouseData || backendData?.marriageRelationship)) {
      const resident  = backendData.resident;
      const spouse    = backendData.spouseData;
      const marriage  = backendData.marriageRelationship;

      const residentFull = resident ? `${resident.firstname} ${resident.lastname}` : '—';
      const spouseFull   = spouse   ? `${spouse.firstname} ${spouse.lastname}`     : '—';

      // Determine husband/wife based on resident gender
      const isHusband = resident?.gender === 'male';

      addField({ label: 'Husband Name / ባል',           key: 'husbandName',   value: isHusband ? residentFull : spouseFull,   required: false });
      addField({ label: 'Husband Birth Date / ልደት ቀን', key: 'husbandBirthDate', value: formatDate(isHusband ? resident?.birth_date : spouse?.birth_date), required: false });
      addField({ label: 'Husband Birthplace / ቦታ',     key: 'husbandBirthPlace', value: isHusband ? resident?.birthplace : spouse?.birthplace, required: false });
      addField({ label: 'Wife Name / ሚስት',             key: 'wifeName',      value: isHusband ? spouseFull : residentFull,   required: false });
      addField({ label: 'Wife Birth Date / ልደት ቀን',   key: 'wifeBirthDate', value: formatDate(isHusband ? spouse?.birth_date : resident?.birth_date), required: false });
      addField({ label: 'Wife Birthplace / ቦታ',        key: 'wifeBirthPlace', value: isHusband ? spouse?.birthplace : resident?.birthplace, required: false });
      addField({ label: 'Marriage Date / ጋብቻ ቀን',     key: 'marriageDate',  value: formatDate(marriage?.marriage_date), required: false });
      addField({ label: 'Marriage Place / ጋብቻ ቦታ',    key: 'marriagePlace', value: marriage?.marriage_place || '', required: false });

      uploadFields.push({ name: 'husbandPhoto', label: 'Husband Photo / ባል ፎቶ', required: false, description: 'Optional photo upload.' });
      uploadFields.push({ name: 'wifePhoto',    label: 'Wife Photo / ሚስት ፎቶ',  required: false, description: 'Optional photo upload.' });

    } else if (type === 'death' && backendData?.deathReports?.length > 0) {
      const selectedReport = backendData.deathReports.find(d => d.id === selectedDeceasedId) || backendData.deathReports[0];
      const deceasedPerson = backendData.deceasedPeople?.find(p => p.id === selectedReport?.deceased_person_id);

      if (deceasedPerson) {
        addField({ label: 'Deceased Full Name', key: 'deceasedName', value: `${deceasedPerson.firstname} ${deceasedPerson.lastname}`, required: false });
        addField({ label: 'Date of Death', key: 'deathDate', value: formatDate(selectedReport?.date_of_death), required: false });
        addField({ label: 'Cause of Death', key: 'causeOfDeath', value: selectedReport?.cause_of_death, required: false });
        addField({ label: 'Place of Death', key: 'deathPlace', value: selectedReport?.place_of_death, required: false });
      }

      uploadFields.push({ name: 'deceasedPhoto', label: 'Deceased Photo', required: true, description: 'Upload a photo for the deceased.' });
    } else if (type === 'residency-id' || type === 'residency') {
      addField({ label: 'Full Name', key: 'fullName', value: backendData?.resident ? `${backendData.resident.firstname} ${backendData.resident.lastname}` : '', required: true });
      if (applicationFor === 'renew') {
        addField({ label: 'Existing Residency ID Number', key: 'existingIdNumber', value: formData.existingIdNumber, required: true });
      }
      addField({ label: 'Contact Phone', key: 'phone', value: backendData?.resident?.phone_number || '', required: true });
      uploadFields.push({ name: 'applicantPhoto', label: 'Applicant Photo', required: true, description: 'Upload a photo for your residency ID.' });
    }

    return {
      summaryFields,
      previewFields,
      missingFields,
      uploadFields,
      hasMissing: missingFields.length > 0,
    };
  };

  const previewData = getPreviewData();

  const handleRegChange = (e) => {
    setRegData({ ...regData, [e.target.name]: e.target.value });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (name) => (e) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, [name]: file }));
  };

  const addDocumentFiles = (e) => {
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

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    try {
      if (needsChildRegistration) {
        const payload = new FormData();
        payload.append('firstname', regData.firstname);
        payload.append('lastname', regData.lastname);
        payload.append('gender', regData.gender);
        payload.append('birth_date', regData.birth_date);
        payload.append('birthplace', regData.birthplace);
        if (backendData?.resident?.gender === 'male') {
          payload.append('father_id', backendData.resident.id);
        } else {
          payload.append('mother_id', backendData.resident.id);
        }
        if (regFile) payload.append('hospitalEvidence', regFile);

        await axios.post('http://localhost:5000/api/residents/children', payload, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        notifySuccess("Child registered successfully. Loading preview...");
      } else if (needsMarriageRegistration) {
        await axios.post('http://localhost:5000/api/residents/marriage-relationships', {
          spouse_id: regData.spouse_id,
          marriage_date: regData.marriage_date,
          marriage_place: regData.marriage_place
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        notifySuccess("Marriage relationship created. Loading preview...");
      } else if (needsDeathRegistration) {
        const payload = new FormData();
        payload.append('deceased_person_id', regData.deceased_person_id);
        payload.append('family_relationship_type', regData.family_relationship_type);
        payload.append('date_of_death', regData.date_of_death);
        payload.append('cause_of_death', regData.cause_of_death);
        payload.append('place_of_death', regData.place_of_death);
        if (regFile) payload.append('evidence_document', regFile);

        await axios.post('http://localhost:5000/api/residents/death-report', payload, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        notifySuccess("Death reported successfully. Loading preview...");
      }
      
      await fetchCertificateData(); // reload the data so preview shows up
    } catch (err) {
      notifyError(`Registration failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (needsEntityRegistration) return; // Prevent certificate submission if prerequisite is missing

    setLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const payload = new FormData();
      payload.append('certificate_type', type);

      // Pre-fill backend verified entity IDs if applicable
      if (type === 'death' && selectedDeceasedId) {
        const report = backendData.deathReports.find(d => d.id === selectedDeceasedId);
        if (report) payload.append('deceased_resident_id', report.deceased_person_id);
      }

      Object.entries(formData).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") return;
        if (value instanceof File) {
          payload.append(key, value);
          return;
        }
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            payload.append(`documents[${index}]`, item.file);
          });
          return;
        }
        payload.append(key, value);
      });

      await axios.post(
        "http://localhost:5000/api/residents/certificates/request",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      notifySuccess(`${config.title} application submitted successfully.`);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      notifyError(`Failed to submit application: ${err.response?.data?.error || err.message}`);
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

  // Main Certificate Application Form
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

          <div className="p-8">
            {!backendData ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-700">
                Loading certificate data...
              </div>
            ) : needsEntityRegistration ? (
              <form onSubmit={handleRegistrationSubmit} className="space-y-6">
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
                  {needsChildRegistration && (
                    <>
                      {!showChildForm ? (
                        <div className="text-center py-4">
                          <h3 className="text-lg font-semibold mb-2">No child record exists.</h3>
                          <p className="text-sm text-slate-700 mb-6">Would you like to register a child?</p>
                          <button type="button" onClick={() => setShowChildForm(true)} className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2 rounded-xl font-medium">Yes, Register Child</button>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          <h3 className="text-lg font-semibold mb-2">Child Registration</h3>
                          <div><label className="block text-sm font-medium mb-1">Child First Name</label><input type="text" name="firstname" value={regData.firstname} onChange={handleRegChange} required className="w-full p-3 border rounded-xl" /></div>
                          <div><label className="block text-sm font-medium mb-1">Child Last Name</label><input type="text" name="lastname" value={regData.lastname} onChange={handleRegChange} required className="w-full p-3 border rounded-xl" /></div>
                          <div><label className="block text-sm font-medium mb-1">Gender</label><select name="gender" value={regData.gender} onChange={handleRegChange} className="w-full p-3 border rounded-xl"><option value="male">Male</option><option value="female">Female</option></select></div>
                          <div><label className="block text-sm font-medium mb-1">Date of Birth</label><input type="date" name="birth_date" value={regData.birth_date} onChange={handleRegChange} required className="w-full p-3 border rounded-xl" /></div>
                          <div><label className="block text-sm font-medium mb-1">Place of Birth</label><input type="text" name="birthplace" value={regData.birthplace} onChange={handleRegChange} required className="w-full p-3 border rounded-xl" /></div>
                          <div><label className="block text-sm font-medium mb-1">Hospital Evidence</label><input type="file" accept="image/*,.pdf" onChange={(e) => setRegFile(e.target.files[0])} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-rose-100 file:text-rose-700" /></div>
                        </div>
                      )}
                    </>
                  )}

                  {needsMarriageRegistration && backendData?.resident?.marital_status === 'single' && (
                    <>
                      {!showMarriageForm ? (
                        <div className="text-center py-4">
                          <h3 className="text-lg font-semibold mb-2">No marriage record exists.</h3>
                          <p className="text-sm text-slate-700 mb-6">Would you like to register a marriage?</p>
                          <button type="button" onClick={() => setShowMarriageForm(true)} className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2 rounded-xl font-medium">Yes, Register Marriage</button>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          <h3 className="text-lg font-semibold mb-2">Marriage Registration</h3>
                          <div><label className="block text-sm font-medium mb-1">Spouse Resident ID</label><input type="number" name="spouse_id" value={regData.spouse_id} onChange={handleRegChange} required className="w-full p-3 border rounded-xl" /></div>
                          <div><label className="block text-sm font-medium mb-1">Marriage Date</label><input type="date" name="marriage_date" value={regData.marriage_date} onChange={handleRegChange} required className="w-full p-3 border rounded-xl" /></div>
                          <div><label className="block text-sm font-medium mb-1">Marriage Place</label><input type="text" name="marriage_place" value={regData.marriage_place} onChange={handleRegChange} required className="w-full p-3 border rounded-xl" /></div>
                        </div>
                      )}
                    </>
                  )}

                  {needsDeathRegistration && (
                    <div className="grid gap-4">
                      <div><label className="block text-sm font-medium mb-1">Deceased Person Resident ID</label><input type="number" name="deceased_person_id" value={regData.deceased_person_id} onChange={handleRegChange} required className="w-full p-3 border rounded-xl" /></div>
                      <div><label className="block text-sm font-medium mb-1">Your Relationship to Deceased</label><input type="text" name="family_relationship_type" value={regData.family_relationship_type} onChange={handleRegChange} required className="w-full p-3 border rounded-xl" /></div>
                      <div><label className="block text-sm font-medium mb-1">Date of Death</label><input type="date" name="date_of_death" value={regData.date_of_death} onChange={handleRegChange} required className="w-full p-3 border rounded-xl" /></div>
                      <div><label className="block text-sm font-medium mb-1">Cause of Death</label><input type="text" name="cause_of_death" value={regData.cause_of_death} onChange={handleRegChange} required className="w-full p-3 border rounded-xl" /></div>
                      <div><label className="block text-sm font-medium mb-1">Place of Death</label><input type="text" name="place_of_death" value={regData.place_of_death} onChange={handleRegChange} required className="w-full p-3 border rounded-xl" /></div>
                      <div><label className="block text-sm font-medium mb-1">Evidence Document</label><input type="file" accept="image/*,.pdf" onChange={(e) => setRegFile(e.target.files[0])} required className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-rose-100 file:text-rose-700" /></div>
                    </div>
                  )}
                </div>
                <button type="submit" disabled={loading} className="w-full bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-2xl font-semibold text-lg transition">
                  {loading ? 'Submitting Registration...' : 'Register Details'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
                  <div className="space-y-6">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                      <h2 className="text-xl font-semibold mb-4">Applicant information</h2>
                      <div className="space-y-3">
                        {previewData.summaryFields.map((item) => (
                          <div key={item.label} className="flex justify-between gap-3">
                            <span className="text-sm text-slate-600">{item.label}</span>
                            <span className="font-medium text-slate-900">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {type === 'birth' && applicationFor === 'child' && backendData.children?.length > 0 && (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                        <h2 className="text-xl font-semibold mb-4">Select child</h2>
                        <select
                          value={selectedChildId || ''}
                          onChange={(e) => setSelectedChildId(Number(e.target.value) || backendData.children[0]?.id)}
                          className="w-full p-4 border rounded-2xl"
                        >
                          {backendData.children.map((child) => (
                            <option key={child.id} value={child.id}>
                              {child.firstname} {child.lastname} - Born {formatDate(child.birth_date)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {type === 'death' && backendData.deathReports?.length > 0 && (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                        <h2 className="text-xl font-semibold mb-4">Select deceased person</h2>
                        <select
                          value={selectedDeceasedId || ''}
                          onChange={(e) => setSelectedDeceasedId(Number(e.target.value) || backendData.deathReports[0]?.id)}
                          className="w-full p-4 border rounded-2xl"
                        >
                          {backendData.deathReports.map((report) => {
                            const deceased = backendData.deceasedPeople?.find(p => p.id === report.deceased_person_id);
                            return (
                              <option key={report.id} value={report.id}>
                                {deceased?.firstname} {deceased?.lastname} - {formatDate(report.date_of_death)}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}

                    <div className="rounded-3xl border border-slate-200 p-6">
                      <h2 className="text-xl font-semibold mb-4">Certificate preview</h2>
                      <div className="space-y-3">
                        {previewData.previewFields.map((field) => (
                          <div key={field.key} className="flex justify-between gap-3">
                            <span className="text-sm text-slate-600">{field.label}</span>
                            <span className={`font-medium ${field.value ? 'text-slate-900' : 'text-rose-700'}`}>
                              {field.value || 'Missing information'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className={`rounded-3xl border p-5 ${previewData.hasMissing ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`}>
                      <h2 className="text-lg font-semibold mb-3">
                        {previewData.hasMissing ? 'Missing required data' : 'All required data is ready'}
                      </h2>
                      <p className="text-sm text-slate-700">
                        {previewData.hasMissing
                          ? 'Please fill in any remaining missing fields or uploads.'
                          : 'Your certificate preview is complete. Confirm and apply to submit.'}
                      </p>
                    </div>

                    <div className="rounded-3xl border border-slate-200 p-5">
                      <h2 className="text-lg font-semibold mb-4">Required uploads</h2>
                      <div className="space-y-4">
                        {previewData.uploadFields.map((file) => (
                          <div key={file.name} className="space-y-2">
                            <label className="block text-sm font-medium">{file.label}</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange(file.name)}
                              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-900 hover:file:bg-slate-200"
                            />
                            <p className="text-xs text-slate-500">{file.description}{file.required ? ' Required.' : ' Optional.'}</p>
                            {formData[file.name] && (
                              <p className="text-xs text-slate-700 mt-1">Selected file: {formData[file.name].name}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {previewData.hasMissing && (
                  <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
                    <h3 className="text-lg font-semibold mb-4">Provide additional details</h3>
                    <div className="grid gap-4">
                      {previewData.missingFields.map(field => {
                        const inputType = field.key.toLowerCase().includes('date') ? 'date' : 'text';
                        return (
                          <div key={field.key}>
                            <label className="block text-sm font-medium mb-2">{field.label}</label>
                            <input
                              type={inputType}
                              name={field.key}
                              value={formData[field.key] || ''}
                              onChange={handleChange}
                              required={field.required}
                              placeholder={field.label}
                              className="w-full p-4 border rounded-2xl"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <h2 className="text-lg font-semibold mb-3">Review before submission</h2>
                  <p className="text-sm text-slate-700">Review the preview above and confirm that all data is correct. The system will submit the certificate request using your profile data and any additional details you provided.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Upload Supporting Documents</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400">
                    <input type="file" multiple accept="image/*,.pdf" onChange={addDocumentFiles} className="hidden" id="docs" />
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
                  {loading ? 'Submitting...' : 'Confirm and Apply'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyCertificate;
