import { InfiniteMovingCards } from "./infinite-moving-cards";

export function InfiniteMovingCardsDemo() {
  return (
    <div
      className="h-[20rem] rounded-md flex flex-col antialiased 
     bg-white 
     items-center justify-center relative overflow-hidden"
    >
      <InfiniteMovingCards
        items={testimonials}
        direction="left"
        speed="medium"
      />
    </div>
  );
}

const testimonials = [
  {
    quote:
      "Este asado es de otro planeta. Se nota que lo hacen con tiempo y cariño, la carne se deshace en la boca. Volvería mil veces!",
    name: "Carlos Gómez",
  },
  {
    quote:
      "Las empanadas de carne cortada a cuchillo son un manjar. No sé cómo las hacen, pero son perfectas con un buen vinito tinto.",
    name: "Lucía Álvarez",
  },
  {
    quote:
      "La milanesa napolitana con papas fritas es como la hacía la abuela, con esa cantidad justa de queso gratinado y salsa casera! El mejor lugar del barrio.",
    name: "Mariano Martínez",
  },
  {
    quote:
      "Las pastas acá tienen gusto a domingo en casa, y la salsa boloñesa es insuperable! Lo mejor es pedir la especial de la casa.",
    name: "Patricia Fernández",
  },
  {
    quote:
      "Me pedí una fugazzeta rellena y creo que no vuelvo a comer pizza en otro lado. Masa a punto, queso a montones... Un lujo!",
    name: "Gustavo López",
  },
];
