// Sorunlu bölümü test et
const test = () => {
  return (
    <div>
      {formStep === 'details' && selectedCategory && (
        <div>
          {/* Vize Süresi */}
          {selectedCategory?.durations && (
            <div>
              <label>Vize Süresi</label>
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
            <div>
              <label>Başvuru Tarihi</label>
              <input type="date" />
            </div>
          </div>

          {/* Randevu Tarihi */}
          <div>
            <div>
              <label>Randevu Tarihi</label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
