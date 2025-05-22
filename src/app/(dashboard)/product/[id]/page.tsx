// app/producto/[id]/page.tsx
import { getMenuById } from "@/actions/menu/get-menu-by-id";
import ProductDetails from "@/components/menu/FoodCardParticular";

import { IMenu } from "@/interfaces";

interface Props {
  params: {
    id: string;
  };
}

export default async function ProductPage({ params }: Props) {
  const id = Number(params.id);
  const menu: IMenu = await getMenuById(id);

  return <ProductDetails menu={menu} />;
}
