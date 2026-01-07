import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkPermission, PermissionLevel } from '@/lib/permission-middleware';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/qms/metrics
 * List compliance metrics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!checkPermission(session, 'quality', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    // Build filter
    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (isActive !== null) where.isActive = isActive === 'true';

    // Fetch metrics with recent history
    const metrics = await prisma.complianceMetric.findMany({
      where,
      include: {
        history: {
          orderBy: { calculatedAt: 'desc' },
          take: 5, // Last 5 history entries
        },
      },
      orderBy: { category: 'asc' },
    });

    return NextResponse.json({ data: metrics });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/qms/metrics
 * Create new metric definition
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!checkPermission(session, 'quality', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      currentValue,
      targetValue,
      unit,
      category,
      formula,
    } = body;

    // Validate required fields
    if (!name || currentValue === undefined || !targetValue || !unit) {
      return NextResponse.json(
        {
          error: 'name, currentValue, targetValue, and unit are required',
        },
        { status: 400 }
      );
    }

    // Check for duplicate metric name
    const existing = await prisma.complianceMetric.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Metric with this name already exists' },
        { status: 400 }
      );
    }

    // Create metric
    const metric = await prisma.complianceMetric.create({
      data: {
        name,
        description: description || null,
        currentValue: parseFloat(String(currentValue)),
        targetValue: parseFloat(String(targetValue)),
        unit,
        category: category || 'GENERAL',
        formula: formula || null,
      },
      include: {
        history: true,
      },
    });

    // Create initial history entry
    await prisma.complianceMetricHistory.create({
      data: {
        metricId: metric.id,
        value: parseFloat(String(currentValue)),
      },
    });

    return NextResponse.json({ data: metric }, { status: 201 });
  } catch (error) {
    console.error('Error creating metric:', error);
    return NextResponse.json(
      { error: 'Failed to create metric' },
      { status: 500 }
    );
  }
}
