import { NextResponse } from 'next/server';
import PaytmChecksum from 'paytmchecksum';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const data: any = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    const mkey = process.env.PAYTM_MERCHANT_KEY || '';
    const paytmChecksum = data.CHECKSUMHASH || '';
    delete data.CHECKSUMHASH;

    const isVerifySignature = PaytmChecksum.verifySignature(data, mkey, paytmChecksum);

    if (isVerifySignature) {
      if (data.STATUS === 'TXN_SUCCESS') {
        const orderId = data.ORDERID || '';
        const admissionIdStr = orderId.split('_')[0].replace('ADM', '');
        const admissionId = parseInt(admissionIdStr);

        if (!isNaN(admissionId)) {
          // Record payment in DB
          const count = await prisma.payment.count();
          const receiptNo = `RCP_ONL_${new Date().getFullYear()}${String(count + 1).padStart(5, '0')}`;

          await prisma.payment.create({
            data: {
              admissionId: admissionId,
              amount: parseFloat(data.TXNAMOUNT),
              paymentDate: new Date().toISOString().split('T')[0],
              paymentMode: 'online_paytm',
              receiptNo: receiptNo,
              reference: data.TXNID,
              notes: `Paytm Transaction ID: ${data.TXNID}`,
            }
          });
        }

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/student?payment=success`, 303);
      } else {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/student?payment=failed`, 303);
      }
    } else {
      return NextResponse.json({ error: 'Checksum mismatch' }, { status: 400 });
    }

  } catch (error) {
    console.error('Paytm callback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
