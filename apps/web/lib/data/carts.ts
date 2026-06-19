import { sdk } from "../medusa/config";
import { getAuthHeaders, getCacheHeaders, getCartId } from "./cookies";

export async function retrieveCart(id?: string) {
  const cartId = (id || (await getCartId())) as any

  const { cart } = await sdk.store.cart.retrieve(
    cartId,
    {
      fields:
        "+metadata, +items.*, +items.thumbnail, +items.title, +items.quantity, +items.total, +items.variant",
    },
    {
      ...(await getAuthHeaders()),
      ...(await getCacheHeaders("carts")),
    }
  );

  return cart;
}
