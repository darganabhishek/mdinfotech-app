import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PaytmChecksum from 'paytmchecksum';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { admissionId, amount } = await request.json();

    if (!admissionId || !amount) {
      return NextResponse.json({ error: 'Admission ID and amount are required' }, { status: 400 });
    }

    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: { student: true }
    });

    if (!admission) {
      return NextResponse.json({ error: 'Admission not found' }, { status: 404 });
    }

    const orderId = `ADM${admissionId}_ORD${Date.now()}`;
    const mid = process.env.PAYTM_MERCHANT_ID;
    const mkey = process.env.PAYTM_MERCHANT_KEY;
    const website = process.env.PAYTM_WEBSITE;
    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/paytm/callback`;

    const paytmParams: any = {
      body: {
        requestType: "Payment",
        mid: mid,
        websiteName: website,
        orderId: orderId,
        callbackUrl: callbackUrl,
        txnAmount: {
          value: amount.toString(),
          currency: "INR",
        },
        userInfo: {
          custId: admission.student.id.toString(),
          mobile: admission.student.phone || "",
          email: admission.student.email || "",
        },
      },
    };

    const checksum = await PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), mkey);
    paytmParams.head = {
      signature: checksum,
    };

    // Return the necessary data to the frontend to initiate the payment
    return NextResponse.json({
      mid,
      orderId,
      txnToken: "SIMULATED_TOKEN_FOR_NOW", // In a real scenario, you'd call Paytm's initiate API here
      amount,
      callbackUrl,
      checksum,
      // We pass the full params for form submission if using standard checkout
      params: paytmParams.body
    });

  } catch (error) {
    console.error('Paytm initiation error:', error);
    return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 });
  }
}
