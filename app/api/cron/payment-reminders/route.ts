import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, getPaymentReminderEmail } from '@/utils/email/service'
import { format, differenceInDays, parseISO } from 'date-fns'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const today = new Date()
        const results = {
            sent: 0,
            failed: 0,
            skipped: 0,
            details: [] as any[],
        }

        // Get active tenants with upcoming due dates
        const { data: tenants, error } = await supabase
            .from('tenants')
            .select(`
        id,
        name,
        email,
        due_date,
        rooms (
          room_number,
          price
        )
      `)
            .eq('status', 'active')
            .not('email', 'is', null)

        if (error) {
            console.error('Error fetching tenants:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        if (!tenants || tenants.length === 0) {
            return NextResponse.json({
                message: 'No active tenants with email found',
                results,
            })
        }

        // Process each tenant
        for (const tenant of tenants) {
            if (!tenant.email || !tenant.due_date) {
                results.skipped++
                continue
            }

            const dueDate = parseISO(tenant.due_date)
            const daysUntilDue = differenceInDays(dueDate, today)

            // Send reminder on H-7, H-3, H-1, and H-day
            const shouldSendReminder =
                daysUntilDue === 7 ||
                daysUntilDue === 3 ||
                daysUntilDue === 1 ||
                daysUntilDue === 0

            if (!shouldSendReminder) {
                results.skipped++
                continue
            }

            // Check if payment already exists for current month
            const currentMonth = format(today, 'yyyy-MM')
            const { data: existingPayment } = await supabase
                .from('payments')
                .select('id, status')
                .eq('tenant_id', tenant.id)
                .eq('month', currentMonth)
                .single()

            // Skip if payment is already verified
            if (existingPayment?.status === 'verified') {
                results.skipped++
                continue
            }

            // Send reminder email
            try {
                const emailHtml = getPaymentReminderEmail({
                    name: tenant.name,
                    room_number: (tenant.rooms as any)?.room_number || 'N/A',
                    amount: (tenant.rooms as any)?.price || 0,
                    due_date: format(dueDate, 'dd MMMM yyyy'),
                    days_until_due: daysUntilDue,
                })

                let subject = 'Pengingat Pembayaran Home72'
                if (daysUntilDue === 0) {
                    subject = 'Hari Ini Jatuh Tempo Pembayaran Kamar Home72'
                }

                const result = await sendEmail({
                    to: tenant.email,
                    subject,
                    html: emailHtml,
                })

                if (result.success) {
                    results.sent++
                    results.details.push({
                        tenant: tenant.name,
                        email: tenant.email,
                        daysUntilDue,
                        status: 'sent',
                    })
                } else {
                    results.failed++
                    results.details.push({
                        tenant: tenant.name,
                        email: tenant.email,
                        daysUntilDue,
                        status: 'failed',
                        error: result.error,
                    })
                }
            } catch (error: any) {
                console.error(`Error sending email to ${tenant.email}:`, error)
                results.failed++
                results.details.push({
                    tenant: tenant.name,
                    email: tenant.email,
                    daysUntilDue,
                    status: 'failed',
                    error: error.message,
                })
            }
        }

        return NextResponse.json({
            message: 'Payment reminders processed',
            results,
            timestamp: new Date().toISOString(),
        })
    } catch (error: any) {
        console.error('Error in payment reminders cron:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
