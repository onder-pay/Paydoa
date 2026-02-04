# Paydos CRM - Yeni Özellikler Planı

## Mevcut Durum (Son Çalışan Build - 11:09)
✅ Geri butonu çalışıyor
✅ Vize türleri doğru
✅ Schengen sınırsız
✅ Pasaport formatı
✅ Yeşil Pasaport kartı
✅ PDF Türkçe karakter
✅ İngiltere düzeltmesi

## Eklenecek Özellikler (Öncelik Sırasıyla)

### 1. İngiltere Vize Türleri
- [ ] 5 özel vize türü ekle
- [ ] Turistik
- [ ] Ticari (fuar, toplantı)
- [ ] Aile / arkadaş ziyareti
- [ ] Öğrenci vizesi
- [ ] Kısa Süreli Eğitim Vizesi

### 2. Rusya Vize Türleri
- [ ] 7 vize türü ekle
- [ ] 1 Girişli Turistik E Vize (1 ay)
- [ ] 1 Girişli Turistik Vize (3 ay)
- [ ] 2 Girişli Turistik Vize (3 ay)
- [ ] Çok Girişli Turistik Vize (6 ay)
- [ ] 1 Girişli Özel Ziyaret Vizesi (3 ay)
- [ ] 1 Girişli Ticari Vize (3 ay)
- [ ] 1 Girişli Teknik Vize (3 ay)

### 3. BAE Güncellemeleri
- [ ] Ülke: Sadece "Birleşik Arap Emirlikleri" (Dubai/Abu Dabi kaldır)
- [ ] 4 yeni vize türü:
  - [ ] 30 Gün Tek Girişli Vize
  - [ ] 30 Gün Çok Girişli Vize
  - [ ] 90 Gün Tek Girişli Vize
  - [ ] 90 Gün Çok Girişli Vize
- [ ] İşlem Hızı alanı ekle:
  - [ ] Normal Başvuru
  - [ ] Hızlı Başvuru (48 Saat)
  - [ ] Çok Hızlı (24 Saat)

### 4. Ödeme Durumu Basitleştirme
- [ ] "Kısmi Ödendi" kaldır
- [ ] Sadece: Ödenmedi, Ödendi
- [ ] Label: "Vize Ücreti"

## Strateji

1. **Önce Syntax Hatasını Çöz**
   - Fresh start ile yeni App.jsx oluştur
   - Veya son çalışan kaynağı bul

2. **Tek Tek Ekle ve Test Et**
   - Her özelliği ayrı commit gibi ekle
   - Her ekleme sonrası build test et
   - Hata olursa hemen geri al

3. **Deploy**
   - Tüm özellikler çalışınca deploy et
