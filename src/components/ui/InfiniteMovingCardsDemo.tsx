import { InfiniteMovingCards } from "./infinite-moving-cards";

export function InfiniteMovingCardsDemo() {
  return (
    <div className="relative flex h-[20rem] flex-col items-center justify-center overflow-hidden rounded-lg bg-white antialiased">
      <InfiniteMovingCards items={testimonials} direction="left" speed="normal" />
    </div>
  );
}

const testimonials = [
  {
    quote:
      "Este asado es de otro planeta. Se nota que lo hacen con tiempo y carino, la carne se deshace en la boca. Volveria mil veces!",
    name: "Carlos Gomez",
    title: "Cliente frecuente",
  },
  {
    quote:
      "Las empanadas de carne cortada a cuchillo son un manjar. No se como las hacen, pero son perfectas con un buen vino tinto.",
    name: "Lucia Alvarez",
    title: "Reserva familiar",
  },
  {
    quote:
      "La milanesa napolitana con papas fritas es como la hacia la abuela, con queso gratinado y salsa casera.",
    name: "Mariano Martinez",
    title: "Pedido online",
  },
  {
    quote:
      "Las pastas tienen gusto a domingo en casa, y la salsa bolonesa es insuperable. La especial de la casa es fija.",
    name: "Patricia Fernandez",
    title: "Cena de pareja",
  },
  {
    quote:
      "Me pedi una fugazzeta rellena y creo que no vuelvo a comer pizza en otro lado. Masa a punto y queso generoso.",
    name: "Gustavo Lopez",
    title: "Fan de la pizza",
  },
];
