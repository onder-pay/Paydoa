# Satır 2386'daki yorumu taşı
with open('src/App.jsx', 'r') as f:
    lines = f.readlines()

# Satır 2384: )}
# Satır 2385: boş
# Satır 2386: {/* Başvuru */}  ← SORUNLU
# Satır 2387: <div>

# Yorumu satır 2384 ile 2385 arasına taşı
new_lines = lines[:2384] + \
            ["              {/* Başvuru Tarihi ve İşlem */}\n"] + \
            ["              )}\n", "\n"] + \
            lines[2387:]

with open('src/App.jsx', 'w') as f:
    f.writelines(new_lines)

print("Düzeltildi!")
