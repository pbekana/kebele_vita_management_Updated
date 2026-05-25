import re
import os

path = '/home/peter/LintMintData/Downloads/kebele-vital-management-system-main/frontend/src/Pages/Apply/ApplyCertificate.jsx'

with open(path, 'r') as f:
    content = f.read()

# 1. Add useEffect
content = content.replace(
    "import { useState } from 'react';",
    "import { useState, useEffect } from 'react';"
)

# 2. Add state and fetch profile
hook_injection = """
  const [userProfile, setUserProfile] = useState(null);
  const [autoFilledFields, setAutoFilledFields] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/residents/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserProfile(res.data.profile);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!userProfile) return;
    const newFormData = { ...formData };
    const filled = [];
    
    // Helper to format date safely
    const formatDate = (dateString) => {
      if (!dateString) return "";
      return dateString.split('T')[0];
    };

    const fullName = `${userProfile.firstname || ''} ${userProfile.lastname || ''}`.trim();
    const phone = userProfile.phone_number || "";

    if (type === 'birth') {
      if (applicationFor === 'myself') {
        if (fullName) { newFormData.fullName = fullName; filled.push('fullName'); }
        if (userProfile.birth_date) { newFormData.birthDate = formatDate(userProfile.birth_date); filled.push('birthDate'); }
        if (userProfile.birthplace) { newFormData.birthPlace = userProfile.birthplace; filled.push('birthPlace'); }
      } else if (applicationFor === 'child') {
        if (userProfile.gender?.toLowerCase() === 'female') {
          newFormData.motherName = fullName;
          filled.push('motherName');
        } else if (userProfile.gender?.toLowerCase() === 'male') {
          newFormData.fatherName = fullName;
          filled.push('fatherName');
        }
      }
    } else if (type === 'marriage') {
      if (userProfile.gender?.toLowerCase() === 'male') {
        newFormData.husbandName = fullName; filled.push('husbandName');
        if (userProfile.birth_date) { newFormData.husbandBirthDate = formatDate(userProfile.birth_date); filled.push('husbandBirthDate'); }
        if (userProfile.birthplace) { newFormData.husbandBirthPlace = userProfile.birthplace; filled.push('husbandBirthPlace'); }
      } else if (userProfile.gender?.toLowerCase() === 'female') {
        newFormData.wifeName = fullName; filled.push('wifeName');
        if (userProfile.birth_date) { newFormData.wifeBirthDate = formatDate(userProfile.birth_date); filled.push('wifeBirthDate'); }
        if (userProfile.birthplace) { newFormData.wifeBirthPlace = userProfile.birthplace; filled.push('wifeBirthPlace'); }
      }
    } else if (type === 'residency-id' || type === 'residency') {
      if (fullName) { newFormData.fullName = fullName; filled.push('fullName'); }
    }

    if (phone) { newFormData.phone = phone; filled.push('phone'); }

    setFormData(newFormData);
    setAutoFilledFields(filled);
  }, [userProfile, applicationFor, type]);
"""

content = content.replace("const { notifySuccess, notifyError } = useNotification();", "const { notifySuccess, notifyError } = useNotification();\n" + hook_injection)

# Now, we need to hide auto-filled fields and show a summary.
# Let's replace the form inputs with conditional rendering.

def hide_input(field_name, label_text, input_html):
    # If the field is in autoFilledFields, we don't render the input, but we might want to render a read-only div instead.
    # Actually, the user asked to "only display additional inputs if information required for that specific certificate is missing from the user's profile."
    # Let's just wrap the input div with `{!autoFilledFields.includes('fieldName') && ( ... )}`
    pass

# We will just write a function to wrap divs containing a specific name="..." with a check
import re

# Find all blocks of `<div>...<input name="fieldName"...>...</div>`
# It's safer to just do simple replacements.

