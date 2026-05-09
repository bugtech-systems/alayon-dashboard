"use client";

import { useEffect, useState } from "react";
import { retrieveRestaurant } from "@/lib/data";
import { Container, Heading, Text } from "@medusajs/ui";
import Image from "next/image";
import { useCart } from "@/lib/context/cart-context";
import { convertToLocale } from "@/lib/medusa/util/money";

export function OrderSummary() {
    const { cart } = useCart();
    const [restaurant, setRestaurant] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRestaurant = async () => {
            if (cart?.metadata?.restaurant_id) {
                const restaurantData = await retrieveRestaurant(
                    cart.metadata.restaurant_id as string
                );
                setRestaurant(restaurantData);
                setLoading(false);
            }
        };

        fetchRestaurant();
        setLoading(false);

    }, [cart?.metadata?.restaurant_id]);

    if (loading) {
        return (
            <Container className="flex flex-col gap-4">
                <Heading level="h2" className="text-lg font-semibold text-ui-fg-base text-center">
                    Loading your order...
                </Heading>
            </Container>
        );
    }

    if (!cart) {
        return (
            <Container className="flex flex-col gap-4">
                <Heading level="h2" className="text-lg font-semibold text-ui-fg-base text-center">
                    Cart not found
                </Heading>
            </Container>
        );
    }


    console.log(cart, 'CARTT')
    return (
        <Container className="flex flex-col gap-4">
            <Heading
                level="h2"
                className="text-lg font-semibold text-ui-fg-base text-center"
            >
                Your order 
            </Heading>
            <div className="flex gap-4 justify-between flex-wrap">
                {cart?.items?.map((item: any) => {
                    const image = item.thumbnail;
                    return (
                        <div key={item.id} className="flex items-center gap-4">
                            <Image
                                src={image}
                                alt={item.title}
                                className="w-16 h-16 rounded-md"
                                width={64}
                                height={64}
                            />
                            <div className="flex flex-col gap-2base">
                                <Heading level="h3" className="text-sm text-ui-fg-subtle">
                                    {item.title}
                                </Heading>
                                <Text className="text-sm text-ui-fg-subtle">
                                    {item.quantity} x {convertToLocale({ amount: item.unit_price ?? 0, currency_code: cart.currency_code })}
                                </Text>
                            </div>
                        </div>
                    );
                })}
                <div className="w-full border-t border-ui-fg-muted"></div>
                <div className="flex justify-between w-full">
                    <Text className="text-md text-ui-fg-subtle">Order total</Text>
                    <Text className="text-base text-ui-fg-subtle">
                        {convertToLocale({ amount: cart.total ?? 0, currency_code: cart.currency_code })}
                    </Text>
                </div>
            </div>
        </Container>
    );
}