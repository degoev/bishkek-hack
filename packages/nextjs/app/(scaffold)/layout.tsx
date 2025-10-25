import { Footer } from "~~/components/Footer";
import { Header } from "~~/components/Header";

type Props = React.PropsWithChildren & Record<string, unknown>;

export default (({ children }) => {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}) as React.FC<Props>;
