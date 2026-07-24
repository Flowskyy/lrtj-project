import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.news.findUnique({
    where: { id: parseInt(id) },
  });

  if (!item) {
    return NextResponse.json({ error: 'News not found' }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();
  const updatedItem = await prisma.news.update({
    where: { id: parseInt(id) },
    data: {
      title: data.title,
      title_en: data.title_en,
      content: data.content,
      content_en: data.content_en,
      img_url: data.img_url,
      caption_image: data.caption_image,
      type: data.type,
      status: data.status,
      publish_date: data.publish_date ? new Date(data.publish_date) : undefined,
      updated_at: new Date(),
    },
  });

  return NextResponse.json(updatedItem);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.news.delete({
    where: { id: parseInt(id) },
  });

  return NextResponse.json({ message: 'News deleted' });
}
