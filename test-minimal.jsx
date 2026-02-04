import React, { useState } from 'react';

const TestComponent = () => {
  const [formData, setFormData] = useState({});
  const selectedCategory = { id: 'test', durations: ['6 Ay', '2 Yıl'] };
  const visaTypes = ['Ticari', 'Turistik'];
  
  return (
    <div>
      {selectedCategory?.id === 'usa' ? (
        <div>
          <select>
            <option value="">Seçin</option>
          </select>
        </div>
      ) : selectedCategory && (
        <div>
          <div>
            {visaTypes.map(t => (
              <button key={t}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedCategory?.durations && (
        <div>
          <div>
            {selectedCategory.durations.map(d => (
              <button key={d}>
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Başvuru Tarihi */}
      <div>
        <input type="date" />
      </div>
    </div>
  );
};

export default TestComponent;
