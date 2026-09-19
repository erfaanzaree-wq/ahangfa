# سیستم اعلان آهنگ جدید | نیو ترانه

این پوشه سیستم نوتیفیکیشن وبلاگ [نیو ترانه](https://newtaraneh.blogfa.com/) را نگه می‌دارد.

## چطور کار می‌کند؟

1. **GitHub Action** هر ۳۰ دقیقه صفحه وبلاگ را چک می‌کند.
2. اگر پست (آهنگ) جدید باشد، پیام به توپیک **ntfy** با نام `newtaraneh-songs` ارسال می‌شود.
3. کاربران با اپ یا وب ntfy (و صفحه فعال‌سازی) نوتیف می‌گیرند.

## لینک‌ها

| مورد | آدرس |
|------|------|
| صفحه فعال‌سازی | https://erfaanzaree-wq.github.io/ahangfa/notify/ |
| توپیک ntfy | https://ntfy.sh/newtaraneh-songs |
| وبلاگ | https://newtaraneh.blogfa.com/ |
| تلگرام | https://t.me/NewTaraneh |

## برای کاربران

### موبایل (پیشنهادی)
1. اپ [ntfy](https://ntfy.sh) را نصب کنید (اندروید / iOS).
2. Subscribe به توپیک: `newtaraneh-songs`

### مرورگر دسکتاپ
1. به صفحه فعال‌سازی بروید.
2. روی «فعال‌سازی اعلان مرورگر» بزنید.
3. برای نوتیف وقتی مرورگر بسته است، همان توپیک ntfy را هم Subscribe کنید.

## برای شما (مدیر)

- Action به‌صورت خودکار در تب Actions ریپو اجرا می‌شود.
- می‌توانید دستی هم از Actions → New Song Notify → Run workflow اجرا کنید.
- اگر توپیک را خصوصی کردید، در Settings → Secrets یک secret به نام `NTFY_TOKEN` بگذارید.

## محدودیت مهم بلاگفا

Service Worker فقط روی دامنه خودش کار می‌کند. به‌خاطر همین نوتیف پس‌زمینه پایدار از طریق **ntfy** انجام می‌شود، نه مستقیم روی `blogfa.com`.

## افزودن دکمه در قالب بلاگفا (اختیاری)

```html
<a href="https://erfaanzaree-wq.github.io/ahangfa/notify/" target="_blank" rel="noopener"
   style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:9999px;background:#0ea5e9;color:#fff;font-weight:700;text-decoration:none;font-size:0.8rem">
  🔔 اعلان آهنگ جدید
</a>
```