replacements = [
    (
        '''<div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                </div>''',
        '''{!autoFilledFields.includes('fullName') && (
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                </div>
                )}'''
    ),
    (
        '''<div>
                      <label className="block text-sm font-medium mb-2">Mother's Full Name</label>
                      <input type="text" name="motherName" value={formData.motherName} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                    </div>''',
        '''{!autoFilledFields.includes('motherName') && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Mother's Full Name</label>
                      <input type="text" name="motherName" value={formData.motherName} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                    </div>
                    )}'''
    ),
    (
        '''<div>
                      <label className="block text-sm font-medium mb-2">Father's Full Name</label>
                      <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                    </div>''',
        '''{!autoFilledFields.includes('fatherName') && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Father's Full Name</label>
                      <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                    </div>
                    )}'''
    ),
    (
        '''<div>
                    <label className="block text-sm font-medium mb-2">Your Full Name</label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                  </div>''',
        '''{!autoFilledFields.includes('fullName') && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Your Full Name</label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                  </div>
                  )}'''
    ),
    (
        '''<div>
                    <label className="block text-sm font-medium mb-2">Date of Birth</label>
                    <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                  </div>''',
        '''{!autoFilledFields.includes('birthDate') && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Date of Birth</label>
                    <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                  </div>
                  )}'''
    ),
    (
        '''<div>
                    <label className="block text-sm font-medium mb-2">Place of Birth</label>
                    <input type="text" name="birthPlace" value={formData.birthPlace} onChange={handleChange} required className="w-full p-4 border rounded-2xl" placeholder="Jimma, Ethiopia" />
                  </div>''',
        '''{!autoFilledFields.includes('birthPlace') && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Place of Birth</label>
                    <input type="text" name="birthPlace" value={formData.birthPlace} onChange={handleChange} required className="w-full p-4 border rounded-2xl" placeholder="Jimma, Ethiopia" />
                  </div>
                  )}'''
    ),
    (
        '''<div>
                  <label className="block text-sm font-medium mb-2">Husband's Full Name</label>
                  <input type="text" name="husbandName" value={formData.husbandName} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                </div>''',
        '''{!autoFilledFields.includes('husbandName') && (
                <div>
                  <label className="block text-sm font-medium mb-2">Husband's Full Name</label>
                  <input type="text" name="husbandName" value={formData.husbandName} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                </div>
                )}'''
    ),
    (
        '''<div>
                  <label className="block text-sm font-medium mb-2">Wife's Full Name</label>
                  <input type="text" name="wifeName" value={formData.wifeName} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                </div>''',
        '''{!autoFilledFields.includes('wifeName') && (
                <div>
                  <label className="block text-sm font-medium mb-2">Wife's Full Name</label>
                  <input type="text" name="wifeName" value={formData.wifeName} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
                </div>
                )}'''
    ),
    (
        '''<div>
                    <label className="block text-sm font-medium mb-2">Husband Birth Date</label>
                    <input type="date" name="husbandBirthDate" value={formData.husbandBirthDate} onChange={handleChange} className="w-full p-4 border rounded-2xl" />
                  </div>''',
        '''{!autoFilledFields.includes('husbandBirthDate') && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Husband Birth Date</label>
                    <input type="date" name="husbandBirthDate" value={formData.husbandBirthDate} onChange={handleChange} className="w-full p-4 border rounded-2xl" />
                  </div>
                  )}'''
    ),
    (
        '''<div>
                    <label className="block text-sm font-medium mb-2">Husband Birth Place</label>
                    <input type="text" name="husbandBirthPlace" value={formData.husbandBirthPlace} onChange={handleChange} className="w-full p-4 border rounded-2xl" />
                  </div>''',
        '''{!autoFilledFields.includes('husbandBirthPlace') && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Husband Birth Place</label>
                    <input type="text" name="husbandBirthPlace" value={formData.husbandBirthPlace} onChange={handleChange} className="w-full p-4 border rounded-2xl" />
                  </div>
                  )}'''
    ),
    (
        '''<div>
                    <label className="block text-sm font-medium mb-2">Wife Birth Date</label>
                    <input type="date" name="wifeBirthDate" value={formData.wifeBirthDate} onChange={handleChange} className="w-full p-4 border rounded-2xl" />
                  </div>''',
        '''{!autoFilledFields.includes('wifeBirthDate') && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Wife Birth Date</label>
                    <input type="date" name="wifeBirthDate" value={formData.wifeBirthDate} onChange={handleChange} className="w-full p-4 border rounded-2xl" />
                  </div>
                  )}'''
    ),
    (
        '''<div>
                    <label className="block text-sm font-medium mb-2">Wife Birth Place</label>
                    <input type="text" name="wifeBirthPlace" value={formData.wifeBirthPlace} onChange={handleChange} className="w-full p-4 border rounded-2xl" />
                  </div>''',
        '''{!autoFilledFields.includes('wifeBirthPlace') && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Wife Birth Place</label>
                    <input type="text" name="wifeBirthPlace" value={formData.wifeBirthPlace} onChange={handleChange} className="w-full p-4 border rounded-2xl" />
                  </div>
                  )}'''
    ),
    (
        '''<div>
                <label className="block text-sm font-medium mb-2">Contact Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
              </div>''',
        '''{!autoFilledFields.includes('phone') && (
              <div>
                <label className="block text-sm font-medium mb-2">Contact Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full p-4 border rounded-2xl" />
              </div>
              )}'''
    ),
]

for old, new in replacements:
    content = content.replace(old, new)


# Add an Auto-filled Summary Box at the top of the form
summary_box = """
            {autoFilledFields.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-2xl mb-6">
                <h3 className="font-semibold mb-2">Auto-populated from your profile:</h3>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {autoFilledFields.map(field => (
                    <li key={field}>
                      <span className="font-medium capitalize">{field.replace(/([A-Z])/g, ' $1')}</span>: {formData[field]}
                    </li>
                  ))}
                </ul>
              </div>
            )}
"""

content = content.replace("<form onSubmit={handleSubmit} className=\"p-8 space-y-6\">", "<form onSubmit={handleSubmit} className=\"p-8 space-y-6\">\n" + summary_box)


with open(path, 'w') as f:
    f.write(content)

print("Done")
