import { NextRequest, NextResponse } from 'next/server';
import { createSign } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { data } = await req.json();
  const privateKey = process.env.QZ_PRIVATE_KEY;

  if (!privateKey) {
    return NextResponse.json({ error: 'QZ private key not configured' }, { status: 500 });
  }

  const sign = createSign('SHA512');
  sign.update(data);
  const signature = sign.sign(privateKey, 'base64');

  return NextResponse.json({ signature });
}
