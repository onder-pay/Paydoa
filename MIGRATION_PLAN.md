# Vize Türü + Fiyat Entegrasyonu

## Değişiklik Planı

### 1. Veri Yapısı Değişikliği
```javascript
// Eski
visaDurations: {
  russia: ["1 Girişli E Vize", "2 Girişli"]
}

// Yeni
visaDurations: {
  russia: [
    {name: "1 Girişli E Vize", price: 250},
    {name: "2 Girişli", price: 350}
  ]
}
```

### 2. Değiştirilecek Yerler

#### A. Ayarlar Modülü (SettingsModule)
- Input alanına fiyat inputu ekle
- Listeleme: name + price göster
- Ekleme: name + price birlikte ekle
- Silme: index'e göre sil (değişmez)

#### B. Vize Formu (VisaModule)
- Butonlarda: `d.name` göster
- onClick: `d.name` ve `d.price` kaydet
- formData'ya: visaDuration + visaPrice ekle

#### C. Vize Listesi
- Gösterim: duration + price
- PDF export: duration + price

#### D. Backward Compatibility
- Eski string array'leri otomatik {name, price: 0} çevir
- localStorage migration

### 3. Uygulama Sırası
1. ✅ Migration fonksiyonu yaz
2. ✅ Ayarlar UI güncelle
3. ✅ Form UI güncelle  
4. ✅ Liste/Card UI güncelle
5. ✅ PDF export güncelle
6. ✅ Test

