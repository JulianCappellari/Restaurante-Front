import { getMenuById } from "@/actions/menu/get-menu-by-id";
import ProductDetails from "@/components/menu/FoodCardParticular";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductPage({ params }: Props) {
  const { id: rawId } = await params;
  const id = Number(rawId);

  if (!Number.isFinite(id)) {
    notFound();
  }

  const menu = await getMenuById(id);

  if (!menu) {
    notFound();
  }

  return <ProductDetails menu={menu} />;
}
