# Lovie P2P Payment Request - Kısa Proje Özeti

Bu proje, Lovie assignment'ı için hazırlanmış çalışan bir P2P payment request demosudur.

## Proje Ne Yapıyor?

- Kullanıcı email ile mock olarak giriş yapar
- Başka bir kullanıcıdan email veya telefon ile para isteği oluşturur
- Giden ve gelen para isteklerini ayrı dashboard'larda görür
- İstekleri durumlarına göre filtreler ve arama yapar
- İstek detay sayfasında tutar, not, kullanıcı bilgileri ve kalan süreyi görür
- Gelen bir isteği ödeyebilir veya reddedebilir
- Gönderdiği bekleyen isteği iptal edebilir
- 7 günü geçen istekler otomatik olarak `EXPIRED` olur

## Teknik Yapı

- Backend: `Node.js + Fastify + TypeScript`
- Frontend: `React + Vite + TypeScript`
- Veritabanı: `PostgreSQL`
- Test: `Vitest`

## Önemli Noktalar

- Ödeme akışı gerçek para transferi değil, simülasyondur
- Başarılı ödeme durumunda iki hesabın bakiyesi atomik olarak güncellenir
- Backend ve frontend aynı kontrata göre çalışır
- Proje localde build ve test doğrulamasından geçirilmiştir

## Local Çalıştırma

1. `docker compose up -d db`
2. `npm install`
3. `npm run db:setup`
4. `npm run db:seed`
5. `npm run dev`
6. `frontend` klasöründe `npm install` ve `npm run dev`

Frontend: `http://localhost:5173`  
Backend: `http://localhost:3000`
