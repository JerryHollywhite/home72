import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

type EmailTemplate = {
    to: string
    subject: string
    html: string
}

export async function sendEmail({ to, subject, html }: EmailTemplate) {
    try {
        const data = await resend.emails.send({
            from: 'Home72 <noreply@home72.otomasikan.com>',
            to: [to],
            subject,
            html,
        })

        console.log('Email sent successfully:', data)
        return { success: true, data }
    } catch (error) {
        console.error('Error sending email:', error)
        return { success: false, error }
    }
}

// Email Templates

export function getPaymentReminderEmail(data: {
    name: string
    room_number: string
    amount: number
    due_date: string
    days_until_due: number
}) {
    const { name, room_number, amount, due_date, days_until_due } = data

    let message = ''
    if (days_until_due === 0) {
        message = `Hari ini adalah tanggal jatuh tempo pembayaran Anda.`
    } else {
        message = `Pembayaran Anda akan jatuh tempo dalam ${days_until_due} hari.`
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🏠 Home72</h1>
          <p style="margin: 10px 0 0 0;">Pengingat Pembayaran</p>
        </div>
        <div class="content">
          <p>Halo <strong>${name}</strong>,</p>
          <p>${message}</p>
          
          <div class="highlight">
            <table style="width: 100%;">
              <tr>
                <td><strong>Kamar:</strong></td>
                <td>${room_number}</td>
              </tr>
              <tr>
                <td><strong>Jumlah:</strong></td>
                <td>Rp ${amount.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td><strong>Jatuh Tempo:</strong></td>
                <td>${due_date}</td>
              </tr>
            </table>
          </div>

          <p>Mohon segera lakukan pembayaran dan upload bukti transfer melalui sistem Home72.</p>
          <p>Terima kasih atas perhatian Anda.</p>
          
          <div class="footer">
            <p><strong>Home72</strong></p>
            <p>Sistem Manajemen Kosan</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

export function getPaymentVerifiedEmail(data: {
    name: string
    room_number: string
    amount: number
    month: string
}) {
    const { name, room_number, amount, month } = data

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">✅ Pembayaran Terverifikasi</h1>
        </div>
        <div class="content">
          <p>Halo <strong>${name}</strong>,</p>
          <p>Pembayaran Anda telah berhasil diverifikasi!</p>
          
          <div class="highlight">
            <table style="width: 100%;">
              <tr>
                <td><strong>Kamar:</strong></td>
                <td>${room_number}</td>
              </tr>
              <tr>
                <td><strong>Bulan:</strong></td>
                <td>${month}</td>
              </tr>
              <tr>
                <td><strong>Jumlah:</strong></td>
                <td>Rp ${amount.toLocaleString('id-ID')}</td>
              </tr>
            </table>
          </div>

          <p>Terima kasih atas pembayaran tepat waktu Anda.</p>
          
          <div class="footer">
            <p><strong>Home72</strong></p>
            <p>Sistem Manajemen Kosan</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}
