import { prisma } from "@/lib/prisma";
import ProductDetailClient from "./ProductDetailClient";

export const revalidate = 600;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const products = await prisma.product.findMany({
      where: {
        is_active: true,
        variants: {
          some: {
            is_active: true,
            stock_online: { gt: 0 },
          },
        },
      },
      select: { id: true },
      take: 100,
    });

    return products.map((p) => ({
      id: p.id,
    }));
  } catch {
    return [];
  }
}

export default function ProductDetailPage() {
  return <ProductDetailClient />;
}
