import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import * as supplierService from '@/lib/supplier/service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const suppliers = await supplierService.listSuppliers({
      status: status as any,
      supplierType: type as any,
      limit,
      offset,
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('Error listing suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to list suppliers' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    const supplier = await supplierService.registerSupplier({
      supplierCode: data.supplierCode,
      name: data.name,
      supplierType: data.supplierType,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,
      address: data.address,
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error('Error registering supplier:', error);
    return NextResponse.json(
      { error: 'Failed to register supplier' },
      { status: 500 }
    );
  }
}
